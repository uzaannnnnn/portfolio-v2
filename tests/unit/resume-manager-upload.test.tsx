import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

import { ResumeManager } from "@/components/admin/system-managers";
import {
  validatePdfUpload,
  uploadAndActivateResume,
  getFixtureResumeBuffer,
  MAX_RESUME_FILE_SIZE_BYTES,
} from "@/lib/resume/resume-service";
import { getCmsStore } from "@/lib/database/cms-store";
import type { ResumeFileRecord } from "@/lib/database/cms-store";
import type { VerifiedAdminContext } from "@/lib/auth/admin-guard";

const TEST_ADMIN: VerifiedAdminContext = {
  adminId: "00000000-0000-4000-8000-000000000001",
  authUserId: "00000000-0000-4000-8000-000000000099",
  email: "admin@muhamadfauzan.dev",
  role: "admin",
};

const VALID_PDF_BYTES = Buffer.from(
  "%PDF-1.5\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF",
);

describe("Direct Device PDF Upload & Validation (resume-service)", () => {
  beforeEach(() => {
    process.env.DATA_ADAPTER_MODE = "fixture";
    const store = getCmsStore();
    store.resetToDefaults();
  });

  it("validates and accepts a valid PDF file with %PDF- header", () => {
    const res = validatePdfUpload({
      name: "My_Software_Engineer_CV.pdf",
      size: VALID_PDF_BYTES.length,
      buffer: VALID_PDF_BYTES,
    });

    expect(res.sanitizedFileName).toBe("my_software_engineer_cv.pdf");
    expect(res.sizeBytes).toBe(VALID_PDF_BYTES.length);
  });

  it("rejects an empty file (0 bytes)", () => {
    expect(() =>
      validatePdfUpload({
        name: "empty.pdf",
        size: 0,
        buffer: Buffer.from(""),
      }),
    ).toThrow(/file is empty/i);
  });

  it("rejects an oversized file (> 10 MB)", () => {
    expect(() =>
      validatePdfUpload({
        name: "huge.pdf",
        size: MAX_RESUME_FILE_SIZE_BYTES + 1,
        buffer: VALID_PDF_BYTES,
      }),
    ).toThrow(/exceeds maximum limit of 10 MB/i);
  });

  it("rejects a non-PDF file extension (e.g. .docx or .png)", () => {
    expect(() =>
      validatePdfUpload({
        name: "malicious.png",
        size: VALID_PDF_BYTES.length,
        buffer: VALID_PDF_BYTES,
      }),
    ).toThrow(/only PDF files \(\.pdf\) are allowed/i);
  });

  it("rejects a file with .pdf extension but invalid binary content (missing %PDF- header)", () => {
    const fakePdfBytes = Buffer.from("THIS IS PLAIN TEXT DISGUISED AS PDF");
    expect(() =>
      validatePdfUpload({
        name: "fake.pdf",
        size: fakePdfBytes.length,
        buffer: fakePdfBytes,
      }),
    ).toThrow(/invalid file content.*not a valid PDF document/i);
  });

  it("automatically activates newly uploaded resume and replaces previous active resume", async () => {
    const store = getCmsStore();

    // 1. Initial active resume exists
    store.resumeFiles = [
      {
        id: "prev-resume-id",
        versionLabel: "v2025.1",
        fileName: "old-cv.pdf",
        storagePath: "resume/old-cv.pdf",
        fileUrl: "/api/resume/download/prev-resume-id",
        sizeBytes: 150000,
        summaryNote: "Old resume",
        isActive: true,
        status: "published",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ];

    // 2. Upload new resume directly
    const newRecord = await uploadAndActivateResume({
      admin: TEST_ADMIN,
      file: {
        name: "Muhamad-Fauzan-Latest-2026-CV.pdf",
        size: VALID_PDF_BYTES.length,
        buffer: VALID_PDF_BYTES,
      },
    });

    expect(newRecord.isActive).toBe(true);
    expect(newRecord.status).toBe("published");
    expect(newRecord.fileName).toBe("muhamad-fauzan-latest-2026-cv.pdf");
    expect(newRecord.fileUrl).toBe(`/api/resume/download/${newRecord.id}`);

    // Verify previous resume was deactivated
    const prev = store.resumeFiles.find((r) => r.id === "prev-resume-id");
    expect(prev?.isActive).toBe(false);

    // Verify exactly one active resume
    const activeResumes = store.resumeFiles.filter((r) => r.isActive);
    expect(activeResumes).toHaveLength(1);
    expect(activeResumes[0]?.id).toBe(newRecord.id);

    // Verify binary buffer cached for fixture download
    const cached = getFixtureResumeBuffer(newRecord.id);
    expect(cached).toBeDefined();
    expect(cached?.toString("ascii")).toBe(VALID_PDF_BYTES.toString("ascii"));
  });
});

describe("ResumeManager Component (Admin UI)", () => {
  const activeResume: ResumeFileRecord = {
    id: "active-res-001",
    versionLabel: "v2026.1",
    fileName: "Muhamad-Fauzan-CV.pdf",
    storagePath: "resume/active-res-001-cv.pdf",
    fileUrl: "/api/resume/download/active-res-001",
    sizeBytes: 245000,
    summaryNote: "Latest production resume",
    isActive: true,
    status: "published",
    updatedAt: "2026-11-06T00:00:00.000Z",
  };

  it("renders Current Active Resume summary and Choose PDF button", () => {
    render(<ResumeManager resumes={[activeResume]} />);

    // Header & Section
    expect(screen.getByTestId("admin-resume-manager")).toBeInTheDocument();
    expect(screen.getByTestId("current-active-resume-card")).toBeInTheDocument();
    expect(screen.getByText("Muhamad-Fauzan-CV.pdf")).toBeInTheDocument();
    expect(screen.getByText(/239\.3 KB/)).toBeInTheDocument();
    expect(screen.getByText("ACTIVE & PUBLISHED")).toBeInTheDocument();

    // Prominent "Choose PDF from Device" button and hidden file input
    expect(screen.getByTestId("choose-pdf-button")).toBeInTheDocument();
    const filePicker = screen.getByTestId("resume-file-picker");
    expect(filePicker).toHaveAttribute("type", "file");
    expect(filePicker).toHaveAttribute("accept", "application/pdf,.pdf");
  });

  it("renders empty state when no active resume is configured", () => {
    render(<ResumeManager resumes={[]} />);

    expect(screen.getByTestId("no-active-resume-state")).toBeInTheDocument();
    expect(
      screen.getByText(/No active PDF resume is currently published/i),
    ).toBeInTheDocument();
  });

  it("displays selected file details when a valid PDF is chosen", () => {
    render(<ResumeManager resumes={[activeResume]} />);

    const filePicker = screen.getByTestId("resume-file-picker");
    const fakeFile = new File([VALID_PDF_BYTES], "New-Software-Engineer-Resume.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(filePicker, { target: { files: [fakeFile] } });

    expect(screen.getByTestId("selected-file-card")).toBeInTheDocument();
    expect(
      screen.getByText("New-Software-Engineer-Resume.pdf"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("upload-active-resume-btn")).toBeInTheDocument();
  });

  it("rejects non-PDF files on client-side selection with clear error banner", () => {
    render(<ResumeManager resumes={[activeResume]} />);

    const filePicker = screen.getByTestId("resume-file-picker");
    const textFile = new File(["some text"], "resume.txt", {
      type: "text/plain",
    });

    fireEvent.change(filePicker, { target: { files: [textFile] } });

    expect(
      screen.getByText(/only PDF files \(\.pdf\) are permitted/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("selected-file-card")).not.toBeInTheDocument();
  });

  it("rejects oversized files on client-side selection (> 10 MB)", () => {
    render(<ResumeManager resumes={[activeResume]} />);

    const filePicker = screen.getByTestId("resume-file-picker");
    const hugeBuffer = new Uint8Array(MAX_RESUME_FILE_SIZE_BYTES + 1024);
    const hugeFile = new File([hugeBuffer], "huge-resume.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(filePicker, { target: { files: [hugeFile] } });

    expect(
      screen.getByText(/exceeds maximum limit of 10 MB/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("selected-file-card")).not.toBeInTheDocument();
  });

  it("submits FormData to /api/admin/resume/upload and automatically activates on upload", async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        message: 'Resume "new-cv.pdf" uploaded and set as Active Resume.',
        activeResume: {
          id: "new-cv-id",
          fileName: "new-cv.pdf",
          fileUrl: "/api/resume/download/new-cv-id",
        },
      }),
    });
    global.fetch = fetchMock;

    try {
      render(<ResumeManager resumes={[activeResume]} />);

      const filePicker = screen.getByTestId("resume-file-picker");
      const validFile = new File([VALID_PDF_BYTES], "new-cv.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(filePicker, { target: { files: [validFile] } });
      const uploadBtn = screen.getByTestId("upload-active-resume-btn");

      fireEvent.click(uploadBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs?.[0]).toBe("/api/admin/resume/upload");
      expect(callArgs?.[1]?.method).toBe("POST");
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData);

      // Verify success status banner
      await waitFor(() => {
        expect(
          screen.getByText(/uploaded and set as Active Resume/i),
        ).toBeInTheDocument();
      });
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe("API Route: /api/admin/resume/upload", () => {
  beforeEach(() => {
    process.env.DATA_ADAPTER_MODE = "fixture";
    const store = getCmsStore();
    store.resetToDefaults();
  });

  it("rejects unauthenticated upload requests with 401 Unauthorized", async () => {
    const { POST } = await import("@/app/api/admin/resume/upload/route");

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([VALID_PDF_BYTES], { type: "application/pdf" }),
      "test.pdf",
    );

    const req = new Request("http://localhost:3000/api/admin/resume/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Authentication required|Unauthorized/i);
  });
});
