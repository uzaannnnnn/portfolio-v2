import { NextResponse } from "next/server";
import { enforceAdminSession } from "@/lib/auth/session";
import { UnauthorizedAdminError } from "@/lib/auth/admin-guard";
import { uploadInlineMediaFile } from "@/lib/media/inline-upload-service";

export async function POST(request: Request) {
  try {
    const admin = await enforceAdminSession();

    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = (formData.get("bucket") as string) || "projects";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file selected. Please choose a file from your device." },
        { status: 400 },
      );
    }

    const name =
      file instanceof File
        ? file.name
        : (formData.get("fileName") as string) || "asset.png";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadInlineMediaFile({
      admin,
      bucket,
      file: {
        name,
        size: file.size,
        mimeType: file.type,
        buffer,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `File "${result.fileName}" successfully uploaded to "${result.bucket}".`,
      data: result,
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

