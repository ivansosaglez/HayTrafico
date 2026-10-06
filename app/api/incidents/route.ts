import { NextResponse } from "next/server";
import { getIncidents } from "@/lib/dgt/dgt-client";
import { DGT_CACHE_TTL_SECONDS } from "@/lib/dgt/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getIncidents();
    return NextResponse.json(payload, {
      headers: {
        // La CDN reutiliza la respuesta para no multiplicar peticiones al origen.
        "Cache-Control": `public, s-maxage=${Math.max(10, Math.floor(DGT_CACHE_TTL_SECONDS / 2))}, stale-while-revalidate=30`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "No se ha podido conectar con la DGT" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
