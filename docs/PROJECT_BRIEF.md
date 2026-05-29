# Rinciku — Project Brief

> AI-powered personal finance companion for managing expenses, planning essentials, and making smarter spending decisions.

---

## Overview

**Rinciku** (from *rincian keuanganku* — "my financial details") is a web-based personal finance app built for young Indonesians — and anyone — who earns in mixed currencies, struggles to track variable monthly expenses, and wants real-time AI guidance before making spending decisions.

The core insight: most people don't fail at *tracking* money. They fail at *deciding* in the moment. Rinciku solves both — by making logging frictionless and consultation instant.

---

## Problems

### 1. No visibility on spending
Users don't know where their money goes until it's gone. Expenses are recalled from memory, not tracked in real time. There's no single source of truth for monthly spending.

### 2. Mixed currency confusion
Income and expenses in both IDR and USD require constant mental conversion. This leads to errors, unclear totals, and difficulty understanding actual financial position.

### 3. Variable expenses make budgeting hard
Costs like electricity, food, and entertainment fluctuate monthly. Without a clear baseline, it's impossible to plan ahead or compare actual vs expected spending.

### 4. No separation between needs and wants
Fixed necessities and lifestyle spending are lumped together. Users can't instantly see their financial health or know what's negotiable vs non-negotiable.

### 5. No guidance for in-the-moment purchase decisions
Users spend impulsively without knowing if they can actually afford it — given remaining budget, upcoming fixed costs, and days left in the month.

### 6. Manual expense entry is slow and error-prone
Typing out every receipt, transfer, or invoice is tedious. Users forget to log, mistype amounts, or give up entirely. Physical proof of payment (receipts, transfer screenshots) is never connected to the expense record.

---

## Solutions

### 1. Essentials Planner
Users define their monthly non-negotiables upfront:
- Fixed bills (rent, internet, electricity)
- Grocery must-haves (protein, vegetables, condiments)
- Recurring needs (water, transport)

This becomes their **baseline cost of living** — the floor they can never go below. It anchors all AI reasoning.

### 2. Chat-based Expense Logging
Type naturally — *"spent 45k on lunch"* — and AI handles categorization and logging automatically. No forms, no friction. Just type and go.

### 3. Image-based Expense Logging
Upload a photo of any payment document and AI extracts the expense automatically:
- Receipts (struk)
- Bank transfer proofs (bukti transfer)
- Invoices
- E-wallet screenshots (GoPay, OVO, Dana)

Claude Vision reads the document, extracts amount, currency, merchant, date, and suggests a category. The user reviews and edits inline in chat before confirming. The original image is stored permanently in Supabase Storage and attached to the expense record for audit trail.

### 4. Multi-currency Support
Log expenses in IDR or USD. Everything is unified into one total using a live or user-defined exchange rate. Income can also be entered in multiple currencies.

### 5. Needs vs Wants Categorization
Three-tier category system:
- **Fixed** — rent, internet, electricity (non-negotiable)
- **Needs** — food, transport, health (essential but variable)
- **Wants** — hangout, subscriptions, entertainment (discretionary)

Dashboard shows instant breakdown of where money is going.

### 6. AI Purchase Consultation
Before spending, users ask the AI: *"Can I buy this Rp 800k keyboard right now?"*

The AI reasons against:
- Total monthly income
- Essentials baseline (what still needs to be covered)
- Current spending so far
- Days remaining in the month

It gives a clear, grounded answer — not generic financial advice.

---

## Target User

**Primary:** Young Indonesian adults (18–30) with:
- Mixed-currency income (e.g. local job + freelance in USD)
- Variable monthly expenses
- No financial advisor, no complex investment portfolio
- Want a smart, friendly tool — not a spreadsheet

**Secondary:** Anyone globally with irregular income or multi-currency financial life.

---

## Core User Story

> *"As someone with mixed-currency income and variable expenses, I want to see clearly what I'm spending, compare it to my budget, and know immediately if I'm on track — without doing math in my head."*

---

## MVP — v1 Features

These are the minimum features needed for the app to be genuinely useful as a daily tool.

