# Phase 1 — Basic MVP Implementation Plan

## Branch
`claude/basic-mvp-foundation-2gRlG` (already checked out)

---

## Step 1: Project Scaffolding

Initialize a Next.js 14+ project with TypeScript and Tailwind CSS.

**Actions:**
- Run `npx create-next-app@latest` with TypeScript, Tailwind, App Router, ESLint enabled
- Verify the scaffolded project builds and runs
- Remove boilerplate content from the default page

**Files created/modified:**
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

---

## Step 2: Environment Configuration

**Actions:**
- Create `.env.local.example` with `OPENAI_API_KEY=your_key_here` as a template
- Add `.env.local` to `.gitignore` (Next.js does this by default)
- Install the OpenAI SDK: `npm install openai`

**Files created/modified:**
- `.env.local.example`
- `package.json` (dependency added)

---

## Step 3: Backend API Route — `/api/generate`

Create the POST endpoint that calls OpenAI and returns structured SMS + Email.

**Actions:**
- Create `app/api/generate/route.ts`
- Accept POST JSON body: `{ incidentType, location, confirmedFacts }`
- Validate required fields, return 400 if missing
- Initialize OpenAI client using `OPENAI_API_KEY` env var
- Call `gpt-4o-mini` with temperature 0.3
- System prompt: emergency communication assistant, confirmed facts only
- User prompt: request SMS (max 160 chars), email subject, email body
- Request JSON response format
- Parse the OpenAI response, extract JSON
- Return structured response: `{ sms, email: { subject, body } }`
- Handle errors: missing API key (500), OpenAI failures (502), parse failures (500)

**File created:**
- `app/api/generate/route.ts`

**Types defined:**
- `GenerateRequest` — input shape
- `GenerateResponse` — output shape (sms + email)

---

## Step 4: Shared Types

Create a shared types file used by both frontend and backend.

**Actions:**
- Create `app/types.ts` with `GenerateRequest` and `GenerateResponse` interfaces

**File created:**
- `app/types.ts`

---

## Step 5: Frontend UI — Single Page Form + Results

Build the main page with form inputs, generate button, loading state, and results display.

**Actions:**
- Replace `app/page.tsx` with the crisis message generator UI
- Mark as `"use client"` for interactivity
- Form section with:
  - Incident Type (text input)
  - Location (text input)
  - Confirmed Facts (textarea)
  - "Generate Messages" button
- State management:
  - Form fields state
  - Loading state (boolean)
  - Results state (GenerateResponse | null)
  - Error state (string | null)
- On submit:
  - Validate fields are non-empty
  - Set loading, clear previous results/errors
  - POST to `/api/generate`
  - Parse response JSON
  - Display results or error
- Results section:
  - SMS message with character count badge
  - Copy to clipboard button for SMS
  - Email subject displayed
  - Email body displayed (preserving line breaks)
- Styling:
  - Centered container (max-w-2xl, mx-auto)
  - Responsive padding
  - Clean card-style sections
  - Tailwind utility classes only
  - Disabled button state while loading

**File modified:**
- `app/page.tsx`

---

## Step 6: Global Styles Cleanup

**Actions:**
- Clean up `app/globals.css` — keep Tailwind directives, remove Next.js boilerplate styles
- Update `app/layout.tsx` — set proper page title and description metadata

**Files modified:**
- `app/globals.css`
- `app/layout.tsx`

---

## Step 7: Build Verification

**Actions:**
- Run `npm run build` to confirm no TypeScript errors and successful production build
- Fix any issues found

---

## Step 8: Commit and Push

**Actions:**
- Commit all changes with a descriptive message
- Push to `claude/basic-mvp-foundation-2gRlG`

---

## File Tree (Final)

```
hyper-reach-ai-assistant/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts        # OpenAI API route
│   ├── globals.css              # Tailwind base styles
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Main UI (form + results)
│   └── types.ts                 # Shared TypeScript interfaces
├── .env.local.example           # Environment variable template
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## What This MVP Does NOT Include (deferred to later phases)

- No translations / multilingual support
- No compliance flags or regulatory checks
- No voice generation
- No schema enforcement (Zod, etc.)
- No database or persistence
- No authentication
- No rate limiting
- No streaming responses
