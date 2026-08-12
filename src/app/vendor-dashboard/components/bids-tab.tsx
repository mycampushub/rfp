"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Download, Edit } from "lucide-react"
import type { Bid } from "../types"
import { getStatusColor } from "../lib/vendor-helpers"

export function BidsTab({ bids }: { bids: Bid[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Bids</CardTitle>
        <CardDescription>
          Track your submitted bids and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFP Title</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Bid Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bids.map((bid) => (
              <TableRow key={bid.id}>
                <TableCell>
                  <div className="font-medium">{bid.rfpTitle}</div>
                </TableCell>
                <TableCell>{bid.organization}</TableCell>
                <TableCell>{bid.amount}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(bid.status)}>
                    {bid.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{bid.submittedAt}</TableCell>
                <TableCell>{bid.deadline}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label="Bid actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download Proposal
                      </DropdownMenuItem>
                      {bid.status === "draft" && (
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Bid
                        </DropdownMenuItem>
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
