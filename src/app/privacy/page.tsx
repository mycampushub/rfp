import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | RFP Platform",
  description: "Understand how RFP Platform collects, uses, and protects your personal data. Our privacy policy covers data handling, cookies, and your rights.",
}

export default function PrivacyPage() {
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
        <article className="max-w-3xl mx-auto prose prose-neutral max-w-none">
          <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 1, 2025
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">1. Information We Collect</h2>
          <h3 className="text-lg font-medium mt-6 mb-2">Information You Provide</h3>
          <p className="text-muted-foreground mb-4">
            When you create an account, we collect your name, email address, organization name, and
            role. When you use the platform, we collect RFP content, proposal submissions, evaluation
            scores, and any files or documents you upload.
          </p>
          <h3 className="text-lg font-medium mt-6 mb-2">Information Collected Automatically</h3>
          <p className="text-muted-foreground mb-4">
            We automatically collect log data such as your IP address, browser type, operating system,
            pages visited, and time spent on each page. We use this information to improve our service
            and maintain security.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">2. Use of Information</h2>
          <p className="text-muted-foreground mb-4">
            We use the information we collect to provide, maintain, and improve the RFP Platform, to
            process transactions and send related information, to respond to your inquiries, to
            communicate with you about products, services, and events, and to detect, prevent, and
            address technical issues or security threats.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">3. Data Protection</h2>
          <p className="text-muted-foreground mb-4">
            We implement industry-standard security measures including AES-256 encryption at rest,
            TLS 1.3 encryption in transit, role-based access controls, and regular security audits.
            Your data is stored in isolated tenant databases to prevent cross-tenant access.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">4. Cookies</h2>
          <p className="text-muted-foreground mb-4">
            We use essential cookies to authenticate your session and maintain preferences. We may also
            use analytics cookies to understand how users interact with our platform. You can manage
            cookie preferences through your browser settings.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">5. Third-Party Services</h2>
          <p className="text-muted-foreground mb-4">
            We may use third-party services for analytics, payment processing, and email delivery.
            These services have their own privacy policies and handle data according to their own
            terms. We do not sell your personal information to any third parties.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">6. Your Rights</h2>
          <p className="text-muted-foreground mb-4">
            You have the right to access, correct, or delete your personal information. You can export
            your data at any time through your account settings. To exercise these rights, contact us
            at privacy@rfpplatform.com. We will respond to all requests within 30 days.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">7. Contact</h2>
          <p className="text-muted-foreground mb-4">
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-muted-foreground">
            RFP Platform, Inc.<br />
            100 Market Street, Suite 400<br />
            San Francisco, CA 94105<br />
            Email: privacy@rfpplatform.com
          </p>
        </article>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} RFP Platform. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
