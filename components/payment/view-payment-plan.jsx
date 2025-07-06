"use client"
import { FileText } from "lucide-react"

export default function ViewPaymentPlan() {
  const paymentPlanUrl = "/images/payment-plan.jpg"

  return (
    <a
      href={paymentPlanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 hover:underline p-0 h-auto inline-flex items-center"
    >
      <FileText className="h-3 w-3 mr-1" />
      View Payment Plan
    </a>
  )
}
