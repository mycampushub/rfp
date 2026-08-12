export interface VendorProfile {
  id: string
  businessName: string
  description: string
  website: string
  contactInfo: {
    email: string
    phone: string
    address: string
    city: string
    state: string
    country: string
  }
  businessId: string
  categories: string[]
  specialties: string[]
  certifications: string[]
  isVerified: boolean
  rating: number
  completedProjects: number
  memberSince: string
}

export interface VendorUser {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  lastActive: string
  status: "active" | "inactive" | "pending"
}

export interface Invitation {
  id: string
  rfpTitle: string
  organization: string
  budget: string
  deadline: string
  status: "pending" | "accepted" | "declined" | "expired"
  isPublic: boolean
  businessId?: string
  receivedAt: string
}

export interface Bid {
  id: string
  rfpTitle: string
  organization: string
  amount: string
  status: "draft" | "submitted" | "under_review" | "awarded" | "rejected"
  submittedAt: string
  deadline: string
}

export interface MarketplaceOpportunity {
  id: string
  title: string
  organization: string
  budget: string
  category: string
  deadline: string
  bids: number
  matchScore: number
  isFeatured: boolean
}
