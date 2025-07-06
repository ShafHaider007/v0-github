import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  // Get the token from cookies
  const token = req.cookies.get("token")?.value

  // Get the user from cookies
  let user = null
  const userCookie = req.cookies.get("user")?.value

  if (userCookie) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie))
    } catch (error) {
      console.error("Error parsing user cookie:", error)
    }
  }

  // Check if user has a role
  const userRole = user?.role

  const { pathname } = req.nextUrl

  // Simplified redirect logic
  if (pathname === "/") {
    if (token && userRole !== undefined) {
      if (userRole === 0) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      } else if (userRole === 5) {
        return NextResponse.redirect(new URL("/manager-booking", req.url))
      } else if (userRole > 0) {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
    }
    // Default redirect if no token or role
    // return NextResponse.next()
    return NextResponse.redirect(new URL("/mainpage", req.url))
  }

  // Simplified profile redirect
  if (pathname.startsWith("/profile") && userRole !== undefined && userRole > 0) {
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/profile"],
}
