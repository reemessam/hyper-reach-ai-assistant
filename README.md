# AI Crisis Message Generator

Generate structured emergency SMS and email communications from confirmed incident details.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your OpenRouter API key (get one free at [openrouter.ai](https://openrouter.ai/keys)):

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=mistralai/llama-4-maverick:free
LLM_MOCK=false
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
- OpenRouter API (llama-4-maverick:free by default)

## Deploy to Vercel

Set the `OPENROUTER_API_KEY` environment variable in your Vercel project settings, then deploy. Set `LLM_MOCK=true` to test without an API key.