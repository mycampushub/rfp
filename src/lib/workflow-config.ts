import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface WorkflowStage {
  id: string
  name: string
  description: string
  order: number
  isRequired: boolean
  approverRole: string
  slaHours: number // Service Level Agreement in hours
  conditions?: any[]
  notifications?: any[]
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
      const tenantContext = getTenantContext()
      const effectiveTenantId = tenantId || tenantContext.tenantId

      // In a real implementation, this would fetch from a workflow_configs table
      // For now, we'll return the default configuration
      return this.getDefaultWorkflowConfigs(effectiveTenantId)
    } catch (error) {
      console.error("Error fetching workflow configs:", error)
      return []
    }
  }

  static async getWorkflowConfig(id: string, tenantId?: string): Promise<WorkflowConfig | null> {
    try {
      const tenantContext = getTenantContext()
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
      const tenantContext = getTenantContext()

      // In a real implementation, this would save to the database
      const newConfig: WorkflowConfig = {
        ...config,
        id: `workflow-${Date.now()}`,
        tenantId: tenantContext.tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // TODO: Save to database
      console.log("Creating workflow config:", newConfig)

      return newConfig
    } catch (error) {
      console.error("Error creating workflow config:", error)
      throw error
    }
  }

  static async updateWorkflowConfig(id: string, updates: Partial<WorkflowConfig>): Promise<WorkflowConfig | null> {
    try {
      const tenantContext = getTenantContext()

      // TODO: Update in database
      console.log("Updating workflow config:", { id, updates })

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
      const tenantContext = getTenantContext()

      // TODO: Delete from database
      console.log("Deleting workflow config:", id)

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
              {
                field: "budget",
                operator: "gt",
                value: 10000,
                action: "require_finance_review"
              }
            ],
            notifications: [
              {
                type: "email",
                recipients: ["procurement_team"],
                template: "rfp_draft_review"
              }
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
              {
                field: "confidentiality",
                operator: "eq",
                value: "high",
                action: "require_extended_review"
              }
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
              {
                field: "budget",
                operator: "gt",
                value: 50000,
                action: "require_cfo_approval"
              }
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
              {
                field: "total_value",
                operator: "gt",
                value: 100000,
                action: "require_board_approval"
              }
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
        if (!stage.name || stage.name.trim() === "") {
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

  static async getNextStage(currentStageId: string, workflowConfigId: string): Promise<WorkflowStage | null> {
    try {
      const config = await this.getWorkflowConfig(workflowConfigId)
      if (!config) {
        return null
      }

      const currentStage = config.stages.find(s => s.id === currentStageId)
      if (!currentStage) {
        return null
      }

      const nextStage = config.stages.find(s => s.order === currentStage.order + 1)
      return nextStage || null
    } catch (error) {
      console.error("Error getting next stage:", error)
      return null
    }
  }

  static async getPreviousStage(currentStageId: string, workflowConfigId: string): Promise<WorkflowStage | null> {
    try {
      const config = await this.getWorkflowConfig(workflowConfigId)
      if (!config) {
        return null
      }

      const currentStage = config.stages.find(s => s.id === currentStageId)
      if (!currentStage) {
        return null
      }

      const previousStage = config.stages.find(s => s.order === currentStage.order - 1)
      return previousStage || null
    } catch (error) {
      console.error("Error getting previous stage:", error)
      return null
    }
  }

  static async checkSLACompliance(approvalId: string): Promise<{ isCompliant: boolean; hoursOverdue: number; slaHours: number }> {
    try {
      // In a real implementation, this would fetch the approval and check SLA
      // For now, we'll return mock data
      return {
        isCompliant: true,
        hoursOverdue: 0,
        slaHours: 24
      }
    } catch (error) {
      console.error("Error checking SLA compliance:", error)
      return {
        isCompliant: false,
        hoursOverdue: 0,
        slaHours: 24
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
      const tenantContext = getTenantContext()
      const effectiveTenantId = tenantId || tenantContext.tenantId

      // In a real implementation, this would fetch actual statistics from the database
      // For now, we'll return mock data
      return {
        totalApprovals: 150,
        pendingApprovals: 25,
        overdueApprovals: 3,
        averageSLACompliance: 92.5,
        stageBreakdown: {
          "draft-review": { total: 45, completed: 42, averageTime: 18 },
          "legal-review": { total: 38, completed: 35, averageTime: 36 },
          "budget-approval": { total: 32, completed: 28, averageTime: 54 },
          "publish-approval": { total: 28, completed: 25, averageTime: 20 },
          "evaluation-approval": { total: 25, completed: 22, averageTime: 42 },
          "award-approval": { total: 22, completed: 18, averageTime: 22 },
          "contract-review": { total: 18, completed: 15, averageTime: 65 }
        }
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