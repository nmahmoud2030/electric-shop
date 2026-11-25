# Electric Shop

POS + inventory + online catalog for an electrician tools shop.

## Stack

- TypeScript, Next.js, Tailwind
- Prisma + SQLite (local) — switch `DATABASE_URL` to Postgres for production
- Auth.js roles: `ADMIN`, `CASHIER`, `CUSTOMER`

## Quick start

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo logins

| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@electric.shop       | admin123    |
| Cashier | cashier@electric.shop     | cashier123  |

- Admin: `/admin` — products, prices, suppliers, reports, backups  
- Cashier: `/pos` — scan barcode, sell, print receipt (no price edit)  
- Store: `/` — public catalog  

## Hardware

- USB barcode scanner: works as keyboard input on the POS search field  
- Receipt / label printer: use Windows printer + browser Print  

## Backups

In Admin → Backups, run **Run backup now** to export finance + goods JSON into `/backups`.  
With Docker Postgres, `docker-compose.yml` includes a nightly `pg_dump` sidecar.
