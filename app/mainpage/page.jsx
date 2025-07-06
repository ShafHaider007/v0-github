"use client"
import LoginForm from "@/components/auth/login-form"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function MainPage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <>
      <DashboardHeader />
      <div className="relative w-full h-screen overflow-hidden">
        <Image
          src={isMobile ? "/images/dha-home-banner-mobile.jpg" : "/images/dha-home-banner.jpg"}
          alt="DHA Islamabad Digital Expo"
          fill
          priority
          quality={100}
          sizes="100vw"
          className="w-full h-full object-cover object-center"
          style={{ objectPosition: 'center center' }}
        />
        {/* Centered blue button at bottom */}
        <div className="absolute bottom-16 left-0 right-0 flex justify-center z-10">
          <Link 
            href="/dashboard-unauth"
            className="bg-[hsl(210,100%,25%)] hover:bg-[hsl(210,100%,30%)] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            View Map
          </Link>
        </div>
      </div>
    </>
  )
}
