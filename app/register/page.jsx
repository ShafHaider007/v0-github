import RegisterForm from "@/components/auth/register-form"
import DashboardHeader from "@/components/dashboard/dashboard-header"

export const metadata = {
  title: "Register | Digital Expo",
  description: "Create an account to access the plot selling dashboard",
}

export default function RegisterPage() {
  return (
    <>
      <DashboardHeader />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
              <p className="text-gray-600 mt-2">
                Register to access the plot selling dashboard
              </p>
            </div>
            <RegisterForm />
            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
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