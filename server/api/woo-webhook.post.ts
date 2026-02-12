/**
 * WooCommerce Order Webhook Handler
 *
 * Receives order.completed webhooks from WooCommerce.
 * When an order uses the LOVE25 coupon code, we:
 *   1. Check if buyer already has a gift nomination (one gift per buyer)
 *   2. Determine the gift tier from the first matching challenge product
 *   3. Store a pending nomination in Supabase
 *   4. Send the buyer a nomination email (telling them to fill the GAC form)
 *
 * WooCommerce webhook setup:
 *   - Topic: Order completed
 *   - Delivery URL: https://<your-domain>/api/woo-webhook
 *   - Secret: Set WOO_WEBHOOK_SECRET in .env
 *   - Status: Active
 */
import { createHmac } from 'crypto'
import { challengeTypes } from '../../app/data/gift-a-challenge'
import { getNominationTemplate } from '../utils/email-templates'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // ── Read raw body for signature verification ──
  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Empty request body.' })
  }

  // ── Verify WooCommerce webhook signature ──
  const signature = getHeader(event, 'x-wc-webhook-signature')
  const webhookSecret = config.wooWebhookSecret || 'ty-gac-woo-webhook-2026'

  if (signature) {
    const expectedSig = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('base64')

    if (signature !== expectedSig) {
      console.warn('WooCommerce webhook signature mismatch')
      throw createError({ statusCode: 401, message: 'Invalid webhook signature.' })
    }
  }

  // ── Parse the order payload ──
  const bodyStr = typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString('utf-8') : String(rawBody)
  const order = JSON.parse(bodyStr)

  // WooCommerce sends a ping on webhook creation — respond OK
  if (!order?.id || getHeader(event, 'x-wc-webhook-topic') === 'action.woocommerce_webhook_ping') {
    return { success: true, message: 'Webhook received (ping).' }
  }

  const orderId = String(order.id)
  const orderStatus = order.status

  // Only process completed orders
  if (orderStatus !== 'completed' && orderStatus !== 'processing') {
    return { success: true, message: `Skipped — order status is ${orderStatus}.` }
  }

  // ── Check if LOVE25 coupon was used ──
  const couponLines = order.coupon_lines || []
  const usedLove25 = couponLines.some(
    (c: any) => (c.code || '').toUpperCase() === 'LOVE25'
  )

  if (!usedLove25) {
    return { success: true, message: 'Skipped — no LOVE25 coupon on this order.' }
  }

  // ── Extract buyer info ──
  const billing = order.billing || {}
  const buyerEmail = (billing.email || '').toLowerCase().trim()
  const buyerName = [billing.first_name, billing.last_name].filter(Boolean).join(' ').trim() || 'Trader'

  if (!buyerEmail) {
    console.error(`Webhook: Order #${orderId} has no billing email`)
    return { success: false, message: 'No billing email on order.' }
  }

  // ── One-gift-per-buyer check ──
  const existingClaim = await checkExistingNomination(config, buyerEmail)
  if (existingClaim) {
    console.log(`Webhook: Buyer ${buyerEmail} already has a gift nomination (${existingClaim.claim_code}). Skipping.`)
    return {
      success: true,
      message: `Buyer already has a gift nomination. Only one gift per buyer.`,
      existingCode: existingClaim.claim_code,
    }
  }

  // ── Determine the gift tier from the first matching line item ──
  const lineItems = order.line_items || []
  const giftMatch = resolveGiftTier(lineItems)

  if (!giftMatch) {
    console.warn(`Webhook: Order #${orderId} — no matching challenge product found in line items`)
    // Still send the nomination email with a generic message
  }

  // ── Generate a unique nomination token ──
  const token = generateToken()

  // ── Store pending nomination in Supabase ──
  const nominationData = {
    token,
    buyer_email: buyerEmail,
    buyer_name: buyerName,
    woo_order_id: orderId,
    challenge_type: giftMatch?.challengeType || null,
    account_size: giftMatch?.accountSize || null,
    gift_tier: giftMatch?.giftTier || null,
    challenge_name: giftMatch?.challengeName || null,
    status: 'nomination_sent',
    created_at: new Date().toISOString(),
  }

  const { error: insertError } = await supabaseFetch(config, '/rest/v1/gac_nominations', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: nominationData,
  })

  if (insertError) {
    console.error('Webhook: Failed to store nomination:', insertError)
    // Don't block email send — log and continue
  }

  // ── Build nomination form URL ──
  const nominationFormUrl = `https://gac.tradersyard.com/?token=${token}&order=${orderId}`

  // ── Send nomination email ──
  const emailSent = await sendNominationEmail(config, {
    buyerName,
    buyerEmail,
    orderId,
    giftTier: giftMatch?.giftTier || 'Challenge',
    challengeName: giftMatch?.challengeName || 'Trading Challenge',
    nominationFormUrl,
  })

  console.log(`Webhook: Order #${orderId} — LOVE25 detected, nomination email ${emailSent ? 'sent' : 'FAILED'} to ${buyerEmail}`)

  return {
    success: true,
    message: emailSent ? 'Nomination email sent.' : 'Nomination stored but email failed.',
    orderId,
    buyerEmail,
    giftTier: giftMatch?.giftTier || null,
    token,
  }
})

