import { createAuthorizationRedirect } from "@/lib/providers/oauth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = await createAuthorizationRedirect("whoop");
    return NextResponse.redirect(url);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}
