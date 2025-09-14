"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Users, 
  Building, 
  MapPin, 
  Globe,
  Phone,
  Mail,
  Star,
  CheckCircle,
  Plus,
  X,
  Upload,
  FileText
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function VendorRegister() {
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    employees: "",
    founded: "",
    hourlyRate: "",
    categories: [] as string[],
    specialties: [] as string[],
    certifications: [] as string[],
    portfolio: [] as string[]
  })

  const [newSpecialty, setNewSpecialty] = useState("")
  const [newCertification, setNewCertification] = useState("")
  const [newPortfolioItem, setNewPortfolioItem] = useState("")

  const categories = [
    "IT Services", "Marketing", "Construction", "Software Development", 
    "Consulting", "Design", "Engineering", "Legal", "Healthcare", "Other"
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }))
      setNewSpecialty("")
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }))
  }

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...formData.certifications, newCertification.trim()]
      }))
      setNewCertification("")
    }
  }

  const removeCertification = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification)
    }))
  }

  const addPortfolioItem = () => {
    if (newPortfolioItem.trim() && !formData.portfolio.includes(newPortfolioItem.trim())) {
      setFormData(prev => ({
        ...prev,
        portfolio: [...prev.portfolio, newPortfolioItem.trim()]
      }))
      setNewPortfolioItem("")
    }
  }

  const removePortfolioItem = (item: string) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter(p => p !== item)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Form submitted:", formData)
    // Here you would typically send the data to your API
  }

  return (
    <MainLayout title="Register as Vendor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" asChild>
            <Link href="/marketplace/vendors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Register as Vendor</h1>
            <p className="text-muted-foreground mt-1">
              Create your vendor profile and start bidding on projects
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Tell us about your business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange("businessName", e.target.value)}
                        placeholder="Enter your business name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="founded">Year Founded</Label>
                      <Input
                        id="founded"
                        type="number"
                        value={formData.founded}
                        onChange={(e) => handleInputChange("founded", e.target.value)}
                        placeholder="e.g., 2014"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe your business, services, and expertise..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="employees">Number of Employees</Label>
                      <Select value={formData.employees} onValueChange={(value) => handleInputChange("employees", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="51-200">51-200</SelectItem>
                          <SelectItem value="201-500">201-500</SelectItem>
                          <SelectItem value="501-1000">501-1000</SelectItem>
                          <SelectItem value="1000+">1000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                      <Select value={formData.hourlyRate} onValueChange={(value) => handleInputChange("hourlyRate", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25-50">$25-50</SelectItem>
                          <SelectItem value="50-100">$50-100</SelectItem>
                          <SelectItem value="100-150">$100-150</SelectItem>
                          <SelectItem value="150-200">$150-200</SelectItem>
                          <SelectItem value="200-300">$200-300</SelectItem>
                          <SelectItem value="300+">$300+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://yourbusiness.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="mr-2 h-5 w-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    How can clients reach you?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="contact@business.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Business Address</Label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Input
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="Street Address"
                        />
                      </div>
                      <div>
                        <Input
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <Input
                          value={formData.state}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                          placeholder="State/Province"
                        />
                      </div>
                      <div>
                        <Input
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
                          placeholder="ZIP/Postal Code"
                        />
                      </div>
                    </div>
                    <div>
                      <Input
                        value={formData.country}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="mr-2 h-5 w-5" />
                    Business Categories
                  </CardTitle>
                  <CardDescription>
                    Select the categories that best describe your services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={formData.categories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <Label htmlFor={category} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Specialties */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="mr-2 h-5 w-5" />
                    Areas of Expertise
                  </CardTitle>
                  <CardDescription>
                    Add your specific skills and specialties
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="Add a specialty (e.g., Cloud Services, Web Development)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" onClick={addSpecialty}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{specialty}</span>
                        <button
                          type="button"
                          onClick={() => removeSpecialty(specialty)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Certifications
                  </CardTitle>
                  <CardDescription>
                    Add any relevant certifications or qualifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Add certification (e.g., AWS Certified Solutions Architect)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    />
                    <Button type="button" onClick={addCertification}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="flex items-center space-x-1">
                        <span>{cert}</span>
                        <button
                          type="button"
                          onClick={() => removeCertification(cert)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Portfolio Highlights
                  </CardTitle>
                  <CardDescription>
                    Add notable projects or achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newPortfolioItem}
                      onChange={(e) => setNewPortfolioItem(e.target.value)}
                      placeholder="Add portfolio item or achievement"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPortfolioItem())}
                    />
                    <Button type="button" onClick={addPortfolioItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.portfolio.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">{item}</span>
                        <button
                          type="button"
                          onClick={() => removePortfolioItem(item)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Terms and Submit */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" required />
                      <Label htmlFor="terms" className="text-sm">
                        I agree to the Terms of Service and Privacy Policy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="verification" required />
                      <Label htmlFor="verification" className="text-sm">
                        I certify that all information provided is accurate and truthful
                      </Label>
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      Create Vendor Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Why Join?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Access to Quality Leads</h4>
                    <p className="text-sm text-muted-foreground">Get notified about relevant RFP opportunities</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Build Your Reputation</h4>
                    <p className="text-sm text-muted-foreground">Collect reviews and showcase your expertise</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Grow Your Business</h4>
                    <p className="text-sm text-muted-foreground">Connect with new clients and expand your reach</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Valid business registration</p>
                <p>• Professional email address</p>
                <p>• Portfolio or work samples</p>
                <p>• At least one client reference</p>
                <p>• Relevant certifications (if applicable)</p>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  View Guidelines
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}