# AI Crisis Message Generator

Generate structured emergency SMS and email communications from confirmed incident details.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
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
- OpenAI API (gpt-4o-mini)

## Deploy to Vercel

Set the `OPENAI_API_KEY` environment variable in your Vercel project settings, then deploy.