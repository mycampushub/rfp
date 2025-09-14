"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Plus,
  Eye,
  Edit
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  // Mock data for demonstration
  const stats = [
    {
      title: "Active RFPs",
      value: "12",
      description: "+2 from last week",
      icon: FileText,
      trend: "up"
    },
    {
      title: "Pending Evaluations",
      value: "8",
      description: "Requires attention",
      icon: Clock,
      trend: "neutral"
    },
    {
      title: "Vendor Responses",
      value: "24",
      description: "+5 from yesterday",
      icon: Users,
      trend: "up"
    },
    {
      title: "Approvals Pending",
      value: "3",
      description: "High priority",
      icon: CheckCircle,
      trend: "down"
    }
  ]

  const recentRFPs = [
    {
      id: "1",
      title: "IT Managed Services 2024",
      status: "published",
      deadline: "2024-12-15",
      responses: 8,
      budget: "$250,000"
    },
    {
      id: "2", 
      title: "Marketing Campaign Services",
      status: "draft",
      deadline: "2024-12-20",
      responses: 0,
      budget: "$100,000"
    },
    {
      id: "3",
      title: "Office Equipment Procurement",
      status: "evaluation",
      deadline: "2024-12-10",
      responses: 12,
      budget: "$75,000"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "evaluation":
        return "bg-blue-100 text-blue-800"
      case "closed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your RFPs.
            </p>
          </div>
          <Button asChild>
            <Link href="/rfps/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New RFP
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent RFPs */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent RFPs</CardTitle>
              <CardDescription>
                Your latest Request for Proposal activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRFPs.map((rfp) => (
                  <div key={rfp.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{rfp.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(rfp.status)}>
                          {rfp.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Due: {rfp.deadline}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span>{rfp.responses} responses</span>
                        <span>{rfp.budget}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" asChild>
                <Link href="/rfps">
                  <FileText className="mr-2 h-4 w-4" />
                  View All RFPs
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild>
                <Link href="/vendors">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Vendors
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild>
                <Link href="/evaluation">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Evaluation Dashboard
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild>
                <Link href="/approvals">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Pending Approvals
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Alerts/Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Important Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  IT Managed Services 2024 - 2 days until deadline
                </p>
                <p className="text-sm text-yellow-600">
                  8 vendor responses received, evaluation pending
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Marketing Campaign Services - Approval required
                </p>
                <p className="text-sm text-blue-600">
                  Budget review pending from finance team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}