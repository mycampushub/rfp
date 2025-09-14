"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  Clock, 
  FileText, 
  Upload, 
  Send,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Download
} from "lucide-react"

interface BidSubmissionProps {
  rfpId: string
  rfpTitle: string
  organization: string
  budget: string
  deadline: string
  onSubmit?: (bidData: any) => void
}

export function BidSubmission({ 
  rfpId, 
  rfpTitle, 
  organization, 
  budget, 
  deadline, 
  onSubmit 
}: BidSubmissionProps) {
  const [bidData, setBidData] = useState({
    amount: "",
    currency: "USD",
    duration: "",
    proposal: "",
    attachments: [] as File[],
    termsAccepted: false
  })

  const [milestones, setMilestones] = useState([
    { id: "1", title: "", description: "", duration: "", amount: "" }
  ])

  const [teamMembers, setTeamMembers] = useState([
    { id: "1", name: "", role: "", experience: "" }
  ])

  const handleInputChange = (field: string, value: string | boolean) => {
    setBidData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setBidData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(files)]
      }))
    }
  }

  const removeAttachment = (index: number) => {
    setBidData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      { id: Date.now().toString(), title: "", description: "", duration: "", amount: "" }
    ])
  }

  const updateMilestone = (id: string, field: string, value: string) => {
    setMilestones(prev =>
      prev.map(milestone =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone
      )
    )
  }

  const removeMilestone = (id: string) => {
    setMilestones(prev => prev.filter(milestone => milestone.id !== id))
  }

  const addTeamMember = () => {
    setTeamMembers(prev => [
      ...prev,
      { id: Date.now().toString(), name: "", role: "", experience: "" }
    ])
  }

  const updateTeamMember = (id: string, field: string, value: string) => {
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === id ? { ...member, [field]: value } : member
      )
    )
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submissionData = {
      rfpId,
      amount: parseFloat(bidData.amount),
      currency: bidData.currency,
      duration: bidData.duration,
      proposal: bidData.proposal,
      milestones: milestones.filter(m => m.title && m.description),
      teamMembers: teamMembers.filter(m => m.name && m.role),
      attachments: bidData.attachments.map(file => file.name),
      submittedAt: new Date().toISOString()
    }

    if (onSubmit) {
      onSubmit(submissionData)
    }
    
    console.log("Bid submitted:", submissionData)
  }

  const isFormValid = bidData.amount && bidData.duration && bidData.proposal && bidData.termsAccepted

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Send className="mr-2 h-5 w-5" />
          Submit Your Bid
        </CardTitle>
        <CardDescription>
          Submit your proposal for: <span className="font-medium">{rfpTitle}</span>
        </CardDescription>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
          <span className="flex items-center">
            <DollarSign className="mr-1 h-4 w-4" />
            Budget: {budget}
          </span>
          <span className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            Deadline: {deadline}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="proposal">Proposal</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Bid Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      value={bidData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={bidData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Project Duration *</Label>
                <Select value={bidData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                    <SelectItem value="3-4 weeks">3-4 weeks</SelectItem>
                    <SelectItem value="1-2 months">1-2 months</SelectItem>
                    <SelectItem value="3-6 months">3-6 months</SelectItem>
                    <SelectItem value="6-12 months">6-12 months</SelectItem>
                    <SelectItem value="1+ years">1+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload supporting documents, portfolio, or certifications
                  </p>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                    Choose Files
                  </Button>
                </div>
                
                {bidData.attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files:</Label>
                    <div className="space-y-2">
                      {bidData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="proposal" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proposal">Proposal Summary *</Label>
                <Textarea
                  id="proposal"
                  value={bidData.proposal}
                  onChange={(e) => handleInputChange("proposal", e.target.value)}
                  placeholder="Provide a comprehensive summary of your proposal, including your approach, methodology, and why you're the best fit for this project..."
                  rows={8}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Be specific about your approach, methodology, and value proposition
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Proposal Tips</h4>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Address all requirements mentioned in the RFP</li>
                      <li>• Highlight your relevant experience and past successes</li>
                      <li>• Be specific about your deliverables and timeline</li>
                      <li>• Explain what makes your proposal unique</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Project Milestones</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Milestone
                </Button>
              </div>

              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <Card key={milestone.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Milestone {milestones.indexOf(milestone) + 1}</h4>
                      {milestones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMilestone(milestone.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, "title", e.target.value)}
                          placeholder="e.g., Planning Phase"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          value={milestone.duration}
                          onChange={(e) => updateMilestone(milestone.id, "duration", e.target.value)}
                          placeholder="e.g., 2 weeks"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={milestone.description}
                          onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                          placeholder="Describe what will be delivered in this milestone"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(milestone.id, "amount", e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Project Team</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </div>

              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Team Member {teamMembers.indexOf(member) + 1}</h4>
                      {teamMembers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(member.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={member.name}
                          onChange={(e) => updateTeamMember(member.id, "name", e.target.value)}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={member.role}
                          onChange={(e) => updateTeamMember(member.id, "role", e.target.value)}
                          placeholder="e.g., Project Manager"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Experience</Label>
                        <Input
                          value={member.experience}
                          onChange={(e) => updateTeamMember(member.id, "experience", e.target.value)}
                          placeholder="e.g., 5+ years"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Terms and Submit */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={bidData.termsAccepted}
                onChange={(e) => handleInputChange("termsAccepted", e.target.checked)}
                className="mt-1"
                required
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the terms and conditions, and certify that all information provided is accurate and complete. 
                I understand that submitting a false or misleading bid may result in disqualification.
              </Label>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                type="submit" 
                className="flex-1" 
                size="lg"
                disabled={!isFormValid}
              >
                <Send className="mr-2 h-4 w-4" />
                Submit Bid
              </Button>
              <Button type="button" variant="outline">
                Save Draft
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}