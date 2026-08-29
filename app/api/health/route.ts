import { NextResponse } from "next/server";
import { dataProvider } from "@/lib/supabase";

export function GET() {
  return NextResponse.json({ status: "ok", adapter: dataProvider() });
}
