# Our Lineage: the Domingo Bautista and Pastora Cayabyab Clan

A wall poster of the clan genealogy, printed from a web page. The record is Ofelia K. Bautista's
"Our Lineage" document dated 10 December 2024, transcribed into `prisma/data.ts` and checked page by
page against the scan.

Live: https://bautista-cayabyab.stimmie.dev

## Printing the poster

1. Open the site and press **Print / save PDF**.
2. Paper size **A0 landscape**, scale **100%**, margins default, background graphics on.
3. The layout is one sheet. A1 at "fit to page" also reads fine from a metre away.

The screen view is the same sheet; click any name for details.

## Editing the record

The data lives in `prisma/data.ts`. Each person has a lineage code that follows the document's own
numbering (`1.3.x` for Domingo and Pastora's descendants, `C.*` and `B.*` for the two ancestral
lines, `.s` for a spouse). After editing:

```bash
npm run db:seed:local    # rebuild dev.db and the local D1 copy
npm test                 # cross-checks the data against the scan
npm run db:seed:remote   # push to the production D1 database
```

Editors can also log in on the site and change biographies in place.

## Development

```bash
npm ci
npx prisma generate
npm run db:seed:local
npm run dev
```

`npm run check` runs lint, format check, typecheck, and tests. CI runs the same on every push and
pull request, then deploys `main` to Cloudflare Workers.

## Deployment

Cloudflare Workers via OpenNext, with a D1 database bound as `DB` (see `wrangler.jsonc`). Deploys need
two repository secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Runtime secrets on the
worker: `JWT_SECRET`. The admin user is created by the seed from `ADMIN_USERNAME` and
`ADMIN_PASSWORD`; change the password after seeding.

---

_☕ If you found this project useful, you can support my work at [kape.stimmie.dev](https://kape.stimmie.dev)!_
