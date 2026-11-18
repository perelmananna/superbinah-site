# superbinah.ai

The SuperBinah website. A small static site with no dependencies: `node build.js` turns the content files into finished pages in `dist/`, and Vercel serves them at superbinah.ai.

```
content/
  site.json              ← all home-page copy, email, LinkedIn
  projects/
    imitzvah.json        ← one file per project
static/
  styles.css             ← brand colours, type and layout
  img/                   ← logos, OG image, project images
  favicon.svg
build.js                 ← builds dist/ (Home, Projects, one page per project, Contact, 404, sitemap)
vercel.json              ← tells Vercel: run node build.js, serve dist/
```

## Add a project

1. Copy `content/projects/imitzvah.json` to `content/projects/<slug>.json` (the slug becomes the URL: superbinah.ai/projects/<slug>).
2. Fill in the fields:

| Field | What it is |
|---|---|
| `slug` | URL name, lowercase, no spaces |
| `order` | Position in lists (1 = first) |
| `name` | Project name |
| `summary` | One sentence shown on cards and as the page intro |
| `type` | e.g. "Mobile app & web", "AI agent", "Internal tool" |
| `stage` | e.g. "Prototype", "POC", "Live" |
| `year` | e.g. "2026" |
| `link` | Live URL, or "" for "Coming soon" |
| `cover` | Path to a cover image, e.g. "/img/projects/<slug>/cover.png" (16:10 works best), or "" for the branded sapphire cover |
| `images` | List of screenshot paths shown under the story, or [] |
| `challenge` | "The challenge" paragraph |
| `product` | "The product" paragraph |
| `status` | "Where it stands" paragraph |

3. Put any images in `static/img/projects/<slug>/`.
4. Commit and push. Vercel rebuilds and the project appears on Home (first four), on /projects and at its own URL, and in the sitemap.

## Preview locally

```
node build.js
npx serve dist        # or open dist/index.html
```

## Deploy (one-time setup)

1. Push this folder to a GitHub repo (e.g. `superbinah-site`).
2. In Vercel: **Add New → Project → Import** that repo. Framework preset: **Other**. Vercel reads `vercel.json`, so the build command (`node build.js`) and output folder (`dist`) are already set.
3. In the project: **Settings → Domains → Add** `superbinah.ai` and `www.superbinah.ai` (redirect www to the apex). The domain is registered with Vercel, so DNS is configured automatically.

After that, every push to `main` deploys.

## Contact form

The form opens the visitor's email app with the message addressed to the email in `content/site.json`. Make sure that address has a working mailbox or forwarding before launch.
