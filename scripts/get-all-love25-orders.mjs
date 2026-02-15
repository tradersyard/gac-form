#!/usr/bin/env node
/**
 * Get ALL WooCommerce orders that used LOVE25 coupon code
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

const SUPABASE_URL = env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

async function getAllLOVE25Orders() {
  console.log('📥 Fetching all LOVE25 orders from WooCommerce...\n')

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/create-woo-coupon`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'verify_order',
        email: 'all', // Special flag to get all orders
      }),
    }
  )

  const result = await response.json()

  if (!result.orders) {
    console.error('❌ No orders returned from WooCommerce')
    return []
  }

  // Filter for LOVE25 orders only
  const love25Orders = result.orders.filter(order =>
    order.coupon_codes?.some(code => code.toUpperCase() === 'LOVE25')
  )

  return love25Orders
}

async function getNominations() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/gift_challenge_claims?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  return await response.json()
}

async function main() {
  try {
    const [orders, nominations] = await Promise.all([
      getAllLOVE25Orders(),
      getNominations()
    ])

    console.log('='.repeat(140))
    console.log(`📊 COMPLETE LOVE25 REPORT`)
    console.log('='.repeat(140))

    console.log(`\n✅ ALL LOVE25 PURCHASES (${orders.length} orders)\n`)
    console.log('Order #'.padEnd(10), 'Date'.padEnd(12), 'Customer Name'.padEnd(35), 'Email'.padEnd(40), 'Total'.padEnd(12), 'Nominated?')
    console.log('-'.repeat(140))

    // Create a map of buyer emails who nominated
    const nominatedEmails = new Set(nominations.map(n => n.buyer_email.toLowerCase()))

    orders.forEach(order => {
      const date = new Date(order.date_created).toLocaleDateString('en-US')
      const customerName = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim()
      const email = order.billing?.email || 'N/A'
      const total = order.currency_symbol + order.total
      const hasNominated = nominatedEmails.has(email.toLowerCase()) ? '✓ Yes' : '✗ No'

      console.log(
        `#${order.id}`.padEnd(10),
        date.padEnd(12),
        customerName.padEnd(35),
        email.padEnd(40),
        total.padEnd(12),
        hasNominated
      )
    })

    console.log('\n' + '='.repeat(140))
    console.log(`\nSummary:`)
    console.log(`  Total LOVE25 purchases: ${orders.length}`)
    console.log(`  Customers who nominated someone: ${nominations.filter(n => n.woo_order_verified).length}`)
    console.log(`  Customers who did NOT nominate yet: ${orders.length - nominations.filter(n => n.woo_order_verified).length}`)
    console.log('\n')

  } catch (err) {
    console.error('❌ Error:', err.message)
    console.error(err)
  }
}

main()
