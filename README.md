# Charlotte's Quest

A private, iPad-friendly Grade 3 practice app made specifically for Charlotte.

It can analyze homework photos with Gemini 3.6 Flash, identify the concepts being taught, and create fresh practice that focuses on understanding and transfer rather than copying the worksheet. It also includes a built-in multiplication-and-arrays mission based on Charlotte's current homework, so she can practice immediately even before Gemini is configured.

## What is included

- A polished child-facing practice experience with an original creature-adventure theme
- Parent photo upload from the camera or photo library
- Multi-page homework analysis with Gemini 3.6 Flash
- Parent review of detected concepts before practice begins
- 10-question, 20-question, 50-question, and Free Practice modes
- Fresh question formats rather than worksheet cloning
- Equal groups, arrays, rows and columns, story-to-equation, commutative property, and answer-label practice
- Practical, layered explanations after a wrong answer
- First-attempt scoring that does not change after a retry
- Separate tracking for mistakes corrected after help
- Adaptive question batches based on concept-level performance
- Local progress stored only in the current browser
- A deterministic Grade 3 math engine as a reliability fallback
- No accounts, advertisements, subscriptions, analytics vendors, or open-ended chatbot
- Installable web-app files for an iPad Home Screen

## Fastest local setup on a Mac

This project has no npm package dependencies. Node.js 20 or newer is the only requirement.

### 1. Open Terminal and enter the project folder

```bash
cd /path/to/charlotte-quest
```

### 2. Add the Gemini API key securely

```bash
bash setup-key.sh
```

The script creates `.env.local` with:

```text
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.6-flash
PORT=3000
```

The key stays on the server side and is never included in browser JavaScript.

### 3. Start the app

```bash
npm start
```

The terminal prints two addresses:

- `http://localhost:3000` for the Mac
- A local network address such as `http://192.168.1.25:3000` for the iPad

Keep the terminal window open. Connect the iPad to the same Wi-Fi network and open the printed iPad address in Safari.

You can also double-click `start.command` after the key has been configured.

## Use on the iPad

1. Open the local network address printed by `npm start`.
2. Charlotte can immediately use the built-in **Multiplication & Array Adventure**.
3. A parent can tap **Add today's homework** to take or choose new photos.
4. After reviewing the detected concepts, select a session length and hand the iPad to Charlotte.
5. To place the app on the Home Screen, use Safari's Share menu and choose **Add to Home Screen**.

## API-key CLI without the helper script

From the project folder:

```bash
printf "Paste Gemini API key: "
stty -echo
IFS= read -r GEMINI_API_KEY
stty echo
printf "\n"
printf 'GEMINI_API_KEY=%s\nGEMINI_MODEL=gemini-3.6-flash\nPORT=3000\n' "$GEMINI_API_KEY" > .env.local
chmod 600 .env.local
unset GEMINI_API_KEY
npm start
```

## Optional Vercel deployment

A hosted deployment is easier to reopen on the iPad and provides HTTPS.

```bash
cd /path/to/charlotte-quest
npm install -g vercel
vercel
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_MODEL production
vercel --prod
```

When Vercel asks for `GEMINI_MODEL`, enter:

```text
gemini-3.6-flash
```

Because this is a private family prototype, protect or avoid broadly sharing the deployment URL.

## How the learning loop works

### Parent side

1. Upload up to eight related pages.
2. The browser resizes them before upload.
3. Gemini analyzes the pages together and separates printed content, visible student work, and uncertain handwriting.
4. The parent reviews the concepts, visible strengths, practice needs, and practical strategy.
5. The parent chooses the session length.

### Charlotte side

1. One question appears at a time.
2. The app records the first submitted answer.
3. A correct first answer earns the first-try point.
4. A wrong first answer does not earn the point, but immediately opens practical, question-specific steps.
5. Charlotte can retry.
6. Correcting the question after help is celebrated and tracked without rewriting the original score.
7. Later question batches give more weight to concepts with lower first-attempt accuracy.

## Reliability design

Gemini handles multimodal concept analysis and personalized exercise generation. The app validates generated question structure and multiplication arithmetic. If Gemini is unavailable during question generation, the built-in Grade 3 engine supplies correct practice so the session can continue.

The built-in multiplication pack is tailored to these observed needs from Charlotte's current homework:

- Multiplication as equal groups
- Arrays
- Rows versus columns
- Turning a story into a multiplication equation
- Commutative property
- Naming the object actually being counted

The original homework photos are deliberately not bundled into the project, which reduces the chance of accidentally publishing personal schoolwork. The extracted private learning pack is included instead.

## Privacy behavior

- The API key remains server-side.
- Gemini requests use stateless interaction mode.
- Homework photos are not saved in browser progress.
- Only the structured learning pack and session summaries are stored locally.
- The app tells the parent to crop names and school details when convenient.
- `robots.txt` asks search engines not to index the site.

This remains a private prototype. A public children's product would need a separate privacy, parental-consent, security, account, and compliance design.

## File map

```text
charlotte-quest/
├── api/
│   ├── analyze.js
│   ├── generate.js
│   └── health.js
├── icons/
├── js/
│   ├── api.js
│   ├── app.js
│   ├── image-utils.js
│   ├── storage.js
│   └── ui-utils.js
├── lib/
│   ├── gemini.mjs
│   ├── handlers.mjs
│   ├── http.mjs
│   ├── prompts.mjs
│   └── schemas.mjs
├── shared/
│   ├── question-engine.js
│   └── sample-pack.js
├── index.html
├── styles.css
├── sw.js
├── manifest.webmanifest
├── server.mjs
├── setup-key.sh
├── start.command
├── vercel.json
└── package.json
```

## Checks

Run the built-in validation suite:

```bash
npm run check
```

It validates 50 generated questions, unique fingerprints, answer checking, multiplication arithmetic, schemas, and the local API health handler.
