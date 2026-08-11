import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText, Lock, Terminal } from "lucide-react"

export const metadata: Metadata = {
  title: "API Documentation | RFP Platform",
  description: "Explore the RFP Platform REST API documentation. Learn about authentication, endpoints, request formats, and integration guides for developers.",
}

const endpoints = [
  {
    method: "GET",
    path: "/api/rfps",
    description: "List all RFPs accessible to the authenticated user.",
  },
  {
    method: "POST",
    path: "/api/rfps",
    description: "Create a new RFP. Requires buyer role.",
  },
  {
    method: "GET",
    path: "/api/rfps/:id",
    description: "Retrieve a single RFP by ID with full details.",
  },
  {
    method: "GET",
    path: "/api/vendors",
    description: "List all registered vendors in the marketplace.",
  },
  {
    method: "POST",
    path: "/api/submissions",
    description: "Submit a proposal for a specific RFP. Requires vendor role.",
  },
]

export default function ApiDocsPage() {
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">API Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Our REST API lets you integrate RFP Platform into your existing tools and workflows.
          </p>
        </section>

        <section className="max-w-3xl mx-auto space-y-10">
 {/* Authentication */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Authentication
            </h2>
            <p className="text-muted-foreground mb-4">
              All API endpoints require a session cookie obtained through our sign-in endpoint. Pass
              your credentials to obtain a valid session, then include the cookie in subsequent requests.
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}`}</pre>
            </div>
          </div>

          {/* Endpoints */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Endpoints</h2>
            <div className="space-y-4">
              {endpoints.map((ep) => (
                <div key={ep.path} className="rounded-lg border p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        ep.method === "GET"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono font-medium">{ep.path}</code>
                  </div>
                  <p className="text-sm text-muted-foreground">{ep.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Example Request */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Example Request</h2>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`GET /api/rfps HTTP/1.1
Host: rfpplatform.com
Cookie: next-auth.session-token=...`}</pre>
            </div>
          </div>

          {/* Response Format */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Response Format</h2>
            <p className="text-muted-foreground mb-4">
              All responses are returned in JSON format. Successful responses use 2xx status codes.
              Errors include a message field describing the issue.
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "success": true,
  "data": [
    {
      "id": "clx1abc23d",
      "title": "Cloud Migration Services",
      "status": "open",
      "deadline": "2025-03-01T00:00:00.000Z"
    }
  ]
}`}</pre>
            </div>
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
