import LoginForm from "@/components/auth/login-form"
import DashboardHeader from "@/components/dashboard/dashboard-header"

export const metadata = {
  title: "Login | Digital Expo",
  description: "Login to your account to access the plot selling dashboard",
}

export default function LoginPage() {
  return (
    <>
      <DashboardHeader />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Login</h1>
              <p className="text-gray-600 mt-2">
                Sign in to access your account
              </p>
            </div>
            <LoginForm />
            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a 
                href="/register" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Register here
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}