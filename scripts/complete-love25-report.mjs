#!/usr/bin/env node
/**
 * Complete LOVE25 report - all buyers and their nominations
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env')

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

async function main() {
  console.log('📊 COMPLETE LOVE25 BUYERS & NOMINATIONS REPORT\n')

  // Get WooCommerce orders
  const wooResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/get-woocommerce-data`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  )

  const wooData = await wooResponse.json()
  const love25Orders = wooData.transactions
    .filter(t => t.discountCode?.toLowerCase() === 'love25')
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Get nominations
  const nomResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/gift_challenge_claims?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  const nominations = await nomResponse.json()
  const realNominations = nominations.filter(n => n.woo_order_verified)

  // Create nomination map by email
  const nominationMap = {}
  realNominations.forEach(n => {
    nominationMap[n.buyer_email.toLowerCase()] = n
  })

  console.log('='.repeat(150))
  console.log(`✅ ALL LOVE25 BUYERS (${love25Orders.length} total)\n`)
  console.log(
    'Date'.padEnd(12),
    'Buyer Name'.padEnd(30),
    'Email'.padEnd(40),
    'Product'.padEnd(35),
    'Nominated?'.padEnd(12),
    'Nominee'
  )
  console.log('-'.repeat(150))

  love25Orders.forEach(order => {
    const date = new Date(order.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
    const email = order.customerEmail.toLowerCase()
    const nomination = nominationMap[email]
    const hasNominated = nomination ? '✓ Yes' : '✗ No'
    const nominee = nomination ? nomination.recipient_name : ''

    console.log(
      date.padEnd(12),
      order.customerName.padEnd(30),
      order.customerEmail.padEnd(40),
      order.product.substring(0, 33).padEnd(35),
      hasNominated.padEnd(12),
      nominee
    )
  })

  console.log('\n' + '='.repeat(150))
  console.log('\n📈 SUMMARY:')
  console.log(`   Total LOVE25 purchases: ${love25Orders.length}`)
  console.log(`   Customers who nominated: ${realNominations.length}`)
  console.log(`   Customers who did NOT nominate: ${love25Orders.length - realNominations.length}`)
  console.log(`   Total revenue (gross): ${wooData.metrics.grossRevenue}`)

  // Show who hasn't nominated
  const notNominated = love25Orders.filter(o => !nominationMap[o.customerEmail.toLowerCase()])
  if (notNominated.length > 0) {
    console.log('\n⚠️  BUYERS WHO HAVE NOT NOMINATED YET:')
    notNominated.forEach(o => {
      console.log(`   - ${o.customerName} (${o.customerEmail})`)
    })
  }

  console.log('\n')
}

main()
