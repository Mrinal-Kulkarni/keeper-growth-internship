# Keeper Growth Internship

Keeper growth prototypes built with Next.js, React, and TypeScript.

## Projects

| Directory | Application |
| --- | --- |
| Repository root | Keeper Lens: an interactive demographic preferences calculator. Estimates currently use hardcoded prototype formulas. |
| `best-photo-finder/` | Keeper Photo Finder: upload candidate photos and select a set of two or three with AI-assisted ranking. |
| `photo-quality-screener/` | Redirect application that sends visitors to the deployed Photo Finder. |

## Run locally

Requires Node.js 22.13 or newer and npm. Each application has its own dependencies and runs independently.

From the directory of the application you want to run:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. To run multiple apps at once, use different ports, for example `npm run dev -- --port 3001`.

For Photo Finder, first copy `best-photo-finder/.env.example` to `best-photo-finder/.env.local` and set the server-side `OPENAI_API_KEY`. See [Photo Finder setup and behavior](best-photo-finder/README.md) for details.

## Build

Run from the selected application's directory:

```bash
npm run build
npm run start
```

## Team collaboration

Create a branch for changes and open a pull request into `main`. Repository access is managed through GitHub Settings → Collaborators.

Local environment files, dependencies, and generated build output are excluded from version control.
