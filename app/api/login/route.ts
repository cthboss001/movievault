import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: "Security not configured on server." }, { status: 500 });
    }

    if (password === adminPassword) {
      // Set cookie
      const response = NextResponse.json({ success: true });
      response.cookies.set("vault_auth", password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
