import { db } from "@/lib/db"

export interface RFPMetrics {
  total: number
  published: number
  inEvaluation: number
  awarded: number
  avgCycleTime: number
}

export interface VendorMetrics {
  total: number
  active: number
  avgResponseRate: number
  topPerformers: Array<{
    name: string
    winRate: number
    avgScore: number
  }>
}

export interface FinancialMetrics {
  totalBudget: number
  totalAwarded: number
  savings: number
  avgAwardValue: number
}

export interface TimelineMetrics {
  avgCreationToPublish: number
  avgPublishToAward: number
  avgEvaluationTime: number
}

export interface MonthlyData {
  month: string
  rfps: number
  awards: number
  budget: number
}

export interface CategoryData {
  category: string
  count: number
  value: number
}

export interface AnalyticsData {
  rfpMetrics: RFPMetrics
  vendorMetrics: VendorMetrics
  financialMetrics: FinancialMetrics
  timelineMetrics: TimelineMetrics
  monthlyData: MonthlyData[]
  categoryData: CategoryData[]
}

export class AnalyticsService {
  static async getAnalyticsData(tenantId: string): Promise<AnalyticsData> {
    const [
      rfpMetrics,
      vendorMetrics,
      financialMetrics,
      timelineMetrics,
      monthlyData,
      categoryData,
    ] = await Promise.all([
      this.getRFPMetrics(tenantId),
      this.getVendorMetrics(tenantId),
      this.getFinancialMetrics(tenantId),
      this.getTimelineMetrics(tenantId),
      this.getMonthlyData(tenantId),
      this.getCategoryData(tenantId),
    ])

    return {
      rfpMetrics,
      vendorMetrics,
      financialMetrics,
      timelineMetrics,
      monthlyData,
      categoryData,
    }
  }

  private static async getRFPMetrics(tenantId: string): Promise<RFPMetrics> {
    const rfps = await db.rFP.findMany({
      where: { tenantId },
      include: {
        timeline: true,
      },
    })

    const total = rfps.length
    const published = rfps.filter(r => r.status === "published").length
    const inEvaluation = rfps.filter(r => r.status === "evaluation").length
    const awarded = rfps.filter(r => r.status === "awarded").length

    // Calculate average cycle time
    const cycleTimes = rfps
      .filter(r => r.timeline && r.timeline.awardTarget)
      .map(r => {
        const created = new Date(r.createdAt).getTime()
        const awarded = new Date(r.timeline.awardTarget!).getTime()
        return Math.ceil((awarded - created) / (1000 * 60 * 60 * 24)) // days
      })

    const avgCycleTime = cycleTimes.length > 0
      ? Math.round(cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length)
      : 0

    return {
      total,
      published,
      inEvaluation,
      awarded,
      avgCycleTime,
    }
  }

