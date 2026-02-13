import { challengeTypes } from '../../app/data/gift-a-challenge'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

// Google Sheets configuration
const SHEET_ID = process.env.LOVE25_SHEET_ID || ''
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''

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

  // ── Generate reference code for tracking ──
  const referenceCode = generateCouponCode()
  const timestamp = new Date().toISOString()

  try {
    // Initialize Google Sheets
    const serviceAccountAuth = new JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth)
    await doc.loadInfo()

    // Get or create the worksheet
    let sheet = doc.sheetsByTitle['LOVE25 Nominations']
    if (!sheet) {
      sheet = await doc.addSheet({
        title: 'LOVE25 Nominations',
        headerValues: [
          'Timestamp',
          'Reference Code',
          'Status',
          'Buyer Name',
          'Buyer Email',
          'Recipient Name',
          'Recipient Email',
          'Challenge Type',
          'Account Size',
          'Gift Tier',
          'Personal Message',
          'WooCommerce Order Verified',
          'Coupon Code Issued',
          'Email Sent At',
        ],
      })
    }

    // Append the nomination
    await sheet.addRow({
      'Timestamp': timestamp,
      'Reference Code': referenceCode,
      'Status': 'Pending Review',
      'Buyer Name': buyerName.trim(),
      'Buyer Email': buyerEmail.toLowerCase().trim(),
      'Recipient Name': recipientName.trim(),
      'Recipient Email': recipientEmail.toLowerCase().trim(),
      'Challenge Type': challenge.name,
      'Account Size': accountSize,
      'Gift Tier': resolvedGiftTier,
      'Personal Message': personalMessage?.trim() || '',
      'WooCommerce Order Verified': 'Not Verified',
      'Coupon Code Issued': '',
      'Email Sent At': '',
    })

    return {
      success: true,
      message: 'Gift nomination submitted successfully! Our team will review and send the gift to your recipient within 24 hours.',
      referenceCode: referenceCode,
    }
  } catch (err: any) {
    console.error('Google Sheets error:', err)
    throw createError({
      statusCode: 500,
      message: 'Failed to submit gift nomination. Please try again.'
    })
  }
})

// ── Generate TY-XXXXXX reference code ──
function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TY-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
