import { NextResponse } from "next/server";
import { enforceAdminSession } from "@/lib/auth/session";
import { UnauthorizedAdminError } from "@/lib/auth/admin-guard";
import { uploadAndActivateResume } from "@/lib/resume/resume-service";

export async function POST(request: Request) {
  try {
    const admin = await enforceAdminSession();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file selected. Please choose a PDF file from your device." },
        { status: 400 },
      );
    }

    const name =
      file instanceof File
        ? file.name
        : (formData.get("fileName") as string) || "resume.pdf";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const record = await uploadAndActivateResume({
      admin,
      file: {
        name,
        size: file.size,
        buffer,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Resume "${record.fileName}" uploaded and automatically activated as the current resume.`,
      activeResume: record,
    });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedAdminError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
