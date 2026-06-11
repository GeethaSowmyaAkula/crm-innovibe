import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const db = await createClient();
    const body = await req.json();

    const { data, error } = await db
      .from("technicians")
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
