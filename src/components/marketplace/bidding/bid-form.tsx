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

interface BidFormProps {
  rfpId: string
  rfpTitle: string
  organization: string
  budget: string
  deadline: string
  onSubmit: (bidData: any) => void
  onCancel: () => void
}

export function BidForm({ 
  rfpId, 
  rfpTitle, 
  organization, 
  budget, 
  deadline, 
  onSubmit, 
  onCancel 
}: BidFormProps) {
  const [bidData, setBidData] = useState({
    amount: "",
    currency: "USD",
    duration: "",
    proposal: "",
    attachments: [] as File[],
    timeline: [] as { phase: string; duration: string; startDate: string }[],
    approach: "",
    team: [] as { name: string; role: string; experience: string }[],
    budgetBreakdown: [] as { item: string; cost: string; description: string }[]
  })

  const [newTimelineItem, setNewTimelineItem] = useState({
    phase: "",
    duration: "",
    startDate: ""
  })

  const [newTeamMember, setNewTeamMember] = useState({
    name: "",
    role: "",
    experience: ""
  })

  const [newBudgetItem, setNewBudgetItem] = useState({
    item: "",
    cost: "",
    description: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setBidData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setBidData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  const removeAttachment = (index: number) => {
    setBidData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const addTimelineItem = () => {
    if (newTimelineItem.phase && newTimelineItem.duration && newTimelineItem.startDate) {
      setBidData(prev => ({
        ...prev,
        timeline: [...prev.timeline, newTimelineItem]
      }))
      setNewTimelineItem({ phase: "", duration: "", startDate: "" })
    }
  }

  const removeTimelineItem = (index: number) => {
    setBidData(prev => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== index)
    }))
  }

  const addTeamMember = () => {
    if (newTeamMember.name && newTeamMember.role && newTeamMember.experience) {
      setBidData(prev => ({
        ...prev,
        team: [...prev.team, newTeamMember]
      }))
      setNewTeamMember({ name: "", role: "", experience: "" })
    }
  }

  const removeTeamMember = (index: number) => {
    setBidData(prev => ({
      ...prev,
      team: prev.team.filter((_, i) => i !== index)
    }))
  }

  const addBudgetItem = () => {
    if (newBudgetItem.item && newBudgetItem.cost) {
      setBidData(prev => ({
        ...prev,
        budgetBreakdown: [...prev.budgetBreakdown, newBudgetItem]
      }))
      setNewBudgetItem({ item: "", cost: "", description: "" })
    }
  }

  const removeBudgetItem = (index: number) => {
    setBidData(prev => ({
      ...prev,
      budgetBreakdown: prev.budgetBreakdown.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(bidData)
  }

  const calculateTotalBudget = () => {
    return bidData.budgetBreakdown.reduce((total, item) => {
      const cost = parseFloat(item.cost.replace(/[^0-9.-]+/g, "")) || 0
      return total + cost
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* RFP Info */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Bid</CardTitle>
          <CardDescription>
            Submit your proposal for: {rfpTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
              <p className="font-medium">{organization}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Budget Range</Label>
              <p className="font-medium">{budget}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Deadline</Label>
              <p className="font-medium">{deadline}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="proposal">Proposal</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the essential details of your bid
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Project Duration *</Label>
                  <Input
                    id="duration"
                    value={bidData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    placeholder="e.g., 3 months, 6 weeks, 1 year"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approach">Project Approach</Label>
                  <Textarea
                    id="approach"
                    value={bidData.approach}
                    onChange={(e) => handleInputChange("approach", e.target.value)}
                    placeholder="Describe your approach to this project..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Proposal</CardTitle>
                <CardDescription>
                  Provide a comprehensive proposal for the project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proposal">Proposal Content *</Label>
                  <Textarea
                    id="proposal"
                    value={bidData.proposal}
                    onChange={(e) => handleInputChange("proposal", e.target.value)}
                    placeholder="Provide a detailed proposal including your understanding of the requirements, solution approach, methodology, and value proposition..."
                    rows={8}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload supporting documents (PDF, DOC, images)
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                      <Label>Uploaded Files</Label>
                      <div className="space-y-2">
                        {bidData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  Outline the key phases and milestones of your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Phase</Label>
                    <Input
                      value={newTimelineItem.phase}
                      onChange={(e) => setNewTimelineItem(prev => ({ ...prev, phase: e.target.value }))}
                      placeholder="e.g., Planning"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      value={newTimelineItem.duration}
                      onChange={(e) => setNewTimelineItem(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 2 weeks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newTimelineItem.startDate}
                      onChange={(e) => setNewTimelineItem(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="button" onClick={addTimelineItem} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Timeline Item
                </Button>

                {bidData.timeline.length > 0 && (
                  <div className="space-y-2">
                    <Label>Timeline Items</Label>
                    <div className="space-y-2">
                      {bidData.timeline.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="grid gap-2 md:grid-cols-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Phase</Label>
                                <p className="font-medium">{item.phase}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Duration</Label>
                                <p className="font-medium">{item.duration}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Start Date</Label>
                                <p className="font-medium">{item.startDate}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimelineItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Team</CardTitle>
                <CardDescription>
                  Introduce the key team members who will work on this project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newTeamMember.name}
                      onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Team member name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={newTeamMember.role}
                      onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g., Project Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <Input
                      value={newTeamMember.experience}
                      onChange={(e) => setNewTeamMember(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="e.g., 10+ years"
                    />
                  </div>
                </div>
                <Button type="button" onClick={addTeamMember} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>

                {bidData.team.length > 0 && (
                  <div className="space-y-2">
                    <Label>Team Members</Label>
                    <div className="space-y-2">
                      {bidData.team.map((member, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="grid gap-2 md:grid-cols-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Name</Label>
                                <p className="font-medium">{member.name}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Role</Label>
                                <p className="font-medium">{member.role}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Experience</Label>
                                <p className="font-medium">{member.experience}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
                <CardDescription>
                  Provide a detailed breakdown of your proposed costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Item</Label>
                    <Input
                      value={newBudgetItem.item}
                      onChange={(e) => setNewBudgetItem(prev => ({ ...prev, item: e.target.value }))}
                      placeholder="e.g., Development"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost</Label>
                    <Input
                      value={newBudgetItem.cost}
                      onChange={(e) => setNewBudgetItem(prev => ({ ...prev, cost: e.target.value }))}
                      placeholder="e.g., $10,000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newBudgetItem.description}
                      onChange={(e) => setNewBudgetItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                    />
                  </div>
                </div>
                <Button type="button" onClick={addBudgetItem} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Budget Item
                </Button>

                {bidData.budgetBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <Label>Budget Items</Label>
                    <div className="space-y-2">
                      {bidData.budgetBreakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="grid gap-2 md:grid-cols-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Item</Label>
                                <p className="font-medium">{item.item}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Cost</Label>
                                <p className="font-medium">{item.cost}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <p className="font-medium text-sm">{item.description}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBudgetItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Total Budget:</span>
                      <span className="font-bold text-lg">${calculateTotalBudget().toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            <Send className="mr-2 h-4 w-4" />
            Submit Bid
          </Button>
        </div>
      </form>
    </div>
  )
}