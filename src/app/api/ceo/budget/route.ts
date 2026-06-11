/**
 * src/app/api/ceo/budget/route.ts
 * API Endpoint for Allocating Budget
 */

import { NextResponse } from "next/server";
import { allocateBudget } from "@/lib/capital-allocation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, amount } = body;

    if (!category || amount === undefined) {
      return NextResponse.json({ success: false, error: "Missing category or amount" }, { status: 400 });
    }

    const success = await allocateBudget(category, Number(amount));

    return NextResponse.json({
      success,
      message: success ? `Successfully allocated ₹${amount} to ${category}` : "Allocation failed"
    });
  } catch (err: any) {
    console.error("CEO Budget Allocation Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
