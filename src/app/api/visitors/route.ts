import { NextRequest, NextResponse } from "next/server";
import {
  getAggregateVisitorCount,
  recordPortfolioVisit,
} from "@/lib/visitors/visitor-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const isPreview = req.nextUrl.searchParams.get("preview") === "true";
    const adminSessionCookie = req.cookies.get("admin_session")?.value;
    const isAdmin = Boolean(adminSessionCookie && adminSessionCookie.length > 0);

    const result = await recordPortfolioVisit({
      headers: req.headers,
      isAdmin,
      isPreview,
    });

    return NextResponse.json(
      { count: result.count },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("[VisitorCounterAPI] Failed to record visit:", error);
    return NextResponse.json(
      { count: null, error: "Failed to record visitor count" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const count = await getAggregateVisitorCount();
    return NextResponse.json(
      { count },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("[VisitorCounterAPI] Failed to fetch visitor count:", error);
    return NextResponse.json(
      { count: null, error: "Failed to fetch visitor count" },
      { status: 500 },
    );
  }
}

