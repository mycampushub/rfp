"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Eye, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { Invitation } from "../types"
import { getStatusColor } from "../lib/vendor-helpers"

export function InvitationsTab({ invitations, searchTerm, statusFilter, onSearchChange, onStatusChange }: { invitations: Invitation[], searchTerm: string, statusFilter: string, onSearchChange: (_val: string) => void, onStatusChange: (_val: string) => void }) {
  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.rfpTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invitation.organization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || invitation.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFP Invitations</CardTitle>
        <CardDescription>
          Manage your private and public RFP invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invitations..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFP Title</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{invitation.rfpTitle}</div>
                    {invitation.businessId && (
                      <div className="text-sm text-muted-foreground">
                        Business ID: {invitation.businessId}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{invitation.organization}</TableCell>
                <TableCell>{invitation.budget}</TableCell>
                <TableCell>{invitation.deadline}</TableCell>
                <TableCell>
                  <Badge variant={invitation.isPublic ? "default" : "secondary"}>
                    {invitation.isPublic ? "Public" : "Private"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(invitation.status)}>
                    {invitation.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label="Invitation actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href={`/rfps/${invitation.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {invitation.status === "pending" && (
                        <>
                          <DropdownMenuItem>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Decline
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  )
}