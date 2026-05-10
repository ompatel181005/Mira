# MIRA — Healthcare Navigator

> Healthcare help, without the maze.

MIRA is a multilingual web application that helps undocumented, uninsured, and low-income patients in the United States navigate the healthcare system without fear and without an account. Find care, lower costs, understand medical documents, and get help applying for charity care — all in one place, in fifteen languages.

---

## About the project

MIRA was inspired by a simple but uncomfortable reality: access to healthcare in the U.S. is not just about availability, it's about *understanding*. While insured and English-speaking patients can easily compare clinics, check drug prices, and navigate billing systems, millions of undocumented, uninsured, and low-income individuals are forced to make medical decisions without clear information or guidance.

This project started with a question: *what if healthcare navigation worked like translation* — turning a complex, fragmented system into something understandable, actionable, and human?

### What inspired us

We were especially motivated by the information gap around:

- **Charity care programs** that most patients never hear about.
- **Sliding-scale clinics** that are hard to discover.
- **Prescription drugs** that vary wildly in price despite identical generics.
- **Medical bills** that are nearly impossible to interpret without expertise.

We wanted to build something that doesn't just show information, but explains it in context, in the user's language, and with immediate next steps.

---

## Four core features

### 1. Find Care
- ZIP-based search across HRSA Federally Qualified Health Centers and Cook County nonprofit hospitals.
- Interactive Leaflet map with ER-aware markers.
- Filters that quietly bias toward FQHCs, sliding-scale clinics, and uninsured-friendly providers.
- Emergency keyword detection (chest pain, suicidal ideation, etc.) surfaces a 911 / 988 banner before any other content.

### 2. Understand Docs
- Upload a PDF, JPG, PNG, or **take a photo of paper bills** with the phone camera.
- Multi-file upload — drop a visit summary, a bill, and an EOB together.
- Two-phase pipeline: Claude vision extracts structured fields first (charges, labs, meds, diagnoses surface in seconds), then a second pass produces a plain-language summary, "what this means", and three concrete next steps.
- Automatic **cross-document reconciliation** when ≥ 2 documents are uploaded — surfaces bill-vs-EOB mismatches and combined recommendations.
- **Quick-question chips** tailored to each document type ("Why is this so expensive?", "Can I negotiate this bill?", "Do I qualify for charity care?") that drop straight into the chat.
- **OCR-quality detection** — if a phone photo is too blurry/dark, MIRA tells you to retake it instead of producing garbage.
- Client-side image compression and HEIC re-encoding before upload (iPhone-friendly).

### 3. Lower Costs
- Type a medication name; MIRA normalizes brand → generic via RxNorm.
- Compares CMS NADAC reference pricing, Cost Plus Drugs, GoodRx coupon links.
- Surfaces manufacturer Patient Assistance Programs (PAPs) via NeedyMeds.
- Shows local charities and community programs that may help.

### 4. Get Help Applying
- Pick a hospital → MIRA estimates charity-care eligibility based on Federal Poverty Level and household size.
- Generates a **pre-filled cover letter and phone script** in the user's language (Claude-generated).
- Pre-fills hospital and amount automatically when the user clicks through from a parsed bill.
- Surfaces Illinois Emergency Medicaid eligibility for pregnant patients, ER visits, and dialysis — covers labor and delivery regardless of immigration status.
- Optional **GoFundMe draft generator** for residual costs the system can't cover.

---

## Privacy by design

- **No accounts, no email, no immigration status.**
- All state lives in browser `sessionStorage` and is wiped when the tab closes. Server side stores nothing.
- One-tap "Wipe my data" button.
- No analytics, no tracking pixels, no third-party cookies.

These decisions are not afterthoughts — they're load-bearing for the population MIRA is built for.

---

## Languages

Full UI translations in **15 languages**:

English · Spanish · Arabic · Hindi · Gujarati · Chinese · Tagalog · Vietnamese · Urdu · Korean · Russian · French · Bengali · Punjabi · Portuguese

RTL layout switches automatically for Arabic and Urdu. The Claude system prompt is locale-aware, so generated cover letters, summaries, and chat replies all return in the chosen language.

