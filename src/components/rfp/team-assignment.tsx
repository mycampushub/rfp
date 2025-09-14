"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Shield, 
  Edit,
  Trash2,
  UserPlus
} from "lucide-react"
import { toast } from "sonner"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "editor" | "evaluator" | "approver" | "viewer"
  avatar?: string
}

const teamMemberSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(["owner", "editor", "evaluator", "approver", "viewer"]),
})

type TeamMemberFormData = z.infer<typeof teamMemberSchema>

interface TeamAssignmentProps {
  teamMembers: TeamMember[]
  onTeamMembersChange: (members: TeamMember[]) => void
}

export function TeamAssignment({ teamMembers, onTeamMembersChange }: TeamAssignmentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [availableUsers, setAvailableUsers] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
  })

  const selectedRole = watch("role")

  // Mock available users - in real app, this would come from API
  useEffect(() => {
    const mockUsers = [
      { id: "1", name: "John Smith", email: "john.smith@company.com", avatar: "" },
      { id: "2", name: "Sarah Johnson", email: "sarah.johnson@company.com", avatar: "" },
      { id: "3", name: "Mike Chen", email: "mike.chen@company.com", avatar: "" },
      { id: "4", name: "Emily Davis", email: "emily.davis@company.com", avatar: "" },
      { id: "5", name: "Robert Wilson", email: "robert.wilson@company.com", avatar: "" },
    ]
    setAvailableUsers(mockUsers)
  }, [])

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800"
      case "editor":
        return "bg-blue-100 text-blue-800"
      case "evaluator":
        return "bg-green-100 text-green-800"
      case "approver":
        return "bg-orange-100 text-orange-800"
      case "viewer":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Shield className="h-4 w-4" />
      case "editor":
        return <Edit className="h-4 w-4" />
      case "evaluator":
        return <Users className="h-4 w-4" />
      case "approver":
        return <Shield className="h-4 w-4" />
      case "viewer":
        return <Users className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const addTeamMember = (data: TeamMemberFormData) => {
    const user = availableUsers.find(u => u.id === data.userId)
    if (!user) return

    // Check if user is already in team
    if (teamMembers.some(member => member.id === data.userId)) {
      toast.error("User is already assigned to this RFP")
      return
    }

    const newMember: TeamMember = {
      id: data.userId,
      name: user.name,
      email: user.email,
      role: data.role,
      avatar: user.avatar,
    }

    onTeamMembersChange([...teamMembers, newMember])
    setIsDialogOpen(false)
    reset()
    toast.success(`${user.name} added to team`)
  }

  const removeTeamMember = (userId: string) => {
    const member = teamMembers.find(m => m.id === userId)
    onTeamMembersChange(teamMembers.filter(m => m.id !== userId))
    toast.success(`${member?.name} removed from team`)
  }

  const updateTeamMemberRole = (userId: string, newRole: TeamMember["role"]) => {
    onTeamMembersChange(teamMembers.map(member => 
      member.id === userId ? { ...member, role: newRole } : member
    ))
    toast.success("Role updated successfully")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Team Assignment</h3>
          <p className="text-sm text-muted-foreground">
            Assign team members and their roles for this RFP
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Select a user and assign their role for this RFP
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(addTeamMember)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select User</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Select</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <input
                              type="radio"
                              name="userId"
                              value={user.id}
                              onChange={() => setValue("userId", user.id)}
                              className="h-4 w-4"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {errors.userId && (
                  <p className="text-sm text-red-600">{errors.userId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => setValue("role", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Owner</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center space-x-2">
                        <Edit className="h-4 w-4" />
                        <span>Editor</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="evaluator">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Evaluator</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="approver">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Approver</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Viewer</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Member</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Current Team Members ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Users assigned to this RFP with their respective roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No team members assigned yet.</p>
              <p className="text-sm text-muted-foreground">Click "Add Team Member" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-2">
                        <Mail className="h-3 w-3" />
                        <span>{member.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Select
                      value={member.role}
                      onValueChange={(value) => updateTeamMemberRole(member.id, value as any)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="evaluator">Evaluator</SelectItem>
                        <SelectItem value="approver">Approver</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={getRoleColor(member.role)}>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(member.role)}
                        <span className="capitalize">{member.role}</span>
                      </div>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeamMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
          <CardDescription>
            Understand what each role can do in the RFP process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={getRoleColor("owner")}>
                  <Shield className="h-3 w-3 mr-1" />
                  Owner
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Full control over the RFP. Can create, edit, publish, manage team, and oversee the entire process.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={getRoleColor("editor")}>
                  <Edit className="h-3 w-3 mr-1" />
                  Editor
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Can draft and edit RFP content but cannot publish or make final decisions.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={getRoleColor("evaluator")}>
                  <Users className="h-3 w-3 mr-1" />
                  Evaluator
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Can view submissions and assign scores based on evaluation criteria.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={getRoleColor("approver")}>
                  <Shield className="h-3 w-3 mr-1" />
                  Approver
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Can review and approve RFPs at different stages (budget, legal, etc.).
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={getRoleColor("viewer")}>
                  <Users className="h-3 w-3 mr-1" />
                  Viewer
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Read-only access to view RFP details and progress.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}