# Phase 4 — Frontend Refactor, VoiceNotePlayer Fix, Email Send & Social Share

## Branch
`claude/basic-mvp-foundation-2gRlG`

---

## Overview

Four objectives:
1. **Refactor** `page.tsx` (467 lines) into small, focused modules
2. **Fix** VoiceNotePlayer progress tracking + add seek-to-position
3. **Add** Email "Send" button with backend API route
4. **Add** Social media share buttons (Facebook, Twitter/X)

Zero visual changes to existing layout. All new UI additions match the existing Tailwind card style.

---

## Step 1: Extract Shared Hooks

Create `hooks/` directory with reusable logic extracted from page.tsx.

### `hooks/useClipboard.ts`
- Extracts the `copyToClipboard` logic + `copiedField` state
- Returns `{ copiedField, copyToClipboard }`
- Handles clipboard API with textarea fallback
- Used by every result card

### `hooks/useGenerateMessages.ts`
- Extracts the `handleSubmit` logic + `loading`, `result`, `error` state
- Accepts form values, returns `{ loading, result, error, generate }`
- Encapsulates the `fetch("/api/generate")` call
- Single responsibility: API communication + state

**Files created:**
- `hooks/useClipboard.ts`
- `hooks/useGenerateMessages.ts`

---

## Step 2: Extract Result Components

Split the results section into focused components. Each renders one result card.

### `components/ResultCard.tsx`
- Already exists inline in page.tsx — extract to its own file
- Props: `title`, `badge?`, `onCopy`, `copied`, `copyLabel`, `children`

### `components/results/SmsResult.tsx`
- Renders SMS text + char count badge + copy button
- Props: `sms: string`, `onCopy`, `copied`

### `components/results/VoiceScriptResult.tsx`
- Renders voice script text + VoiceNotePlayer
- Props: `voiceScript: string`, `onCopy`, `copied`

### `components/results/EmailResult.tsx`
- Renders email subject + body + copy button
- **NEW**: "Send Email" button (wired in Step 5)
- Props: `email: { subject, body }`, `onCopy`, `copied`

### `components/results/SocialPostResult.tsx`
- Renders social post text + copy button
- **NEW**: "Share to" dropdown with Facebook & Twitter/X (Step 6)
- Props: `socialPost: string`, `onCopy`, `copied`

### `components/results/TranslationResult.tsx`
- Renders Spanish SMS + char count badge + copy button
- Props: `esSms: string`, `onCopy`, `copied`

### `components/results/MetadataPanel.tsx`
- Renders readability grade + compliance flags side-by-side
- Props: `readabilityGrade: number`, `complianceFlags: string[]`

### `components/results/FollowUpPanel.tsx`
- Renders follow-up suggestion in blue info card
- Props: `suggestion: string`

### `components/MetadataBar.tsx`
- The gray bar showing Time / Sender / Tone
- Props: `metadata: GenerateResponse["metadata"]`

**Files created:**
- `components/ResultCard.tsx`
- `components/MetadataBar.tsx`
- `components/results/SmsResult.tsx`
- `components/results/VoiceScriptResult.tsx`
- `components/results/EmailResult.tsx`
- `components/results/SocialPostResult.tsx`
- `components/results/TranslationResult.tsx`
- `components/results/MetadataPanel.tsx`
- `components/results/FollowUpPanel.tsx`

---

## Step 3: Extract the Form

### `components/IncidentForm.tsx`
- All form inputs (incidentType, location, severity, tone, audience, readingLevel, sender, requiredAction, confirmedFacts)
- All form state lives here
- Calls `onSubmit(formData)` prop when submitted
- Props: `onSubmit: (data: GenerateRequest) => void`, `loading: boolean`

**Files created:**
- `components/IncidentForm.tsx`

---

## Step 4: Slim Down `page.tsx`

After extraction, page.tsx becomes a ~60-line orchestrator:
- Imports `IncidentForm`, all result components, hooks
- Wires `useGenerateMessages` + `useClipboard` hooks
- Renders: header → form → error → results (compose result components)
- No inline logic, no inline sub-components

**Files modified:**
- `app/page.tsx` (rewritten as thin shell)

---

## Step 5: Fix VoiceNotePlayer

### Problems with current implementation:
1. **Progress inaccuracy**: Uses estimated duration `(words/150)*60s` which doesn't match actual SpeechSynthesis speed (varies by browser, voice, language)
2. **No seek**: Progress bar is display-only, not interactive

### Fix approach:

**Accurate progress tracking:**
- Use `SpeechSynthesisUtterance.onboundary` event — fires at each word boundary with `event.charIndex`
- Track progress as `charIndex / text.length * 100` — tied to actual speech position, not a time guess
- Keep the animation frame loop for smooth visual interpolation between boundary events, but anchor it to real boundary data
- On `onend`, snap to 100%

