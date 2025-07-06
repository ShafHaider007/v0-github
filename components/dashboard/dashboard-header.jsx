"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, LogOut, Menu, User, ImageIcon, HelpCircle, Book, Phone, UserPlus, FileText } from "lucide-react"

export default function DashboardHeader() {
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { role } = useAuth()

  // Check if user is admin or manager (role > 0)
  const isAdminOrManager = role !== undefined && role > 0

  const handleLogout = () => {
    logout()
    // Force reload to ensure clean state
    window.location.href = "/login"
  }

  // Function to navigate to profile page
  const navigateToProfile = () => {
    // Force a hard navigation instead of client-side routing
    window.location.href = "/profile"
  }

  return (
    <>
      {/* Blue bar at the top */}
      <div className="w-full py-1 text-black text-center text-xs sm:text-sm">
        Official Plot Selling Portal of DHA Islamabad-Rawalpindi
      </div>

      {/* Sticky header container */}
      <div className="sticky top-0 z-40">
        {/* Logo positioned absolutely within the sticky header */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
          <img src="/images/dha.png" alt="DHA Logo" className="h-8 sm:h-12 md:h-14 lg:h-14" />
        </div>
        
        {/* Header content */}
        <header className="relative bg-primary text-white border-b border-primary/20 ml-[130px] rounded-tl-[40px] rounded-bl-[40px] mr-[30px] rounded-tr-[40px] rounded-br-[40px] pr-6">
          <div className="container mx-auto px-2 sm:px-4 py-2 md:py-3 flex items-center justify-between">
            <div className="flex items-center">
              <nav className="hidden md:flex ml-4 lg:ml-2 space-x-2 lg:space-x-6">
                {role === 5 ? (
                  // Simplified navigation for marketing users
                  <Link href="/manager-booking" className="text-white/90 hover:text-white text-xs lg:text-base">
                    Marketing Booking
                  </Link>
                ) : (
                  // Original navigation for other users
                  <>
                    <Link
                      href={isAuthenticated ? (user?.role === 0 ? "/dashboard" : "/admin") : "/mainpage"}
                      className="text-white/90 hover:text-white text-xs lg:text-base"
                    >
                      <div className="flex items-center text-white/90 hover:text-white text-xs lg:text-base space-x-1">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dashboard</span>
                      </div>
                    </Link>
                    <Link href="/gallery" className="text-white/90 hover:text-white text-xs lg:text-base">
                    <div className="flex items-center text-white/90 hover:text-white text-xs lg:text-base space-x-1">
                      <ImageIcon className="w-4 h-4" />
                      <span>Gallery</span>
                    </div>
                    </Link>
                    <Link href="/how-to-use" className="text-white/90 hover:text-white text-xs lg:text-base">
                      <div className="flex items-center text-white/90 hover:text-white text-xs lg:text-base space-x-1">
                        <HelpCircle className="w-4 h-4" />
                        <span>How to Use</span>
                      </div>
                    </Link>
                    <Link href="/contact" className="text-white/90 hover:text-white text-xs lg:text-base">
                    <div className="flex items-center text-white/90 hover:text-white text-xs lg:text-base space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>Contact</span>
                    </div>
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Vertically center login/register on all screens, but keep menu toggle right on mobile */}
            <div className="flex items-center w-full md:w-auto justify-end md:justify-end relative mt-2 md:mt-0">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 mr-10 md:mr-0">
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-8 sm:h-9 flex items-center gap-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
                      >
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate max-w-[60px] sm:max-w-[100px]">
                          {isLoading ? "Loading..." : user?.name || localStorage.getItem("userName") || "User"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {/* IMPORTANT: Show My Bookings for role 0, undefined, or null */}
                      {(role === 0 || role === undefined || role === null) && (
                        <DropdownMenuItem onClick={navigateToProfile}>My Bookings</DropdownMenuItem>
                      )}
                      {/* Show My Sales for marketing users (role 5) */}
                      {role === 5 && (
                        <DropdownMenuItem asChild>
                          <Link href="/my-sales">My Sales</Link>
                        </DropdownMenuItem>
                      )}
                      {user?.role === 0 && user?.type === "commercial" && (
                        <DropdownMenuItem asChild>
                          <Link href="/bids">My Bids</Link>
                        </DropdownMenuItem>
                      )}
                      {user?.role === 0 && user?.type === "residential" && (
                        <DropdownMenuItem asChild>
                          <Link href="/purchases">My Purchases</Link>
                        </DropdownMenuItem>
                      )}
                      {isAdminOrManager && (
                        <>
                          {/* Only show Admin Dashboard for roles other than 5 (marketing) */}
                          {role !== 5 && (
                            <DropdownMenuItem asChild>
                              <Link href="/admin">Admin Dashboard</Link>
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link href="/login">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-8 sm:h-9 bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center justify-center"
                        style={{ minWidth: 80 }}
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" className="hidden sm:block">
                      <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-9 bg-accent hover:bg-accent/90 text-white flex items-center justify-center">
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              {/* Menu toggle: absolutely right on mobile, normal on desktop */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 md:static md:translate-y-0">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[80%] sm:w-[350px] p-0">
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="p-4 border-b flex items-center gap-3 bg-primary/5">
                        <img src="/images/dha.png" alt="DHA Logo" className="h-10" />
                        <div>
                          <h2 className="text-lg font-bold">DHA Marketplace</h2>
                          {isAuthenticated && (
                            <p className="text-sm text-muted-foreground">Welcome, {user?.name || "User"}</p>
                          )}
                        </div>
                      </div>

                      {/* Navigation */}
                      <nav className="flex-1 overflow-auto py-4">
                        <div className="px-3 mb-2 text-xs font-medium text-muted-foreground">MAIN NAVIGATION</div>
                        <div className="space-y-1 px-2">
                          {role === 5 ? (
                            // Simplified navigation for marketing users
                            <Link
                              href="/manager-booking"
                              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <FileText className="h-4 w-4" />
                              <span>Marketing Booking</span>
                            </Link>
                          ) : (
                            // Original navigation for other users
                            <>
                              <Link
                                href={isAuthenticated ? (user?.role === 0 ? "/dashboard" : "/admin") : "/mainpage"}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Dashboard</span>
                              </Link>
                              <Link
                                href="/gallery"
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <ImageIcon className="h-4 w-4" />
                                <span>Gallery</span>
                              </Link>
                              <Link
                                href="/how-to-use"
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <HelpCircle className="h-4 w-4" />
                                <span>How to Use</span>
                              </Link>
                              <Link
                                href="/contact"
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <Phone className="h-4 w-4" />
                                <span>Contact</span>
                              </Link>
                              {/* Add Manager Booking link for admin/manager users in mobile menu */}
                              {isAdminOrManager && (
                                <>
                                  {/* Only show Admin Dashboard for roles other than 5 (marketing) */}
                                  {role !== 5 && (
                                    <Link
                                      href="/admin"
                                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                                      onClick={() => setMobileMenuOpen(false)}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M12 2v20" />
                                        <path d="M2 12h20" />
                                        <path d="m4.93 4.93 14.14 14.14" />
                                        <path d="m19.07 4.93-14.14 14.14" />
                                      </svg>
                                      <span>Admin Dashboard</span>
                                    </Link>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          {/* <Link
                            href="/manager-booking"
                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <FileText className="h-4 w-4" />
                            <span>Manager Booking</span>
                        </Link> */}
                        </div>

                        {isAuthenticated && (
                          <>
                            <div className="px-3 mt-6 mb-2 text-xs font-medium text-muted-foreground">ACCOUNT</div>
                            <div className="space-y-1 px-2">
                              {/* IMPORTANT: Show My Bookings for role 0, undefined, or null */}
                              {(role === 0 || role === undefined || role === null) && (
                                <button
                                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm w-full text-left"
                                  onClick={() => {
                                    setMobileMenuOpen(false)
                                    navigateToProfile()
                                  }}
                                >
                                  <User className="h-4 w-4" />
                                  <span>My Bookings</span>
                                </button>
                              )}
                              {role === 5 && (
                                <Link
                                  href="/my-sales"
                                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <FileText className="h-4 w-4" />
                                  <span>My Sales</span>
                                </Link>
                              )}
                              {user?.role === 0 && user?.type === "commercial" && (
                                <Link
                                  href="/bids"
                                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M6 12H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" />
                                    <path d="M21 12h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3" />
                                    <path d="M12 2v20" />
                                    <path d="m4.5 9 7.5 7.5" />
                                    <path d="m19.5 9-7.5 7.5" />
                                  </svg>
                                  <span>My Bids</span>
                                </Link>
                              )}
                              {user?.role === 0 && user?.type === "residential" && (
                                <Link
                                  href="/purchases"
                                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                                    <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                                    <path d="M12 3v6" />
                                  </svg>
                                  <span>My Purchases</span>
                                </Link>
                              )}
                              {isAdminOrManager && (
                                <>
                                  {/* Only show Admin Dashboard for roles other than 5 (marketing) */}
                                  {role !== 5 && (
                                    <Link
                                      href="/admin"
                                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                                      onClick={() => setMobileMenuOpen(false)}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M12 2v20" />
                                        <path d="M2 12h20" />
                                        <path d="m4.93 4.93 14.14 14.14" />
                                        <path d="m19.07 4.93-14.14 14.14" />
                                      </svg>
                                      <span>Admin Dashboard</span>
                                    </Link>
                                  )}
                                </>
                              )}
                            </div>
                          </>
                        )}
                        {/* <Link
                            href="/manager-booking"
                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 text-sm"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <FileText className="h-4 w-4" />
                            <span>Manager Booking</span>
                        </Link> */}
                      </nav>

                      {/* Footer */}
                      <div className="p-4 border-t">
                        {isAuthenticated ? (
                          <button
                            onClick={() => {
                              handleLogout()
                              setMobileMenuOpen(false)
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Link
                              href="/login"
                              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md bg-primary text-white"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <User className="h-4 w-4" />
                              <span>Login</span>
                            </Link>
                            <Link
                              href="/register"
                              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md bg-accent text-white"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <UserPlus className="h-4 w-4" />
                              <span>Register</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>
      </div>
    </>
  )
}