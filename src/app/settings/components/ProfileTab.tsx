"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, RefreshCw, Save } from "lucide-react"

interface ProfileTabProps {
  userData: {
    name: string
    email: string
    phone: string
    bio: string
    location: string
    timezone: string
    language: string
  }
  isLoading: boolean
  setUserData: React.Dispatch<React.SetStateAction<{
    name: string
    email: string
    phone: string
    bio: string
    location: string
    timezone: string
    language: string
  }>>
  onSave: () => void
}

export function ProfileTab({ userData, isLoading, setUserData, onSave }: ProfileTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Update your personal details and contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={userData.name}
              onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={userData.email}
              onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={userData.phone}
              onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={userData.location}
              onChange={(e) => setUserData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={userData.bio}
            onChange={(e) => setUserData(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={userData.timezone} onValueChange={(value) => setUserData(prev => ({ ...prev, timezone: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={userData.language} onValueChange={(value) => setUserData(prev => ({ ...prev, language: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
