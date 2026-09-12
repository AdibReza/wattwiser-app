# WattWiser — everyday commands. Run `just` to list them.
# Local development talks ONLY to the local Supabase (ports 553xx). The hosted
# database is reachable only from Vercel. See docs/architecture.md §4.

default:
    @just --list

# install packages (pnpm only — never npm)
install:
    rm -rf node_modules
    pnpm install

# start the local Supabase (Postgres + Studio) in Docker
up:
    supabase start

# stop the local Supabase
down:
    supabase stop

# show local Supabase URLs and status
status:
    supabase status

# apply pending schema migrations to the LOCAL database
migrate:
    pnpm db:migrate

# generate a new migration after editing lib/db/schema.ts
generate name:
    pnpm exec drizzle-kit generate --name {{name}}

# wipe the local database and re-apply all migrations (never touches the cloud)
db-reset:
    supabase db reset
    pnpm db:migrate

# open Supabase Studio for the local database
studio:
    open http://127.0.0.1:55323

# run the web app on http://localhost:3000 (start `just up` first)
run:
    pnpm dev

# production build + lint, the same checks Vercel runs
check:
    pnpm build
    pnpm exec eslint .

# load 30 days of demo data into the LOCAL database (skips if already there)
seed:
    pnpm db:seed

# remove the demo data and load it again
seed-reset:
    pnpm db:seed --reset

# remove the demo data only
seed-clear:
    pnpm db:seed --clear

# seed the HOSTED database — a deliberate one-off, normally blocked by lib/db/target.ts.
# Pass the DATABASE_URL from Vercel. Add --reset or --clear as a second argument.
#   just seed-cloud "postgresql://…"            load
#   just seed-cloud "postgresql://…" --clear    remove
seed-cloud url *args:
    ALLOW_CLOUD_DB=true DATABASE_URL="{{url}}" pnpm db:seed {{args}}
