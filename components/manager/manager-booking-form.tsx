"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAuthToken } from "@/utils/api"
import { MARKETING_ENDPOINTS } from "../../config/api-config"
import { PDFGenerator } from "./pdf-generator"

export default function ManagerBookingForm({ plot, onBackToSelection }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiResponse, setApiResponse] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const router = useRouter()
  const [bookingData, setBookingData] = useState(null)

  // Form data structure to match API expectations
  const [formData, setFormData] = useState({
    name: "", // required
    father_name: "", // required
    cnic: "", // required
    passportNo: "",
    mailingAddress: "",
    officePhone: "", // optional (office_phone in API)
    residencePhone: "", // optional (residence_phone in API)
    phone: "", // required
    email: "", // required
    address: "", // optional
    paymentPlan: "lumpSum",
    plan_type: "0", // Default to lump sum (1)
    processingFee: true,
    totalAmount: "",
    tokenReceived: "",
    balanceDownPayment: "",
    totalBalancePayment: "",
    date: "", // required - booking date
    bank_name: "", // required
    cheque_no: "", // required
    cheque_date: "", // required
    heardFrom: "sms",
    is_filler: "1", // required - 0 or 1
    plot_id: plot?.id || "", // required
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear validation errors when field is edited
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // First, let's enhance the CNIC input handling to ensure only numbers are entered and proper formatting

  // Replace the existing handleCNICChange function with this improved version:
  const handleCNICChange = (e) => {
    const { value } = e.target
    // Only allow numbers
    const numericValue = value.replace(/[^\d]/g, "")
    // Format CNIC as 12345-1234567-1 for display only
    const cnic = numericValue
      .slice(0, 13)
      .replace(/^(\d{5})(\d{7})(\d{1})?$/, "$1-$2-$3")
      .replace(/-+$/, "")
    setFormData((prev) => ({ ...prev, cnic }))

    // Clear validation errors when field is edited
    if (validationErrors.cnic) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.cnic
        return newErrors
      })
    }
  }

  // Add a new function to handle phone number inputs
  const handlePhoneChange = (e) => {
    const { name, value } = e.target
    // Only allow numbers and limit to 11 digits (Pakistan standard)
    const numericValue = value.replace(/[^\d]/g, "").slice(0, 11)
    setFormData((prev) => ({ ...prev, [name]: numericValue }))

    // Clear validation errors when field is edited
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Add a function to handle numerical inputs (for amounts)
  const handleNumericInput = (e) => {
    const { name, value } = e.target
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^\d.]/g, "")
    // Ensure only one decimal point
    const parts = numericValue.split(".")
    const formattedValue = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : numericValue

    setFormData((prev) => ({ ...prev, [name]: formattedValue }))

    // Clear validation errors when field is edited
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleRadioChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Enhance the validateForm function to include more specific validations
  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = "Customer name is required"
    if (!formData.father_name.trim()) errors.father_name = "Father name is required"

    // CNIC validation
    if (!formData.cnic.trim()) {
      errors.cnic = "CNIC is required"
    } else if (formData.cnic.replace(/[^0-9]/g, "").length !== 13) {
      errors.cnic = "CNIC must be 13 digits"
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required"
    } else if (formData.phone.length < 10 || formData.phone.length > 11) {
      errors.phone = "Phone number must be 10-11 digits"
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Valid email is required"
    if (!formData.bank_name.trim()) errors.bank_name = "Bank name is required"
    if (!formData.cheque_no.trim()) errors.cheque_no = "Cheque number is required"
    if (!formData.date) errors.date = "Booking date is required"
    if (!formData.cheque_date) errors.cheque_date = "Cheque date is required"
    if (!formData.plot_id) errors.plot_id = "Please select a plot"
    if (!acceptedTerms) errors.terms = "You must accept the terms and conditions"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setApiError(null)
    setApiResponse(null)
    setValidationErrors({})

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Authentication token not found")
      }

      // Create FormData object for API submission
      const apiFormData = new FormData()

      // Map form fields to API expected fields
      apiFormData.append("name", formData.name)
      apiFormData.append("father_name", formData.father_name)
      apiFormData.append("cnic", formData.cnic.replace(/-/g, "")) // Remove dashes from CNIC
      apiFormData.append("phone", formData.phone)
      apiFormData.append("email", formData.email)
      apiFormData.append("is_filler", formData.is_filler)
      apiFormData.append("plot_id", formData.plot_id)
      apiFormData.append("date", formData.date)
      apiFormData.append("bank_name", formData.bank_name)
      apiFormData.append("cheque_no", formData.cheque_no)
      apiFormData.append("cheque_date", formData.cheque_date)

      // Optional fields
      if (formData.officePhone) apiFormData.append("office_phone", formData.officePhone)
      if (formData.residencePhone) apiFormData.append("residence_phone", formData.residencePhone)
      if (formData.mailingAddress) apiFormData.append("address", formData.mailingAddress)

      // Additional fields that might be useful
      if (formData.passportNo) apiFormData.append("passport_no", formData.passportNo)
      if (formData.totalAmount) apiFormData.append("total_amount", formData.totalAmount)
      if (formData.tokenReceived) apiFormData.append("token_received", formData.tokenReceived)
      if (formData.balanceDownPayment) apiFormData.append("balance_down_payment", formData.balanceDownPayment)
      if (formData.totalBalancePayment) apiFormData.append("total_balance_payment", formData.totalBalancePayment)
      if (formData.heardFrom) apiFormData.append("heard_from", formData.heardFrom)

      // Update the API submission to include plan_type
      if (formData.plan_type) apiFormData.append("plan_type", formData.plan_type)

      // Make API request
      const response = await fetch(MARKETING_ENDPOINTS.SALE_RESERVE_BOOKING, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: apiFormData,
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Handle validation errors from API
        if (responseData.errors) {
          setValidationErrors(responseData.errors)

          // Create a readable error message from all validation errors
          const errorMessages = Object.entries(responseData.errors)
            .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
            .join("\n")

          throw new Error(`Validation errors:\n${errorMessages}`)
        }
        throw new Error(responseData.message || "Failed to submit booking")
      }

      // Store the complete response data
      setApiResponse(responseData)

      // Set booking data for PDF generation
      setBookingData({
        ...responseData.data,
        plot_details: plot,
        customer_details: formData,
        booking_date: new Date().toISOString(),
        booking_id: responseData.data?.id || responseData.data?.booking_id || "N/A",
      })

      // Show success message
      setBookingComplete(true)
    } catch (error) {
      setApiError(error.message || "Failed to submit booking. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to display validation errors
  const getFieldError = (fieldName) => {
    if (validationErrors[fieldName]) {
      return Array.isArray(validationErrors[fieldName]) ? validationErrors[fieldName][0] : validationErrors[fieldName]
    }
    return formErrors[fieldName]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Plot Booking Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display API errors */}
          {apiError && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800 whitespace-pre-line">{apiError}</AlertDescription>
            </Alert>
          )}

          {/* Display API success */}
          {bookingComplete && apiResponse && apiResponse.success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {apiResponse?.message || "Booking completed successfully!"}
              </AlertDescription>
            </Alert>
          )}

          {/* Allotment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">ALLOTMENT INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="plot_no">Plot No</Label>
                <Input id="plot_no" value={plot?.plot_no || ""} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="street_no">Street No</Label>
                <Input id="street_no" value={plot?.street_no || ""} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Input id="sector" value={plot?.sector || ""} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="block">Block</Label>
                <Input id="block" value={plot?.phase || ""} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="size">Size</Label>
                <Input id="size" value={plot?.size || plot?.cat_area || ""} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input id="type" value={plot?.category || "Residential"} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="phase">Phase</Label>
                <Input id="phase" value={plot?.phase || ""} readOnly className="bg-gray-50" />
              </div>
              {/* Hidden input for plot_id */}
              <input type="hidden" name="plot_id" value={plot?.id || ""} />
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">PERSONAL INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name" className={getFieldError("name") ? "text-red-500" : ""}>
                  Name of Applicant*
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  autoComplete="name"
                  className="w-full"
                />
                {getFieldError("name") && <p className="text-red-500 text-sm mt-1">{getFieldError("name")}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="father_name" className={getFieldError("father_name") ? "text-red-500" : ""}>
                  S/O, D/O, W/O*
                </Label>
                <Input
                  id="father_name"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleInputChange}
                  className={getFieldError("father_name") ? "border-red-500" : ""}
                />
                {getFieldError("father_name") && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError("father_name")}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cnic" className={getFieldError("cnic") ? "text-red-500" : ""}>
                  CNIC*
                </Label>
                <Input
                  id="cnic"
                  name="cnic"
                  type="text"
                  placeholder="00000-0000000-0"
                  value={formData.cnic}
                  onChange={handleCNICChange}
                  maxLength={15}
                  className={getFieldError("cnic") ? "border-red-500" : ""}
                />
                {getFieldError("cnic") && <p className="text-red-500 text-sm mt-1">{getFieldError("cnic")}</p>}
              </div>

              <div>
                <Label htmlFor="passportNo">Passport No</Label>
                <Input id="passportNo" name="passportNo" value={formData.passportNo} onChange={handleInputChange} />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="mailingAddress">Mailing Address</Label>
                <Textarea
                  id="mailingAddress"
                  name="mailingAddress"
                  value={formData.mailingAddress}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="officePhone">Phone No (Office)</Label>
                <Input
                  id="officePhone"
                  name="officePhone"
                  value={formData.officePhone}
                  onChange={handlePhoneChange}
                  maxLength={11}
                />
              </div>

              <div>
                <Label htmlFor="residencePhone">Residence</Label>
                <Input
                  id="residencePhone"
                  name="residencePhone"
                  value={formData.residencePhone}
                  onChange={handlePhoneChange}
                  maxLength={11}
                />
              </div>

              <div>
                <Label htmlFor="phone" className={getFieldError("phone") ? "text-red-500" : ""}>
                  Mobile* (10-11 digits)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={getFieldError("phone") ? "border-red-500" : ""}
                  maxLength={11}
                  placeholder="03XXXXXXXXX"
                />
                {getFieldError("phone") && <p className="text-red-500 text-sm mt-1">{getFieldError("phone")}</p>}
              </div>

              <div>
                <Label htmlFor="email" className={getFieldError("email") ? "text-red-500" : ""}>
                  Email*
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={getFieldError("email") ? "border-red-500" : ""}
                />
                {getFieldError("email") && <p className="text-red-500 text-sm mt-1">{getFieldError("email")}</p>}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">PAYMENT INFORMATION</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalAmount">Total Amount (PKR)</Label>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleNumericInput}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="tokenReceived">Token Received</Label>
                <Input
                  id="tokenReceived"
                  name="tokenReceived"
                  value={formData.tokenReceived}
                  onChange={handleNumericInput}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="balanceDownPayment">Balance Down Payment</Label>
                <Input
                  id="balanceDownPayment"
                  name="balanceDownPayment"
                  value={formData.balanceDownPayment}
                  onChange={handleNumericInput}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="totalBalancePayment">Total Balance Payment</Label>
                <Input
                  id="totalBalancePayment"
                  name="totalBalancePayment"
                  value={formData.totalBalancePayment}
                  onChange={handleNumericInput}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-6">
              {/* Only show payment plan options for RVN in Phase 4 or B3 in Phase 5 */}
              {((plot?.phase === "4" && plot?.sector === "RVN") || (plot?.phase === "6" && plot?.sector === "B3")) && (
                <>
                  <Label className="mb-2 block">Payment Plan:</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="lumpSum"
                        checked={formData.paymentPlan === "lumpSum"}
                        onChange={() => {
                          handleRadioChange("paymentPlan", "lumpSum")
                          handleRadioChange("plan_type", "0") // Set plan_type to 1 for lump sum
                        }}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="lumpSum">Lump Sum</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="installment2Year"
                        checked={formData.paymentPlan === "installment2Year"}
                        onChange={() => {
                          handleRadioChange("paymentPlan", "installment2Year")
                          handleRadioChange("plan_type", "2") // Set plan_type to 2 for 2 year installment
                        }}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="installment2Year">2 Year Installment Plan</Label>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="date" className={getFieldError("date") ? "text-red-500" : ""}>
                  Booking Date*
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={getFieldError("date") ? "border-red-500" : ""}
                />
                {getFieldError("date") && <p className="text-red-500 text-sm mt-1">{getFieldError("date")}</p>}
              </div>
              <div>
                <Label htmlFor="bank_name" className={getFieldError("bank_name") ? "text-red-500" : ""}>
                  Drawn on Bank*
                </Label>
                <Input
                  id="bank_name"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  className={getFieldError("bank_name") ? "border-red-500" : ""}
                />
                {getFieldError("bank_name") && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError("bank_name")}</p>
                )}
              </div>
              <div>
                <Label htmlFor="cheque_no" className={getFieldError("cheque_no") ? "text-red-500" : ""}>
                  Cheque/DD/Pay Order #*
                </Label>
                <Input
                  id="cheque_no"
                  name="cheque_no"
                  value={formData.cheque_no}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, "").slice(0, 20)
                    setFormData((prev) => ({ ...prev, cheque_no: value }))

                    if (validationErrors.cheque_no) {
                      setValidationErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.cheque_no
                        return newErrors
                      })
                    }
                  }}
                  className={getFieldError("cheque_no") ? "border-red-500" : ""}
                  maxLength={20}
                />
                {getFieldError("cheque_no") && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError("cheque_no")}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="cheque_date" className={getFieldError("cheque_date") ? "text-red-500" : ""}>
                  Cheque Date*
                </Label>
                <Input
                  id="cheque_date"
                  name="cheque_date"
                  type="date"
                  value={formData.cheque_date}
                  onChange={handleInputChange}
                  className={getFieldError("cheque_date") ? "border-red-500" : ""}
                />
                {getFieldError("cheque_date") && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError("cheque_date")}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Label className="mb-2 block">How did you hear about this launch?</Label>
              <RadioGroup
                value={formData.heardFrom}
                onValueChange={(value) => handleRadioChange("heardFrom", value)}
                className="grid grid-cols-2 md:grid-cols-3 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms">SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email-source" />
                  <Label htmlFor="email-source">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="billboard" id="billboard" />
                  <Label htmlFor="billboard">Billboard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="newspaper" id="newspaper" />
                  <Label htmlFor="newspaper">Newspaper</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="social" id="social" />
                  <Label htmlFor="social">Social Media</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="mt-6">
              <Label className="mb-2 block">FBR active Taxpayers status:</Label>
              <RadioGroup
                value={formData.is_filler}
                onValueChange={(value) => handleRadioChange("is_filler", value)}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="filer" />
                  <Label htmlFor="filer">Filer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="nonFiler" />
                  <Label htmlFor="nonFiler">Non-Filer</Label>
                </div>
              </RadioGroup>
              {getFieldError("is_filler") && <p className="text-red-500 text-sm mt-1">{getFieldError("is_filler")}</p>}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm">The above information is correct and be recorded accordingly.</p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">TERMS & CONDITIONS</h3>
            <div className="text-sm space-y-2 border p-4 rounded-md bg-gray-50 max-h-60 overflow-y-auto">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  10% Discount on sale price will be applicable Local Pakistanis (payment within Pakistan) & Special 15%
                  Discount on sale Price for Overseas Pakistanis for international fund transfer will be applicable
                  after confirmation from Fin Dte.
                </li>
                <li>Price of property is inclusive of applicable DHA Charges & Govt Taxes (for filers only).</li>
                <li>
                  One Application Form can be used for one booking only and no restrictions on number of applications.
                </li>
                <li>
                  Online Payments can be made through Kuickpay & by signing into DHA's Online Member Portal at
                  http://member.dhai-r.com.pk
                </li>
                <li>All Applicants holding CNIC / NICOP are eligible to participate.</li>
                <li>Allotment of plot on First Come First Serve Basis.</li>
                <li>
                  Intimation Letter shall be sent electronically to applicants after allotment on given email address
                  and upload on DHAI-R website. Hard copy of the Intimation Letter shall be sent through courier on the
                  given postal address.
                </li>
                <li>
                  Allocation Letter, considered as "Title Document" will be issued by Tfr & Rec Dte after deposit of
                  Chosen Lump sum or Down Payment of total sale consideration along with applicable DHA Charges & Govt
                  Taxes after confirmation by Finance Dte & issuance of Intimation Letter by Mktg Dte.
                </li>
                <li>Lump Sum payment to be deposited within 4 Weeks from booking date.</li>
                <li>5% annual Increase on base price of plot is applicable on offered Installment plans.</li>
                <li>
                  Token of 5 Lacs rupees will be received on spot for confirmation & 20% of total sale price shall be
                  deposited as Down Payment within 4 Weeks & balance payment as per opted plan.
                </li>
                <li>
                  Applicants to abide by all Bye-Laws, rules, policies of DHAI-R in respect of the allotment of plot
                  including inter alia, Site Plan, Possession and Construction etc.
                </li>
                <li>10% of total sale consideration will be additionally charged for Corner Category Property.</li>
                <li>
                  Allotment Letter will be issued after payment of total sale consideration, DHA Charges & applicable
                  Government Taxes on initial allotment. However, additional Advance Tax & FED in case of Late Filer /
                  Non-Filer & Stamp duty is required to be paid before issuance of allotment letter or at the time of
                  sale of plot whichever is earlier. Moreover, Government Taxes related laws shall be applicable as and
                  when revised.
                </li>
                <li>
                  Sales / Transfer will be allowed through normal transfer procedure after deposit of all due
                  installments & Govt Taxes, remaining payment shall be carry fwd to the purchaser.
                </li>
                <li>
                  In case applicant fails to pay 2 x consecutive installments his/her allotment shall be cancelled after
                  issuance of notice in this regard and deposited amount shall be refunded as per DHAI-R Policy.
                </li>
                <li>
                  In case of cancellation of a plot, deposited amount will be refunded after deduction of 20% of the
                  total deposited amount except DHA Charges & Government Taxes within eight weeks from the request of
                  cancellation. Refund shall be made in PKR (Rupees) without any interest / markup on deposited amount
                  vide Demand Draft / Pay Order / Crossed Cheque in the name of applicant, at the rate at which amount
                  was deposited in foreign currency (if any).
                </li>
                <li>
                  The sale price is based on standard size of property. However, variation due to oversize shall be
                  charged separately at the time of Possession / Site Plan.
                </li>
                <li>
                  Possession of the property shall be handed over to the applicant for construction after the complete
                  payment according to DHA Bye-laws.
                </li>
                <li>
                  Any and all refund shall be made in PKR (Rupees) without any interest / markup on deposited amount.
                </li>
                <li>
                  Surcharge @ 6 months KIBOR + 5% per annum would be charged on late payment of installments, however,
                  failure to deposit of 2 x consecutive installments stated in clause 16 above will be invoked.
                </li>
                <li>
                  In case of any dispute arising out of or in relation to the application / allotment property, the same
                  shall be resolved by arbitration to be conducted by the "Management Committee" of DHAI-R or any other
                  person or body as DHAI-R may deem fit.
                </li>
                <li>
                  The Application for the property and its subsequent allotment and transfer shall be governed by the
                  applicable laws of Pakistan and the internal rules, regulations, policies and procedures of DHAI-R and
                  the court of Rawalpindi shall have exclusive jurisdiction in this regard.
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-4 flex items-start space-x-2">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="acceptTerms" className="text-sm">
              I have read and agree to the terms and conditions
            </label>
          </div>
          {formErrors.terms && <p className="text-red-500 text-sm mt-1">{formErrors.terms}</p>}
        </CardContent>

        <CardFooter className="flex justify-between">
          <button
            type="button"
            onClick={onBackToSelection}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to Plot Selection
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Book Plot"}
          </button>
        </CardFooter>
      </Card>

      {/* Declaration */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 text-center">DECLARATION</h3>
          <div className="flex justify-end mt-8">
            <div className="text-center">
              <p>Booking Officer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Generation Section - Only shown after successful booking */}
      {bookingComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200 mb-4">
              <AlertDescription className="text-green-800">
                {apiResponse?.message || "Booking completed successfully!"}
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-4">
              <PDFGenerator bookingData={bookingData} />
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  )
}
