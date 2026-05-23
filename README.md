## Nashwa

Nashwa is a student-focused social e-commerce platform built with Next.js, PostgreSQL, and Cloudinary. The app includes customer profiles, shop dashboards, admin tools, and direct image uploads for user and shop branding.

## Completed

- Shop profile photo upload and update flow
- Shop cover photo upload and update flow
- Admin login flow
- Cloudinary image upload pipeline with signed requests
- Profile and shop dashboard image refresh after save

## Local Setup

Install all dependencies (Node and Python) with one command:

```bash
npm run install:all
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

If the database needs to be prepared, run the DB script first:

```bash
npm run db
```

## Environment

The app expects a `.env` file with database, JWT, email, Google OAuth, and Cloudinary settings. The current setup uses PostgreSQL and Cloudinary signed uploads.

## Notes

- Admin login is available under `/admin/login`.
- Shop media uploads are handled in the shop dashboard.
- Profile photo uploads are handled on the profile page.
