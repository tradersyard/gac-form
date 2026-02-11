export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Optional: protect with a simple secret header for cron services
  const authHeader = getHeader(event, 'x-cron-secret')
  if (authHeader !== 'ty-gac-expire-2026') {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Find all pending/email_sent claims past their expiry
  const now = new Date().toISOString()
  const lookupUrl = `${config.supabaseUrl}/rest/v1/gift_challenge_claims?expires_at=lt.${now}&status=in.(pending,email_sent)&select=id,claim_code`

  try {
    const expired: any[] = await $fetch(lookupUrl, {
      headers: {
        apikey: config.supabaseServiceRoleKey,
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      },
    }) as any[]

    if (!expired || expired.length === 0) {
      return { success: true, expired: 0, message: 'No expired claims found.' }
    }

    // Batch update all expired claims
    const patchUrl = `${config.supabaseUrl}/rest/v1/gift_challenge_claims?expires_at=lt.${now}&status=in.(pending,email_sent)`
    await $fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseServiceRoleKey,
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'expired' }),
    })

    return {
      success: true,
      expired: expired.length,
      codes: expired.map((c) => c.claim_code),
      message: `Expired ${expired.length} unclaimed gift(s).`,
    }
  } catch (err: any) {
    console.error('Expiry job error:', err?.data || err?.message)
    throw createError({ statusCode: 500, message: 'Expiry job failed.' })
  }
})