**Seek-to-position:**
- Make the progress bar container clickable
- On click: calculate target position as `(clickX / barWidth) * text.length`
- Find nearest word boundary (space) in text at that character index
- Cancel current speech, create new utterance starting from `text.slice(seekCharIndex)`
- Update progress state to reflect the seek position
- Store a `seekOffset` ref so progress = `(seekOffset + currentCharIndex) / totalLength * 100`

**Duration display:**
- Show elapsed / total instead of countdown
- Format as `0:00 / 0:00` (mm:ss)
- Calculate elapsed from the boundary events' real timing, not estimation

### Rewrite `components/VoiceNotePlayer.tsx`:
- `useRef` for: utterance, seekOffset, lastBoundaryCharIndex, totalLength
- `useState` for: playing, progress (0-100), elapsedSeconds
- `onboundary` handler updates real progress
- Click handler on progress bar for seek
- Play/stop toggle (unchanged behavior)
- Cleanup on unmount (unchanged)

**Files modified:**
- `components/VoiceNotePlayer.tsx` (rewritten)

---

## Step 6: Email "Send" Button

### Backend: `app/api/send-email/route.ts`
- POST endpoint accepting `{ to?: string, subject: string, body: string }`
- Uses `nodemailer` to send via SMTP (configured through env vars)
- Env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO` (default recipient)
- If `to` not provided in body, falls back to `EMAIL_TO` env var
- Returns `{ success: true }` or `{ error: "..." }` with 500
- Returns 400 if subject/body missing
- Returns 500 if SMTP not configured

### Dependencies:
- `npm install nodemailer`
- `npm install -D @types/nodemailer`

### Frontend: `components/results/EmailResult.tsx`
- "Send Email" button below the copy button
- On click: calls `POST /api/send-email` with subject + body
- Shows loading spinner on button while sending
- Shows success toast/inline message ("Email sent!") on success
- Shows error message on failure
- Button disabled while sending

**Files created:**
- `app/api/send-email/route.ts`

**Files modified:**
- `components/results/EmailResult.tsx` (send button added)
- `package.json` (nodemailer dependency)

---

## Step 7: Social Media Share Buttons

### `components/results/SocialPostResult.tsx`
- Add "Share" section below the copy button
- Two share buttons side by side: Facebook, Twitter/X
- Both open in new tab (`window.open`, `target="_blank"`)
- URL construction:
  - **Twitter/X**: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  - **Facebook**: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`
- Small pill-style buttons with platform labels
- No SDKs, no external dependencies — just URL intent links

**Files modified:**
- `components/results/SocialPostResult.tsx` (share buttons added)

---

## Step 8: Update `.env.local.example`

Add the new SMTP env vars:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
LLM_MOCK=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_TO=recipient@example.com
```

**Files modified:**
- `.env.local.example`

---

## Step 9: Build & Push

- `npm run build` — verify zero TypeScript errors
- Commit with descriptive message
- Push to `claude/basic-mvp-foundation-2gRlG`

---

## Final File Tree (new/modified only)

```
hyper-reach-ai-assistant/
├── app/
│   ├── api/
│   │   ├── generate/          # (unchanged)
│   │   └── send-email/
│   │       └── route.ts       # NEW — SMTP email sender
│   ├── page.tsx               # MODIFIED — thin orchestrator
│   └── types.ts               # (unchanged)
├── components/
│   ├── IncidentForm.tsx       # NEW — form extraction
│   ├── MetadataBar.tsx        # NEW — metadata display bar
│   ├── ResultCard.tsx         # NEW — reusable card shell
│   ├── VoiceNotePlayer.tsx    # MODIFIED — fixed progress + seek
│   └── results/
│       ├── SmsResult.tsx          # NEW
│       ├── VoiceScriptResult.tsx  # NEW
│       ├── EmailResult.tsx        # NEW — includes Send button
│       ├── SocialPostResult.tsx   # NEW — includes Share buttons
│       ├── TranslationResult.tsx  # NEW
│       ├── MetadataPanel.tsx      # NEW
│       └── FollowUpPanel.tsx      # NEW
├── hooks/
│   ├── useClipboard.ts        # NEW
│   └── useGenerateMessages.ts # NEW
└── .env.local.example         # MODIFIED — SMTP vars added
```

---

## What Does NOT Change
- `app/types.ts` — response schema untouched
- `app/api/generate/*` — all 7 backend modules untouched
- `app/layout.tsx`, `app/globals.css` — untouched
- Visual appearance of every existing section — identical
