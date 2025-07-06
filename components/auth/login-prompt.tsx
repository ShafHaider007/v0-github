import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LoginPrompt() {
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <h3 className="font-semibold mb-2">Login Required</h3>
      <p className="text-sm text-gray-600 mb-4">Please login to place bids or make purchases.</p>
      <div className="flex gap-2 justify-center">
        <Link href="/login">
          <Button>Login</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline">Register</Button>
        </Link>
      </div>
    </div>
  )
}
