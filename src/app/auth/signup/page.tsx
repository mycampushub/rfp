"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Mail, 
  Lock, 
  Building, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    phone: "",
    agreeToTerms: false,
    agreeToPrivacy: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.company.trim()) {
      newErrors.company = "Company name is required"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ""))) {
      newErrors.phone = "Please enter a valid phone number"
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions"
    }
    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = "You must agree to the privacy policy"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const prevStep = () => {
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 2 && validateStep2()) {
      setIsLoading(true)
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 400 && data.details) {
            // Validation errors
            const fieldErrors: Record<string, string> = {}
            data.details.forEach((err: any) => {
              fieldErrors[err.field] = err.message
            })
            setErrors(fieldErrors)
            return
          }
          throw new Error(data.error || 'Registration failed')
        }

        toast.success(data.message || "Account created successfully! Please check your email to verify your account.")
        router.push("/auth/signin?message=signup-success")
      } catch (error) {
        console.error('Registration error:', error)
        toast.error(error instanceof Error ? error.message : "Failed to create account. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return 0
    let strength = 0
    
    // Length check
    if (password.length >= 8) strength += 25
    if (password.length >= 12) strength += 25
    
    // Character variety
    if (/[a-z]/.test(password)) strength += 12.5
    if (/[A-Z]/.test(password)) strength += 12.5
    if (/\d/.test(password)) strength += 12.5
    if (/[^a-zA-Z\d]/.test(password)) strength += 12.5
    
    return Math.min(strength, 100)
  }

  const getStrengthColor = (strength: number) => {
    if (strength < 30) return "bg-red-500"
    if (strength < 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = (strength: number) => {
    if (strength < 30) return "Weak"
    if (strength < 70) return "Medium"
    return "Strong"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join thousands of organizations managing their RFP process efficiently</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`h-1 w-16 ${
                  step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
              </div>
              <span className="text-sm text-gray-600">
                Step {step} of 2
              </span>
            </div>
            <CardTitle>
              {step === 1 ? "Personal Information" : "Company & Agreement"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Create your personal account credentials" 
                : "Tell us about your company and accept our terms"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          className="pl-10"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          className="pl-10"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(getPasswordStrength(formData.password))}`}
                              style={{ width: `${getPasswordStrength(formData.password)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 ml-2">
                            {getStrengthText(getPasswordStrength(formData.password))}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Must be at least 8 characters with uppercase, lowercase, and numbers
                        </p>
                      </div>
                    )}
                    {errors.password && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className="w-full"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="company"
                        type="text"
                        placeholder="Acme Corporation"
                        className="pl-10"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                      />
                    </div>
                    {errors.company && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.company}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="agreeToTerms" className="text-sm">
                          I agree to the{" "}
                          <Link href="/terms" className="text-blue-600 hover:underline">
                            Terms and Conditions
                          </Link>{" "}
                          *
                        </Label>
                      </div>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.agreeToTerms}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeToPrivacy"
                        checked={formData.agreeToPrivacy}
                        onCheckedChange={(checked) => handleInputChange("agreeToPrivacy", checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="agreeToPrivacy" className="text-sm">
                          I agree to the{" "}
                          <Link href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                          </Link>{" "}
                          *
                        </Label>
                      </div>
                    </div>
                    {errors.agreeToPrivacy && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.agreeToPrivacy}
                      </p>
                    )}
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      By creating an account, you agree to receive email communications about your RFP activities and important updates.
                    </AlertDescription>
                  </Alert>

                  <div className="flex space-x-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={prevStep}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-blue-600 hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}