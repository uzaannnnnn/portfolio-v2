import { NextResponse } from "next/server";
import { getPortfolioRepository } from "@/lib/database/repository";

export async function GET() {
  try {
    const repository = getPortfolioRepository();
    const bundle = await repository.getPublicPortfolioBundle();
    return NextResponse.json(
      { activeResume: bundle.activeResume },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json({ activeResume: null }, { status: 200 });
  }
}