| Feature | Description |
|---|---|
| **Auth + profile setup** | Supabase auth. User sets income (IDR + USD), base currency, and monthly start date |
| **Essentials planner** | Define fixed bills, grocery needs, recurring costs. Auto-calculates minimum monthly cost |
| **Expense logging — chat** | Type naturally: *"spent 45k on lunch"*. AI categorizes and logs automatically |
| **Expense logging — image** | Upload receipt, transfer proof, invoice, or e-wallet screenshot. AI extracts expense data via Claude Vision. User reviews inline in chat before saving. Image stored permanently in Supabase Storage |
| **Multi-currency** | Log in IDR or USD. Auto-convert to IDR as base using live or fixed rate |
| **Category system** | Three tiers: Fixed / Needs / Wants. User can customize categories within each tier |
| **Monthly dashboard** | Actual vs budget overview. Needs vs wants breakdown. Days remaining. Budget health indicator |
| **AI consultation** | Chat with AI: *"can I buy this?"* AI responds based on real budget context — income, essentials baseline, current spending, days left |
| **Budget targets** | Set monthly spending limit per category. Color indicator when approaching or over budget |

---

## v2 Features (Post-MVP)

| Feature | Description |
|---|---|
| Recurring expenses | Auto-log monthly fixed bills so user doesn't re-enter each month |
| AI spending insights | Monthly pattern analysis — where did you overspend? What trends emerged? |
| Export to CSV | Download monthly expense report with optional image attachments |
| Flutter mobile app | iOS + Android companion app with camera integration for faster image logging |
| Grocery planner | Weekly shopping list tied to essentials planner with estimated cost |
| Savings goals | Set a savings target, AI tracks progress and adjusts consultation advice |
| Multi-language | English + Bahasa Indonesia UI toggle |
| Data retention settings | User-controlled storage expiry for uploaded images |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Storage | Supabase Storage (expense image attachments) |
| AI | Claude API (Anthropic) — claude-sonnet-4-20250514 |
| AI Vision | Claude API vision input — for receipt / document extraction |
| State management | TBD — Zustand or TanStack Query |
| Deployment | Vercel or Netlify |
| Repo | GitHub (open source) |

---

## Database — High Level Entities

```
users                 — profile, income, currency preference
categories            — name, tier (fixed/needs/wants), icon, color
essentials            — user's monthly non-negotiable items + estimated cost
expenses              — amount, currency, converted_amount, category, date, note, attachment_id (nullable)
expense_attachments   — storage_path, public_url, doc_type, ai_raw_extraction (jsonb), ai_confidence, confirmed
budgets               — monthly target per category
conversations         — AI chat history per user per month
```

### Storage

- Bucket: `expense-attachments` (private, RLS-protected per user_id)
- Path pattern: `{user_id}/{year}-{month}/{uuid}.{ext}`
- Attachment record created on upload; linked to expense only after user confirmation

Full schema with RLS policies to be defined in `docs/schema.md`.

---

## AI Extraction — Supported Document Types

| Type | Examples | Key extraction targets |
|---|---|---|
| Receipt (struk) | Warung, restaurant, minimarket | Amount, merchant, date, items |
| Bank transfer proof | BCA, Mandiri, BNI bukti transfer | Amount, currency, sender/receiver, date |
| Invoice | Freelance invoice, vendor bill | Total, vendor name, due date, line items |
| E-wallet screenshot | GoPay, OVO, Dana transaction | Amount, transaction type, merchant/recipient |

> **Note:** Claude Vision prompt is calibrated for Indonesian document formats — IDR dot-separator notation (e.g. `85.000`), common bank UI layouts, and local e-wallet interfaces.

---

## Project Goals

1. **Personal use first** — solve the real problem for the builder
2. **Open source** — clean code, good README, contribution-friendly
3. **Portfolio product** — production-grade UI, real AI integration, deployable
4. **Future SaaS** — freemium model possible in v2 (free tier + pro with advanced AI features and higher storage quota)

---

## Out of Scope (v1)

- Investment tracking
- Bank/e-wallet sync (OVO, GoPay, BCA, etc.)
- Tax calculations
- Team or shared budgets
- Complex financial reports
- OCR for scanned PDFs (images only in v1)

---

## Key Differentiators vs Existing Apps

| Feature | Rinciku | Typical finance apps |
|---|---|---|
| AI purchase consultation | ✅ Core feature | ❌ Not available |
| Chat-based logging | ✅ Natural language | ❌ Form-only |
| Image-based logging | ✅ Receipt / transfer / invoice scan | ⚠️ Basic OCR at best |
| Essentials baseline planner | ✅ Built-in | ❌ Not available |
| IDR + USD native support | ✅ First-class | ⚠️ Limited |
| Indonesian context-aware AI | ✅ Yes (IDR format, local docs) | ❌ Generic |
| Attachment audit trail | ✅ Image stored with expense | ❌ Not available |

---

*Last updated: May 2026*
*Stack: Vite + React + TypeScript + Supabase + Claude API*
