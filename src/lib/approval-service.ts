import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { AuthError } from "@/lib/tenant-context"

export interface ApprovalStage {
  id: string
  name: string
  description: string
  required: boolean
  order: number
  approverRole: string
  slaHours: number
  autoApprove?: boolean
  conditions?: Record<string, unknown>[]
}

export interface ApprovalWorkflow {
  id: string
  tenantId: string
  name: string
  description: string
  stages: ApprovalStage[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class ApprovalService {
  static async createWorkflow(data: {
    tenantId: string
    name: string
    description: string
    stages: Omit<ApprovalStage, 'id'>[]
  }) {
    const workflow = await db.approvalWorkflow.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        stages: data.stages as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    })

    return workflow
  }

  static async getWorkflows(tenantId: string) {
    return await db.approvalWorkflow.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: "desc" },
    })
  }

  static async getWorkflow(id: string, tenantId: string) {
    return await db.approvalWorkflow.findFirst({
      where: { id, tenantId },
    })
  }

  static async updateWorkflow(id: string, tenantId: string, data: Partial<ApprovalWorkflow>) {
    const { id: _id, tenantId: _tid, createdAt: _ca, updatedAt: _ua, stages, ...rest } = data
    return await db.approvalWorkflow.updateMany({
      where: { id, tenantId },
      data: {
        ...rest,
        ...(stages != null ? { stages: stages as unknown as Prisma.InputJsonValue } : {}),
      },
    })
  }

  static async deleteWorkflow(id: string, tenantId: string) {
    return await db.approvalWorkflow.deleteMany({
      where: { id, tenantId },
    })
  }

  static async initiateApproval(data: {
    rfpId: string
    workflowId: string
    requestedBy: string
    metadata?: Record<string, unknown>
  }) {
    const workflow = await db.approvalWorkflow.findUnique({
      where: { id: data.workflowId },
    })

    if (!workflow) {
      throw new Error("Workflow not found")
    }

    const rfp = await db.rFP.findUnique({
      where: { id: data.rfpId },
    })

    if (!rfp) {
      throw new Error("RFP not found")
    }

    const workflowStages = (Array.isArray(workflow.stages) ? workflow.stages : []) as unknown as ApprovalStage[]

    return await db.$transaction(async (tx) => {
      const approvalProcess = await tx.approvalProcess.create({
        data: {
          rfpId: data.rfpId,
          workflowId: data.workflowId,
          requestedBy: data.requestedBy,
          status: "in_progress",
          currentStage: 0,
          metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        },
      })

      const approvalRequests = await Promise.all(
        workflowStages.map((stage, index) =>
          tx.approvalRequest.create({
            data: {
              processId: approvalProcess.id,
              stageId: stage.id,
              stageName: stage.name,
              approverRole: stage.approverRole,
              slaHours: stage.slaHours,
              status: index === 0 ? "pending" : "waiting",
              dueAt: this.calculateDueDate(stage.slaHours),
            },
          })
        )
      )

      return { process: approvalProcess, requests: approvalRequests }
    })
  }

  static async getApprovalProcess(rfpId: string) {
    return await db.approvalProcess.findFirst({
      where: { rfpId },
      include: {
        workflow: true,
        requests: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })
  }

  static async approveRequest(requestId: string, approverId: string, comments?: string) {
    const request = await db.approvalRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new Error("Approval request not found")
    }

    if (request.status !== "pending") {
      throw new Error("Request is not pending approval")
    }

    return await db.$transaction(async (tx) => {
      // Update request
      const updatedRequest = await tx.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          approverId,
          decidedAt: new Date(),
          comments,
        },
      })

      // Get the process and move to next stage
      const process = await tx.approvalProcess.findUnique({
        where: { id: request.processId },
        include: {
          requests: {
            orderBy: { createdAt: "asc" },
          },
        },
      })

      if (process) {
        const currentIndex = process.requests.findIndex(r => r.id === requestId)
        const nextRequest = process.requests[currentIndex + 1]

        if (nextRequest) {
          // Move to next stage
          await tx.approvalRequest.update({
            where: { id: nextRequest.id },
            data: {
              status: "pending",
            },
          })

          await tx.approvalProcess.update({
            where: { id: process.id },
            data: {
              currentStage: currentIndex + 1,
            },
          })
        } else {
          // All stages completed
          await tx.approvalProcess.update({
            where: { id: process.id },
            data: {
              status: "completed",
              completedAt: new Date(),
            },
          })

          // Update RFP status based on workflow completion
          await tx.rFP.update({
            where: { id: process.rfpId },
            data: {
              status: "approved",
            },
          })
        }
      }

      return updatedRequest
    })
  }

  static async rejectRequest(requestId: string, approverId: string, comments: string) {
    const request = await db.approvalRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new Error("Approval request not found")
    }

    if (request.status !== "pending") {
      throw new Error("Request is not pending approval")
    }

    return await db.$transaction(async (tx) => {
      // Update request
      const updatedRequest = await tx.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: "rejected",
          approverId,
          decidedAt: new Date(),
          comments,
        },
      })

      // Fetch process to get rfpId
      const process = await tx.approvalProcess.findUnique({
        where: { id: request.processId },
      })

      if (process) {
        // Mark process as rejected
        await tx.approvalProcess.update({
          where: { id: process.id },
          data: {
            status: "rejected",
            completedAt: new Date(),
          },
        })

        // Update RFP status
        await tx.rFP.update({
          where: { id: process.rfpId },
          data: {
            status: "rejected",
          },
        })
      }

      return updatedRequest
    })
  }

  static async getOverdueApprovals(tenantId: string) {
    const now = new Date()
    
    return await db.approvalRequest.findMany({
      where: {
        process: {
          rfp: {
            tenantId,
          },
        },
        status: "pending",
        dueAt: {
          lt: now,
        },
      },
      include: {
        process: {
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  static async getApprovalStats(tenantId: string) {
    const [
      totalProcesses,
      activeProcesses,
      completedProcesses,
      rejectedProcesses,
      overdueRequests,
      avgProcessingTime,
    ] = await Promise.all([
      db.approvalProcess.count({
        where: {
          workflow: {
            tenantId,
          },
        },
      }),
      db.approvalProcess.count({
        where: {
          workflow: {
            tenantId,
          },
          status: "in_progress",
        },
      }),
      db.approvalProcess.count({
        where: {
          workflow: {
            tenantId,
          },
          status: "completed",
        },
      }),
      db.approvalProcess.count({
        where: {
          workflow: {
            tenantId,
          },
          status: "rejected",
        },
      }),
      this.getOverdueApprovals(tenantId).then(requests => requests.length),
      this.getAverageProcessingTime(tenantId),
    ])

    return {
      totalProcesses,
      activeProcesses,
      completedProcesses,
      rejectedProcesses,
      overdueRequests,
      avgProcessingTime,
    }
  }

  private static async getAverageProcessingTime(tenantId: string): Promise<number> {
    const processes = await db.approvalProcess.findMany({
      where: {
        workflow: {
          tenantId,
        },
        status: "completed",
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    })

    if (processes.length === 0) return 0

    const totalTime = processes.reduce((sum, process) => {
      const processingTime = process.completedAt!.getTime() - process.createdAt.getTime()
      return sum + processingTime
    }, 0)

    return totalTime / processes.length / (1000 * 60 * 60) // Convert to hours
  }

  private static calculateDueDate(slaHours: number): Date {
    const dueDate = new Date()
    dueDate.setHours(dueDate.getHours() + slaHours)
    return dueDate
  }

  static async checkSLACompliance() {
    const overdueRequests = await db.approvalRequest.findMany({
      where: {
        status: "pending",
        dueAt: {
          lt: new Date(),
        },
      },
      include: {
        process: {
          include: {
            rfp: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    })

    // Send notifications for overdue requests
    for (const request of overdueRequests) {
      // TODO: Implement notification system
    }

    return overdueRequests
  }
}