import crypto from 'crypto'
import { db } from '@/lib/db'

// Events that can trigger webhooks
export type WebhookEvent =
  | 'rfp.created' | 'rfp.published' | 'rfp.closed' | 'rfp.awarded' | 'rfp.archived'
  | 'submission.created' | 'submission.awarded'
  | 'vendor.registered' | 'vendor.approved'
  | 'evaluation.completed'
  | 'contract.created' | 'contract.status_changed'

interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
  tenantId: string
}

/**
 * Generate HMAC-SHA256 hex digest for webhook payload signing.
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Dispatch webhooks for a given event to all matching active endpoints.
 * Fire-and-forget: errors are caught and logged, never thrown to the caller.
 */
export function dispatchWebhooks(
  event: WebhookEvent,
  data: Record<string, unknown>,
  tenantId: string,
): void {
  // Fire-and-forget: do not await
  ;(async () => {
    try {
      // 1. Query all active webhook endpoints for this tenant
      const endpoints = await db.webhookEndpoint.findMany({
        where: {
          tenantId,
          status: 'active',
        },
      })

      // 2. Filter endpoints whose events array includes the triggered event
      const matched = endpoints.filter((ep) => {
        if (!ep.events) return false
        try {
          const events = typeof ep.events === 'string'
            ? JSON.parse(ep.events as string)
            : ep.events
          return Array.isArray(events) && events.includes(event)
        } catch {
          return false
        }
      })

      if (matched.length === 0) return

      // 3. Build the payload once
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        tenantId,
      }
      const body = JSON.stringify(payload)

      // 4. Dispatch to each matched endpoint concurrently
      await Promise.allSettled(
        matched.map(async (endpoint) => {
          const deliveryId = crypto.randomUUID()
          const secret = endpoint.secret ?? ''
          const signature = generateSignature(body, secret)

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)

          try {
            const response = await fetch(endpoint.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': `sha256=${signature}`,
                'X-Webhook-Event': event,
                'X-Webhook-Delivery': deliveryId,
              },
              body,
              signal: controller.signal,
            })

            // eslint-disable-next-line no-console
            console.log(
              `[Webhook] Delivered ${event} to ${endpoint.url} — delivery=${deliveryId} status=${response.status}`,
            )
          } catch (err) {
            const reason = err instanceof Error ? err.message : 'Unknown error'
            console.error(
              `[Webhook] FAILED to deliver ${event} to ${endpoint.url} — delivery=${deliveryId} error=${reason}`,
            )
          } finally {
            clearTimeout(timeout)
          }
        }),
      )
    } catch (err) {
      // Top-level catch — never propagate errors from webhook dispatch
      console.error('[Webhook] Error during webhook dispatch:', err)
    }
  })()
}
