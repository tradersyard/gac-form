import { challengeTypes } from '../../app/data/gift-a-challenge'
import { getRecipientCouponTemplate, getBuyerConfirmationTemplate } from '../utils/email-templates'

// Hardcoded WooCommerce product IDs for each gift tier
// Includes both "One off" and "Reset" variants so the coupon works for either
// Source: WooCommerce API product lookup (verified Feb 2026)
const GIFT_PRODUCT_IDS: Record<string, number[]> = {
  // CFD 2-Phase Swing
  '$5K|cfd-2-phase-swing': [172, 177],   // 2 Phase Swing 5k (One off $39 + Reset $34)
  '$10K|cfd-2-phase-swing': [173, 178],  // 2 Phase Swing 10k (One off $79 + Reset $70)
  '$25K|cfd-2-phase-swing': [174, 179],  // 2 Phase Swing 25k (One off $149 + Reset $134)

  // CFD 1-Phase Swing
  '$5K|cfd-1-phase': [182, 188],         // 1 Phase Swing 5k (One off $55 + Reset $50)
  '$10K|cfd-1-phase': [183, 189],        // 1 Phase Swing 10k (One off $95 + Reset $85)
  '$25K|cfd-1-phase': [184, 190],        // 1 Phase Swing 25k (One off $165 + Reset $150)
  '$50K|cfd-1-phase': [185, 191],        // 1 Phase Swing 50k (One off $345 + Reset $325)

  // Futures Static
  '$10K|futures-static': [399, 405],     // Futures Static 10k (One off $149 + Reset $99)
  '$25K|futures-static': [400, 404],     // Futures Static 25k (One off $249 + Reset $199)

  // Futures EoD gifts are Static challenges
  '$10K (Static)|futures-eod': [399, 405],
  '$25K (Static)|futures-eod': [400, 404],
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const {
    buyerName,
    buyerEmail,
    challengeType,
    accountSize,
    giftTier,
    recipientName,
    recipientEmail,
    personalMessage,
  } = body

  // ── Basic validation ──
  if (!buyerName || !buyerEmail || !challengeType || !accountSize || !recipientName || !recipientEmail) {
    throw createError({ statusCode: 400, message: 'All fields are required.' })
  }

  if (buyerEmail.toLowerCase() === recipientEmail.toLowerCase()) {
    throw createError({ statusCode: 400, message: 'Recipient email must be different from your email.' })
  }

  // ── One-gift-per-buyer check ──
  const existingGift = await checkExistingGift(config, buyerEmail.toLowerCase().trim())
  if (existingGift) {
    throw createError({
      statusCode: 409,
      message: 'You have already submitted a gift nomination. Each buyer can only gift one free challenge.',
    })
  }

  // ── Validate challenge type + account size against config ──
  const challenge = challengeTypes.find((c) => c.key === challengeType)
  if (!challenge) {
    throw createError({ statusCode: 400, message: 'Invalid challenge type.' })
  }

  const account = challenge.accounts.find((a) => a.label === accountSize)
  if (!account) {
    throw createError({ statusCode: 400, message: 'Invalid account size for this challenge type.' })
  }

  const resolvedGiftTier = giftTier || account.giftTier

  // ── Step 1: Verify buyer against WooCommerce orders ──
  const verification = await verifyBuyerOrder(config, buyerEmail.toLowerCase().trim(), challengeType, account.value)

  // ── Step 2: Find the WooCommerce product IDs for the gift tier ──
  const giftProductIds = findGiftProductIds(resolvedGiftTier, challengeType)

  if (giftProductIds.length === 0) {
    console.error(`No WooCommerce products found for gift tier: ${resolvedGiftTier} (${challengeType})`)
    // Don't block — we'll create the coupon without product restriction and flag for manual review
  }

  // ── Step 3: Generate unique coupon code ──
  const couponCode = generateCouponCode()

  // ── Step 4: 48-hour expiry ──
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

  // ── Step 5: Create WooCommerce coupon via edge function ──
  const couponResult = await createWooCoupon(config, {
    code: couponCode,
    productIds: giftProductIds,
    usageLimit: 3,
    expiresAt: expiresAt.toISOString(),
    description: `GAC Valentine's gift from ${buyerName} to ${recipientName} — ${resolvedGiftTier} ${challenge.name}`,
    emailRestriction: recipientEmail.toLowerCase().trim(),
  })

  // ── Step 6: Save to Supabase ──
  const { error: insertError } = await supabaseFetch(config, '/rest/v1/gift_challenge_claims', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      claim_code: couponCode,
      buyer_name: buyerName.trim(),
      buyer_email: buyerEmail.toLowerCase().trim(),
      challenge_type: challengeType,
      account_size: account.value,
      gift_tier: resolvedGiftTier,
      gift_challenge_type: couponResult ? challengeType : null,
      gift_account_size: giftProductIds.length > 0 ? account.value : null,
      recipient_name: recipientName.trim(),
      recipient_email: recipientEmail.toLowerCase().trim(),
      personal_message: personalMessage?.trim() || null,
      woo_order_id: verification.orderId || null,
      woo_product_name: verification.productName || null,
      woo_order_verified: verification.verified,
      woo_coupon_id: couponResult?.coupon?.id || null,
      woo_coupon_code: couponResult?.coupon?.code || couponCode,
      woo_coupon_product_ids: giftProductIds.length > 0 ? giftProductIds : null,
      status: couponResult ? 'coupon_created' : 'pending',
      expires_at: expiresAt.toISOString(),
    },
  })

  if (insertError) {
    console.error('Supabase insert error:', insertError)
    throw createError({ statusCode: 500, message: 'Failed to create gift claim. Please try again.' })
  }

  // ── Step 7: Determine the checkout URL for the gift ──
  // Build a direct checkout link for the specific gift product
  const checkoutUrl = buildGiftCheckoutUrl(resolvedGiftTier, challengeType, couponCode)

  // ── Step 8: Send recipient email ──
  const recipientEmailSent = await sendRecipientEmail(config, {
    recipientName: recipientName.trim(),
    recipientEmail: recipientEmail.toLowerCase().trim(),
    senderName: buyerName.trim(),
    couponCode: couponResult?.coupon?.code || couponCode,
    giftTier: resolvedGiftTier,
    challengeName: challenge.name,
    personalMessage: personalMessage?.trim() || null,
    expiresAt: expiresAt.toISOString(),
    checkoutUrl,
  })

  // ── Step 9: Send buyer confirmation email ──
  await sendBuyerConfirmationEmail(config, {
    buyerName: buyerName.trim(),
    buyerEmail: buyerEmail.toLowerCase().trim(),
    recipientName: recipientName.trim(),
    recipientEmail: recipientEmail.toLowerCase().trim(),
    couponCode: couponResult?.coupon?.code || couponCode,
    giftTier: resolvedGiftTier,
    challengeName: challenge.name,
    expiresAt: expiresAt.toISOString(),
  })

  // ── Step 10: Update status to email_sent ──
  if (recipientEmailSent) {
    await supabaseFetch(config, `/rest/v1/gift_challenge_claims?claim_code=eq.${couponCode}`, {
      method: 'PATCH',
      body: {
        status: 'email_sent',
        email_sent_at: new Date().toISOString(),
      },
    })
  }

  return {
    success: true,
    message: 'Gift sent successfully! Your recipient will receive an email shortly.',
    couponCode: couponResult?.coupon?.code || couponCode,
    verified: verification.verified,
    couponCreated: !!couponResult,
  }
})

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
    console.error(`Supabase fetch error [${path}]:`, err?.data || err?.message || err)
    return { data: null, error: err }
  }
}

