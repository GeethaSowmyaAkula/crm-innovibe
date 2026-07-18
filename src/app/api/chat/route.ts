import { NextRequest, NextResponse } from "next/server";
import { generateTextWithFallback } from "@/lib/ai/ai-client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    // Format chat history for the text model
    const formattedHistory = messages
      .map((msg: any) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    const systemPrompt = 
      "You are the InnoVibe AI Assistant. You assist InnoVibe staff (executives, fleet managers, support team members, and depot technicians) with platform navigation, database audits, and operational insights. Keep your responses concise, professional, and helpful. Format your responses in Markdown when appropriate.";

    const text = await generateTextWithFallback(systemPrompt, formattedHistory);

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error("[Chat API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI response" }, { status: 550 });
  }
}
