# Contributing to the Website

This guide covers setup and development for the Accented website package.

**All commands should be run from the monorepo root.**

## Prerequisites

The website uses Netlify DB (PostgreSQL) for analytics. To develop locally, you'll need:

1. **A Netlify account** - Sign up at https://netlify.com
2. **A staging Netlify site** - Create a new site for development/testing purposes
3. **Netlify CLI** - Already included in dependencies

## Database Setup

### 1. Link to your staging site

```bash
pnpm --filter website exec netlify link
```

Select your staging site when prompted.

### 2. Create the database

If your staging site doesn't already have a database:

```bash
pnpm --filter website exec netlify db init
```

When asked "Set up Drizzle boilerplate?", choose **No** (we already have the schema).

This creates a PostgreSQL database connected to your staging site.

**Note:** If you already created a database via the Netlify web UI, you can skip this step.

### 3. Run migrations

```bash
pnpm --filter website db:migrate
```

This creates the necessary tables in your database.

## Development

### Running the dev server

```bash
pnpm website:dev
```

This runs `netlify dev`, which:
- Starts the Astro dev server
- Automatically provides database environment variables
- Connects to your staging database

### Working with the database

**View data:**
```bash
pnpm --filter website db:studio
```

Opens a web UI to browse tables and data.

**Making schema changes:**

1. Edit `packages/website/db/schema.ts`
2. Generate migration: `pnpm --filter website db:generate`
3. Apply migration: `pnpm --filter website db:migrate`
4. Commit both schema and migration files

**Important:** Migrations run against your staging database when using `netlify dev`. Be mindful of this when testing schema changes.

## Notes

- The database is shared with your staging site deployment
- To create an isolated database, create a separate Netlify site just for local development
- Database connection details are managed by Netlify CLI - no manual configuration needed
