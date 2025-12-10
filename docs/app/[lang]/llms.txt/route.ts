import type { NextRequest } from "next/server";
import { getLLMText, source } from "@/lib/geistdocs/source";

export const revalidate = false;

export const GET = async (
  _req: NextRequest,
  { params }: RouteContext<"/[lang]/llms.txt">
) => {
  const { lang } = await params;
  const scan = source.getPages(lang).map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join("\n\n"));
};