  private static async getVendorMetrics(tenantId: string): Promise<VendorMetrics> {
    const vendors = await db.vendor.findMany({
      where: { tenantId },
    })

    const total = vendors.length
    const active = vendors.filter(v => v.isActive).length

    // Calculate response rate
    const invitations = await db.invitation.findMany({
      where: {
        rfp: {
          tenantId,
        },
      },
    })

    const respondedInvitations = invitations.filter(i => i.status === "accepted")
    const avgResponseRate = invitations.length > 0
      ? Math.round((respondedInvitations.length / invitations.length) * 100)
      : 0

    // Calculate top performers
    const submissions = await db.submission.findMany({
      where: {
        rfp: {
          tenantId,
        },
        status: "awarded",
      },
      include: {
        vendor: true,
        consensus: true,
      },
    })

    const vendorStats = new Map<string, {
      submissions: number
      awards: number
      totalScore: number
      scoreCount: number
    }>()

    submissions.forEach(submission => {
      const vendorId = submission.vendorId
      const vendorName = submission.vendor.name

      if (!vendorStats.has(vendorId)) {
        vendorStats.set(vendorId, {
          submissions: 0,
          awards: 0,
          totalScore: 0,
          scoreCount: 0,
        })
      }

      const stats = vendorStats.get(vendorId)!
      stats.submissions++

      if (submission.status === "awarded") {
        stats.awards++
      }

      // Calculate average score from consensus
      const avgScore = submission.consensus.length > 0
        ? submission.consensus.reduce((sum, c) => sum + c.scoreValue, 0) / submission.consensus.length
        : 0

      if (avgScore > 0) {
        stats.totalScore += avgScore
        stats.scoreCount++
      }
    })

    const topPerformers = Array.from(vendorStats.entries())
      .map(([vendorId, stats]) => ({
        name: vendors.find(v => v.id === vendorId)?.name || "Unknown",
        winRate: stats.submissions > 0 ? Math.round((stats.awards / stats.submissions) * 100) : 0,
        avgScore: stats.scoreCount > 0 ? stats.totalScore / stats.scoreCount : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 10)

    return {
      total,
      active,
      avgResponseRate,
      topPerformers,
    }
  }

  private static async getFinancialMetrics(tenantId: string): Promise<FinancialMetrics> {
    const rfps = await db.rFP.findMany({
      where: { tenantId },
      select: {
        budget: true,
        status: true,
      },
    })

    const totalBudget = rfps.reduce((sum, rfp) => sum + (rfp.budget || 0), 0)

    const awardedRfps = rfps.filter(rfp => rfp.status === "awarded")
    const totalAwarded = awardedRfps.reduce((sum, rfp) => sum + (rfp.budget || 0), 0)

    const savings = totalBudget - totalAwarded
    const avgAwardValue = awardedRfps.length > 0 ? totalAwarded / awardedRfps.length : 0

    return {
      totalBudget,
      totalAwarded,
      savings,
      avgAwardValue,
    }
  }

  private static async getTimelineMetrics(tenantId: string): Promise<TimelineMetrics> {
    const rfps = await db.rFP.findMany({
      where: { tenantId },
      include: {
        timeline: true,
      },
    })

    const creationToPublishTimes: number[] = []
    const publishToAwardTimes: number[] = []
    const evaluationTimes: number[] = []

    rfps.forEach(rfp => {
      const created = new Date(rfp.createdAt).getTime()

      if (rfp.publishAt) {
        const published = new Date(rfp.publishAt).getTime()
        creationToPublishTimes.push(Math.ceil((published - created) / (1000 * 60 * 60 * 24)))
      }

      if (rfp.timeline?.awardTarget) {
        const awarded = new Date(rfp.timeline.awardTarget).getTime()
        if (rfp.publishAt) {
          const published = new Date(rfp.publishAt).getTime()
          publishToAwardTimes.push(Math.ceil((awarded - published) / (1000 * 60 * 60 * 24)))
        }
      }

      if (rfp.timeline?.evaluationStart && rfp.timeline?.awardTarget) {
        const evalStart = new Date(rfp.timeline.evaluationStart).getTime()
        const awarded = new Date(rfp.timeline.awardTarget).getTime()
        evaluationTimes.push(Math.ceil((awarded - evalStart) / (1000 * 60 * 60 * 24)))
      }
    })

    return {
      avgCreationToPublish: this.calculateAverage(creationToPublishTimes),
      avgPublishToAward: this.calculateAverage(publishToAwardTimes),
      avgEvaluationTime: this.calculateAverage(evaluationTimes),
    }
  }

  private static async getMonthlyData(tenantId: string): Promise<MonthlyData[]> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const rfps = await db.rFP.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
        budget: true,
        status: true,
      },
    })

    const monthlyData: MonthlyData[] = []
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = monthNames[date.getMonth()]
      const year = date.getFullYear()

      const monthRfps = rfps.filter(rfp => {
        const rfpDate = new Date(rfp.createdAt)
        return rfpDate.getMonth() === date.getMonth() && rfpDate.getFullYear() === date.getFullYear()
      })

      const monthAwards = monthRfps.filter(rfp => rfp.status === "awarded")
      const monthBudget = monthRfps.reduce((sum, rfp) => sum + (rfp.budget || 0), 0)

      monthlyData.push({
        month,
        rfps: monthRfps.length,
        awards: monthAwards.length,
        budget: monthBudget,
      })
    }

    return monthlyData
  }

  private static async getCategoryData(tenantId: string): Promise<CategoryData[]> {
    const rfps = await db.rFP.findMany({
      where: { tenantId },
      select: {
        category: true,
        budget: true,
      },
    })

    const categoryStats = new Map<string, { count: number; value: number }>()

    rfps.forEach(rfp => {
      const category = rfp.category || "Uncategorized"
      const budget = rfp.budget || 0

      if (!categoryStats.has(category)) {
        categoryStats.set(category, { count: 0, value: 0 })
      }

      const stats = categoryStats.get(category)!
      stats.count++
      stats.value += budget
    })

    return Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        value: stats.value,
      }))
      .sort((a, b) => b.value - a.value)
  }

  private static calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return Math.round(numbers.reduce((sum, num) => sum + num, 0) / numbers.length)
  }

  static async getRealTimeMetrics(tenantId: string) {
    const now = new Date()
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalRfps,
      activeRfps,
      pendingEvaluations,
      overdueApprovals,
      recentSubmissions,
      avgResponseTime,
    ] = await Promise.all([
      db.rFP.count({ where: { tenantId } }),
      db.rFP.count({ 
        where: { 
          tenantId,
          status: { in: ["published", "evaluation"] }
        }
      }),
      db.submission.count({
        where: {
          rfp: { tenantId },
          status: { in: ["pending", "in_progress"] }
        }
      }),
      db.approvalRequest.count({
        where: {
          process: {
            rfp: { tenantId }
          },
          status: "pending",
          dueAt: { lt: now }
        }
      }),
      db.submission.count({
        where: {
          rfp: { tenantId },
          createdAt: { gte: last7Days }
        }
      }),
      this.getAverageResponseTime(tenantId),
    ])

    return {
      totalRfps,
      activeRfps,
      pendingEvaluations,
      overdueApprovals,
      recentSubmissions,
      avgResponseTime,
    }
  }

  private static async getAverageResponseTime(tenantId: string): Promise<number> {
    const invitations = await db.invitation.findMany({
      where: {
        rfp: { tenantId },
        status: "accepted",
        acceptedAt: { not: null },
      },
      select: {
        createdAt: true,
        acceptedAt: true,
      },
    })

    if (invitations.length === 0) return 0

    const responseTimes = invitations.map(inv => {
      const created = new Date(inv.createdAt).getTime()
      const accepted = new Date(inv.acceptedAt!).getTime()
      return Math.ceil((accepted - created) / (1000 * 60 * 60)) // hours
    })

    return Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
  }
}