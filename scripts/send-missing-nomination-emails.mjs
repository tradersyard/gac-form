#!/usr/bin/env node
/**
 * Send nomination emails to LOVE25 buyers who didn't receive them
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
const RESEND_API_KEY = env.RESEND_API_KEY || 're_auKf53Ek_FaGLn2c8P4HAWsYTUnTsawEp'

// Buyers who need nomination emails
const missingBuyers = [
  { name: 'Fabian Herzog', email: 'herzogbusiness07@gmail.com', orderId: '2868', product: 'FUTURES - 1 Phase STATIC 25k Account', giftTier: '$25K' },
  { name: 'Abdulwahab Saeed', email: 'abdulwahabsaeed910@gmail.com', orderId: '2811', product: '2 Phase Swing 5k Account', giftTier: '$5K' },
  { name: 'MIRACLE ACHENA OTUWE', email: 'achenaotuwe205@gmail.com', orderId: '2757', product: '2 Phase Swing 25k Account', giftTier: '$10K' },
  { name: 'Alexandros Salamanis', email: 'alex_2003@live.nl', orderId: '2314', product: '2 Phase Swing 5k Account', giftTier: '$5K' },
  { name: 'Shafiu Aminu', email: 'shafiuaminu555@gmail.com', orderId: '2301', product: '2 Phase Swing 5k Account', giftTier: '$5K' },
]

function buildNominationEmail(buyer) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background-color: #1a1a2e; border-radius: 8px; padding: 12px 20px;">
          <img src="https://iili.io/fyfm6hB.png" alt="TradersYard" width="140" style="display: block;"/>
        </div>
      </div>

      <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 600; color: #1a1a2e; text-align: center;">
        🎁 Thank You for Your Purchase!
      </h1>

      <div style="background-color: #f8f8fa; border-radius: 12px; padding: 32px; margin-bottom: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #64748b; line-height: 1.6;">
          Hey ${buyer.name},
        </p>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #64748b; line-height: 1.6;">
          Thank you for using code <strong style="color: #4250eb;">LOVE25</strong> on your recent order!
        </p>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #64748b; line-height: 1.6;">
          As part of our Valentine's special, you can now <strong style="color: #1a1a2e;">gift a FREE ${buyer.giftTier} challenge</strong> to someone you know.
        </p>

        <div style="background-color: #ffffff; border-left: 4px solid #4250eb; border-radius: 0 8px 8px 0; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">Your Order:</p>
          <p style="margin: 0; font-size: 14px; color: #64748b;">${buyer.product}</p>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="https://gac.tradersyard.com" style="display: inline-block; padding: 16px 48px; background-color: #4250eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
          Nominate Someone for a Free Challenge →
        </a>
      </div>

      <div style="background-color: #fff4e6; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
        <p style="margin: 0; font-size: 14px; color: #d97706; font-weight: 600; text-align: center;">
          ⏰ Nominations close February 18 at midnight
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 32px;">
        <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
          This is a one-time gift opportunity. Nominate someone special today!
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;"/>
      <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
        © 2026 TradersYard GmbH. All Rights Reserved.
      </p>
    </div>
  `
}

async function sendEmail(buyer) {
  console.log(`📧 Sending nomination email to ${buyer.name} (${buyer.email})...`)

  const html = buildNominationEmail(buyer)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TradersYard <noreply@tradersyard.de>',
      to: [buyer.email],
      subject: '🎁 Your LOVE25 Gift - Nominate Someone for a Free Challenge',
      html: html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send to ${buyer.email}: ${error}`)
  }

  const result = await response.json()
  console.log(`   ✅ Sent (ID: ${result.id})`)
  return result.id
}

async function main() {
  console.log('🚀 Sending nomination emails to LOVE25 buyers...\n')
  console.log(`Sending to ${missingBuyers.length} buyers:\n`)

  let successCount = 0
  let failCount = 0

  for (const buyer of missingBuyers) {
    try {
      await sendEmail(buyer)
      successCount++
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`)
      failCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Successfully sent: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('='.repeat(80))
  console.log('\n✨ Done! All nomination emails sent.\n')
}

main()
