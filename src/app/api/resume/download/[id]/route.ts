import { NextResponse } from "next/server";
import { getOptionalAdminSession } from "@/lib/auth/session";
import { getCmsStore } from "@/lib/database/cms-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const store = getCmsStore();
  const resume = store.resumeFiles.find((r) => r.id === id);

  if (!resume) {
    return NextResponse.json(
      { error: "Resume version not found." },
      { status: 404 },
    );
  }

  const isPubliclyPublished =
    resume.status === "published" && resume.isActive === true;

  if (!isPubliclyPublished) {
    const admin = await getOptionalAdminSession();
    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Forbidden: draft or inactive resume versions require administrator authentication.",
        },
        { status: 403 },
      );
    }
  }

  // Generate a minimal valid PDF byte stream representing the verified resume artifact
  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
% Muhamad Fauzan Resume - ${resume.versionLabel} (${resume.fileName})
%%EOF`;

  return new NextResponse(pdfContent, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${resume.fileName}"`,
      "Cache-Control": isPubliclyPublished
        ? "public, max-age=300"
        : "private, no-store",
    },
  });
}
