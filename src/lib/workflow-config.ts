import { db } from "@/lib/db"
import { getTenantContextAsync } from "@/lib/tenant-context"

export interface WorkflowStage {
  id: string
  name: string
  description: string
  order: number
  isRequired: boolean
  approverRole: string
  slaHours: number
  conditions?: Record<string, unknown>[]
  notifications?: Record<string, unknown>[]
}

export interface WorkflowConfig {
  id: string
  name: string
  description: string
  stages: WorkflowStage[]
  isActive: boolean
  tenantId: string
  createdAt: string
  updatedAt: string
}

export class WorkflowConfigManager {
  static async getWorkflowConfigs(tenantId?: string): Promise<WorkflowConfig[]> {
    try {
      const tenantContext = await getTenantContextAsync()
      const effectiveTenantId = tenantId || tenantContext.tenantId
      return this.getDefaultWorkflowConfigs(effectiveTenantId)
    } catch (error) {
      console.error("Error fetching workflow configs:", error)
      return []
    }
  }

  static async getWorkflowConfig(id: string, tenantId?: string): Promise<WorkflowConfig | null> {
    try {
      const tenantContext = await getTenantContextAsync()
      const effectiveTenantId = tenantId || tenantContext.tenantId
      const configs = await this.getWorkflowConfigs(effectiveTenantId)
      return configs.find(config => config.id === id) || null
    } catch (error) {
      console.error("Error fetching workflow config:", error)
      return null
    }
  }

