import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/admin/profile",
}));

import {
  validateInlineUpload,
  validateMagicBytes,
  uploadInlineMediaFile,
  INLINE_BUCKET_POLICIES,
} from "@/lib/media/inline-upload-service";
import {
  InlineMediaUploader,
  InlineGalleryUploader,
} from "@/components/admin/inline-media-uploader";
import { AdminShell } from "@/components/admin/admin-shell";
import { UnifiedProfileManager } from "@/components/admin/singleton-editors";
import { getCmsStore } from "@/lib/database/cms-store";
import type { VerifiedAdminContext } from "@/lib/auth/admin-guard";
import type { VersionedEntityRecord } from "@/features/publishing/publishing-engine";
import type {
  AboutContent,
  EducationItem,
  HeroContent,
  ProfileData,
} from "@/types/portfolio";

const TEST_ADMIN: VerifiedAdminContext = {
  adminId: "00000000-0000-4000-8000-000000000001",
  authUserId: "00000000-0000-4000-8000-000000000099",
  email: "admin@muhamadfauzan.dev",
  role: "admin",
};

// Valid binary fixtures
const VALID_PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const VALID_JPEG_BYTES = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
]);
const VALID_PDF_BYTES = Buffer.from(
  "%PDF-1.5\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF",
);
const FAKE_TEXT_BYTES = Buffer.from("THIS_IS_PLAIN_TEXT_NOT_AN_IMAGE");

describe("1. Shared Inline Media Upload Validation (inline-upload-service)", () => {
  beforeEach(() => {
    process.env.DATA_ADAPTER_MODE = "fixture";
    const store = getCmsStore();
    store.resetToDefaults();
  });

  it("validates and accepts valid PNG and JPEG for profile and projects buckets", () => {
    const profileRes = validateInlineUpload({
      bucket: "profile",
      fileName: "headshot.png",
      sizeBytes: VALID_PNG_BYTES.length,
      mimeType: "image/png",
      buffer: VALID_PNG_BYTES,
    });
    expect(profileRes.sanitizedFileName).toBe("headshot.png");
    expect(profileRes.bucket).toBe("profile");

    const projectRes = validateInlineUpload({
      bucket: "projects",
      fileName: "cover-image.jpg",
      sizeBytes: VALID_JPEG_BYTES.length,
      mimeType: "image/jpeg",
      buffer: VALID_JPEG_BYTES,
    });
    expect(projectRes.sanitizedFileName).toBe("cover-image.jpg");
    expect(projectRes.bucket).toBe("projects");
  });

  it("validates and accepts PDF for certificates bucket", () => {
    const certRes = validateInlineUpload({
      bucket: "certificates",
      fileName: "aws-solutions-architect.pdf",
      sizeBytes: VALID_PDF_BYTES.length,
      mimeType: "application/pdf",
      buffer: VALID_PDF_BYTES,
    });
    expect(certRes.sanitizedFileName).toBe("aws-solutions-architect.pdf");
    expect(certRes.bucket).toBe("certificates");
  });

  it("rejects PDF in profile or projects buckets", () => {
    expect(() =>
      validateInlineUpload({
        bucket: "profile",
        fileName: "resume.pdf",
        sizeBytes: VALID_PDF_BYTES.length,
        mimeType: "application/pdf",
        buffer: VALID_PDF_BYTES,
      }),
    ).toThrow(/file extension for "resume.pdf" is not permitted/i);
  });

  it("rejects files exceeding bucket max size limit (5MB for profile)", () => {
    const hugeSize = INLINE_BUCKET_POLICIES.profile.maxSizeBytes + 1024;
    expect(() =>
      validateInlineUpload({
        bucket: "profile",
        fileName: "huge.png",
        sizeBytes: hugeSize,
        mimeType: "image/png",
        buffer: VALID_PNG_BYTES,
      }),
    ).toThrow(/exceeds maximum limit of 5 MB/i);
  });

  it("rejects spoofed files where magic bytes do not match declared extension", () => {
    expect(() =>
      validateMagicBytes(FAKE_TEXT_BYTES, "image/png", "fake.png"),
    ).toThrow(/not a valid PNG image/i);

    expect(() =>
      validateMagicBytes(FAKE_TEXT_BYTES, "application/pdf", "fake.pdf"),
    ).toThrow(/not a valid PDF document/i);
  });

  it("successfully performs end-to-end inline upload in fixture store", async () => {
    const result = await uploadInlineMediaFile({
      admin: TEST_ADMIN,
      bucket: "projects",
      file: {
        name: "architecture-diagram.png",
        size: VALID_PNG_BYTES.length,
        mimeType: "image/png",
        buffer: VALID_PNG_BYTES,
      },
    });

    expect(result.bucket).toBe("projects");
    expect(result.fileName).toBe("architecture-diagram.png");
    expect(result.publicUrl).toContain("/storage/mock/projects/");

    const store = getCmsStore();
    const stored = store.mediaAssets.find((a) => a.id === result.id);
    expect(stored).toBeDefined();
    expect(stored?.fileName).toBe("architecture-diagram.png");
  });
});

