export interface Question {
  id: string
  type: "text" | "number" | "multiple_choice" | "checkbox" | "file" | "date" | "signature" | "data_integration"
  prompt: string
  required: boolean
  constraints?: any
  options?: string[]
  dataSource?: string
  validation?: {
    type: string
    pattern?: string
    message?: string
  }
}

export interface ESignature {
  id: string
  name: string
  email: string
  title: string
  signature: string
  timestamp: string
  ipAddress: string
  status: "pending" | "signed" | "verified"
}

export interface DataIntegration {
  id: string
  source: string
  dataSource?: string
  endpoint: string
  dataType: string
  status: "connected" | "disconnected" | "error"
  lastSync?: string
  data?: any
}

export interface ValidationRule {
  id: string
  field: string
  rule: string
  message: string
  severity: "error" | "warning" | "info"
}

export interface Section {
  id: string
  title: string
  description?: string
  isRequired: boolean
  order: number
  questions: Question[]
}

export interface RFP {
  id: string
  title: string
  description?: string
  category: string
  budget?: string
  confidentiality: string
  sections: Section[]
  timeline?: {
    submissionDeadline?: string
  }
}