  static async createWorkflowConfig(config: Omit<WorkflowConfig, "id" | "createdAt" | "updatedAt">): Promise<WorkflowConfig> {
    try {
      const tenantContext = await getTenantContextAsync()
      const newConfig: WorkflowConfig = {
        ...config,
        id: `workflow-${Date.now()}`,
        tenantId: tenantContext.tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return newConfig
    } catch (error) {
      console.error("Error creating workflow config:", error)
      throw error
    }
  }

  static async updateWorkflowConfig(id: string, updates: Partial<WorkflowConfig>): Promise<WorkflowConfig | null> {
    try {
      const tenantContext = await getTenantContextAsync()
      const existingConfig = await this.getWorkflowConfig(id, tenantContext.tenantId)
      if (!existingConfig) {
        return null
      }
      const updatedConfig: WorkflowConfig = {
        ...existingConfig,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      return updatedConfig
    } catch (error) {
      console.error("Error updating workflow config:", error)
      throw error
    }
  }

  static async deleteWorkflowConfig(id: string): Promise<boolean> {
    try {
      await getTenantContextAsync()
      return true
    } catch (error) {
      console.error("Error deleting workflow config:", error)
      return false
    }
  }

  static getDefaultWorkflowConfigs(tenantId: string): WorkflowConfig[] {
    return [
      {
        id: "default-rfp-workflow",
        name: "Standard RFP Workflow",
        description: "Default workflow for RFP approval process",
        tenantId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stages: [
          {
            id: "draft-review",
            name: "Draft Review",
            description: "Initial review of RFP draft by procurement team",
            order: 1,
            isRequired: true,
            approverRole: "procurement_manager",
            slaHours: 24,
            conditions: [
              { field: "budget", operator: "gt", value: 10000, action: "require_finance_review" }
            ],
            notifications: [
              { type: "email", recipients: ["procurement_team"], template: "rfp_draft_review" }
            ]
          },
          {
            id: "legal-review",
            name: "Legal Review",
            description: "Legal team review of terms and conditions",
            order: 2,
            isRequired: true,
            approverRole: "legal_counsel",
            slaHours: 48,
            conditions: [
              { field: "confidentiality", operator: "eq", value: "high", action: "require_extended_review" }
            ]
          },
          {
            id: "budget-approval",
            name: "Budget Approval",
            description: "Finance team approval for budget allocation",
            order: 3,
            isRequired: true,
            approverRole: "finance_manager",
            slaHours: 72,
            conditions: [
              { field: "budget", operator: "gt", value: 50000, action: "require_cfo_approval" }
            ]
          },
          {
            id: "publish-approval",
            name: "Publish Approval",
            description: "Final approval to publish RFP",
            order: 4,
            isRequired: true,
            approverRole: "procurement_director",
            slaHours: 24
          },
          {
            id: "evaluation-approval",
            name: "Evaluation Complete",
            description: "Approval of evaluation results and scoring",
            order: 5,
            isRequired: true,
            approverRole: "evaluation_committee",
            slaHours: 48
          },
          {
            id: "award-approval",
            name: "Award Approval",
            description: "Final approval for vendor award",
            order: 6,
            isRequired: true,
            approverRole: "executive_sponsor",
            slaHours: 24,
            conditions: [
              { field: "total_value", operator: "gt", value: 100000, action: "require_board_approval" }
            ]
          },
          {
            id: "contract-review",
            name: "Contract Review",
            description: "Final contract review and signing",
            order: 7,
            isRequired: true,
            approverRole: "legal_counsel",
            slaHours: 72
          }
        ]
      },
      {
        id: "emergency-rfp-workflow",
        name: "Emergency RFP Workflow",
        description: "Expedited workflow for emergency procurements",
        tenantId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stages: [
          {
            id: "emergency-review",
            name: "Emergency Review",
            description: "Expedited review for emergency situations",
            order: 1,
            isRequired: true,
            approverRole: "emergency_committee",
            slaHours: 4
          },
          {
            id: "emergency-approval",
            name: "Emergency Approval",
            description: "Rapid approval process",
            order: 2,
            isRequired: true,
            approverRole: "executive_sponsor",
            slaHours: 2
          }
        ]
      }
    ]
  }

  static async validateWorkflowConfig(config: Omit<WorkflowConfig, "id" | "createdAt" | "updatedAt">): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!config.name || config.name.trim() === "") {
      errors.push("Workflow name is required")
    }

    if (!config.stages || config.stages.length === 0) {
      errors.push("At least one stage is required")
    }

    if (config.stages) {
      const stageOrders = config.stages.map(s => s.order)
      const uniqueOrders = new Set(stageOrders)
      if (stageOrders.length !== uniqueOrders.size) {
        errors.push("Stage orders must be unique")
      }

      config.stages.forEach((stage, index) => {
        if (!stage.name || stage.name.trim() === "" ) {
          errors.push(`Stage ${index + 1}: Name is required`)
        }

        if (!stage.approverRole || stage.approverRole.trim() === "") {
          errors.push(`Stage ${index + 1}: Approver role is required`)
        }

        if (stage.slaHours <= 0) {
          errors.push(`Stage ${index + 1}: SLA hours must be greater than 0`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static async getNextStage(currentStageId: string, workflowConfigId: string, tenantId?: string): Promise<WorkflowStage | null> {
    try {
      const config = await this.getWorkflowConfig(workflowConfigId, tenantId)
      if (!config) return null

      const currentStage = config.stages.find(s => s.id === currentStageId)
      if (!currentStage) return null

      return config.stages.find(s => s.order === currentStage.order + 1) || null
    } catch (error) {
      console.error("Error getting next stage:", error)
      return null
    }
  }

  static async getPreviousStage(currentStageId: string, workflowConfigId: string, tenantId?: string): Promise<WorkflowStage | null> {
    try {
      const config = await this.getWorkflowConfig(workflowConfigId, tenantId)
      if (!config) return null

      const currentStage = config.stages.find(s => s.id === currentStageId)
      if (!currentStage) return null

      return config.stages.find(s => s.order === currentStage.order - 1) || null
    } catch (error) {
      console.error("Error getting previous stage:", error)
      return null
    }
  }

  static async checkSLACompliance(approvalId: string): Promise<{ isCompliant: boolean; hoursOverdue: number; slaHours: number }> {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const process = await db.approvalProcess.findUnique({
        where: { id: approvalId },
      })

      if (!process) {
        return { isCompliant: false, hoursOverdue: 0, slaHours: 168 }
      }

      const isCompliant = new Date(process.createdAt) > sevenDaysAgo
      const hoursOverdue = isCompliant ? 0 : Math.max(0, (sevenDaysAgo.getTime() - new Date(process.createdAt).getTime()) / (1000 * 60 * 60))

      return {
        isCompliant,
        hoursOverdue: Math.round(hoursOverdue),
        slaHours: 168
      }
    } catch (error) {
      console.error("Error checking SLA compliance:", error)
      return {
        isCompliant: false,
        hoursOverdue: 0,
        slaHours: 168
      }
    }
  }

  static async getStageStatistics(tenantId?: string): Promise<{
    totalApprovals: number
    pendingApprovals: number
    overdueApprovals: number
    averageSLACompliance: number
    stageBreakdown: Record<string, { total: number; completed: number; averageTime: number }>
  }> {
    try {
      const tenantContext = await getTenantContextAsync()
      const effectiveTenantId = tenantId || tenantContext.tenantId

      const statusCounts = await db.approvalRequest.groupBy({
        by: ['status'],
        _count: { id: true },
      })

      const countByStatus = (status: string) =>
        statusCounts.find(s => s.status === status)?._count.id ?? 0

      const totalApprovals = statusCounts.reduce((sum, s) => sum + s._count.id, 0)
      const pendingApprovals = countByStatus('waiting') + countByStatus('pending')

      const now = new Date()
      const overdueApprovals = await db.approvalRequest.count({
        where: {
          status: { in: ['waiting', 'pending'] },
          dueAt: { lt: now },
        },
      })

      const decidedRequests = await db.approvalRequest.findMany({
        where: {
          status: { in: ['approved', 'rejected'] },
          decidedAt: { not: null },
        },
        select: { decidedAt: true, dueAt: true },
      })

      const averageSLACompliance =
        decidedRequests.length > 0
          ? (decidedRequests.filter(r => r.decidedAt! <= r.dueAt).length / decidedRequests.length) * 100
          : 100

      const stageGroups = await db.approvalRequest.groupBy({
        by: ['stageId', 'status'],
        _count: { id: true },
      })

      const stageBreakdown: Record<string, { total: number; completed: number; averageTime: number }> = {}
      for (const group of stageGroups) {
        if (!stageBreakdown[group.stageId]) {
          stageBreakdown[group.stageId] = { total: 0, completed: 0, averageTime: 0 }
        }
        stageBreakdown[group.stageId].total += group._count.id
        if (group.status === 'approved' || group.status === 'rejected') {
          stageBreakdown[group.stageId].completed += group._count.id
        }
      }

      for (const stageId of Object.keys(stageBreakdown)) {
        const completedInStage = await db.approvalRequest.findMany({
          where: { stageId, status: { in: ['approved', 'rejected'] }, decidedAt: { not: null } },
          select: { createdAt: true, decidedAt: true },
        })
        if (completedInStage.length > 0) {
          const avgMs =
            completedInStage.reduce((sum, r) => sum + (r.decidedAt!.getTime() - r.createdAt.getTime()), 0) /
            completedInStage.length
          stageBreakdown[stageId].averageTime = Math.round(avgMs / (1000 * 60 * 60))
        }
      }

      return {
        totalApprovals,
        pendingApprovals,
        overdueApprovals,
        averageSLACompliance: Math.round(averageSLACompliance * 10) / 10,
        stageBreakdown,
      }
    } catch (error) {
      console.error("Error getting stage statistics:", error)
      return {
        totalApprovals: 0,
        pendingApprovals: 0,
        overdueApprovals: 0,
        averageSLACompliance: 0,
        stageBreakdown: {}
      }
    }
  }
}