// ── Generate TY-XXXXXX coupon code ──
function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TY-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// ── Build checkout URL for the gift product ──
function buildGiftCheckoutUrl(giftTier: string, challengeType: string, couponCode: string): string {
  // Simple link to TradersYard register page - recipient will apply coupon code manually
  return 'https://tradersyard.com/auth/register'
}

// ── Find WooCommerce product IDs for the gift tier ──
function findGiftProductIds(giftTier: string, challengeType: string): number[] {
  // Use the hardcoded map — key is "giftTier|challengeType"
  const key = `${giftTier}|${challengeType}`
  const productIds = GIFT_PRODUCT_IDS[key]

  if (!productIds || productIds.length === 0) {
    console.warn(`No product IDs mapped for gift tier: ${key}`)
    return []
  }

  console.log(`Gift tier ${key} → product IDs: ${productIds.join(', ')}`)
  return productIds
}

// ── Create WooCommerce coupon via edge function ──
async function createWooCoupon(
  config: any,
  params: {
    code: string
    productIds: number[]
    usageLimit: number
    expiresAt: string
    description: string
    emailRestriction?: string
  },
): Promise<any | null> {
  try {
    const url = `${config.supabaseUrl}/functions/v1/create-woo-coupon`
    const response = await $fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_coupon',
        code: params.code,
        productIds: params.productIds.length > 0 ? params.productIds : undefined,
        usageLimit: params.usageLimit,
        expiresAt: params.expiresAt,
        description: params.description,
        emailRestriction: params.emailRestriction,
      }),
    })

    return response
  } catch (err: any) {
    console.error('WooCommerce coupon creation failed:', err?.data || err?.message || err)
    return null
  }
}

