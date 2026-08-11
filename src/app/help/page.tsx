"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText, Search } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"

const allFaqs = [
  {
    q: "How do I create an RFP?",
    a: "Log in to your account and navigate to the RFPs section in the sidebar. Click the \"Create RFP\" button, fill in the title, description, deadline, and requirements. You can use our templates to get started quickly. Once published, vendors can view and respond to your RFP.",
  },
  {
    q: "How do I submit a proposal as a vendor?",
    a: "Vendors can browse open RFPs in the Marketplace. When you find an RFP you want to respond to, click \"Submit Proposal\" and fill in the required fields including your approach, timeline, and pricing. Make sure to submit before the deadline.",
  },
  {
    q: "How do I update my account settings?",
    a: "Click on your user avatar in the top-right corner and select \"Settings\". From there you can update your profile information, change your password, configure notification preferences, and manage your organization details.",
  },
  {
    q: "How do I register as a vendor?",
    a: "During sign-up, select the \"Vendor\" account type. Complete your vendor profile including company information, capabilities, certifications, and contact details. Once verified, you will appear in the vendor marketplace and can start responding to RFPs.",
  },
  {
    q: "What are the pricing plans?",
    a: "We offer a Free plan for small teams, a Professional plan for growing organizations, and an Enterprise plan with custom pricing. Visit our pricing page or contact sales for detailed plan comparisons and volume discounts.",
  },
  {
    q: "How does the evaluation scoring work?",
    a: "Buyers define weighted scoring criteria when creating an RFP (e.g., Technical Approach 40%, Price 30%, Experience 30%). Evaluators score each proposal against these criteria, and the system calculates a weighted total to rank vendors objectively.",
  },
  {
    q: "Is my data secure on the platform?",
    a: "Yes. We use AES-256 encryption at rest, TLS 1.3 in transit, and follow SOC 2 Type II compliance standards. All data is stored in isolated tenant databases, and we perform regular security audits and penetration tests.",
  },
  {
    q: "Can I export RFP data and reports?",
    a: "Yes. You can export RFP details, proposal submissions, and evaluation scores as PDF or CSV files. Admin users can also generate procurement analytics reports with custom date ranges and filters.",
  },
]

export default function HelpPage() {
  const [search, setSearch] = useState("")
  const filtered = allFaqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-semibold">RFP Platform</span>
          </div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Help Center</h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about using RFP Platform.
          </p>
        </section>

        <section className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </section>

        <section className="max-w-2xl mx-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground">No results found. Try a different search term.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filtered.map((faq, i) => (
                <AccordionItem key={i} value={String(i)}>
                  <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} RFP Platform. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
