import Link from "next/link"
import { ArrowLeft, FileText, MapPin, Clock } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Careers | RFP Platform",
  description: "Join our team and help build the future of procurement.",
}

const positions = [
  {
    title: "Senior Software Engineer",
    location: "San Francisco, CA (Hybrid)",
    type: "Full-time",
    department: "Engineering",
    description:
      "Build core platform features including RFP workflows, real-time collaboration, and our vendor evaluation engine. You will work with TypeScript, Next.js, and PostgreSQL to ship production-quality code that serves enterprise clients.",
  },
  {
    title: "Product Manager",
    location: "Remote (US)",
    type: "Full-time",
    department: "Product",
    description:
      "Own the roadmap for our procurement platform. Work closely with buyers, vendors, and internal teams to define requirements, prioritize features, and drive product strategy from concept through launch.",
  },
  {
    title: "DevOps Engineer",
    location: "Austin, TX (On-site)",
    type: "Full-time",
    department: "Infrastructure",
    description:
      "Design and maintain our cloud infrastructure on AWS. Automate CI/CD pipelines, manage Kubernetes clusters, ensure 99.9% uptime, and implement security best practices across our deployment stack.",
  },
]

export default function CareersPage() {
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
        <section className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Join Our Team</h1>
          <p className="text-lg text-muted-foreground">
            We are building the future of procurement. Join a growing team of passionate people
            dedicated to making the RFP process better for everyone.
          </p>
        </section>

        <section className="max-w-3xl mx-auto mb-8">
          <h2 className="text-2xl font-semibold mb-6">Open Positions</h2>
          <div className="space-y-4">
            {positions.map((position) => (
              <Card key={position.title}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-xl">{position.title}</CardTitle>
                    <Badge variant="secondary">{position.department}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{position.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {position.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {position.type}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href="/contact">Apply Now</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto text-center mt-8">
          <p className="text-muted-foreground">
            Do not see a role that fits? We are always looking for talented people.
            Send your resume to{" "}
            <a href="mailto:careers@rfpplatform.com" className="text-primary hover:underline">
              careers@rfpplatform.com
            </a>
          </p>
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
