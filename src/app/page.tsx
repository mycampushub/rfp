"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Users,
  Shield,
  TrendingUp,
  LayoutTemplate,
  FileSignature,
  Webhook,
  BarChart2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "RFP Creation Wizard",
    description: "8-step guided wizard with drag-and-drop sections, scoring rubrics, and team assignment.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Users,
    title: "Vendor Marketplace",
    description: "Full vendor portal with profiles, bidding, reviews, categories, and real-time messaging.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "RBAC, CSRF protection, HMAC webhooks, audit logging, and AES-256 encryption utilities.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: TrendingUp,
    title: "Weighted Scoring",
    description: "Multi-criteria evaluation with rubrics, consensus scoring, blind evaluation, and comparison.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: LayoutTemplate,
    title: "RFP Templates",
    description: "6 built-in templates (IT, Construction, Software, etc.) plus custom template creation.",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: FileSignature,
    title: "Contracts & Awards",
    description: "Formal vendor award workflow, contract lifecycle management, and status tracking.",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: BarChart2,
    title: "Analytics & Export",
    description: "Dashboard charts, spend analytics, and CSV export for RFPs, vendors, and evaluations.",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    icon: Webhook,
    title: "Automations",
    description: "Webhook dispatch, cron scheduler for auto-close/deadlines, and approval workflows with SLA.",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-500/10",
  },
]

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (status === "authenticated") {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 dark:bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold">RFP Platform</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Enterprise RFP
              <span className="text-primary"> Management</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              A multi-tenant, enterprise-grade platform for creating, publishing, evaluating,
              and awarding Requests for Proposal — with weighted scoring, vendor marketplace,
              contract management, and full automation.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
            {features.map((f) => (
              <Card key={f.title} className="text-center hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${f.bg}`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {f.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Social Proof / Stats */}
        <section className="border-y bg-muted/50">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
              {[
                ["35+", "Database Models"],
                ["80+", "API Endpoints"],
                ["50+", "UI Components"],
                ["11", "Webhook Events"],
              ].map(([val, label]) => (
                <div key={label}>
                  <div className="text-3xl md:text-4xl font-bold text-primary">{val}</div>
                  <div className="text-sm text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold">
                Ready to streamline your procurement?
              </h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Self-hosted, free, and open source. Full RFP lifecycle from creation
                to contract award with enterprise-grade security.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
                {["Multi-tenant", "RBAC", "CSV Export", "Templates", "Blind Evaluation", "Contracts"].map((tag) => (
                  <span key={tag} className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} RFP Platform. All rights reserved.
        </div>
      </footer>
    </div>
  )
}