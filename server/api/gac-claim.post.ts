/**
 * GAC Claim Status Check
 *
 * Recipients can check their coupon code status.
 * The actual redemption happens on WooCommerce at checkout — this just lets them
 * verify the code is valid before they go through the signup flow.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { code } = body

  if (!code) {
    throw createError({ statusCode: 400, message: 'Coupon code is required.' })
  }

  const couponCode = code.trim().toUpperCase()

  // Look up in our tracking table
  const lookupUrl = `${config.supabaseUrl}/rest/v1/gift_challenge_claims?claim_code=eq.${couponCode}&select=claim_code,gift_tier,challenge_type,buyer_name,recipient_name,status,expires_at,created_at`

  try {
    const claims: any[] = await $fetch(lookupUrl, {
      headers: {
        apikey: config.supabaseServiceRoleKey,
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      },
    }) as any[]

    if (!claims || claims.length === 0) {
      throw createError({ statusCode: 404, message: 'Invalid coupon code.' })
    }

    const claim = claims[0]

    // Check expiry
    if (new Date(claim.expires_at) < new Date() && claim.status !== 'claimed') {
      return {
        valid: false,
        status: 'expired',
        message: 'This coupon code has expired.',
      }
    }

    return {
      valid: claim.status !== 'expired',
      status: claim.status,
      giftTier: claim.gift_tier,
      challengeType: claim.challenge_type,
      senderName: claim.buyer_name,
      expiresAt: claim.expires_at,
      message: claim.status === 'expired'
        ? 'This coupon has expired.'
        : `Valid coupon for a FREE ${claim.gift_tier} challenge from ${claim.buyer_name}. Apply code ${couponCode} at checkout.`,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Claim lookup error:', err?.data || err?.message)
    throw createError({ statusCode: 500, message: 'Failed to look up coupon. Please try again.' })
  }
})
