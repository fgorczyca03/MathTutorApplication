## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## What to add next (high impact)

If you want this repo to feel more complete, these are great next additions:

- **Session memory:** persist chat history per problem so students can refresh and continue.
- **Problem type classifier:** tag uploads as algebra, calculus, geometry, etc., then adapt prompt style.
- **Step checker mode:** let students submit *their* next step and get feedback before proceeding.
- **Teacher dashboard:** simple analytics on common student mistakes and stuck points.
- **Accessibility pass:** keyboard-first flow + alt text guidance + contrast checks.
