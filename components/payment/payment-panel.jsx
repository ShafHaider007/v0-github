"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Copy } from "lucide-react"

// Import the new ViewPaymentPlan component
import ViewPaymentPlan from "../payment/view-payment-plan"

export default function PaymentPanel({ plots }) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [psid, setPsid] = useState(null)

  const totalAmount = plots.reduce((sum, plot) => sum + plot.price, 0)

  const handlePaymentSubmit = async () => {
    try {
      setIsProcessing(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful payment
      setIsSuccess(true)
      setPsid("11520332277831262") // Set the PSID here
    } catch (error) {
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Secure Your Plot</CardTitle>
          <CardDescription>Complete your purchase to secure the selected plot(s).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Plot Price:</span>
              <span>PKR {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Processing Fee:</span>
              <span>PKR {(totalAmount * 0.01).toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
              <span>Total Amount:</span>
              <span>PKR {(totalAmount * 1.01).toLocaleString()}</span>
            </div>
          </div>
          {/* Replace any existing PDF link with our new component */}
          <ViewPaymentPlan />
        </CardContent>
        <CardFooter>
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Proceed to Payment</Button>
            </DialogTrigger>
            <DialogContent>
              {!isSuccess ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Complete Payment</DialogTitle>
                    <DialogDescription>
                      You will be redirected to our secure payment gateway to complete your purchase.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="font-semibold">Payment Summary</p>
                    <p className="mt-2">Total Amount: PKR {(totalAmount * 1.01).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      By proceeding, you agree to our terms and conditions for plot purchase.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={handlePaymentSubmit} disabled={isProcessing} className="w-full">
                      {isProcessing ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        "Confirm Payment"
                      )}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Payment Successful!</DialogTitle>
                    <DialogDescription>Your payment has been processed successfully.</DialogDescription>
                  </DialogHeader>
                  <div className="py-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-center">
                      Your plot purchase has been confirmed. You will receive a confirmation email shortly.
                    </p>
                    {psid && (
                      <div className="mt-4 flex items-center gap-2">
                        <p className="font-semibold">PSID:</p>
                        <p className="font-medium">{psid}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 ml-1 flex items-center justify-center"
                          onClick={() => navigator.clipboard.writeText(psid)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsPaymentDialogOpen(false)}>Close</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  )
}
