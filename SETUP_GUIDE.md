# Setup Guide for We The Potato

## Database Seeding

After setting up the Neon PostgreSQL database, you need to populate the zipcodes table with US zipcode data.

### One-time Setup

1. **Verify DATABASE_URL in .env.local** (for local development):
   - The file should contain: `DATABASE_URL="postgresql://..."`
   - If you don't have it, copy it from Vercel Dashboard → Project Settings → Environment Variables

2. **Create the zipcodes table** using Drizzle migration:

```bash
npm run db:push
```

This will push the `zipcodes` table schema to your Neon database.

3. **Run the zipcode seed script** locally:

```bash
# Option 1: Using npm script (recommended - automatically loads .env.local)
npm run seed-zipcodes

# Option 2: Or directly with environment variable
DATABASE_URL="postgresql://..." npm run seed-zipcodes

# Option 3: Or with tsx directly
npx tsx scripts/seed-zipcodes.ts
```

This will populate the `zipcodes` table with all US zipcodes for the supported states:
- NY (New York) - 150+ zipcodes
- NJ (New Jersey) - 25+ zipcodes
- PA (Pennsylvania) - 100+ zipcodes
- CT (Connecticut) - 30+ zipcodes
- TX (Texas) - 400+ zipcodes

### Verifying the Setup

After seeding, you can test the zipcode lookup:

```bash
curl https://wethepotato.vercel.app/api/lookup-zip/10001
```

Expected response:
```json
{
  "state": "NY",
  "county": "New York",
  "city": "New York",
  "supported": true
}
```

### Adding More Zipcodes

To add more zipcodes to the database:

1. Edit `scripts/seed-zipcodes.ts`
2. Add zipcode entries to the `ZIPCODE_DATA` array
3. Run the seed script again

The script uses `onConflictDoNothing()` so it's safe to run multiple times - it will skip any zipcodes that already exist.

### Database Schema

The zipcodes table has the following structure:

```sql
CREATE TABLE zipcodes (
  zipcode VARCHAR(5) PRIMARY KEY,
  state VARCHAR(2) NOT NULL,
  county TEXT,
  city TEXT,
  latitude TEXT,
  longitude TEXT
);

CREATE INDEX IDX_zipcode_state ON zipcodes(state);
```

## Troubleshooting

### "DATABASE_URL is not set" error
- Verify the environment variable is set in Vercel
- For local development, create a `.env.local` file with your DATABASE_URL
- Restart your development server

### "relation zipcodes does not exist" error
- Run the seed script: `npm run seed-zipcodes`
- Verify the database connection is working

### Zipcode lookup returns 404
- Check that the zipcode is in the database: `SELECT * FROM zipcodes WHERE zipcode = '10001';`
- If not present, add it to `ZIPCODE_DATA` in the seed script and run again
