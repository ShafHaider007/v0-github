// Simplify this component to improve performance
export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-lg">Loading dashboard...</p>
    </div>
  )
}
