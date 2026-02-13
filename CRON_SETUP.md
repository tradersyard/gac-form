# Daily LOVE25 Nominations Report - Cron Setup

## What it does
Sends a daily email to **flo@tradersyard.com** at **4:00 PM** with all pending LOVE25 gift nominations that need to be reviewed and processed.

## Setup Instructions

### Option 1: Mac/Linux Cron Job (Recommended)

1. Open terminal and run:
```bash
crontab -e
```

2. Add this line (adjust path if needed):
```bash
0 16 * * * cd /Users/gbolahan/Documents/TradersYard/Landing\ Pages\ -\ TY/gac-form && /usr/local/bin/node scripts/send-daily-nominations-report.mjs >> /tmp/love25-report.log 2>&1
```

This runs every day at 4:00 PM (16:00).

3. Save and exit (`:wq` in vim, or `Ctrl+X` then `Y` in nano)

4. Verify it's scheduled:
```bash
crontab -l
```

### Option 2: Manual Run (Testing)

Run manually anytime:
```bash
cd /Users/gbolahan/Documents/TradersYard/Landing\ Pages\ -\ TY/gac-form
node scripts/send-daily-nominations-report.mjs
```

### Option 3: GitHub Actions (If repo is on GitHub)

Create `.github/workflows/daily-report.yml`:
```yaml
name: Send Daily LOVE25 Report

on:
  schedule:
    - cron: '0 16 * * *'  # 4 PM daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/send-daily-nominations-report.mjs
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: \${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          RESEND_API_KEY: \${{ secrets.RESEND_API_KEY }}
```

## Cron Time Reference
- `0 16 * * *` = 4:00 PM daily
- `0 9 * * *` = 9:00 AM daily
- `0 16 * * 1-5` = 4:00 PM Monday-Friday only
- `0 */6 * * *` = Every 6 hours

## Troubleshooting

### Check if cron is running
```bash
tail -f /tmp/love25-report.log
```

### Test manually first
```bash
node scripts/send-daily-nominations-report.mjs
```

### Verify email was sent
Check flo@tradersyard.com inbox for "LOVE25 Nominations Report"
