#!/usr/bin/env node
/**
 * Send daily LOVE25 nominations report to flo@tradersyard.com
 *
 * Run manually: node scripts/send-daily-nominations-report.mjs
 * Or schedule with cron: 0 16 * * * cd /path/to/gac-form && node scripts/send-daily-nominations-report.mjs
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
const RESEND_API_KEY = env.RESEND_API_KEY || 're_auKf53Ek_FaGLn2c8P4HAWsYTUnTsawEp'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

async function fetchPendingNominations() {
  console.log('📥 Fetching pending nominations from Supabase...')

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/gift_challenge_claims?status=eq.pending_review&select=*&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch nominations: ${response.statusText}`)
  }

  const nominations = await response.json()
  console.log(`✅ Found ${nominations.length} pending nominations`)

  return nominations
}

function buildEmailHTML(nominations) {
  if (nominations.length === 0) {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a2e; margin-bottom: 24px;">LOVE25 Nominations Report</h1>
        <p style="color: #64748b; font-size: 16px;">No pending nominations today.</p>
      </div>
    `
  }

  const rows = nominations.map(n => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 16px 8px; font-size: 13px; color: #64748b;">${new Date(n.created_at).toLocaleDateString()}</td>
      <td style="padding: 16px 8px; font-size: 14px; font-weight: 600; color: #1a1a2e;">${n.buyer_name}</td>
      <td style="padding: 16px 8px; font-size: 13px; color: #4250eb;"><a href="mailto:${n.buyer_email}" style="color: #4250eb; text-decoration: none;">${n.buyer_email}</a></td>
      <td style="padding: 16px 8px; font-size: 14px; font-weight: 600; color: #1a1a2e;">${n.recipient_name}</td>
      <td style="padding: 16px 8px; font-size: 13px; color: #4250eb;"><a href="mailto:${n.recipient_email}" style="color: #4250eb; text-decoration: none;">${n.recipient_email}</a></td>
      <td style="padding: 16px 8px; font-size: 13px; color: #64748b;">${n.gift_tier} ${n.challenge_type}</td>
      <td style="padding: 16px 8px; text-align: center;"><span style="display: inline-block; padding: 4px 12px; background-color: ${n.woo_order_verified ? '#10b981' : '#f59e0b'}; color: white; border-radius: 12px; font-size: 11px; font-weight: 600;">${n.woo_order_verified ? 'Verified' : 'Not Verified'}</span></td>
    </tr>
  `).join('')

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px 20px; background-color: #f8f8fa;">
      <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color: #1a1a2e; margin: 0 0 8px 0; font-size: 28px;">LOVE25 Nominations Report</h1>
        <p style="color: #64748b; margin: 0 0 32px 0; font-size: 16px;">${nominations.length} pending ${nominations.length === 1 ? 'nomination' : 'nominations'} to review</p>

        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8f8fa; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Date</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Buyer</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Buyer Email</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Recipient</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Recipient Email</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Gift Details</th>
              <th style="padding: 12px 8px; text-align: center; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Order Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div style="margin-top: 32px; padding: 20px; background-color: #f8f8fa; border-radius: 8px; border-left: 4px solid #4250eb;">
          <p style="margin: 0; font-size: 14px; color: #64748b;"><strong style="color: #1a1a2e;">Next Steps:</strong> Review each nomination, verify the buyer used LOVE25, create coupons, and send gift emails to recipients.</p>
        </div>
      </div>
    </div>
  `
}

async function sendEmail(nominations) {
  console.log('📧 Sending email to flo@tradersyard.com...')

  const html = buildEmailHTML(nominations)
  const subject = nominations.length === 0
    ? 'LOVE25 Nominations Report - No Pending Nominations'
    : `LOVE25 Nominations Report - ${nominations.length} Pending ${nominations.length === 1 ? 'Nomination' : 'Nominations'}`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TradersYard <noreply@tradersyard.de>',
      to: ['flo@tradersyard.com'],
      subject: subject,
      html: html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }

  const result = await response.json()
  console.log(`✅ Email sent successfully (ID: ${result.id})`)
}

async function main() {
  console.log('🚀 Starting daily LOVE25 nominations report...\n')

  try {
    const nominations = await fetchPendingNominations()
    await sendEmail(nominations)

    console.log('\n✨ Report sent successfully!')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

main()
