# Summer Redline

Baseball Development Dashboard

Summer Redline is a mobile-first baseball development dashboard for throwing, hitting, physical performance, recovery, readiness, logging, and earned progression.

Patch notes: v2.0 - Premium UX Rebuild: cleaner visual system, redesigned Today dashboard, session detail pages, faster logging flow, Progress lane tabs, official May 18 start date, and reduced text-heavy clutter.

Roadmap:
- v2.x - Full Integrated Plan + Progress

## Run Locally

Install Node.js 18+ if `npm` is not already available.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
```

The production build is created in `dist/`.

## Deploy

The project is a static Vite app. The production build output is `dist/`.

### Vercel

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In Vercel, create a new project and import the repository.
3. Use these settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Deploy.

The included `vercel.json` pins the same settings and adds an SPA fallback.

### Netlify

1. Push this project to a GitHub, GitLab, Bitbucket, or Azure DevOps repository.
2. In Netlify, add a new site from Git and choose the repository.
3. Use these settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy.

The included `netlify.toml` pins the same settings and adds an SPA fallback.

## Add to iPhone Home Screen

After deployment:

1. Open the deployed URL in Safari on iPhone.
2. Tap Share.
3. Tap Add to Home Screen.
4. Confirm the name Summer Redline.

The app already includes a web manifest, mobile viewport metadata, theme color, and icon so it is ready for a basic PWA-style install flow. It does not include offline caching yet.

## Local Data

All app data is saved in browser local storage:

- `summerRedline_plan`
- `summerRedline_logs`
- `summerRedline_settings`
- `summerRedline_drills`
- `summerRedline_checkins`

Use Reference / Settings to export logs as CSV, export a JSON backup, import a JSON backup, reset the plan, or reset all app data.
