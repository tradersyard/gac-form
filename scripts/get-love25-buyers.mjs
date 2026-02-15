#!/usr/bin/env node
/**
 * Get all LOVE25 buyers and their nominations
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

async function main() {
  console.log('📊 LOVE25 Buyers & Nominations Report\n')
  console.log('='.repeat(120))

  // Get all nominations
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/gift_challenge_claims?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  const nominations = await response.json()

  // Separate verified buyers from test entries
  const verified = nominations.filter(n => n.woo_order_verified)
  const unverified = nominations.filter(n => !n.woo_order_verified)

  console.log(`\n✅ VERIFIED LOVE25 BUYERS (${verified.length})\n`)
  console.log('Buyer Name'.padEnd(30), 'Buyer Email'.padEnd(35), 'Nominated'.padEnd(30), 'Recipient Email'.padEnd(35), 'Date')
  console.log('-'.repeat(120))

  verified.forEach(n => {
    const date = new Date(n.created_at).toLocaleDateString('en-US')
    console.log(
      n.buyer_name.padEnd(30),
      n.buyer_email.padEnd(35),
      n.recipient_name.padEnd(30),
      n.recipient_email.padEnd(35),
      date
    )
  })

  if (unverified.length > 0) {
    console.log(`\n\n⚠️  UNVERIFIED / TEST ENTRIES (${unverified.length})\n`)
    console.log('Buyer Name'.padEnd(30), 'Buyer Email'.padEnd(35), 'Nominated'.padEnd(30), 'Recipient Email'.padEnd(35), 'Date')
    console.log('-'.repeat(120))

    unverified.forEach(n => {
      const date = new Date(n.created_at).toLocaleDateString('en-US')
      console.log(
        n.buyer_name.padEnd(30),
        n.buyer_email.padEnd(35),
        n.recipient_name.padEnd(30),
        n.recipient_email.padEnd(35),
        date
      )
    })
  }

  console.log('\n' + '='.repeat(120))
  console.log(`\nTotal verified LOVE25 buyers: ${verified.length}`)
  console.log(`Total nominations: ${nominations.length}\n`)
}

main()
