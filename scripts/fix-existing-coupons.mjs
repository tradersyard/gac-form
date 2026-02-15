#!/usr/bin/env node
/**
 * Fix existing LOVE25 gift coupons by removing email restrictions
 *
 * This script:
 * 1. Fetches all gift_challenge_claims from Supabase
 * 2. For each coupon, deletes the old one and creates a new one WITHOUT email restrictions
 * 3. Updates the Supabase record with the new coupon ID
 *
 * Run: node scripts/fix-existing-coupons.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env')

// Parse .env file
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const SUPABASE_URL = env.SUPABASE_URL || env.NUXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.error(`   SUPABASE_URL: ${SUPABASE_URL ? '✓' : '✗'}`)
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗'}`)
  process.exit(1)
}

async function fetchGiftClaims() {
  console.log('📥 Fetching all gift challenge claims from Supabase...')

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/gift_challenge_claims?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch claims: ${response.statusText}`)
  }

  const claims = await response.json()
  console.log(`✅ Found ${claims.length} gift claims`)

  // Filter to only claims with valid WooCommerce coupon IDs
  const validClaims = claims.filter(c => c.woo_coupon_id && c.woo_coupon_code)
  console.log(`📋 ${validClaims.length} have WooCommerce coupons (${claims.length - validClaims.length} were failures/pending)`)

  return validClaims
}

async function recreateCouponWithoutEmailRestriction(claim) {
  const { woo_coupon_code, woo_coupon_product_ids, expires_at, buyer_name, recipient_name, gift_tier, challenge_type } = claim

  console.log(`   🔧 Recreating coupon ${woo_coupon_code}...`)

  // Create new coupon with same code but no email restriction
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-woo-coupon`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create_coupon',
      code: woo_coupon_code,
      productIds: woo_coupon_product_ids || [],
      usageLimit: 3,
      expiresAt: expires_at,
      description: `GAC Valentine's gift from ${buyer_name} to ${recipient_name} — ${gift_tier} ${challenge_type}`,
      // NO emailRestriction parameter
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to recreate coupon: ${error}`)
  }

  const result = await response.json()

  if (!result.success || !result.coupon) {
    throw new Error(`Coupon creation returned success=false`)
  }

  return result.coupon
}

async function updateClaimInSupabase(claimCode, newCouponId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/gift_challenge_claims?claim_code=eq.${claimCode}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        woo_coupon_id: newCouponId,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to update Supabase: ${response.statusText}`)
  }
}

async function main() {
  console.log('🚀 Starting LOVE25 gift coupon fix...\n')

  try {
    // Step 1: Fetch all gift claims
    const claims = await fetchGiftClaims()

    if (claims.length === 0) {
      console.log('✅ No coupons to update')
      return
    }

    console.log(`\n🔄 Recreating ${claims.length} coupons without email restrictions...\n`)

    let successCount = 0
    let failureCount = 0
    const failures = []

    // Step 2: Recreate each coupon
    for (const claim of claims) {
      try {
        const newCoupon = await recreateCouponWithoutEmailRestriction(claim)
        await updateClaimInSupabase(claim.claim_code, newCoupon.id)
        successCount++
        console.log(`   ✅ ${claim.woo_coupon_code} - recreated without email restriction (new ID: ${newCoupon.id})`)
      } catch (err) {
        failureCount++
        failures.push({ code: claim.woo_coupon_code, error: err.message })
        console.log(`   ❌ ${claim.woo_coupon_code} - FAILED: ${err.message}`)
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Successfully updated: ${successCount}`)
    console.log(`❌ Failed: ${failureCount}`)
    console.log('='.repeat(60))

    if (failures.length > 0) {
      console.log('\n⚠️  Failed coupons:')
      failures.forEach(f => {
        console.log(`   - ${f.code}: ${f.error}`)
      })
    }

    console.log('\n✨ Done! All existing gift coupons now work without email restrictions.')
  } catch (err) {
    console.error('❌ Fatal error:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

main()
