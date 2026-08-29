# PersonalWeb architecture

## Purpose

Build a personal public portal containing self-introduction, blog posts, a resource/download library, comments, and controlled file uploads. The visual system combines a Wii-style home dashboard with an iBooks-style bookshelf for content collections.

## Baseline architecture

| Layer | Chosen baseline | Responsibility |
| --- | --- | --- |
| Source control | GitHub | Source review, history, release trigger. |
| Application | Next.js App Router + TypeScript | Public pages, server-side operations, SEO, administration UI. |
| Hosting | Vercel or Cloudflare Pages | Preview and production application deployment. |
| Data and identity | Supabase Postgres + Auth | Profiles, permissions, posts when dynamic, comments, audit records. |
| Object storage | Supabase Storage or Cloudflare R2 | Images, attachments, user-uploaded files, signed access. |
| Editorial content | MDX in Git at first | Blog content and revision-friendly authoring. |

This is a baseline, not a deployed system. The actual host and data provider must be recorded in `docs/DECISIONS.md` before implementation.

## Planned routes

| Route | Purpose |
| --- | --- |
| `/` | Wii-style portal dashboard and entry points. |
| `/about` | Introduction and external links. |
| `/blog` and `/blog/[slug]` | Article library and reader pages. |
| `/library` | iBooks-style resources and download shelves. |
| `/uploads` | Authenticated upload area, if public/user uploads are enabled. |
| `/admin` | Author/moderator management surface. |

## Security baseline

All write operations use server-side authentication and authorization. Every user-owned database row and object has an owner and visibility policy. Files are type- and size-validated before storage. Public comments require a moderation state, rate limit, and removal workflow. Environment secrets never enter Git.

## Visual system

- Home: soft white/blue Wii menu, rounded channel tiles, deliberate selected and pressed states.
- Collections: wooden shelves, cover cards, paper-like reading pages, restrained texture.
- Reading: high-contrast text and conventional responsive reading width; no textured background behind body copy.
- Accessibility: semantic navigation, visible focus, keyboard use, reduced motion, and mobile layouts are mandatory.
