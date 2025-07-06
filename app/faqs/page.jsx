import Link from "next/link"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const metadata = {
  title: "FAQs | Plot Selling Dashboard",
  description: "Frequently asked questions about plot selling and bidding",
}

export default function FAQsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <main className="flex-1 container max-w-4xl py-10">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img src="/images/dha-logo.png" alt="DHA Logo" className="h-16" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
              <p className="text-muted-foreground mt-2">
                Find answers to common questions about our plot selling platform.
              </p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is an digital / online plot auction?</AccordionTrigger>
              <AccordionContent>
                An online plot auction is a digital platform where land or real estate plots are sold to the highest
                bidder in a competitive bidding process.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>How does the online bidding process work?</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Users register on the platform.</li>
                  <li>They browse available plots on GIS maps and review details.</li>
                  <li>For residential plots, it is first come first served.</li>
                  <li>Bids can be placed for commercial plots only.</li>
                  <li>They place bids within the auction period.</li>
                  <li>The highest bid at the auction's end wins the plot.</li>
                  <li>The winner completes payment and documentation.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>What are the benefits of online plot auctions?</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Transparency: Real-time bidding ensures fair competition.</li>
                  <li>Convenience: Participate from anywhere, anytime.</li>
                  <li>Competitive Pricing: Buyers get the best prices through bidding.</li>
                  <li>Efficient Process: Automated bidding and quick transactions.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Why doesn't the dashboard work fully on my iPhone web browser?</AccordionTrigger>
              <AccordionContent>
                Some features may not work perfectly on iOS due to Safari's limitations, but we're working on it! A
                full-featured iOS app is coming soon for the best experience. In the meantime, try using a desktop or
                Android device. Thanks for your patience!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>How do I register for the auction?</AccordionTrigger>
              <AccordionContent>
                You need to sign up on the platform, provide necessary details (such as CNIC/NICOP, phone number, and
                email), and verify your identity.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Is there a registration fee?</AccordionTrigger>
              <AccordionContent>
                Yes participants will be required to pay the registration fee according to the categories.
                <br />
                Commercial Plots – Rs. 0.5 Million
                <br />
                Big Sites – Rs. 1.0 Million
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>Can anyone participate in the auction?</AccordionTrigger>
              <AccordionContent>
                Yes, but participants must meet eligibility criteria, such as registration fee, age, identity and
                company verification.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>How do I place a bid?</AccordionTrigger>
              <AccordionContent>Once logged in, you can select a plot and enter your bid amount.</AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger>Can I modify or cancel my bid?</AccordionTrigger>
              <AccordionContent>Yes, before closing of auction.</AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger>What happens if two people place the same highest bid?</AccordionTrigger>
              <AccordionContent>
                The first person who placed the bid gets priority. This will be based on time stamp.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger>How do I know if I won the auction?</AccordionTrigger>
              <AccordionContent>
                The highest bidder receives an email and notification confirming their win through email & formal
                intimation letter.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12">
              <AccordionTrigger>What happens after I win a bid?</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You must complete the payment within a specified period.</li>
                  <li>Documentation and legal formalities follow.</li>
                  <li>The plot will be officially transferred to your name.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13">
              <AccordionTrigger>What are the payment options?</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Bank transfer</li>
                  <li>Online payment gateway</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14">
              <AccordionTrigger>What happens if I don't pay after winning?</AccordionTrigger>
              <AccordionContent>
                Your bid may be canceled, and your deposited amount will be refunded after 20% Deduction. You may also
                be banned from future auctions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-15">
              <AccordionTrigger>Is the auctioned plot legally verified?</AccordionTrigger>
              <AccordionContent>Yes, all plots go through legal verification before being listed.</AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-16">
              <AccordionTrigger>Will I receive an ownership document?</AccordionTrigger>
              <AccordionContent>
                Yes, once payment is completed, you will receive official documents proving ownership.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-17">
              <AccordionTrigger>Can I resell the plot after winning the auction?</AccordionTrigger>
              <AccordionContent>
                Yes, after deposited of down payment and receipt of allocation letter.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-18">
              <AccordionTrigger>What if I face issues while bidding?</AccordionTrigger>
              <AccordionContent>You can contact our support team via email, or phone.</AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-19">
              <AccordionTrigger>Is my personal and payment information secure?</AccordionTrigger>
              <AccordionContent>
                Yes, we use encryption and secure payment gateways to protect your data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-20">
              <AccordionTrigger>Can I participate in multiple auctions at once?</AccordionTrigger>
              <AccordionContent>
                Yes, you can bid on multiple plots simultaneously if eligible. However, one transaction will be done at
                a time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-21">
              <AccordionTrigger>
                I've made my token payment. When will I receive confirmation or acknowledgement?
              </AccordionTrigger>
              <AccordionContent>
                Once you've completed your token payment, please allow up to 48 hours for final acknowledgement. Our
                team verifies all payments manually to ensure accuracy and security. You will receive an official
                confirmation via email or through your account once the process is complete. If you do not hear from us
                within 48 hours, please feel free to reach out to our support team with your payment reference.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">Still have questions? Contact our support team for assistance.</p>
            <Link
              href="/contact"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
