import ForgotPasswordForm from "@/components/auth/forgot-password-form"
import DashboardHeader from "@/components/dashboard/dashboard-header"

export const metadata = {
  title: "Forgot Password | Digital Expo",
  description: "Reset your password to access the plot selling dashboard",
}

export default function ForgotPasswordPage() {
  return (
    <>
      <DashboardHeader />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 sm:p-10">
            <ForgotPasswordForm />
            <div className="mt-6 text-center text-sm text-gray-600">
              Remember your password?{' '}
              <a 
                href="/login" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Login here
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