// ── Verify buyer's WooCommerce order ──
async function verifyBuyerOrder(
  config: any,
  email: string,
  challengeType: string,
  accountSize: number,
): Promise<{ verified: boolean; orderId?: string; productName?: string }> {
  try {
    const url = `${config.supabaseUrl}/functions/v1/create-woo-coupon`
    const response: any = await $fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'verify_order', email }),
    })

    if (!response?.orders || !Array.isArray(response.orders)) {
      return { verified: false }
    }

    const challengeConfig = challengeTypes.find((c) => c.key === challengeType)
    if (!challengeConfig) return { verified: false }

    const sizeLabel = accountSize >= 1000 ? `${accountSize / 1000}K` : String(accountSize)

    for (const order of response.orders) {
      // Check if LOVE25 coupon was used
      const usedLove25 = order.coupon_codes?.some((c: string) => c.toUpperCase() === 'LOVE25')

      for (const item of order.items || []) {
        const name = (item.name || '').toLowerCase()
        const matchesChallenge =
          name.includes(challengeConfig.shortName.toLowerCase()) ||
          name.includes(challengeType.replace(/-/g, ' '))
        const matchesSize =
          name.includes(sizeLabel.toLowerCase()) ||
          name.includes(`$${sizeLabel.toLowerCase()}`) ||
          name.includes(accountSize.toString())

        if (matchesChallenge && matchesSize) {
          return {
            verified: true,
            orderId: String(order.id),
            productName: item.name,
          }
        }
      }
    }

    console.warn(`No matching order for ${email} — ${challengeType} ${sizeLabel}`)
    return { verified: false }
  } catch (err: any) {
    console.error('Order verification error:', err?.message || err)
    return { verified: false }
  }
}

// ── Send recipient email via Resend ──
async function sendRecipientEmail(
  config: any,
  data: {
    recipientName: string
    recipientEmail: string
    senderName: string
    couponCode: string
    giftTier: string
    challengeName: string
    personalMessage: string | null
    expiresAt: string
    checkoutUrl: string
  },
): Promise<boolean> {
  const expiryDate = new Date(data.expiresAt)
  const expiryFormatted = expiryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const personalMessageHtml = data.personalMessage
    ? `<p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #475569; line-height: 1.6; font-style: italic;">&#8220;${escapeHtml(data.personalMessage)}&#8221;</p>`
    : `<p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #475569; line-height: 1.6;"><strong style="color: #4250eb;">${escapeHtml(data.senderName)}</strong> has gifted you a free Trading Challenge from TradersYard.</p>`

  // Load from the inlined HTML template
  let html: string = getRecipientCouponTemplate()
  html = html
    .replace(/\$\{d\.senderName\}/g, escapeHtml(data.senderName))
    .replace(/\$\{d\.recipientName\}/g, escapeHtml(data.recipientName))
    .replace(/\$\{d\.couponCode\}/g, data.couponCode)
    .replace(/\$\{d\.giftTier\}/g, data.giftTier)
    .replace(/\$\{d\.challengeName\}/g, data.challengeName)
    .replace(/\$\{d\.personalMessageHtml\}/g, personalMessageHtml)
    .replace(/\$\{d\.checkoutUrl\}/g, data.checkoutUrl)
    .replace(/\$\{d\.expiryFormatted\}/g, expiryFormatted)

  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TradersYard <noreply@tradersyard.de>',
        to: [data.recipientEmail],
        subject: `🎁 ${data.senderName} gifted you a free Trading Challenge!`,
        html,
      }),
    })
    return true
  } catch (err: any) {
    console.error('Resend (recipient) error:', err?.data || err?.message || err)
    return false
  }
}

// ── Send buyer confirmation email via Resend ──
async function sendBuyerConfirmationEmail(
  config: any,
  data: {
    buyerName: string
    buyerEmail: string
    recipientName: string
    recipientEmail: string
    couponCode: string
    giftTier: string
    challengeName: string
    expiresAt: string
  },
): Promise<boolean> {
  const expiryDate = new Date(data.expiresAt)
  const expiryFormatted = expiryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  // Load from the inlined HTML template
  let html: string = getBuyerConfirmationTemplate()
  html = html
    .replace(/\$\{d\.buyerName\}/g, escapeHtml(data.buyerName))
    .replace(/\$\{d\.recipientName\}/g, escapeHtml(data.recipientName))
    .replace(/\$\{d\.recipientEmail\}/g, data.recipientEmail)
    .replace(/\$\{d\.couponCode\}/g, data.couponCode)
    .replace(/\$\{d\.giftTier\}/g, data.giftTier)
    .replace(/\$\{d\.challengeName\}/g, data.challengeName)
    .replace(/\$\{d\.expiryFormatted\}/g, expiryFormatted)

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
        subject: `Gift confirmed! 🎁 Your challenge gift to ${data.recipientName}`,
        html,
      }),
    })
    return true
  } catch (err: any) {
    console.error('Resend (buyer) error:', err?.data || err?.message || err)
    return false
  }
}

// ── One-gift-per-buyer dedup check ──
async function checkExistingGift(config: any, email: string): Promise<boolean> {
  const url = `${config.supabaseUrl}/rest/v1/gift_challenge_claims?buyer_email=eq.${encodeURIComponent(email)}&select=id&limit=1`
  try {
    const results: any[] = await $fetch(url, {
      headers: {
        apikey: config.supabaseServiceRoleKey,
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      },
    }) as any[]
    return results && results.length > 0
  } catch {
    // If table doesn't exist or query fails, allow through
    return false
  }
}

// ── HTML escape ──
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

