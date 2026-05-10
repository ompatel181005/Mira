# MIRA — Healthcare Navigator

Multilingual web app helping uninsured and undocumented patients navigate US healthcare — find care, lower costs, understand documents, and get help applying for charity care. No account, no email, no record.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local`, add `ANTHROPIC_API_KEY`
3. `npm run dev`
4. Open http://localhost:3000

## Features

- **Find Care**: ZIP-based search across HRSA FQHCs and Cook County nonprofit hospitals; Leaflet map; emergency-aware ranking.
- **Understand Docs**: PDF/image upload → Claude multimodal extraction (tool-use) → plain-language summary, "what this means", "what to do next" + chat.
- **Lower Costs**: RxNorm brand→generic, OpenFDA drug info, NADAC reference price, Cost Plus / GoodRx deep links, manufacturer PAP lookup, local charity finder.
- **Get Help Applying**: Hospital charity-care eligibility based on FPL, pre-filled cover letter and phone script (Claude-generated, in user's language), Illinois Emergency Medicaid pathway.

Plus: emergency keyword detection across all flows, multilingual UI (English / Spanish / Arabic with RTL), `sessionStorage`-only state, no analytics.

## Privacy

MIRA stores no user data server-side. All session state is client-side. No accounts, no analytics, no cookies beyond what Next.js requires.

## Data sources

- HRSA Health Center dataset (pre-filtered Illinois FQHCs)
- CMS Hospital General Information (Cook County nonprofits)
- Manually curated Cook County charity / immigrant-serving organizations
- CMS NADAC drug pricing
- RxNorm + OpenFDA APIs
- NeedyMeds patient assistance programs
- Nominatim (OSM) for ZIP geocoding; OpenStreetMap tiles via Leaflet

## License

MIT for code. Data sources retain their original licenses.
