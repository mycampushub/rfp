import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Blog | RFP Platform",
  description: "Insights, best practices, and trends in procurement and RFP management.",
}

const posts = [
  {
    title: "5 Tips for Writing Better RFPs",
    date: "January 15, 2025",
    category: "Best Practices",
    excerpt:
      "A well-written RFP attracts better proposals and saves everyone time. Learn five practical strategies to make your next RFP clearer, more structured, and more effective.",
  },
  {
    title: "How to Evaluate Vendor Proposals Effectively",
    date: "January 8, 2025",
    category: "Evaluation",
    excerpt:
      "Scoring proposals fairly is one of the hardest parts of procurement. Discover how weighted scoring criteria and structured evaluation rubrics can lead to better vendor selection decisions.",
  },
  {
    title: "The Future of Digital Procurement",
    date: "December 20, 2024",
    category: "Industry Trends",
    excerpt:
      "From AI-assisted proposal analysis to blockchain-verified contracts, technology is reshaping how organizations buy and sell. Here is what to expect in the next five years.",
  },
  {
    title: "Common Mistakes in RFP Management (And How to Avoid Them)",
    date: "December 12, 2024",
    category: "Best Practices",
    excerpt:
      "Vague requirements, unrealistic timelines, and poor communication are the top reasons RFP processes fail. Learn from these common pitfalls to run smoother procurement cycles.",
  },
]

export default function BlogPage() {
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
          <h1 className="text-4xl font-bold tracking-tight mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground">
            Insights, best practices, and trends in procurement and RFP management.
          </p>
        </section>

        <section className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {posts.map((post) => (
              <Card
                key={post.title}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <Badge variant="outline">{post.category}</Badge>
                    <span className="text-sm text-muted-foreground">{post.date}</span>
                  </div>
                  <CardTitle className="text-2xl">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{post.excerpt}</p>
                </CardContent>
                <CardFooter>
                  <Link
                    href="#"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Read more
                  </Link>
                </CardFooter>
              </Card>
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
