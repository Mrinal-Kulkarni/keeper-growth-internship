# Keeper Photo Finder

A Next.js application that helps users choose the strongest two or three photos of themselves for a Keeper profile. It supports the native iOS Photos picker and desktop drag-and-drop/file browsing, then uses AI to compare the submitted candidates.

## What the app does

Keeper Photo Finder asks the user to provide a group of recent, representative photos of themselves. It works across:

- **iPhone and iPad:** tapping **Choose photos** opens the native iOS picker, where the user can select images from their Photo Library.
- **Desktop:** the user can drag photos into the upload area or browse Finder/File Explorer.

Before choosing files, the user selects whether they want a final set of two or three photos. They can review and remove candidates before explicitly starting AI analysis. Resized copies are sent to the server and evaluated for clear visibility of the person, natural expression, focus, lighting, composition, and variety. The AI returns exactly the requested number of photos with a score and concise reason for each choice.

The complete flow is:

1. Choose whether the final set should contain two or three photos.
2. Upload photos of yourself from the iOS Photos picker or a desktop device.
3. Review the candidates and remove accidental selections.
4. Confirm that resized copies can be securely sent for AI analysis.
5. Receive the strongest two or three photos, ranked with selection reasons.
6. Try another set or continue to Keeper.

The AI is instructed to assess profile-photo effectiveness rather than attractiveness and must not infer sensitive traits. API responses use `store: false`. The final choice always remains with the user.

## Run locally

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `OPENAI_API_KEY` in `.env.local`, then open `http://localhost:3000`. `OPENAI_MODEL` is optional and defaults to `gpt-5.4-mini`. Never expose the API key through a `NEXT_PUBLIC_` variable.

## Production

```bash
npm run lint
npm run test:unit
npm run build
npm run start
```

The app requires Node.js 22.13 or newer and can run on any platform that supports Next.js 16 server routes. Configure `OPENAI_API_KEY` as a protected server-side environment variable in the hosting platform.

## Supported uploads

- JPEG, PNG, and WebP
- Up to 20 files per analysis
- Up to 25 MB per original file

Unsupported and oversized files are skipped with an in-app notice. Before transmission, the browser resizes candidates to a maximum dimension of 1600 pixels and converts them to compressed JPEG copies. Local preview URLs are revoked when results are cleared, replaced, or the page is closed.

## AI processing

The server route uses the OpenAI Responses API with image inputs and a strict JSON schema. It returns only selected candidate indices, scores, and reasons; the application does not persist image data. See the [official OpenAI Responses API documentation](https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create).

## Failure handling

Duplicate file selections, empty files, and unsupported formats are skipped with an explanation. Unreadable images are removed before submission, allowing the user to review the remaining set. Images are resized sequentially to reduce peak browser memory use. Analysis can be cancelled and has a timeout; invalid AI selections are rejected and valid selections are ordered by score.

The server limits processed files to 6 MB each and the complete upload to 32 MB. The Open Keeper link opens Keeper; it does not transfer the selected photos.
