import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText, Users, Target, Shield, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "About Us | RFP Platform",
  description: "Learn about the RFP Platform team, our mission, and how we help organizations streamline their procurement process with modern RFP management tools.",
}

const team = [
  { name: "Sarah Chen", role: "CEO & Co-Founder", initials: "SC" },
  { name: "Marcus Johnson", role: "CTO & Co-Founder", initials: "MJ" },
  { name: "Emily Rodriguez", role: "VP of Product", initials: "ER" },
]

const values = [
  {
    icon: Target,
    title: "Transparency",
    description:
      "We believe in open, fair procurement processes that create equal opportunities for all vendors.",
  },
  {
    icon: Shield,
    title: "Security",
    description:
      "Enterprise-grade security protects every proposal, document, and piece of sensitive data on our platform.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "We build tools that bring buyers and vendors together, making the RFP process a partnership, not an adversarial exercise.",
  },
  {
    icon: Zap,
    title: "Efficiency",
    description:
      "Every feature we ship is designed to save time and reduce friction in the procurement workflow.",
  },
]

export default function AboutPage() {
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
        {/* Hero */}
        <section className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">About RFP Platform</h1>
          <p className="text-lg text-muted-foreground">
            We&rsquo;re on a mission to transform how organizations manage procurement. Our platform
            makes the RFP process faster, fairer, and more transparent for buyers and vendors alike.
          </p>
        </section>

        {/* Mission */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            The traditional RFP process is broken — it&rsquo;s slow, opaque, and frustrating for everyone
            involved. Buyers spend weeks managing spreadsheets and emails. Vendors waste time on
            poorly structured requirements. Evaluations are subjective and hard to defend.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            RFP Platform was built to fix this. We provide a modern, collaborative workspace where
            organizations can create structured RFPs, invite vendors, collect proposals, and evaluate
            them using transparent scoring — all in one place. Whether you&rsquo;re a government agency,
            a Fortune 500 company, or a growing startup, our platform scales to meet your procurement
            needs.
          </p>
        </section>

        {/* What We Do */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-semibold mb-4">What RFP Platform Does</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong className="text-foreground">RFP Creation</strong> — Build structured,
                professional RFPs with guided templates and custom question sections.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong className="text-foreground">Vendor Marketplace</strong> — Discover and
                invite qualified vendors from our growing network.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong className="text-foreground">Proposal Management</strong> — Vendors submit
                proposals through a streamlined, structured form.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong className="text-foreground">Evaluation &amp; Scoring</strong> — Evaluate
                proposals with weighted scoring criteria and collaborative reviews.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong className="text-foreground">Analytics &amp; Reporting</strong> — Gain
                insights into your procurement pipeline with real-time dashboards.
              </span>
            </li>
          </ul>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="max-w-3xl mx-auto mb-8">
          <h2 className="text-2xl font-semibold mb-8 text-center">Meet the Team</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {member.initials}
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
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
