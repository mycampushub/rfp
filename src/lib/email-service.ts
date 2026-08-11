/**
 * Email notification service.
 * In production, integrate with SendGrid/SES/SMTP.
 * Currently logs email events for development.
 */
type EmailPayload = { to: string; subject: string; html: string; text?: string }
const emailLog: EmailPayload[] = []

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // TODO: Replace with actual email provider (SendGrid, AWS SES, etc.)
  console.log('[EmailService] Would send:', payload.to, payload.subject)
  emailLog.push(payload)
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
