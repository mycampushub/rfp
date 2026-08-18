import { db } from "@/lib/db"

export interface ApprovalStage {
  id: string
  name: string
  description: string
  required: boolean
  order: number
  approverRole: string
  slaHours: number
  autoApprove?: boolean
  conditions?: any[]
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
        stages: data.stages,
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
    const { tenantId: _tid, ...updateData } = data as Partial<ApprovalWorkflow> & { tenantId?: string }
    return await db.approvalWorkflow.updateMany({
      where: { id, tenantId },
      data: updateData as Parameters<typeof db.approvalWorkflow.updateMany>[0]['data'],
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
    metadata?: any
  }) {
    // Look up the requesting user to get their tenantId
    const requestingUser = await db.user.findUnique({
      where: { id: data.requestedBy },
      select: { tenantId: true },
    })
    if (!requestingUser) {
      throw new Error("Requesting user not found")
    }

    const workflow = await db.approvalWorkflow.findUnique({
      where: { id: data.workflowId },
    })

    if (!workflow) {
      throw new Error("Workflow not found")
    }

    // Cross-tenant check: workflow must belong to the requesting user's tenant
    if (workflow.tenantId !== requestingUser.tenantId) {
      throw new Error("Workflow does not belong to your organization")
    }

    const rfp = await db.rFP.findUnique({
      where: { id: data.rfpId },
    })

    if (!rfp) {
      throw new Error("RFP not found")
    }

    // Cross-tenant check: RFP must belong to the requesting user's tenant
    if (rfp.tenantId !== requestingUser.tenantId) {
      throw new Error("RFP does not belong to your organization")
    }

    // Create approval process
    const approvalProcess = await db.approvalProcess.create({
      data: {
        rfpId: data.rfpId,
        workflowId: data.workflowId,
        requestedBy: data.requestedBy,
        status: "in_progress",
        currentStage: 0,
        metadata: data.metadata || {},
      },
    })

    // Create approval requests for each stage
    const approvalRequests = await Promise.all(
      ((workflow.stages || []) as Array<Record<string, unknown>>).map((stage, index) =>
        db.approvalRequest.create({
          data: {
            processId: approvalProcess.id,
            stageId: String(stage.id),
            stageName: String(stage.name),
            approverRole: String(stage.approverRole),
            slaHours: Number(stage.slaHours) || 24,
            status: index === 0 ? "pending" : "waiting",
            dueAt: this.calculateDueDate(Number(stage.slaHours) || 24),
          },
        })
      )
    )

    return {
      process: approvalProcess,
      requests: approvalRequests,
    }
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

    // Update request
    const updatedRequest = await db.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: "approved",
        approverId,
        decidedAt: new Date(),
        comments,
      },
    })

    // Get the process and move to next stage
    const process = await db.approvalProcess.findUnique({
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
        await db.approvalRequest.update({
          where: { id: nextRequest.id },
          data: {
            status: "pending",
          },
        })

        await db.approvalProcess.update({
          where: { id: process.id },
          data: {
            currentStage: currentIndex + 1,
          },
        })
      } else {
        // All stages completed
        await db.approvalProcess.update({
          where: { id: process.id },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        })

        // Update RFP status based on workflow completion
        await db.rFP.update({
          where: { id: process.rfpId },
          data: {
            status: "approved",
          },
        })
      }
    }

    return updatedRequest
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

    // Update request
    const updatedRequest = await db.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        approverId,
        decidedAt: new Date(),
        comments,
      },
    })

    // Mark process as rejected
    await db.approvalProcess.update({
      where: { id: request.processId },
      data: {
        status: "rejected",
        completedAt: new Date(),
      },
    })

    // Fetch the process to get the actual RFP ID
    const process = await db.approvalProcess.findUnique({
      where: { id: request.processId },
      select: { rfpId: true },
    })

    // Update RFP status
    await db.rFP.update({
      where: { id: process?.rfpId },
      data: {
        status: "rejected",
      },
    })

    return updatedRequest
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
    const processes = (await db.approvalProcess.findMany({
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
    })) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any

    if (processes.length === 0) return 0

    const totalTime = processes.reduce((sum: number, process: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const processingTime = process.completedAt.getTime() - process.createdAt.getTime()
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
      console.log(`SLA breach detected for request ${request.id} in tenant ${request.process.rfp.tenantId}`)
    }

    return overdueRequests
  }
}