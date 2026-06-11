/**
 * src/app/api/ceo/copilot/route.ts
 * API Endpoint for CEO Copilot Chat
 */

import { NextResponse } from "next/server";
import { askCEOQuestion } from "@/lib/ceo-question-engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { question, history } = await req.json();

    if (!question || question.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Question query is required." },
        { status: 400 }
      );
    }

    const result = await askCEOQuestion(question, history);
    return NextResponse.json({
      success: true,
      answer: result.answer,
      citations: result.citations
    });
  } catch (err: any) {
    console.error("CEO Copilot API Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
