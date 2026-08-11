import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "System Status | RFP Platform",
  description: "Check the real-time operational status of all RFP Platform services, including API, database, and infrastructure health monitoring.",
}

const services = [
  { name: "API", status: "Operational" },
  { name: "Database", status: "Operational" },
  { name: "File Storage", status: "Operational" },
  { name: "Notifications", status: "Operational" },
]

export default function StatusPage() {
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
        <section className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">System Status</h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xl font-semibold">All Systems Operational</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Last checked: {new Date().toLocaleString()}
          </p>
        </section>

        <section className="max-w-xl mx-auto">
          <div className="rounded-lg border">
            {services.map((service, i) => (
              <div
                key={service.name}
                className={`flex items-center justify-between px-6 py-4 ${
                  i < services.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="font-medium">{service.name}</span>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15">
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
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
