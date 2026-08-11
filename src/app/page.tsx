"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Users, Shield, Store, BarChart3, Bell, Globe, Star, Award, Target, CheckCircle, ArrowRight, Zap, Clock, DollarSign } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-sky-500/10 to-violet-500/15">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <FileText className="h-10 w-10 text-sky-600 dark:text-sky-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (status === "authenticated") {
    return null // Will redirect to dashboard
  }

  // Enhanced stats for the platform
  const platformStats = [
    { label: "Active Organizations", value: "2,500+", icon: Users, color: "text-sky-600 dark:text-sky-400" },
    { label: "Verified Vendors", value: "15,000+", icon: Store, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "RFPs Processed", value: "50,000+", icon: FileText, color: "text-violet-600 dark:text-violet-400" },
    { label: "Total Value", value: "$2.5B+", icon: DollarSign, color: "text-orange-600 dark:text-orange-400" }
  ]

  // Enhanced features
  const features = [
    {
      icon: FileText,
      title: "Smart RFP Creation",
      description: "AI-powered RFP builder with templates, collaboration tools, and automated evaluation criteria",
      color: "text-sky-600 dark:text-sky-400"
    },
    {
      icon: Store,
      title: "Global Vendor Marketplace",
      description: "Connect with 15,000+ verified vendors across 200+ categories with advanced matching algorithms",
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards, predictive insights, and comprehensive reporting for data-driven decisions",
      color: "text-violet-600 dark:text-violet-400"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade encryption, compliance certifications, and detailed audit trails for complete security",
      color: "text-red-600 dark:text-red-400"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Real-time alerts for new opportunities, bid updates, and marketplace activities",
      color: "text-amber-600 dark:text-amber-400"
    },
    {
      icon: Users,
      title: "Vendor Management",
      description: "Complete vendor lifecycle management with performance tracking and relationship tools",
      color: "text-indigo-600 dark:text-indigo-400"
    }
  ]

  // Recent achievements
  const achievements = [
    { icon: Award, title: "Industry Leader", description: "Rated #1 RFP platform by G2" },
    { icon: CheckCircle, title: "99.9% Uptime", description: "Enterprise-grade reliability" },
    { icon: Star, title: "4.8/5 Rating", description: "Based on 5,000+ reviews" },
    { icon: Target, title: "78% Win Rate", description: "Average vendor success rate" }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-sky-500/10 to-violet-500/15">
      {/* Header */}
      <header className="border-b bg-background/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <FileText className="h-8 w-8 text-sky-600 dark:text-sky-400" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">RFP Platform</h1>
              <p className="text-xs text-muted-foreground">Enterprise Procurement Solution</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" asChild>
              <Link href="/marketplace">
                <Globe className="mr-2 h-4 w-4" />
                Marketplace
              </Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signin">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-sky-500/15 text-sky-700 dark:text-sky-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>Now with AI-powered vendor matching</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Transform Your
            <span className="text-sky-600 dark:text-sky-400"> Procurement Process</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground/80 mb-8 max-w-4xl mx-auto leading-relaxed">
            The complete RFP management platform with intelligent vendor marketplace, 
            advanced analytics, and enterprise-grade security for modern organizations.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/auth/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/marketplace">
                <Store className="mr-2 h-4 w-4" />
                Browse Marketplace
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex justify-center items-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-primary" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-violet-500" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {platformStats.map((stat, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <stat.icon className={`h-8 w-8 mx-auto ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <p className="text-sm text-muted-foreground/80">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Modern Procurement
            </h3>
            <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto">
              Built for organizations that demand efficiency, transparency, and results in their procurement processes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="grid gap-8 lg:grid-cols-2 mb-16">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary to-purple-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Award className="mr-3 h-6 w-6" />
                Trusted by Industry Leaders
              </CardTitle>
              <CardDescription className="text-sky-100 text-base">
                Join thousands of organizations that have transformed their procurement process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <achievement.icon className="h-5 w-5 text-sky-200" />
                    <div>
                      <div className="font-medium">{achievement.title}</div>
                      <div className="text-sm text-sky-100">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Target className="mr-3 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                Why Choose Our Platform?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">AI-Powered Matching</h4>
                  <p className="text-sm text-muted-foreground/80">Intelligent vendor recommendations based on your specific requirements</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Real-time Analytics</h4>
                  <p className="text-sm text-muted-foreground/80">Live dashboards and insights to optimize your procurement strategy</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Seamless Integration</h4>
                  <p className="text-sm text-muted-foreground/80">Connect with your existing ERP and procurement systems</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">24/7 Support</h4>
                  <p className="text-sm text-muted-foreground/80">Dedicated support team with expertise in procurement processes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary to-purple-600 rounded-2xl shadow-2xl p-12 text-white mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary-foreground/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            <span>Limited Time: Get 3 Months Free</span>
          </div>
          
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Revolutionize Your Procurement?
          </h3>
          <p className="text-lg mb-8 text-sky-100 max-w-2xl mx-auto">
            Join thousands of organizations that have streamlined their RFP processes and discovered better vendors.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-card hover:text-primary" asChild>
              <Link href="/marketplace">
                <Store className="mr-2 h-4 w-4" />
                Explore Marketplace
              </Link>
            </Button>
          </div>
        </div>

        {/* Recent Activity Preview */}
        <Card className="border-0 shadow-lg bg-card mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Live Marketplace Activity</CardTitle>
            <CardDescription>
              See what's happening in our vendor marketplace right now
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-2">156</div>
                <div className="text-sm text-muted-foreground/80">Active RFPs</div>
                <Badge className="mt-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Live Now</Badge>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">2,847</div>
                <div className="text-sm text-muted-foreground/80">Vendors Online</div>
                <Badge className="mt-2 bg-sky-500/15 text-sky-700 dark:text-sky-300">Available</Badge>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mb-2">$12.5M</div>
                <div className="text-sm text-muted-foreground/80">Total Value</div>
                <Badge className="mt-2 bg-orange-500/15 text-orange-700 dark:text-orange-300">This Week</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-6 w-6 text-sky-400" />
                <h3 className="text-lg font-semibold">RFP Platform</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade RFP management and vendor marketplace platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/rfps" className="hover:text-white">RFP Management</Link></li>
                <li><Link href="/marketplace" className="hover:text-white">Vendor Marketplace</Link></li>
                <li><Link href="/analytics" className="hover:text-white">Analytics</Link></li>
                <li><Link href="/vendors" className="hover:text-white">Vendor Management</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/api-docs" className="hover:text-white">API Docs</Link></li>
                <li><Link href="/status" className="hover:text-white">System Status</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-foreground/20 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 RFP Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}