describe("2. InlineMediaUploader & InlineGalleryUploader Components", () => {
  it("renders empty state with choose button when value is null", () => {
    render(
      <InlineMediaUploader
        bucket="profile"
        value={null}
        onChange={vi.fn()}
        label="Avatar Photo"
        testIdPrefix="test-avatar"
      />,
    );

    expect(screen.getByText("Avatar Photo")).toBeInTheDocument();
    expect(screen.getByTestId("test-avatar-choose-btn")).toBeInTheDocument();
    expect(screen.getByTestId("test-avatar-file-input")).toHaveAttribute(
      "type",
      "file",
    );
  });

  it("renders preview and replace/remove controls when value is present", () => {
    const onChangeMock = vi.fn();
    render(
      <InlineMediaUploader
        bucket="projects"
        value="https://storage.example.com/projects/my-cover.webp"
        onChange={onChangeMock}
        label="Project Cover"
        testIdPrefix="test-cover"
      />,
    );

    expect(screen.getByTestId("test-cover-image-preview")).toHaveAttribute(
      "src",
      "https://storage.example.com/projects/my-cover.webp",
    );
    expect(screen.getByTestId("test-cover-replace-btn")).toBeInTheDocument();

    const removeBtn = screen.getByTestId("test-cover-remove-btn");
    fireEvent.click(removeBtn);
    expect(onChangeMock).toHaveBeenCalledWith(null);
  });

  it("InlineGalleryUploader renders existing screenshots and allows deletion", () => {
    const onChangeMock = vi.fn();
    const items = [
      { url: "https://example.com/shot1.webp", alt: "Screenshot 1" },
      { url: "https://example.com/shot2.webp", alt: "Screenshot 2" },
    ];

    render(
      <InlineGalleryUploader
        bucket="projects"
        items={items}
        onChange={onChangeMock}
        testIdPrefix="test-gallery"
      />,
    );

    expect(screen.getByText(/Project Screenshots Gallery \(2\)/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Screenshot 1")).toBeInTheDocument();

    const removeBtns = screen.getAllByRole("button", {
      name: /remove screenshot/i,
    });
    fireEvent.click(removeBtns[0]!);
    expect(onChangeMock).toHaveBeenCalledWith([items[1]]);
  });
});

import { ThemeProvider } from "@/components/theme/theme-provider";

describe("3. Final Simplified CMS Navigation (7 Modules Only)", () => {
  it("renders exactly the 7 requested CMS modules in AdminShell", () => {
    render(
      <ThemeProvider>
        <AdminShell adminEmail="admin@muhamadfauzan.dev" adapterMode="fixture">
          <div>Child Content</div>
        </AdminShell>
      </ThemeProvider>,
    );

    // Verify exactly 7 modules exist in sidebar navigation
    const expectedModules = [
      "Dashboard",
      "Profile",
      "Experience",
      "Projects / Showcase",
      "Certifications",
      "Resume Manager",
      "Site Settings",
    ];

    for (const mod of expectedModules) {
      expect(screen.getAllByText(mod)[0]).toBeInTheDocument();
    }

    // Verify completely removed modules do NOT appear anywhere in the sidebar
    expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    expect(screen.queryByText("Engineering Notes")).not.toBeInTheDocument();
    expect(screen.queryByText("Media Library")).not.toBeInTheDocument();
  });
});

describe("4. UnifiedProfileManager (Consolidated Profile, Hero, About, Education)", () => {
  const profileEntity: VersionedEntityRecord<ProfileData> = {
    entityType: "profile",
    entityId: "singleton-profile",
    slug: "profile",
    draftData: {
      fullName: "Muhamad Fauzan",
      professionalTitle: "Full-Stack Software Engineer",
      tagline: "Building scalable distributed systems",
      shortBio: "Bio text",
      location: "Bandung, Indonesia",
      email: "admin@muhamadfauzan.dev",
      githubUrl: "https://github.com/muhamadfauzan",
      linkedinUrl: "https://linkedin.com/in/muhamadfauzan",
      websiteUrl: "https://muhamadfauzan.dev",
      avatarUrl: null,
      availableForWork: true,
      availabilityNote: "Available for engineering roles",
    },
    publishedData: null,
    status: "published",
    publishedRevisionId: null,
    draftRevisionId: null,
    publishedAt: null,
    updatedAt: new Date().toISOString(),
  };

  const heroEntity: VersionedEntityRecord<HeroContent> = {
    entityType: "hero_content",
    entityId: "singleton-hero",
    slug: "hero",
    draftData: {
      eyebrow: "Software Engineer",
      headline: "Crafting High-Performance Distributed Systems",
      supportingDescription: "Building mission-critical web applications.",
      primaryCtaLabel: "View Case Studies",
      primaryCtaHref: "#showcase",
      secondaryCtaLabel: "Contact",
      secondaryCtaHref: "#contact",
      engineeringFocusAreas: ["Backend", "Distributed Systems"],
    },
    publishedData: null,
    status: "published",
    publishedRevisionId: null,
    draftRevisionId: null,
    publishedAt: null,
    updatedAt: new Date().toISOString(),
  };

  const aboutEntity: VersionedEntityRecord<AboutContent> = {
    entityType: "about_content",
    entityId: "singleton-about",
    slug: "about",
    draftData: {
      introduction: "Introduction about Fauzan",
      narrativeParagraphs: ["Paragraph 1", "Paragraph 2"],
      engineeringPhilosophyTitle: "Philosophy",
      engineeringPhilosophySubtitle: "Core principles",
      engineeringPillars: [],
      coreDomains: ["Distributed Systems"],
    },
    publishedData: null,
    status: "published",
    publishedRevisionId: null,
    draftRevisionId: null,
    publishedAt: null,
    updatedAt: new Date().toISOString(),
  };

  const educations: VersionedEntityRecord<EducationItem>[] = [
    {
      entityType: "education",
      entityId: "edu-001",
      slug: "edu-001",
      draftData: {
        id: "edu-001",
        institution: "Universitas Padjadjaran",
        degree: "Bachelor of Science",
        major: "Computer Science",
        startDate: "2020-09-01",
        endDate: "2024-07-01",
        isCurrent: false,
        gpa: "3.85",
        thesisTitle: "Distributed Consensus in Cloud Architectures",
        defenseGrade: "A",
        description: "Focus on distributed systems.",
        displayOrder: 1,
        status: "published",
      },
      publishedData: null,
      status: "published",
      publishedRevisionId: null,
      draftRevisionId: null,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    },
  ];

  it("renders subtabs for Identity, Hero, About, and Education", () => {
    render(
      <UnifiedProfileManager
        profileEntity={profileEntity}
        heroEntity={heroEntity}
        aboutEntity={aboutEntity}
        educationItems={educations}
        revisions={[]}
      />,
    );

    expect(screen.getByTestId("unified-profile-manager")).toBeInTheDocument();
    expect(screen.getByTestId("profile-subtab-identity")).toBeInTheDocument();
    expect(screen.getByTestId("profile-subtab-hero")).toBeInTheDocument();
    expect(screen.getByTestId("profile-subtab-about")).toBeInTheDocument();
    expect(screen.getByTestId("profile-subtab-education")).toBeInTheDocument();

    // Default tab is identity
    expect(screen.getByTestId("profile-fullname-input")).toBeInTheDocument();
    expect(screen.getByTestId("profile-avatar-container")).toBeInTheDocument();
  });

  it("switches subtabs to Hero, About, and Education on click", () => {
    render(
      <UnifiedProfileManager
        profileEntity={profileEntity}
        heroEntity={heroEntity}
        aboutEntity={aboutEntity}
        educationItems={educations}
        revisions={[]}
      />,
    );

    // Switch to Hero tab
    fireEvent.click(screen.getByTestId("profile-subtab-hero"));
    expect(screen.getByTestId("hero-headline-en-input")).toBeInTheDocument();

    // Switch to About tab
    fireEvent.click(screen.getByTestId("profile-subtab-about"));
    expect(screen.getByTestId("about-intro-en-input")).toBeInTheDocument();

    // Switch to Education tab
    fireEvent.click(screen.getByTestId("profile-subtab-education"));
    expect(screen.getByText("Universitas Padjadjaran")).toBeInTheDocument();
  });
});

describe("5. Authenticated Route: /api/admin/media/upload", () => {
  beforeEach(() => {
    process.env.DATA_ADAPTER_MODE = "fixture";
    const store = getCmsStore();
    store.resetToDefaults();
  });

  it("rejects unauthenticated upload requests with 401 Unauthorized", async () => {
    const { POST } = await import("@/app/api/admin/media/upload/route");

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([VALID_PNG_BYTES], { type: "image/png" }),
      "test.png",
    );
    formData.append("bucket", "projects");

    const req = new Request("http://localhost:3000/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Authentication required|Unauthorized/i);
  });
});