---

## Tech stack

**Frontend**
- Next.js 14 (App Router) · React 18 · TypeScript
- Tailwind CSS · Framer Motion
- react-leaflet · Leaflet (OpenStreetMap tiles)
- i18next · react-i18next · i18next-browser-languagedetector

**Backend**
- Next.js serverless API routes (Node.js runtime)
- Anthropic Claude API (`@anthropic-ai/sdk`)
  - Claude Opus 4.5 for document vision, extraction, and summarization
  - Claude Sonnet 4.5 for chat
  - Tool use for guaranteed structured JSON output
  - Prompt caching for cheap follow-up chat turns

**External data & APIs**
- HRSA Find a Health Center
- CMS Hospital General Information
- CMS NADAC drug pricing
- NIH RxNav / RxNorm
- openFDA
- NeedyMeds patient-assistance programs
- Cook County / Illinois charity-care policy data (curated)
- OpenStreetMap (Leaflet tiles)

**Storage**
- Browser `sessionStorage` only — no database, no Redis, no PII at rest

**Deployment**
- Vercel (hosting, serverless functions, edge CDN)
- GitHub (source control)

---

## Getting started

### Prerequisites

- Node.js 18+ and npm
- An Anthropic API key (`sk-ant-...`)

### Local development

```bash
git clone https://github.com/ompatel181005/Mira.git
cd Mira
npm install
cp .env.example .env.local
# Open .env.local and set ANTHROPIC_API_KEY
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic key |

Other entries in `.env.example` are not read by the code.

### Deploying to Vercel

1. Push to GitHub.
2. Import the repo at <https://vercel.com/new>.
3. Add `ANTHROPIC_API_KEY` under **Environment Variables** (Production / Preview / Development).
4. Deploy. The default Next.js preset works as-is.

The four AI-heavy routes (`/api/docs/extract`, `/summarize`, `/combine`, `/api/apply/charity-care`) declare `maxDuration = 60`, which is supported on Vercel's Hobby tier.

**Recommended before going public:** set a spend cap in the Anthropic Console so an accidental upload loop can't burn through your quota.

---

## Project structure

```
app/
  api/                  Next.js API routes
    apply/              Charity-care eligibility + Emergency Medicaid
    care/               ZIP-based care provider search
    costs/              Medication pricing + local charities
    docs/               Document AI pipeline
      extract/          Stage 1: vision extraction → structured JSON
      summarize/        Stage 2: plain-language summary (tool use)
      combine/          Cross-document reconciliation
      chat/             Follow-up Q&A with prompt caching
  apply/                /apply page — charity care application help
  care/                 /care page — care provider results + map
  costs/                /costs page — medication price lookup
  docs/                 /docs page — document upload + summary + chat
  page.tsx              Home

components/
  HomeForm.tsx          Mascot hero + free-form search + ZIP modal
  Header.tsx            Sticky header with logo, privacy badge, language
  RichText.tsx          Inline markdown renderer (**bold**, *italic*, `code`)
  care/                 CareCard, CareMap
  docs/                 QuickChips, ReconciliationCard
  ...

lib/
  claude.ts             Anthropic SDK wrapper
  emergency.ts          Multilingual emergency keyword detection
  i18n.ts               i18next setup with lazy-loaded locales
  imageCompress.ts      Browser-side resize + HEIC re-encode
  session.ts            sessionStorage form state
  fpl.ts                Federal Poverty Level math
  geocode.ts, distance.ts
  cms-hospitals.ts, hrsa.ts, charities.ts
  nadac.ts, needymeds.ts, openfda.ts, rxnorm.ts

data/                   Static JSON datasets (FQHCs, hospitals, etc.)
locales/                15 translation files
scripts/                One-off translation merge helper
public/                 Mascot + logo assets
```

---

## Disclaimer

MIRA provides general information, not medical or legal advice. The application surfaces public data, generated guidance, and direct phone numbers to official assistance lines (911, 988, 211, HRSA). Always consult a licensed healthcare professional for medical decisions and a benefits counselor for application support.

---

## License

MIT for code. External data sources retain their original licenses.
