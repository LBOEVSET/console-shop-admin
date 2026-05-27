# Console Shop — Admin Panel

Internal admin dashboard for managing the Console Shop platform, built with Next.js.

## Live URL

**[https://console-shop-admin.lboevset.com](https://console-shop-admin.lboevset.com)**

## Features

- Product, platform & category management
- Order management with status transitions
- Customer support ticket handling
- Article / news management
- User management

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Data fetching:** TanStack Query
- **Auth:** httpOnly cookie sessions
- **Deployment:** GKE (Google Kubernetes Engine), standalone output

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3030](http://localhost:3030).

Requires a `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:3012/api/v1
```

## Deployment

Pushing to the `dev` branch triggers GitHub Actions to build and deploy to GKE automatically.

See `console-shop-backend-config` for all Kubernetes manifests and the full deployment guide.
