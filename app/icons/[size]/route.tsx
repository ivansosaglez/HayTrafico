import { ImageResponse } from "next/og";

export const dynamic = "force-static";

const SIZES = [180, 192, 512];

export function generateStaticParams() {
  return SIZES.map((s) => ({ size: String(s) }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#1d4ed8", color: "#fff", fontSize: size * 0.55, fontWeight: 800,
        }}
      >
        T
      </div>
    ),
    { width: size, height: size },
  );
}
