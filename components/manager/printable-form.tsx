"use client"
import { useEffect, useState } from "react"

export default function PrintableForm({ bookingData }) {
  const [imagesLoaded, setImagesLoaded] = useState(false)

  useEffect(() => {
    // Set a timeout to ensure images have time to load
    const timer = setTimeout(() => {
      setImagesLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (!bookingData) return null

  const { plot_details, customer_details } = bookingData
  const currentDate = new Date()
  const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`

  return (
    <div className="bg-white text-black p-4 border border-gray-200 rounded-lg max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
      {/* First Page - Application Form */}
      <div id="application-form" className="mb-8 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="relative w-16 h-16 mr-4">
              <img src="/images/dha-circular-logo.png" alt="DHA Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold">APPLICATION FORM</h2>
            <h1 className="text-2xl font-bold">DHA EXPO 2025</h1>
            <h3 className="text-lg">DHA Islamabad-Rawalpindi</h3>
          </div>
          <div className="relative w-24 h-24">
            <img src="/images/expo-logo.png" alt="EXPO Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm">Application No: __________________</p>
          <p className="text-sm">Date: {formattedDate}</p>
        </div>

        <div className="border border-gray-600 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold mb-2 uppercase">Allotment Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm">
                Plot No: <span className="font-medium">{plot_details?.plot_no || "_______"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Street No: <span className="font-medium">{plot_details?.street_no || "_______"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Sector: <span className="font-medium">{plot_details?.sector || "_______"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Size: <span className="font-medium">{plot_details?.size || plot_details?.cat_area || "_______"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Type: <span className="font-medium">{plot_details?.category || "Residential"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Phase: <span className="font-medium">{plot_details?.phase || "_______"}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border border-gray-600 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold mb-2 uppercase">Personal Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm">
                Name of Applicant:{" "}
                <span className="font-medium">{customer_details?.name || "_______________________"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                S/O, D/O, W/O:{" "}
                <span className="font-medium">{customer_details?.father_name || "_______________________"}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">
                  CNIC:{" "}
                  <span className="font-medium">
                    {customer_details?.cnic || "__ __ __ __ __ - __ __ __ __ __ __ __ - __"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm">
                  Passport No:{" "}
                  <span className="font-medium">{customer_details?.passportNo || "_______________________"}</span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm">
                Mailing Address:{" "}
                <span className="font-medium">{customer_details?.mailingAddress || "_______________________"}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm">
                  Phone No (Office): <span className="font-medium">{customer_details?.officePhone || "_______"}</span>
                </p>
              </div>
              <div>
                <p className="text-sm">
                  Res: <span className="font-medium">{customer_details?.residencePhone || "_______"}</span>
                </p>
              </div>
              <div>
                <p className="text-sm">
                  Mobile: <span className="font-medium">{customer_details?.phone || "_______"}</span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm">
                Email: <span className="font-medium">{customer_details?.email || "_______________________"}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border border-gray-600 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold mb-2 uppercase">Payment Information</h3>
          <div className="grid grid-cols-1 gap-4 mb-4">
            {((plot_details?.phase === "4" && plot_details?.sector === "RVN") ||
              (plot_details?.phase === "6" && plot_details?.sector === "B3")) && (
              <div>
                <p className="text-sm font-bold">Payment Plan:</p>
                <div className="flex flex-col space-y-2 mt-2">
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 border border-black mr-2 ${
                        customer_details?.paymentPlan === "lumpSum" || customer_details?.plan_type === "0"
                          ? "bg-black"
                          : ""
                      }`}
                    ></div>
                    <span className="text-sm">Lump Sum</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 border border-black mr-2 ${
                        customer_details?.paymentPlan === "installment2Year" || customer_details?.plan_type === "2"
                          ? "bg-black"
                          : ""
                      }`}
                    ></div>
                    <span className="text-sm">2 Year Installment Plan</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm">
                Total Amount (PKR): <span className="font-medium">{customer_details?.totalAmount || "_______"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Token Received: <span className="font-medium">{customer_details?.tokenReceived || "_______"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Balance Down Payment:{" "}
                <span className="font-medium">{customer_details?.balanceDownPayment || "_______"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Total Balance Payment:{" "}
                <span className="font-medium">{customer_details?.totalBalancePayment || "_______"}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm">
                Date: <span className="font-medium">{customer_details?.date || "_______"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Drawn on Bank: <span className="font-medium">{customer_details?.bank_name || "_______"}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                Cheque/DD/Pay Order #: <span className="font-medium">{customer_details?.cheque_no || "_______"}</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold">How did you hear about this launch?</p>
            <div className="flex space-x-4 mt-2">
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 border border-black mr-2 ${customer_details?.heardFrom === "sms" ? "bg-black" : ""}`}
                ></div>
                <span className="text-sm">SMS</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 border border-black mr-2 ${customer_details?.heardFrom === "email" ? "bg-black" : ""}`}
                ></div>
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 border border-black mr-2 ${customer_details?.heardFrom === "billboard" ? "bg-black" : ""}`}
                ></div>
                <span className="text-sm">Billboard</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 border border-black mr-2 ${customer_details?.heardFrom === "newspaper" ? "bg-black" : ""}`}
                ></div>
                <span className="text-sm">Newspaper</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 border border-black mr-2 ${customer_details?.heardFrom === "social" ? "bg-black" : ""}`}
                ></div>
                <span className="text-sm">Social Media</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 border border-black mr-2 ${customer_details?.heardFrom === "other" ? "bg-black" : ""}`}
                ></div>
                <span className="text-sm">Other</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-bold">FBR active Taxpayers status:</p>
            <div className="flex space-x-8 mt-2">
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 border border-black mr-2 ${customer_details?.is_filler === "1" ? "bg-black" : ""}`}
                ></div>
                <span className="text-sm">Filer</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 border border-black mr-2 ${customer_details?.is_filler === "0" ? "bg-black" : ""}`}
                ></div>
                <span className="text-sm">Non-Filer</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm italic">The above information is correct and be recorded accordingly.</p>
          </div>

          <div className="mt-8 border-t border-gray-600 pt-4">
            <div className="h-16"></div>
            <p className="text-center">_______________________________</p>
            <p className="text-center text-sm">Signature & Thumb Impression of the Applicant</p>
          </div>
        </div>
      </div>

      {/* Second Page - Terms & Conditions */}
      <div id="terms-conditions" className="bg-white text-black p-1 rounded-lg">
        <h2 className="text-xl font-bold text-center mb-4">TERMS & CONDITIONS</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>
            10% Discount on sale price will be applicable Local Pakistanis (payment within Pakistan) & Special 15%
            Discount on sale Price for Overseas Pakistanis for international fund transfer will be applicable after
            confirmation from Fin Dte.
          </li>
          <li>Price of property is inclusive of applicable DHA Charges & Govt Taxes (for filers only).</li>
          <li>One Application Form can be used for one booking only and no restrictions on number of applications.</li>
          <li>
            Online Payments can be made through Kuickpay & by signing into DHA's Online Member Portal at
            http://member.dhai-r.com.pk
          </li>
          <li>All Applicants holding CNIC / NICOP are eligible to participate.</li>
          <li>Allotment of plot on First Come First Serve Basis.</li>
          <li>
            Intimation Letter shall be sent electronically to applicants after allotment on given email address and
            upload on DHAI-R website. Hard copy of the Intimation Letter shall be sent through courier on the given
            postal address.
          </li>
          <li>
            Allocation Letter, considered as "Title Document" will be issued by Tfr & Rec Dte after deposit of Chosen
            Lump sum or Down Payment of total sale consideration along with applicable DHA Charges & Govt Taxes after
            confirmation by Finance Dte & issuance of Intimation Letter by Mktg Dte.
          </li>
          <li>Lump Sum payment to be deposited within 4 Weeks from booking date.</li>
          <li>5% annual Increase on base price of plot is applicable on offered Installment plans.</li>
          <li>
            Token of 5 Lacs rupees will be received on spot for confirmation & 20% of total sale price shall be
            deposited as Down Payment within 4 Weeks & balance payment as per opted plan.
          </li>
          <li>
            Applicants to abide by all Bye-Laws, rules, policies of DHAI-R in respect of the allotment of plot including
            inter alia, Site Plan, Possession and Construction etc.
          </li>
          <li>10% of total sale consideration will be additionally charged for Corner Category Property.</li>
          <li>
            Allotment Letter will be issued after payment of total sale consideration, DHA Charges & applicable
            Government Taxes on initial allotment. However, additional Advance Tax & FED in case of Late Filer /
            Non-Filer & Stamp duty is required to be paid before issuance of allotment letter or at the time of sale of
            plot whichever is earlier. Moreover, Government Taxes related laws shall be applicable as and when revised.
          </li>
          <li>
            Sales / Transfer will be allowed through normal transfer procedure after deposit of all due installments &
            Govt Taxes, remaining payment shall be carry fwd to the purchaser.
          </li>
          <li>
            In case applicant fails to pay 2 x consecutive installments his/her allotment shall be cancelled after
            issuance of notice in this regard and deposited amount shall be refunded as per DHAI-R Policy.
          </li>
          <li>
            In case of cancellation of a plot, deposited amount will be refunded after deduction of 20% of the total
            deposited amount except DHA Charges & Government Taxes within eight weeks from the request of cancellation.
            Refund shall be made in PKR (Rupees) without any interest / markup on deposited amount vide Demand Draft /
            Pay Order / Crossed Cheque in the name of applicant, at the rate at which amount was deposited in foreign
            currency (if any).
          </li>
          <li>
            The sale price is based on standard size of property. However, variation due to oversize shall be charged
            separately at the time of Possession / Site Plan.
          </li>
          <li>
            Possession of the property shall be handed over to the applicant for construction after the complete payment
            according to DHA Bye-laws.
          </li>
          <li>Any and all refund shall be made in PKR (Rupees) without any interest / markup on deposited amount.</li>
          <li>
            Surcharge @ 6 months KIBOR + 5% per annum would be charged on late payment of installments, however, failure
            to deposit of 2 x consecutive installments stated in clause 16 above will be invoked.
          </li>
          <li>
            In case of any dispute arising out of or in relation to the application / allotment property, the same shall
            be resolved by arbitration to be conducted by the "Management Committee" of DHAI-R or any other person or
            body as DHAI-R may deem fit.
          </li>
          <li>
            The Application for the property and its subsequent allotment and transfer shall be governed by the
            applicable laws of Pakistan and the internal rules, regulations, policies and procedures of DHAI-R and the
            court of Rawalpindi shall have exclusive jurisdiction in this regard.
          </li>
        </ol>

        <div className="flex justify-between items-end mt-8">
          <div className="w-1/2">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-4">DHA ISLAMABAD PROPERTY</h3>
              <div className="relative w-32 h-32 mx-auto">
                <img src="/images/expo-logo.png" alt="EXPO Logo" className="w-full h-full object-contain" />
              </div>
              <p className="text-sm font-bold">& DIGITAL</p>
              <p className="text-sm font-bold">AUCTION 2025</p>
            </div>
          </div>

          <div className="w-1/2">
            <div className="relative w-24 h-24 mx-auto mb-2">
              <img src="/images/dha-circular-logo.png" alt="DHA Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-center text-xs">
              <p className="font-bold">DHA ISLAMABAD</p>
              <p>Defence Housing Authority</p>
              <p>Phase-II, Sector F, DHA Islamabad</p>
              <p>UAN: 051-111-555-111</p>
              <p>www.dhai-r.com.pk</p>
              <p>Email: info@dhai-r.com.pk</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-600 pt-4">
          <h3 className="text-lg font-bold text-center mb-4">DECLARATION</h3>
          <p className="text-sm text-center mb-6">
            I have hereby read and understood the above terms and conditions and I/We hereby agree & undertake to abide
            by all the terms and conditions as laid down above as well as those that may be prescribed by DHA Islamabad
            - Rawalpindi from time to time.
          </p>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <p className="text-sm mb-8">Signature & Thumb Impression of the Applicant</p>
              <p className="text-sm">Date: __________2025</p>
            </div>
            <div className="text-right">
              <p className="text-sm mb-16">Booking Officer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
