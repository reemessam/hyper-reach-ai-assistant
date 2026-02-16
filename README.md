# AI Crisis Message Generator

Generate structured emergency SMS and email communications from confirmed incident details.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your Gemini API key (get one free at [Google AI Studio](https://aistudio.google.com/apikey)):

```
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Google Gemini API (gemini-2.0-flash, free tier)

## Deploy to Vercel

Set the `GEMINI_API_KEY` environment variable in your Vercel project settings, then deploy.