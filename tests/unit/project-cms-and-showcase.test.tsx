import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { ProjectsManager } from "@/components/admin/projects-manager";
import { INITIAL_PROJECTS } from "@/lib/database/fixtures";
import type { VersionedEntityRecord } from "@/features/publishing/publishing-engine";
import type { ProjectDetail } from "@/types/portfolio";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/admin/projects",
}));

const mockSaveProjectDraftAction = vi.fn().mockResolvedValue({
  ok: true,
  message: "Draft saved successfully",
});

vi.mock("@/features/admin/actions", () => ({
  saveProjectDraftAction: (...args: unknown[]) => mockSaveProjectDraftAction(...args),
  publishProjectAction: vi.fn().mockResolvedValue({ ok: true, message: "Published" }),
  transitionProjectStateAction: vi.fn().mockResolvedValue({ ok: true, message: "State updated" }),
  deleteProjectAction: vi.fn().mockResolvedValue({ ok: true, message: "Deleted" }),
}));

describe("Project CMS Editor — Version & 7-Category Technology Manager", () => {
  const mockEntityRecords: VersionedEntityRecord<ProjectDetail>[] = INITIAL_PROJECTS.map(
    (proj) => ({
      entityId: proj.id,
      entityType: "project",
      versionNumber: 1,
      status: proj.status,
      draftData: proj,
      publishedData: proj.status === "published" ? proj : null,
      draftRevisionId: "rev-draft",
      publishedRevisionId: null,
      publishedAt: null,
      updatedAt: proj.updatedAt,
      createdAt: proj.updatedAt,
    }),
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Version input as a required shared field and does not render Category inputs", () => {
    render(<ProjectsManager projects={mockEntityRecords} revisions={[]} />);

    const versionInput = screen.getByTestId("project-version-input");
    expect(versionInput).toBeInTheDocument();
    expect(versionInput).toHaveAttribute("required");
    expect(versionInput).toHaveValue("v0.1.0");

    // Category inputs must not exist
    expect(screen.queryByTestId("project-category-en-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("project-category-id-input")).not.toBeInTheDocument();
  });

  it("displays all 7 technology categories clearly in the CMS Project Editor", () => {
    render(<ProjectsManager projects={mockEntityRecords} revisions={[]} />);

    const manager = screen.getByTestId("categorized-technologies-manager");
    expect(manager).toBeInTheDocument();

    const expectedCategories = [
      "FE",
      "BE",
      "DB",
      "API",
      "ARCHITECTURE",
      "DEVOPS & INFRA",
      "SOFTWARE QUALITY",
    ];

    for (const cat of expectedCategories) {
      const group = screen.getByTestId(
        `tech-category-group-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      );
      expect(group).toBeInTheDocument();
      expect(group).toHaveTextContent(cat);
    }
  });

  it("allows assigning technologies to a selected category and removing them", async () => {
    render(<ProjectsManager projects={mockEntityRecords} revisions={[]} />);

    const categorySelect = screen.getByTestId("tech-category-select");
    const nameInput = screen.getByTestId("tech-name-input");
    const addBtn = screen.getByTestId("tech-add-btn");

    // Add a DEVOPS & INFRA item
    fireEvent.change(categorySelect, { target: { value: "DEVOPS & INFRA" } });
    fireEvent.change(nameInput, { target: { value: "Kubernetes" } });
    fireEvent.click(addBtn);

    const devopsGroup = screen.getByTestId("tech-category-group-devops---infra");
    expect(devopsGroup).toHaveTextContent("Kubernetes");

    // Add a SOFTWARE QUALITY item
    fireEvent.change(categorySelect, { target: { value: "SOFTWARE QUALITY" } });
    fireEvent.change(nameInput, { target: { value: "Playwright" } });
    fireEvent.click(addBtn);

    const qaGroup = screen.getByTestId("tech-category-group-software-quality");
    expect(qaGroup).toHaveTextContent("Playwright");

    // Remove the added Playwright item
    const removeBtn = screen.getByLabelText("Remove Playwright from SOFTWARE QUALITY");
    fireEvent.click(removeBtn);

    expect(qaGroup).not.toHaveTextContent("Playwright");
  });

  it("saves draft with version and categorized technologies payload", async () => {
    render(<ProjectsManager projects={mockEntityRecords} revisions={[]} />);

    const versionInput = screen.getByTestId("project-version-input");
    fireEvent.change(versionInput, { target: { value: "v2.0.0" } });

    const saveBtn = screen.getByTestId("project-save-draft-btn");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSaveProjectDraftAction).toHaveBeenCalled();
    });

    const savedPayload = mockSaveProjectDraftAction.mock.calls[0]![0] as ProjectDetail;
    expect(savedPayload.version).toBe("v2.0.0");
    expect(Array.isArray(savedPayload.categorizedTechnologies)).toBe(true);
    expect(savedPayload.categorizedTechnologies!.length).toBeGreaterThan(0);
    expect(savedPayload.technologies).toEqual(
      savedPayload.categorizedTechnologies!.map((t) => t.name),
    );
  });
});

