import { NextResponse } from "next/server";
import { getOptionalAdminSession } from "@/lib/auth/session";
import { getCmsStore } from "@/lib/database/cms-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(_request.url);
  const isDownload =
    searchParams.get("download") === "true" ||
    searchParams.get("attachment") === "true";
  const disposition = isDownload ? "attachment" : "inline";
  const mode = process.env.DATA_ADAPTER_MODE ?? "fixture";

  let fileName = "resume.pdf";
  let versionLabel = "v1.0";
  let isPubliclyPublished = false;
  let fileBuffer: ArrayBuffer | null = null;

  if (mode === "supabase") {
    const { createSupabaseServerClient } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("resume_files").select("*");
    if (id === "active") {
      query = query.eq("status", "published").eq("is_active", true);
    } else {
      query = query.eq("id", id);
    }
    const { data: resumeRow, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !resumeRow) {
      return NextResponse.json(
        { error: "Resume version not found." },
        { status: 404 },
      );
    }

    fileName = resumeRow.file_name;
    versionLabel = resumeRow.version_label;
    isPubliclyPublished =
      resumeRow.status === "published" && resumeRow.is_active === true;

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

    // Attempt to download the real binary object from Supabase Storage
    const objectPath = resumeRow.storage_path.replace(/^resume\//, "");
    const { data: fileBlob, error: downloadErr } = await supabase.storage
      .from("resume")
      .download(objectPath);

    if (downloadErr || !fileBlob) {
      return NextResponse.json(
        { error: "Resume file not found in storage." },
        { status: 404 },
      );
    }

    fileBuffer = await fileBlob.arrayBuffer();
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "Cache-Control": isPubliclyPublished
          ? "public, max-age=300"
          : "private, no-store",
      },
    });
  }

  // Fixture adapter mode
  const store = getCmsStore();
  const resume =
    id === "active"
      ? store.resumeFiles.find((r) => r.status === "published" && r.isActive)
      : store.resumeFiles.find((r) => r.id === id);

  if (!resume) {
    return NextResponse.json(
      { error: "Resume version not found." },
      { status: 404 },
    );
  }

  fileName = resume.fileName;
  versionLabel = resume.versionLabel;
  isPubliclyPublished =
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

  // Check if a real binary upload was cached in fixture mode
  const { getFixtureResumeBuffer } = await import("@/lib/resume/resume-service");
  const cachedBuffer = getFixtureResumeBuffer(resume.id);
  if (cachedBuffer) {
    return new NextResponse(new Uint8Array(cachedBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "Cache-Control": isPubliclyPublished
          ? "public, max-age=300"
          : "private, no-store",
      },
    });
  }

  // Fallback representation strictly limited to fixture testing mode
  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
% Muhamad Fauzan Resume - ${versionLabel} (${fileName})
%%EOF`;

  return new NextResponse(pdfContent, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": isPubliclyPublished
        ? "public, max-age=300"
        : "private, no-store",
    },
  });
}
