import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant-context"
import ZAI from "z-ai-web-dev-sdk"

// Mock external APIs for data integration
const EXTERNAL_APIS = {
  business_registration: {
    name: "Business Registration API",
    endpoint: "https://api.business-registry.gov/companies",
    fields: ["companyName", "registrationNumber", "status", "incorporationDate", "businessType"]
  },
  certifications: {
    name: "Certification Database",
    endpoint: "https://api.certifications.org/verify",
    fields: ["certificationName", "issuer", "issueDate", "expiryDate", "status"]
  },
  financial_data: {
    name: "Financial Data API",
    endpoint: "https://api.financial-services.com/reports",
    fields: ["revenue", "profit", "employees", "creditScore", "financialHealth"]
  },
  compliance_records: {
    name: "Compliance Records API",
    endpoint: "https://api.compliance.gov/records",
    fields: ["violations", "penalties", "licenses", "inspections", "complianceStatus"]
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const query = searchParams.get("query")

    if (!type || !EXTERNAL_APIS[type as keyof typeof EXTERNAL_APIS]) {
      return NextResponse.json({ 
        error: "Invalid integration type",
        availableTypes: Object.keys(EXTERNAL_APIS)
      }, { status: 400 })
    }

    const integration = EXTERNAL_APIS[type as keyof typeof EXTERNAL_APIS]
    
    // Simulate API call with mock data
    const mockData = generateMockData(type, query)
    
    return NextResponse.json({
      type,
      source: integration.name,
      endpoint: integration.endpoint,
      data: mockData,
      timestamp: new Date().toISOString(),
      status: "success"
    })

  } catch (error) {
    console.error("Error in data integration:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, data, action } = body

    if (!type || !EXTERNAL_APIS[type as keyof typeof EXTERNAL_APIS]) {
      return NextResponse.json({ 
        error: "Invalid integration type",
        availableTypes: Object.keys(EXTERNAL_APIS)
      }, { status: 400 })
    }

    const tenantContext = getTenantContext()

    // Handle different actions
    switch (action) {
      case "validate":
        return await validateData(type, data)
      
      case "enrich":
        return await enrichData(type, data)
      
      case "sync":
        return await syncData(type, data, tenantContext.tenantId)
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in data integration POST:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

function generateMockData(type: string, query?: string) {
  const baseData = {
    business_registration: [
      {
        id: "BR001",
        companyName: "Tech Solutions Inc",
        registrationNumber: "123456789",
        status: "Active",
        incorporationDate: "2018-05-15",
        businessType: "Technology Services",
        address: "123 Tech Street, Silicon Valley, CA 94000",
        contactEmail: "info@techsolutions.com",
        website: "https://techsolutions.com"
      },
      {
        id: "BR002", 
        companyName: "Global Systems Ltd",
        registrationNumber: "987654321",
        status: "Active",
        incorporationDate: "2015-08-22",
        businessType: "IT Consulting",
        address: "456 Global Ave, New York, NY 10001",
        contactEmail: "contact@globalsystems.com",
        website: "https://globalsystems.com"
      }
    ],
    certifications: [
      {
        id: "CERT001",
        certificationName: "ISO 27001:2022",
        issuer: "International Organization for Standardization",
        issueDate: "2023-01-15",
        expiryDate: "2026-01-15",
        status: "Active",
        certificateNumber: "ISO-27001-2023-001"
      },
      {
        id: "CERT002",
        certificationName: "SOC 2 Type II",
        issuer: "AICPA",
        issueDate: "2023-06-01", 
        expiryDate: "2024-06-01",
        status: "Active",
        certificateNumber: "SOC2-2023-002"
      }
    ],
    financial_data: [
      {
        id: "FIN001",
        revenue: 5000000,
        profit: 750000,
        employees: 50,
        creditScore: 750,
        financialHealth: "Excellent",
        lastUpdated: "2024-12-01"
      }
    ],
    compliance_records: [
      {
        id: "COMP001",
        violations: 0,
        penalties: 0,
        licenses: ["Business License", "IT Services License"],
        inspections: 3,
        complianceStatus: "Fully Compliant",
        lastInspection: "2024-11-15"
      }
    ]
  }

  const data = baseData[type as keyof typeof baseData] || []
  
  if (query) {
    return data.filter((item: any) => 
      Object.values(item).some((value: any) => 
        String(value).toLowerCase().includes(query.toLowerCase())
      )
    )
  }
  
  return data
}

async function validateData(type: string, data: any) {
  // Simulate data validation
  const validationRules = {
    business_registration: {
      required: ["companyName", "registrationNumber", "status"],
      patterns: {
        registrationNumber: /^[\dA-Z]{9,12}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    },
    certifications: {
      required: ["certificationName", "issuer", "issueDate", "expiryDate"],
      patterns: {
        certificateNumber: /^[A-Z0-9-]{10,20}$/
      }
    }
  }

  const rules = validationRules[type as keyof typeof validationRules]
  if (!rules) {
    return NextResponse.json({ valid: true, message: "No validation rules for this type" })
  }

  const errors: string[] = []
  
  // Check required fields
  rules.required.forEach((field: string) => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  // Check patterns
  if (rules.patterns) {
    Object.entries(rules.patterns).forEach(([field, pattern]) => {
      if (data[field] && !pattern.test(data[field])) {
        errors.push(`Invalid format for ${field}`)
      }
    })
  }

  return NextResponse.json({
    valid: errors.length === 0,
    errors,
    validatedAt: new Date().toISOString()
  })
}

async function enrichData(type: string, data: any) {
  // Simulate data enrichment using AI
  try {
    const zai = await ZAI.create()
    
    const enrichmentPrompt = `
      Enrich the following ${type} data with additional insights and categorization:
      
      Data: ${JSON.stringify(data)}
      
      Provide:
      1. Risk assessment (Low, Medium, High)
      2. Confidence score (0-100)
      3. Recommended actions
      4. Data quality score (0-100)
      5. Additional insights
    `

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a data enrichment expert specializing in business data analysis."
        },
        {
          role: "user", 
          content: enrichmentPrompt
        }
      ],
      max_tokens: 500
    })

    const enrichment = JSON.parse(response.choices[0]?.message?.content || "{}")

    return NextResponse.json({
      originalData: data,
      enrichedData: enrichment,
      enrichedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("AI enrichment error:", error)
    
    // Fallback enrichment
    return NextResponse.json({
      originalData: data,
      enrichedData: {
        riskAssessment: "Medium",
        confidenceScore: 75,
        recommendedActions: ["Verify data accuracy", "Cross-reference with other sources"],
        dataQualityScore: 80,
        insights: "Data appears complete but requires verification"
      },
      enrichedAt: new Date().toISOString()
    })
  }
}

async function syncData(type: string, data: any, tenantId: string) {
  // Simulate data synchronization
  const syncRecord = {
    id: `sync_${Date.now()}`,
    type,
    tenantId,
    data,
    timestamp: new Date().toISOString(),
    status: "synced",
    recordCount: Array.isArray(data) ? data.length : 1
  }

  // In a real implementation, this would store the sync record in the database
  console.log("Data sync record:", syncRecord)

  return NextResponse.json({
    success: true,
    syncId: syncRecord.id,
    syncedAt: syncRecord.timestamp,
    recordCount: syncRecord.recordCount
  })
}