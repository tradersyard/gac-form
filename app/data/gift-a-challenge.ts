export interface CampaignAccount {
  value: number
  label: string
  originalPrice: number
  discountedPrice: number
  savings: number
  resetFee: number
  giftTier: string
  giftValue: number
  cartUrl: string
}

export interface ChallengeType {
  key: string
  name: string
  shortName: string
  description: string
  features: { label: string; value: string }[]
  accounts: CampaignAccount[]
}

export const CAMPAIGN_CONFIG = {
  promoCode: 'LOVE25',
  discountPercent: 25,
  startDate: '2026-02-09T00:00:00Z',
  endDate: '2026-02-18T23:59:59Z',
  cartBaseUrl: 'https://tradersyard.com/auth/register',
  giftRedeemUrl: 'https://tradersyard.com/gift',
}

function cartUrl(challenge: string): string {
  return `${CAMPAIGN_CONFIG.cartBaseUrl}?challenge=${challenge}&discount=${CAMPAIGN_CONFIG.promoCode}`
}

export const challengeTypes: ChallengeType[] = [
  {
    key: 'cfd-2-phase-swing',
    name: 'CFD - 2 Phase Swing',
    shortName: '2 Phase Swing',
    description: 'Profit Target: Phase 1 = 10%, Phase 2 = 5% | Leverage: 1:30 | Daily Loss: 5% | Max Loss: 10% | Static Drawdown | News & Weekend: Allowed',
    features: [
      { label: 'Profit Target', value: 'P1: 10% / P2: 5%' },
      { label: 'Leverage', value: '1:30' },
      { label: 'Daily Loss Limit', value: '5%' },
      { label: 'Max Loss', value: '10%' },
      { label: 'Drawdown', value: 'Static' },
      { label: 'News & Weekend', value: 'Allowed' },
    ],
    accounts: [
      { value: 5000, label: '$5K', originalPrice: 39, discountedPrice: 29, savings: 10, resetFee: 34, giftTier: '$5K', giftValue: 39, cartUrl: cartUrl('cfd-2phase-5k') },
      { value: 10000, label: '$10K', originalPrice: 79, discountedPrice: 59, savings: 20, resetFee: 70, giftTier: '$5K', giftValue: 39, cartUrl: cartUrl('cfd-2phase-10k') },
      { value: 25000, label: '$25K', originalPrice: 149, discountedPrice: 112, savings: 37, resetFee: 134, giftTier: '$5K', giftValue: 39, cartUrl: cartUrl('cfd-2phase-25k') },
      { value: 50000, label: '$50K', originalPrice: 249, discountedPrice: 187, savings: 62, resetFee: 224, giftTier: '$10K', giftValue: 79, cartUrl: cartUrl('cfd-2phase-50k') },
      { value: 100000, label: '$100K', originalPrice: 499, discountedPrice: 374, savings: 125, resetFee: 449, giftTier: '$25K', giftValue: 149, cartUrl: cartUrl('cfd-2phase-100k') },
    ],
  },
  {
    key: 'cfd-1-phase',
    name: 'CFD - 1 Phase',
    shortName: '1 Phase',
    description: 'Profit Target: 10% | Leverage: 1:30 | Daily Loss: 3% | Max Loss: 6% | Static Drawdown | News & Weekend: Restricted',
    features: [
      { label: 'Profit Target', value: '10%' },
      { label: 'Leverage', value: '1:30' },
      { label: 'Daily Loss Limit', value: '3%' },
      { label: 'Max Loss', value: '6%' },
      { label: 'Drawdown', value: 'Static' },
      { label: 'News & Weekend', value: 'Restricted' },
    ],
    accounts: [
      { value: 5000, label: '$5K', originalPrice: 55, discountedPrice: 41, savings: 14, resetFee: 50, giftTier: '$5K', giftValue: 55, cartUrl: cartUrl('cfd-1phase-5k') },
      { value: 10000, label: '$10K', originalPrice: 95, discountedPrice: 71, savings: 24, resetFee: 85, giftTier: '$5K', giftValue: 55, cartUrl: cartUrl('cfd-1phase-10k') },
      { value: 25000, label: '$25K', originalPrice: 165, discountedPrice: 124, savings: 41, resetFee: 150, giftTier: '$5K', giftValue: 55, cartUrl: cartUrl('cfd-1phase-25k') },
      { value: 50000, label: '$50K', originalPrice: 345, discountedPrice: 259, savings: 86, resetFee: 325, giftTier: '$10K', giftValue: 95, cartUrl: cartUrl('cfd-1phase-50k') },
      { value: 100000, label: '$100K', originalPrice: 555, discountedPrice: 416, savings: 139, resetFee: 530, giftTier: '$25K', giftValue: 165, cartUrl: cartUrl('cfd-1phase-100k') },
      { value: 200000, label: '$200K', originalPrice: 1045, discountedPrice: 784, savings: 261, resetFee: 1015, giftTier: '$50K', giftValue: 345, cartUrl: cartUrl('cfd-1phase-200k') },
    ],
  },
  {
    key: 'futures-static',
    name: 'Futures - 1 Phase (Static Drawdown)',
    shortName: 'Static Drawdown',
    description: 'Profit Target: $800-$4,000 | Daily Drawdown: None | Max Loss: $400-$2,000 | News: Allowed | Overnight: Restricted',
    features: [
      { label: 'Profit Target', value: '$800 - $4,000' },
      { label: 'Daily Drawdown', value: 'None' },
      { label: 'Max Loss', value: '$400 - $2,000' },
      { label: 'News Trading', value: 'Allowed' },
      { label: 'Overnight', value: 'Restricted' },
    ],
    accounts: [
      { value: 10000, label: '$10K', originalPrice: 149, discountedPrice: 112, savings: 37, resetFee: 99, giftTier: '$10K', giftValue: 149, cartUrl: cartUrl('futures-static-10k') },
      { value: 25000, label: '$25K', originalPrice: 249, discountedPrice: 187, savings: 62, resetFee: 199, giftTier: '$10K', giftValue: 149, cartUrl: cartUrl('futures-static-25k') },
      { value: 50000, label: '$50K', originalPrice: 399, discountedPrice: 299, savings: 100, resetFee: 349, giftTier: '$10K', giftValue: 149, cartUrl: cartUrl('futures-static-50k') },
    ],
  },
  {
    key: 'futures-eod',
    name: 'Futures - 1 Phase (EoD Drawdown)',
    shortName: 'EoD Drawdown',
    description: 'Profit Target: $3,000-$9,000 | Daily Drawdown: None | Max Loss: $2,000-$4,500 | News: Allowed | Overnight: Restricted',
    features: [
      { label: 'Profit Target', value: '$3,000 - $9,000' },
      { label: 'Daily Drawdown', value: 'None' },
      { label: 'Max Loss', value: '$2,000 - $4,500' },
      { label: 'News Trading', value: 'Allowed' },
      { label: 'Overnight', value: 'Restricted' },
    ],
    accounts: [
      { value: 50000, label: '$50K', originalPrice: 299, discountedPrice: 224, savings: 75, resetFee: 149, giftTier: '$10K (Static)', giftValue: 149, cartUrl: cartUrl('futures-eod-50k') },
      { value: 100000, label: '$100K', originalPrice: 424, discountedPrice: 318, savings: 106, resetFee: 249, giftTier: '$25K (Static)', giftValue: 249, cartUrl: cartUrl('futures-eod-100k') },
      { value: 150000, label: '$150K', originalPrice: 549, discountedPrice: 412, savings: 137, resetFee: 349, giftTier: '$25K (Static)', giftValue: 249, cartUrl: cartUrl('futures-eod-150k') },
    ],
  },
]

// Flat list of all gift mappings for the Gift Tier Mapping section
export const giftMappings = challengeTypes.flatMap(type =>
  type.accounts.map(account => ({
    type: type.shortName,
    typeFull: type.name,
    buyTier: account.label,
    price: `$${account.discountedPrice}`,
    originalPrice: `$${account.originalPrice}`,
    giftTier: account.giftTier,
    giftValue: `$${account.giftValue}`,
  }))
)
