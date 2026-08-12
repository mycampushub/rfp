import { db } from './prisma'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = 5001
const TICK_INTERVAL_MS = 60_000 // 60 seconds
const APPROVAL_SLA_HOURS_DEFAULT = 48 // fallback if slaHours is 0/null

// ---------------------------------------------------------------------------
// In-memory tracking
// ---------------------------------------------------------------------------
const sentReminders = new Set<string>() // "rfpId:days" to avoid duplicate reminders

// ---------------------------------------------------------------------------
// Uptime & run counters
// ---------------------------------------------------------------------------
const startTime = Date.now()
const lastRunTimes: Record<string, Date | null> = {
  closeExpiredRfps: null,
  deadlineReminders: null,
  overdueApprovals: null,
}
const runCounts: Record<string, number> = {
  closeExpiredRfps: 0,
  deadlineReminders: 0,
  overdueApprovals: 0,
}

// ---------------------------------------------------------------------------
// Helper – days between two dates (rounded down)
// ---------------------------------------------------------------------------
function daysBetween(now: Date, target: Date): number {
  const diffMs = target.getTime() - now.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

// ---------------------------------------------------------------------------
// Task A: Auto-close expired RFPs
// ---------------------------------------------------------------------------
async function closeExpiredRfps(): Promise<number> {
  const now = new Date()

  // Find published RFPs whose timeline submissionDeadline has passed
  const expiredRfps = await db.rFP.findMany({
    where: {
      status: 'published',
      timeline: {
        submissionDeadline: { lt: now },
      },
    },
    include: { timeline: true },
  })

  let closedCount = 0
  for (const rfp of expiredRfps) {
    try {
      await db.rFP.update({
        where: { id: rfp.id },
        data: { status: 'closed', closeAt: now },
      })
      console.log(
        `[Scheduler] Auto-closed RFP "${rfp.title}" (${rfp.id}) — deadline was ${rfp.timeline?.submissionDeadline?.toISOString()}`
      )
      closedCount++
    } catch (err) {
      console.error(`[Scheduler] Error closing RFP ${rfp.id}:`, err)
    }
  }

  return closedCount
}

// ---------------------------------------------------------------------------
// Task B: Deadline reminder checks (7, 3, 1 days)
// ---------------------------------------------------------------------------
async function deadlineReminders(): Promise<number> {
  const now = new Date()
  const reminderDays = [7, 3, 1] as const
  let reminderCount = 0

  // Query published RFPs with a future submission deadline
  const activeRfps = await db.rFP.findMany({
    where: {
      status: 'published',
      timeline: {
        submissionDeadline: { gt: now },
      },
    },
    include: { timeline: true },
  })

  for (const rfp of activeRfps) {
    const deadline = rfp.timeline?.submissionDeadline
    if (!deadline) continue

    const daysLeft = daysBetween(now, deadline)

    for (const d of reminderDays) {
      if (daysLeft === d) {
        const key = `${rfp.id}:${d}`
        if (sentReminders.has(key)) continue

        // In production this would send email / push notification
        console.log(
          `[Scheduler] Reminder: RFP "${rfp.title}" (${rfp.id}) deadline in ${d} day(s) — due ${deadline.toISOString()}`
        )
        sentReminders.add(key)
        reminderCount++
      }
    }
  }

  // Prune old reminder keys (optional, to avoid unbounded memory growth)
  // Keep keys for at most 30 days
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  // We can't iterate set keys by date directly; this is a safeguard limit
  if (sentReminders.size > 10_000) {
    console.warn('[Scheduler] Reminder set exceeds 10k entries — clearing (potential memory leak)')
    sentReminders.clear()
  }

  return reminderCount
}

// ---------------------------------------------------------------------------
// Task C: Overdue approval alerts
// ---------------------------------------------------------------------------
async function overdueApprovals(): Promise<number> {
  const now = new Date()
  let overdueCount = 0

  // Find approval requests that are still pending/waiting and past their SLA
  const pendingRequests = await db.approvalRequest.findMany({
    where: {
      status: { in: ['pending', 'waiting'] },
    },
    include: {
      process: {
        include: { rfp: true },
      },
      approver: true,
    },
  })

  for (const req of pendingRequests) {
    const slaHours = req.slaHours || APPROVAL_SLA_HOURS_DEFAULT
    const slaDeadline = new Date(
      req.createdAt.getTime() + slaHours * 60 * 60 * 1000
    )

    if (now > slaDeadline) {
      const hoursOverdue = Math.round(
        (now.getTime() - slaDeadline.getTime()) / (1000 * 60 * 60)
      )
      console.log(
        `[Scheduler] Overdue approval: request ${req.id} (${req.stageName}) ` +
          `for RFP "${req.process.rfp?.title || 'N/A'}" — ` +
          `${hoursOverdue}h overdue (SLA: ${slaHours}h, created: ${req.createdAt.toISOString()})`
      )
      overdueCount++
    }
  }

  return overdueCount
}

// ---------------------------------------------------------------------------
// Run all tasks (called on timer tick and manual trigger)
// ---------------------------------------------------------------------------
async function runAllTasks(): Promise<void> {
  console.log(`\n[Scheduler] Running scheduled tasks at ${new Date().toISOString()}`)

  // Task A: Auto-close expired RFPs
  try {
    const t0 = Date.now()
    const count = await closeExpiredRfps()
    lastRunTimes.closeExpiredRfps = new Date()
    runCounts.closeExpiredRfps++
    console.log(`[Scheduler] ✓ closeExpiredRfps completed in ${Date.now() - t0}ms — ${count} RFP(s) closed`)
  } catch (err) {
    console.error('[Scheduler] ✗ closeExpiredRfps failed:', err)
  }

  // Task B: Deadline reminders
  try {
    const t0 = Date.now()
    const count = await deadlineReminders()
    lastRunTimes.deadlineReminders = new Date()
    runCounts.deadlineReminders++
    console.log(`[Scheduler] ✓ deadlineReminders completed in ${Date.now() - t0}ms — ${count} reminder(s) sent`)
  } catch (err) {
    console.error('[Scheduler] ✗ deadlineReminders failed:', err)
  }

  // Task C: Overdue approvals
  try {
    const t0 = Date.now()
    const count = await overdueApprovals()
    lastRunTimes.overdueApprovals = new Date()
    runCounts.overdueApprovals++
    console.log(`[Scheduler] ✓ overdueApprovals completed in ${Date.now() - t0}ms — ${count} overdue`)
  } catch (err) {
    console.error('[Scheduler] ✗ overdueApprovals failed:', err)
  }
}

// ---------------------------------------------------------------------------
// HTTP Server
// ---------------------------------------------------------------------------
function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)

  // GET / — status overview
  if (req.method === 'GET' && url.pathname === '/') {
    const uptimeMs = Date.now() - startTime
    const uptimeSec = Math.floor(uptimeMs / 1000)
    const body = {
      status: 'running',
      uptime: `${uptimeSec}s`,
      uptimeMs,
      port: PORT,
      tickIntervalMs: TICK_INTERVAL_MS,
      tasks: Object.keys(lastRunTimes),
      tasksCount: Object.keys(lastRunTimes).length,
      runCounts,
      lastRunTimes: Object.fromEntries(
        Object.entries(lastRunTimes).map(([k, v]) => [k, v?.toISOString() ?? null])
      ),
      remindersTracked: sentReminders.size,
    }
    return Promise.resolve(
      new Response(JSON.stringify(body, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }

  // GET /health
  if (req.method === 'GET' && url.pathname === '/health') {
    return Promise.resolve(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }

  // POST /trigger — manual trigger
  if (req.method === 'POST' && url.pathname === '/trigger') {
    return (async () => {
      try {
        await runAllTasks()
        return new Response(JSON.stringify({ status: 'triggered' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (err) {
        return new Response(
          JSON.stringify({ status: 'error', message: String(err) }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    })()
  }

  // 404
  return Promise.resolve(
    new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(`[Scheduler] Connecting to database...`)
  await db.$connect()
  console.log(`[Scheduler] Database connected`)

  // Start HTTP server
  const server = Bun.serve({
    port: PORT,
    fetch(req: Request) {
      return handleRequest(req)
    },
  })
  console.log(`[Scheduler] HTTP server listening on port ${PORT}`)

  // Run an initial tick immediately
  await runAllTasks()

  // Schedule recurring tasks
  setInterval(() => {
    runAllTasks().catch((err) => {
      console.error('[Scheduler] Unhandled error in task run:', err)
    })
  }, TICK_INTERVAL_MS)

  console.log(
    `[Scheduler] Scheduled tasks running every ${TICK_INTERVAL_MS / 1000}s — press Ctrl+C to stop`
  )
}

main().catch((err) => {
  console.error('[Scheduler] Fatal startup error:', err)
  process.exit(1)
})