// ── Check if buyer already has a nomination ──
async function checkExistingNomination(config: any, email: string): Promise<any | null> {
  // Check both tables — gac_nominations (webhook-created) and gift_challenge_claims (form-submitted)
  const tables = ['gac_nominations', 'gift_challenge_claims']

  for (const table of tables) {
    const field = table === 'gac_nominations' ? 'buyer_email' : 'buyer_email'
    const url = `${config.supabaseUrl}/rest/v1/${table}?${field}=eq.${encodeURIComponent(email)}&select=id,claim_code,token,status&limit=1`

    try {
      const results: any[] = await $fetch(url, {
        headers: {
          apikey: config.supabaseServiceRoleKey,
          Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        },
      }) as any[]

      if (results && results.length > 0) {
        return results[0]
      }
    } catch (err: any) {
      // Table might not exist yet — that's OK
      console.warn(`Dedup check on ${table} failed:`, err?.message)
    }
  }

  return null
}

// ── Resolve which gift tier the buyer gets based on their line items ──
function resolveGiftTier(lineItems: any[]): {
  giftTier: string
  challengeName: string
  challengeType: string
  accountSize: number
} | null {
  // Try to match each line item against our challenge types config
  for (const item of lineItems) {
    const productName = (item.name || '').toLowerCase()
    const productId = item.product_id

    for (const challenge of challengeTypes) {
      for (const account of challenge.accounts) {
        // Match by product name containing the challenge short name and size
        const sizeLabel = account.label.toLowerCase() // e.g. "$5k"
        const shortName = challenge.shortName.toLowerCase() // e.g. "2 phase swing"

        const matchesName =
          productName.includes(shortName) ||
          productName.includes(challenge.key.replace(/-/g, ' '))
        const matchesSize =
          productName.includes(sizeLabel) ||
          productName.includes(sizeLabel.replace('$', '')) ||
          productName.includes(String(account.value))

        if (matchesName && matchesSize) {
          return {
            giftTier: account.giftTier,
            challengeName: challenge.name,
            challengeType: challenge.key,
            accountSize: account.value,
          }
        }
      }
    }
  }

  // Fallback: if we can't match, just use the first line item and a generic tier
  if (lineItems.length > 0) {
    return {
      giftTier: '$5K',
      challengeName: 'Trading Challenge',
      challengeType: 'unknown',
      accountSize: 5000,
    }
  }

  return null
}

// ── Generate unique nomination token ──
function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

// ── Send nomination email via Resend using the HTML template ──
async function sendNominationEmail(
  config: any,
  data: {
    buyerName: string
    buyerEmail: string
    orderId: string
    giftTier: string
    challengeName: string
    nominationFormUrl: string
  },
): Promise<boolean> {
  // Load the nomination email template and fill variables
  let html: string = getNominationTemplate()

  // Replace template variables (nomination uses ${xxx} without d. prefix)
  html = html
    .replace(/\$\{buyerName\}/g, escapeHtml(data.buyerName))
    .replace(/\$\{giftTier\}/g, data.giftTier)
    .replace(/\$\{challengeName\}/g, data.challengeName)
    .replace(/\$\{orderId\}/g, data.orderId)
    .replace(/\$\{nominationFormUrl\}/g, data.nominationFormUrl)

  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TradersYard <noreply@tradersyard.de>',
        to: [data.buyerEmail],
        subject: `You've unlocked a free challenge to gift! 🎁 Order #${data.orderId}`,
        html,
      }),
    })
    return true
  } catch (err: any) {
    console.error('Webhook: Resend error:', err?.data || err?.message || err)
    return false
  }
}

// ── Supabase fetch wrapper ──
async function supabaseFetch(config: any, path: string, options: any = {}) {
  const url = `${config.supabaseUrl}${path}`
  try {
    const response = await $fetch(url, {
      ...options,
      headers: {
        apikey: config.supabaseServiceRoleKey,
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
    return { data: response, error: null }
  } catch (err: any) {
    return { data: null, error: err }
  }
}

// ── HTML escape ──
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
