import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;
  
  // The only routes that need protection are the admin import routes
  const isAdminRoute = 
    url.startsWith("/import") || 
    url.startsWith("/api/import") || 
    url.startsWith("/api/enrich");

  // Get the auth cookie
  const authCookie = request.cookies.get("vault_auth")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // If no password is set in .env, don't enforce security (useful for local dev)
  if (!adminPassword) {
    return NextResponse.next();
  }

  const isAdmin = authCookie === adminPassword;

  // If they are trying to access an admin route but aren't an admin
  if (isAdminRoute && !isAdmin) {
    // Redirect them to the public home page (or login page)
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If they are on the login page but are already an admin
  if (url === "/login" && isAdmin) {
    // Redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Otherwise, the site is entirely public!
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
