import { db } from "@/lib/db"

const SYSTEM_TENANT_ID = "system"

interface SeedSection {
  title: string
  description: string
  questions: { type: string; prompt: string; required: boolean; order: number }[]
}

interface SeedCriterion {
  label: string
  weight: number
  scaleMin: number
  scaleMax: number
  guidance?: string
}

interface SeedTemplate {
  name: string
  description: string
  category: string
  isPublic: boolean
  sections: SeedSection[]
  scoringCriteria: SeedCriterion[]
  terms?: string
}

const templates: Omit<SeedTemplate, "name">[] & { name: string }[] = [
  {
    name: "IT Services",
    description:
      "Comprehensive template for IT service procurement including infrastructure, support, and managed services. Covers technical approach, team qualifications, pricing models, and past performance evaluation.",
    category: "IT Services",
    isPublic: true,
    sections: [
      {
        title: "Company Overview",
        description: "Provide an overview of your company, its history, mission, and key capabilities.",
        questions: [
          { type: "textarea", prompt: "Company history and background", required: true, order: 0 },
          { type: "textarea", prompt: "Mission statement and core values", required: true, order: 1 },
          { type: "text", prompt: "Annual revenue and company size (employees)", required: true, order: 2 },
          { type: "text", prompt: "Primary office locations", required: false, order: 3 },
          { type: "textarea", prompt: "Key differentiators and competitive advantages", required: true, order: 4 },
        ],
      },
      {
        title: "Technical Approach",
        description: "Describe your proposed technical solution, architecture, and methodology.",
        questions: [
          { type: "textarea", prompt: "Proposed technical architecture and design", required: true, order: 0 },
          { type: "textarea", prompt: "Technology stack and tools to be used", required: true, order: 1 },
          { type: "textarea", prompt: "Implementation methodology (Agile, Waterfall, etc.)", required: true, order: 2 },
          { type: "textarea", prompt: "Risk mitigation strategy", required: true, order: 3 },
          { type: "textarea", prompt: "Quality assurance and testing approach", required: true, order: 4 },
          { type: "textarea", prompt: "Disaster recovery and business continuity plan", required: true, order: 5 },
        ],
      },
      {
        title: "Team Qualifications",
        description: "Detail the qualifications and experience of the proposed project team.",
        questions: [
          { type: "text", prompt: "Project manager name and qualifications", required: true, order: 0 },
          { type: "textarea", prompt: "Project manager experience and certifications", required: true, order: 1 },
          { type: "textarea", prompt: "Key team members and their roles", required: true, order: 2 },
          { type: "textarea", prompt: "Team certifications and technical skills summary", required: true, order: 3 },
          { type: "number", prompt: "Total years of combined team experience", required: true, order: 4 },
          { type: "textarea", prompt: "Staffing plan and resource allocation", required: false, order: 5 },
        ],
      },
      {
        title: "Pricing",
        description: "Provide a detailed pricing breakdown for all proposed services.",
        questions: [
          { type: "textarea", prompt: "Total project cost summary", required: true, order: 0 },
          { type: "textarea", prompt: "Hourly rates by role/skill level", required: true, order: 1 },
          { type: "textarea", prompt: "Fixed-price components (if any)", required: false, order: 2 },
          { type: "textarea", prompt: "Payment schedule and milestones", required: true, order: 3 },
          { type: "textarea", prompt: "Cost containment and value engineering proposals", required: false, order: 4 },
          { type: "textarea", prompt: "Warranty and post-delivery support costs", required: false, order: 5 },
        ],
      },
      {
        title: "Past Performance",
        description: "Provide examples of similar projects your company has completed.",
        questions: [
          { type: "textarea", prompt: "Three most relevant past projects (describe scope, budget, timeline, outcomes)", required: true, order: 0 },
          { type: "textarea", prompt: "Client references with contact information", required: true, order: 1 },
          { type: "text", prompt: "Client satisfaction scores or metrics", required: false, order: 2 },
          { type: "textarea", prompt: "Industry awards or recognitions", required: false, order: 3 },
        ],
      },
    ],
    scoringCriteria: [
      { label: "Technical Approach", weight: 40, scaleMin: 1, scaleMax: 10, guidance: "Evaluate the soundness, feasibility, and innovation of the proposed technical solution." },
      { label: "Price", weight: 30, scaleMin: 1, scaleMax: 10, guidance: "Evaluate competitiveness and value-for-money of the pricing model." },
      { label: "Experience & Past Performance", weight: 20, scaleMin: 1, scaleMax: 10, guidance: "Evaluate relevance and success of past projects and team qualifications." },
      { label: "Innovation", weight: 10, scaleMin: 1, scaleMax: 10, guidance: "Evaluate creative solutions, emerging technology adoption, and forward-thinking approach." },
    ],
    terms: "Standard IT Services terms: NDA required for proprietary information. Net 30 payment terms. SLA with 99.5% uptime guarantee. Data handling in compliance with applicable regulations.",
  },
  {
    name: "Professional Services",
    description:
      "Template for professional services engagements including consulting, auditing, legal, and advisory services. Focuses on methodology, team expertise, timelines, and budget management.",
    category: "Professional Services",
    isPublic: true,
    sections: [
      {
        title: "Executive Summary",
        description: "Provide a high-level summary of your proposed approach and value proposition.",
        questions: [
          { type: "textarea", prompt: "Executive summary of your proposal", required: true, order: 0 },
          { type: "textarea", prompt: "Understanding of the client's needs and objectives", required: true, order: 1 },
          { type: "textarea", prompt: "Value proposition and expected outcomes", required: true, order: 2 },
          { type: "textarea", prompt: "Key differentiators", required: false, order: 3 },
        ],
      },
      {
        title: "Methodology",
        description: "Describe your approach, frameworks, and methodologies for delivering the engagement.",
        questions: [
          { type: "textarea", prompt: "Overall engagement methodology and framework", required: true, order: 0 },
          { type: "textarea", prompt: "Phase-by-phase approach with deliverables", required: true, order: 1 },
          { type: "textarea", prompt: "Quality assurance and review processes", required: true, order: 2 },
          { type: "textarea", prompt: "Stakeholder engagement and communication plan", required: true, order: 3 },
          { type: "textarea", prompt: "Change management approach", required: false, order: 4 },
        ],
      },
      {
        title: "Team",
        description: "Detail the proposed engagement team and their qualifications.",
        questions: [
          { type: "text", prompt: "Engagement lead name and qualifications", required: true, order: 0 },
          { type: "textarea", prompt: "Engagement lead relevant experience", required: true, order: 1 },
          { type: "textarea", prompt: "Supporting team members and their roles", required: true, order: 2 },
          { type: "textarea", prompt: "Team availability and commitment level", required: true, order: 3 },
          { type: "textarea", prompt: "Back-up team arrangements", required: false, order: 4 },
        ],
      },
      {
        title: "Timeline",
        description: "Provide a detailed project timeline with milestones and deliverables.",
        questions: [
          { type: "textarea", prompt: "Detailed project timeline with milestones", required: true, order: 0 },
          { type: "textarea", prompt: "Phase durations and dependencies", required: true, order: 1 },
          { type: "text", prompt: "Estimated start date and completion date", required: true, order: 2 },
          { type: "textarea", prompt: "Risk factors that may impact timeline", required: false, order: 3 },
          { type: "textarea", prompt: "Contingency plans for schedule delays", required: false, order: 4 },
        ],
      },
      {
        title: "Budget",
        description: "Provide a comprehensive budget breakdown for the engagement.",
        questions: [
          { type: "textarea", prompt: "Total engagement cost", required: true, order: 0 },
          { type: "textarea", prompt: "Cost breakdown by phase or deliverable", required: true, order: 1 },
          { type: "textarea", prompt: "Rate structure (hourly, fixed, retainer)", required: true, order: 2 },
          { type: "textarea", prompt: "Expenses and travel costs", required: false, order: 3 },
          { type: "textarea", prompt: "Payment terms and schedule", required: true, order: 4 },
        ],
      },
    ],
    scoringCriteria: [
      { label: "Methodology", weight: 35, scaleMin: 1, scaleMax: 10, guidance: "Evaluate the rigor and appropriateness of the proposed methodology and framework." },
      { label: "Team", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate the qualifications, experience, and fit of the proposed team." },
      { label: "Budget", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate competitiveness, transparency, and alignment of the proposed budget." },
      { label: "Timeline", weight: 15, scaleMin: 1, scaleMax: 10, guidance: "Evaluate feasibility, reasonableness, and clarity of the proposed timeline." },
    ],
    terms: "Standard Professional Services terms: NDA required. Net 30 payment terms. Monthly progress reporting required. All deliverables subject to client review and approval.",
  },
  {
    name: "Construction",
    description:
      "Template for construction project procurement including building, renovation, and infrastructure projects. Emphasizes project planning, safety, scheduling, and cost management.",
    category: "Construction",
    isPublic: true,
    sections: [
      {
        title: "Project Plan",
        description: "Describe your overall project plan, approach, and execution strategy.",
        questions: [
          { type: "textarea", prompt: "Project execution plan overview", required: true, order: 0 },
          { type: "textarea", prompt: "Construction methodology and approach", required: true, order: 1 },
          { type: "textarea", prompt: "Site logistics and access plan", required: true, order: 2 },
          { type: "textarea", prompt: "Subcontractor management strategy", required: true, order: 3 },
          { type: "textarea", prompt: "Material procurement plan", required: true, order: 4 },
        ],
      },
      {
        title: "Safety Plan",
        description: "Outline your comprehensive safety management plan for the project.",
        questions: [
          { type: "textarea", prompt: "Site-specific safety plan", required: true, order: 0 },
          { type: "textarea", prompt: "Safety officer qualifications and certifications", required: true, order: 1 },
          { type: "textarea", prompt: "Incident reporting and investigation procedures", required: true, order: 2 },
          { type: "textarea", prompt: "Safety training programs for workers", required: true, order: 3 },
          { type: "textarea", prompt: "PPE requirements and compliance measures", required: true, order: 4 },
          { type: "textarea", prompt: "Emergency response procedures", required: true, order: 5 },
        ],
      },
      {
        title: "Timeline",
        description: "Provide a detailed construction schedule with key milestones.",
        questions: [
          { type: "textarea", prompt: "Detailed construction schedule (Gantt or CPM)", required: true, order: 0 },
          { type: "textarea", prompt: "Key milestones and deliverable dates", required: true, order: 1 },
          { type: "text", prompt: "Projected start and completion dates", required: true, order: 2 },
          { type: "textarea", prompt: "Critical path analysis", required: true, order: 3 },
          { type: "textarea", prompt: "Weather delay contingency plan", required: false, order: 4 },
        ],
      },
      {
        title: "Budget Breakdown",
        description: "Provide a comprehensive cost estimate and budget breakdown.",
        questions: [
          { type: "textarea", prompt: "Total project cost estimate", required: true, order: 0 },
          { type: "textarea", prompt: "Detailed cost breakdown by trade/work item", required: true, order: 1 },
          { type: "textarea", prompt: "Labor costs breakdown", required: true, order: 2 },
          { type: "textarea", prompt: "Material costs breakdown", required: true, order: 3 },
          { type: "textarea", prompt: "Contingency and allowances", required: true, order: 4 },
          { type: "textarea", prompt: "Change order pricing methodology", required: false, order: 5 },
        ],
      },
      {
        title: "References",
        description: "Provide references from similar construction projects.",
        questions: [
          { type: "textarea", prompt: "Three similar past projects with descriptions", required: true, order: 0 },
          { type: "textarea", prompt: "Client references with contact information", required: true, order: 1 },
          { type: "text", prompt: "Safety record (EMR rating, incident history)", required: true, order: 2 },
          { type: "textarea", prompt: "Bonding capacity information", required: false, order: 3 },
          { type: "textarea", prompt: "Licensing and registrations", required: true, order: 4 },
        ],
      },
    ],
    scoringCriteria: [
      { label: "Experience & Qualifications", weight: 30, scaleMin: 1, scaleMax: 10, guidance: "Evaluate relevant construction experience, licenses, and safety record." },
      { label: "Safety Plan", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate the comprehensiveness and effectiveness of the safety management plan." },
      { label: "Price", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate competitiveness and completeness of the cost estimate." },
      { label: "Timeline", weight: 20, scaleMin: 1, scaleMax: 10, guidance: "Evaluate feasibility, realism, and management of the proposed schedule." },
    ],
    terms: "Standard Construction terms: Performance bond required (100% of contract value). Payment bond required. Net 30 payment terms with 10% retainage. Builders risk insurance required. Prevailing wage compliance required where applicable.",
  },
  {
    name: "Software Development",
    description:
      "Template for software development project procurement covering architecture, tech stack, development methodology, QA, DevOps practices, and pricing models.",
    category: "Software Development",
    isPublic: true,
    sections: [
      {
        title: "Architecture",
        description: "Describe your proposed system architecture and design decisions.",
        questions: [
          { type: "textarea", prompt: "High-level system architecture overview", required: true, order: 0 },
          { type: "textarea", prompt: "Design patterns and principles to be applied", required: true, order: 1 },
          { type: "textarea", prompt: "Data architecture and storage strategy", required: true, order: 2 },
          { type: "textarea", prompt: "Integration architecture with existing systems", required: true, order: 3 },
          { type: "textarea", prompt: "Scalability and performance considerations", required: true, order: 4 },
        ],
      },
      {
        title: "Tech Stack",
        description: "Detail the technology stack, frameworks, and tools proposed for the project.",
        questions: [
          { type: "textarea", prompt: "Primary programming languages and frameworks", required: true, order: 0 },
          { type: "textarea", prompt: "Database and data management technologies", required: true, order: 1 },
          { type: "textarea", prompt: "Front-end technologies and UI framework", required: true, order: 2 },
          { type: "textarea", prompt: "Cloud infrastructure and hosting platform", required: true, order: 3 },
          { type: "textarea", prompt: "Third-party libraries and open-source components", required: false, order: 4 },
        ],
      },
      {
        title: "Development Approach",
        description: "Describe your development methodology, sprint planning, and delivery practices.",
        questions: [
          { type: "textarea", prompt: "Development methodology (Agile, Scrum, Kanban, etc.)", required: true, order: 0 },
          { type: "textarea", prompt: "Sprint structure and release planning", required: true, order: 1 },
          { type: "textarea", prompt: "Code review and collaboration practices", required: true, order: 2 },
          { type: "textarea", prompt: "Technical documentation approach", required: true, order: 3 },
          { type: "textarea", prompt: "Knowledge transfer and training plan", required: false, order: 4 },
        ],
      },
      {
        title: "QA Plan",
        description: "Outline your quality assurance strategy and testing approach.",
        questions: [
          { type: "textarea", prompt: "Overall QA strategy and test plan", required: true, order: 0 },
          { type: "textarea", prompt: "Unit testing approach and coverage targets", required: true, order: 1 },
          { type: "textarea", prompt: "Integration and end-to-end testing plan", required: true, order: 2 },
          { type: "textarea", prompt: "Performance and load testing approach", required: true, order: 3 },
          { type: "textarea", prompt: "Security testing and vulnerability assessment plan", required: true, order: 4 },
          { type: "textarea", prompt: "UAT and acceptance criteria", required: true, order: 5 },
        ],
      },
      {
        title: "DevOps",
        description: "Describe your CI/CD pipeline, deployment strategy, and operational practices.",
        questions: [
          { type: "textarea", prompt: "CI/CD pipeline and automation tools", required: true, order: 0 },
          { type: "textarea", prompt: "Deployment strategy (blue-green, canary, rolling)", required: true, order: 1 },
          { type: "textarea", prompt: "Infrastructure as Code approach", required: true, order: 2 },
          { type: "textarea", prompt: "Monitoring, logging, and alerting strategy", required: true, order: 3 },
          { type: "textarea", prompt: "Incident response and on-call procedures", required: false, order: 4 },
        ],
      },
      {
        title: "Pricing",
        description: "Provide a detailed pricing structure for the software development engagement.",
        questions: [
          { type: "textarea", prompt: "Total project cost estimate", required: true, order: 0 },
          { type: "textarea", prompt: "Pricing model (fixed-price, T&M, hybrid)", required: true, order: 1 },
          { type: "textarea", prompt: "Resource rates and team composition", required: true, order: 2 },
          { type: "textarea", prompt: "Licensing and third-party costs", required: false, order: 3 },
          { type: "textarea", prompt: "Maintenance and support costs post-launch", required: false, order: 4 },
          { type: "textarea", prompt: "Payment milestones and schedule", required: true, order: 5 },
        ],
      },
    ],
    scoringCriteria: [
      { label: "Technical Solution", weight: 35, scaleMin: 1, scaleMax: 10, guidance: "Evaluate the quality and appropriateness of the proposed architecture, tech stack, and DevOps practices." },
      { label: "Development Approach", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate the development methodology, QA strategy, and delivery practices." },
      { label: "Price", weight: 20, scaleMin: 1, scaleMax: 10, guidance: "Evaluate competitiveness, transparency, and value-for-money of the pricing." },
      { label: "Team", weight: 20, scaleMin: 1, scaleMax: 10, guidance: "Evaluate the team's qualifications, experience, and capacity to deliver." },
    ],
    terms: "Standard Software Development terms: Source code escrow required. IP ownership transfers upon full payment. 12-month warranty period for defect fixes. Net 30 payment terms. NDA required for confidential information access.",
  },
  {
    name: "Marketing Services",
    description:
      "Template for marketing and advertising service procurement covering strategy, creative work, team capabilities, budget allocation, and performance metrics.",
    category: "Marketing Services",
    isPublic: true,
    sections: [
      {
        title: "Strategy",
        description: "Describe your proposed marketing strategy and campaign approach.",
        questions: [
          { type: "textarea", prompt: "Overall marketing strategy and campaign concept", required: true, order: 0 },
          { type: "textarea", prompt: "Target audience analysis and segmentation", required: true, order: 1 },
          { type: "textarea", prompt: "Channel strategy (digital, traditional, social, etc.)", required: true, order: 2 },
          { type: "textarea", prompt: "Messaging framework and brand positioning", required: true, order: 3 },
          { type: "textarea", prompt: "Competitive landscape analysis", required: false, order: 4 },
        ],
      },
      {
        title: "Creative Portfolio",
        description: "Showcase relevant creative work and campaign examples.",
        questions: [
          { type: "textarea", prompt: "Relevant campaign case studies with results", required: true, order: 0 },
          { type: "textarea", prompt: "Sample creative concepts for this engagement", required: true, order: 1 },
          { type: "file", prompt: "Portfolio or work samples (PDF/upload)", required: true, order: 2 },
          { type: "textarea", prompt: "Industry awards and creative recognitions", required: false, order: 3 },
        ],
      },
      {
        title: "Team",
        description: "Describe the proposed marketing team and their expertise.",
        questions: [
          { type: "text", prompt: "Account director name and qualifications", required: true, order: 0 },
          { type: "textarea", prompt: "Creative team composition and specialties", required: true, order: 1 },
          { type: "textarea", prompt: "Digital and analytics team capabilities", required: true, order: 2 },
          { type: "textarea", prompt: "Strategic planning team experience", required: false, order: 3 },
          { type: "textarea", prompt: "Client service and communication approach", required: true, order: 4 },
        ],
      },
      {
        title: "Budget",
        description: "Provide a detailed budget allocation and pricing structure.",
        questions: [
          { type: "textarea", prompt: "Total campaign budget", required: true, order: 0 },
          { type: "textarea", prompt: "Budget allocation by channel and activity", required: true, order: 1 },
          { type: "textarea", prompt: "Agency fee structure (retainer, project-based, etc.)", required: true, order: 2 },
          { type: "textarea", prompt: "Media spend and ad placement costs", required: false, order: 3 },
          { type: "textarea", prompt: "Production costs (photo, video, design)", required: false, order: 4 },
        ],
      },
      {
        title: "Metrics",
        description: "Define KPIs, measurement approach, and reporting framework.",
        questions: [
          { type: "textarea", prompt: "Proposed KPIs and success metrics", required: true, order: 0 },
          { type: "textarea", prompt: "Measurement and tracking methodology", required: true, order: 1 },
          { type: "textarea", prompt: "Reporting frequency and format", required: true, order: 2 },
          { type: "textarea", prompt: "Optimization and iteration process", required: true, order: 3 },
          { type: "textarea", prompt: "ROI modeling and benchmark approach", required: false, order: 4 },
        ],
      },
    ],
    scoringCriteria: [
      { label: "Creativity", weight: 30, scaleMin: 1, scaleMax: 10, guidance: "Evaluate originality, visual quality, and creative impact of proposed concepts." },
      { label: "Strategy", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate strategic thinking, audience insights, and channel planning." },
      { label: "Budget", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate competitiveness, transparency, and efficiency of the proposed budget." },
      { label: "Experience", weight: 20, scaleMin: 1, scaleMax: 10, guidance: "Evaluate relevance and quality of past campaign experience and team expertise." },
    ],
    terms: "Standard Marketing Services terms: NDA required for brand assets and campaign data. All creative assets transfer ownership upon payment. Net 30 payment terms. Monthly performance reporting required.",
  },
  {
    name: "General Purpose",
    description:
      "A flexible all-purpose RFP template suitable for any procurement type. Includes standard sections for proposal overview, approach, qualifications, pricing, timeline, and references.",
    category: "General",
    isPublic: false,
    sections: [
      {
        title: "Proposal Overview",
        description: "Provide an overview of your proposal and understanding of the requirements.",
        questions: [
          { type: "textarea", prompt: "Proposal executive summary", required: true, order: 0 },
          { type: "textarea", prompt: "Understanding of requirements and objectives", required: true, order: 1 },
          { type: "textarea", prompt: "Proposed solution overview", required: true, order: 2 },
          { type: "textarea", prompt: "Key benefits and value proposition", required: true, order: 3 },
        ],
      },
      {
        title: "Approach",
        description: "Describe your approach, methodology, and work plan.",
        questions: [
          { type: "textarea", prompt: "Detailed approach and methodology", required: true, order: 0 },
          { type: "textarea", prompt: "Work plan with phases and deliverables", required: true, order: 1 },
          { type: "textarea", prompt: "Risk assessment and mitigation plan", required: true, order: 2 },
          { type: "textarea", prompt: "Quality assurance plan", required: false, order: 3 },
        ],
      },
      {
        title: "Qualifications",
        description: "Describe your company's qualifications and relevant experience.",
        questions: [
          { type: "textarea", prompt: "Company overview and core competencies", required: true, order: 0 },
          { type: "textarea", prompt: "Relevant experience and past projects", required: true, order: 1 },
          { type: "textarea", prompt: "Proposed team and key personnel", required: true, order: 2 },
          { type: "textarea", prompt: "Certifications, licenses, and accreditations", required: false, order: 3 },
        ],
      },
      {
        title: "Pricing",
        description: "Provide your pricing proposal and cost breakdown.",
        questions: [
          { type: "textarea", prompt: "Total cost proposal", required: true, order: 0 },
          { type: "textarea", prompt: "Detailed cost breakdown", required: true, order: 1 },
          { type: "textarea", prompt: "Payment terms and schedule", required: true, order: 2 },
          { type: "textarea", prompt: "Optional value-added services", required: false, order: 3 },
        ],
      },
      {
        title: "Timeline",
        description: "Provide your proposed timeline and schedule.",
        questions: [
          { type: "textarea", prompt: "Project timeline with milestones", required: true, order: 0 },
          { type: "text", prompt: "Proposed start and end dates", required: true, order: 1 },
          { type: "textarea", prompt: "Dependencies and critical path items", required: false, order: 2 },
        ],
      },
      {
        title: "References",
        description: "Provide client references and testimonials.",
        questions: [
          { type: "textarea", prompt: "Client references with contact information", required: true, order: 0 },
          { type: "textarea", prompt: "Testimonials or case studies", required: false, order: 1 },
        ],
      },
    ],
    scoringCriteria: [
      { label: "Proposal Quality", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate clarity, completeness, and overall quality of the proposal." },
      { label: "Approach & Methodology", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate the soundness and feasibility of the proposed approach." },
      { label: "Price", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate competitiveness and transparency of the pricing." },
      { label: "Qualifications", weight: 25, scaleMin: 1, scaleMax: 10, guidance: "Evaluate relevant experience, team qualifications, and certifications." },
    ],
    terms: "Standard terms and conditions: NDA required where applicable. Net 30 payment terms. Deliverables subject to client acceptance.",
  },
]

export async function seedTemplates() {
  // Check if any templates exist already
  const existingCount = await db.rFPTemplate.count({
    where: { tenantId: SYSTEM_TENANT_ID },
  })

  if (existingCount > 0) {
    console.warn(`[seed-templates] ${existingCount} templates already exist — skipping.`)
    return
  }

  // Find or create a system user for createdBy
  let systemUser = await db.user.findFirst({ where: { email: "system@rfp-platform.local" } })
  if (!systemUser) {
    // Find any tenant to use as the system tenant
    let systemTenant = await db.tenant.findFirst()
    if (!systemTenant) {
      systemTenant = await db.tenant.create({
        data: { name: "System", plan: "enterprise", subscriptionTier: "enterprise" },
      })
    }
    systemUser = await db.user.create({
      data: {
        tenantId: systemTenant.id,
        email: "system@rfp-platform.local",
        name: "System",
        password: "not-used",
        isActive: false,
      },
    })
  }

  // Use the system user's tenantId as the template tenant
  const tenantId = systemUser.tenantId

  // Create all templates
  for (const tpl of templates) {
    await db.rFPTemplate.create({
      data: {
        tenantId,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        isPublic: tpl.isPublic,
        sections: JSON.stringify(tpl.sections),
        scoringCriteria: JSON.stringify(tpl.scoringCriteria),
        terms: tpl.terms || null,
        createdBy: systemUser.id,
      },
    })
  }

  console.warn(`[seed-templates] Created ${templates.length} default templates.`)
}
