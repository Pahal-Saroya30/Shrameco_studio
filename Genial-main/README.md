# Genial Eco-Villas

A luxury eco-villa website built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- Next.js 15 with App Router
- Responsive landing page layout
- Animated hero, gallery, FAQ, and contact sections
- Tailwind CSS utility styling
- Form validation with `react-hook-form` and `zod`
- TypeScript for type safety
- Server and client components

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the site in your browser.

## Scripts

- `npm run dev` — Start Next.js development server
- `npm run build` — Create a production build
- `npm start` — Start production server
- `npm run lint` — Run ESLint across the project

## Project Structure

- `app/` — Next.js app router pages and layouts
- `src/components/` — React UI components
- `src/lib/utils.ts` — Utility functions and animation variants
- `tailwind.config.js` — Tailwind CSS configuration
- `next.config.js` — Next.js configuration

## Building for Production

To build for production:

```bash
npm run build
npm start
```

The optimized output is generated in the `.next/` folder.