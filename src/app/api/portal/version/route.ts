import { NextResponse } from "next/server";
import { getPortalVersions } from "@/lib/portal-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      timestamp: Date.now(),
      versions: getPortalVersions(),
    },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
