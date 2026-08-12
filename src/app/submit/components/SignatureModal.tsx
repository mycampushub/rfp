"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Signature } from "lucide-react"
import type { ESignature } from "./types"

interface SignatureModalProps {
  currentSignature: ESignature
  onSignatureChange: (_signature: ESignature | null) => void
  onClose: () => void
  onSubmit: (_signature: ESignature) => void
}

export function SignatureModal({ currentSignature, onSignatureChange, onClose, onSubmit }: SignatureModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Signature className="mr-2 h-5 w-5" />
            Electronic Signature
          </CardTitle>
          <CardDescription>
            Please provide your electronic signature for this document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="sig-name">Full Name</Label>
              <Input
                id="sig-name"
                value={currentSignature.name}
                onChange={(e) => onSignatureChange(currentSignature ? {...currentSignature, name: e.target.value} : null)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="sig-email">Email Address</Label>
              <Input
                id="sig-email"
                type="email"
                value={currentSignature.email}
                onChange={(e) => onSignatureChange(currentSignature ? {...currentSignature, email: e.target.value} : null)}
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <Label htmlFor="sig-title">Title/Position</Label>
              <Input
                id="sig-title"
                value={currentSignature.title}
                onChange={(e) => onSignatureChange(currentSignature ? {...currentSignature, title: e.target.value} : null)}
                placeholder="Enter your title or position"
              />
            </div>
            <div>
              <Label>Signature</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/50">
                <p className="text-sm text-muted-foreground/80 mb-2">Click to sign</p>
                <div className="text-2xl font-signature text-muted-foreground">
                  {currentSignature.name ? currentSignature.name.split(' ').map(n => n[0]).join('') : 'Signature'}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>By signing, you agree to the following:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>This electronic signature is legally binding</li>
                <li>You have the authority to sign this document</li>
                <li>All provided information is accurate and complete</li>
              </ul>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (currentSignature) {
                  const completedSignature = {
                    ...currentSignature,
                    signature: "electronic_signature_hash",
                    timestamp: new Date().toISOString(),
                    status: "signed" as const
                  }
                  onSubmit(completedSignature)
                }
              }}
              disabled={!currentSignature.name || !currentSignature.email || !currentSignature.title}
              className="flex-1"
            >
              Sign Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
