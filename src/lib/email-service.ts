/**
 * Email notification service.
 * In production, integrate with SendGrid/SES/SMTP.
 * Currently logs email events and creates in-app notifications as fallback.
 */
import { db } from "@/lib/db"

type EmailPayload = { to: string; subject: string; html: string; text?: string }
const MAX_LOG_SIZE = 100
const emailLog: EmailPayload[] = []

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // TODO: Replace with actual email provider (SendGrid, AWS SES, etc.)
  console.error('[EmailService] Dev mode — would send:', payload.to, payload.subject)

  // Bounded log to prevent memory leaks
  emailLog.push(payload)
  if (emailLog.length > MAX_LOG_SIZE) emailLog.shift()

  // In-app notification fallback so users still see notifications
  try {
    const user = await db.user.findFirst({ where: { email: payload.to }, select: { id: true } })
    if (user) {
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'email_fallback',
          title: payload.subject,
          message: payload.text || 'An email notification was sent regarding this subject.',
        },
      })
    }
  } catch {
    // Notification creation is best-effort
  }

  return true
}

export async function sendRFPNotification(payload: { to: string; rfpTitle: string; type: 'published' | 'closing_soon' | 'awarded'; rfpId: string }) {
  const subjects = {
    published: `New RFP: ${payload.rfpTitle}`,
    closing_soon: `RFP Closing Soon: ${payload.rfpTitle}`,
    awarded: `RFP Awarded: ${payload.rfpTitle}`,
  }
  return sendEmail({
    to: payload.to,
    subject: subjects[payload.type],
    html: `<p>RFP <strong>${payload.rfpTitle}</strong> — ${payload.type}.</p><p><a href="${process.env.NEXTAUTH_URL || ''}/rfps/${payload.rfpId}">View RFP</a></p>`,
    text: `RFP ${payload.rfpTitle} — ${payload.type}. View at: ${process.env.NEXTAUTH_URL || ''}/rfps/${payload.rfpId}`,
  })
}

export function getEmailLog() { return emailLog }
