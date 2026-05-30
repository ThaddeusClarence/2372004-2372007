# TravelGo

TravelGo is a Node.js / Express booking app for bus or shuttle travel. It uses MySQL/MariaDB for schedules, vehicles, users, bookings, seats, payments, and e-ticket data, with Pug templates for the UI.

> [!NOTE]
> For step-by-step installation, developer environment setup, and local database configuration instructions, please see the dedicated **[SETUP.md](SETUP.md)** guide.

## Tech Stack

- Node.js + Express
- Pug views
- MySQL / MariaDB, usually through XAMPP locally
- Socket.IO for realtime admin/customer updates
- bcrypt for password hashing
- qrcode for QR generation

## Prerequisites

Install these first:

- Node.js 18 or newer
- Git
- XAMPP, with MySQL/MariaDB enabled

You do not need Composer or Laravel Artisan for the current app.

## How to Work With This Project

Use the current Express structure as the source of truth. This project is not currently a Laravel app, even if older files or notes mention Laravel.

Important folders and files:

```text
app.js                         Express bootstrap, sessions, routes, Socket.IO
config/database.js             MySQL config loaded from .env
scripts/migrate.js             SQL migration runner
migrations/                    Source-of-truth database changes
routes/index.js                Public pages, login, register
routes/admin.js                Admin dashboard and operations
routes/customer.js             Customer dashboard, booking, payment, history
middleware/authAdmin.js        Admin role guard
utils/env.js                   Lightweight .env loader
utils/qrService.js             QR code helper
views/**/*.pug                 Pug page templates
public/css/*.css               Frontend styling
```

Recommended development loop:

1. Pull the latest code.

```bash
git pull
```

2. Install dependencies if `package.json` or `package-lock.json` changed.

```bash
npm install
```

3. Apply any new database migrations.

```bash
npm run migrate
```

4. Check migration state when something feels off.

```bash
npm run migrate:status
```

5. Start the development server.

```bash
npm run dev
```

6. Open the app at:

```text
http://localhost:3000
```

Before changing code, check the planning docs:

- `requirements.md` describes what the app must do.
- `design.md` describes the target Express architecture.
- `roadmap.md` describes progress from the current state to 100%.
- `tasks.md` lists the next implementation batches.

When adding features, prefer small changes that match the current Express/Pug/MySQL style. Keep business rules out of Pug templates where possible. For booking, seat, payment, ticket, and notification logic, prefer service modules over copying SQL into many route handlers.

## Setup From Zero

1. Clone the repository.

```bash
git clone <repository-url>
cd 2372004-2372007
```

2. Install Node dependencies.

```bash
npm install
```

3. Create your local environment file.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux/Git Bash:

```bash
cp .env.example .env
```

4. Check the database settings in `.env`.

For default XAMPP, this should work:

```env
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=travelgo
DB_USERNAME=root
DB_PASSWORD=
```

5. Start MySQL from XAMPP.

6. Run the migrations.

```bash
npm run migrate
```

This creates the `travelgo` database if it does not exist, creates the tables, and seeds the default accounts. You do not need to import a `.sql` file manually.

7. Start the app.

```bash
npm start
```

Open:

```text
http://localhost:3000
```

For development with auto-restart:

```bash
npm run dev
```

## Default Accounts

Admin:

```text
Email: admin@travelgo.com
Username: admin123
Password: admin123
```

Customer:

```text
Email: budi@example.com
Username: budi
Password: cust123
```

The login pages currently authenticate by email and password.

## Database Migrations

Migrations are the source of truth for the database.

Migration files live in:

```text
migrations/
```

The migration runner records applied files in:

```text
schema_migrations
```

To apply new database changes after pulling from GitHub:

```bash
npm run migrate
```

To see which migrations are already applied:

```bash
npm run migrate:status
```

## How to Add or Change the Database Schema

Do not edit an already-applied migration after teammates may have run it. The migration runner records filenames in `schema_migrations`, so changing the contents of an old migration will not automatically update teammates' databases. Add a new numbered migration instead.

Use this workflow for every schema change:

1. Find the latest migration number in `migrations/`.

```text
001_initial_schema.sql
002_seed_default_users.sql
003_normalize_notifications_table.sql
004_add_current_app_indexes.sql
```

2. Create the next numbered SQL file with a clear name.

```text
005_add_cancellation_requests.sql
```

3. Put only forward changes in the file.

Good examples:

```sql
CREATE TABLE IF NOT EXISTS cancellation_requests (...);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_reason TEXT NULL;
ALTER TABLE payments ADD INDEX IF NOT EXISTS payments_status_index (status);
```

Avoid these during normal team development:

```sql
DROP DATABASE travelgo;
DROP TABLE bookings;
TRUNCATE TABLE bookings;
```

4. Run the migration locally.

```bash
npm run migrate
```

5. Verify the migration state.

```bash
npm run migrate:status
```

6. Update the application code that uses the new schema.

7. Commit the migration file together with the code that depends on it.

After a teammate pulls your change, they should run:

```bash
git pull
npm install
npm run migrate
```

No dropping the database, no phpMyAdmin dumps, and no `php artisan migrate`.

### Schema Change Rules

- Add a new numbered SQL migration for every schema change.
- Keep migrations idempotent when possible with `IF NOT EXISTS`.
- Keep `.env` private. Commit `.env.example`, not `.env`.
- If a new feature needs a new env variable, add it to `.env.example` and document it.
- Keep seed data safe to rerun by using `ON DUPLICATE KEY UPDATE` when possible.
- Do not create or alter tables inside route handlers. Schema belongs in `migrations/`.
- Do not rely on manual phpMyAdmin edits. If the app needs it, write a migration.
- Commit schema changes and code changes together so the app and database stay compatible.

### Example: Adding a Column

Create a new migration such as:

```text
005_add_refund_reason_to_bookings.sql
```

Add the SQL:

```sql
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS refund_reason TEXT NULL;
```

Run:

```bash
npm run migrate
npm run migrate:status
```

Then update the route/service/view code that uses `refund_reason`.

### Example: Adding a New Table

Create a new migration such as:

```text
006_add_reschedule_requests.sql
```

Add the SQL:

```sql
CREATE TABLE IF NOT EXISTS reschedule_requests (
    request_id INT NOT NULL AUTO_INCREMENT,
    booking_id INT NOT NULL,
    target_schedule_id INT NOT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    notes TEXT NULL,
    PRIMARY KEY (request_id),
    KEY reschedule_requests_booking_id_index (booking_id),
    KEY reschedule_requests_target_schedule_id_index (target_schedule_id),
    CONSTRAINT reschedule_requests_booking_id_foreign
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    CONSTRAINT reschedule_requests_target_schedule_id_foreign
        FOREIGN KEY (target_schedule_id) REFERENCES schedules(schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Run the migration and commit it with the feature code.

## Important Notes

- Do not manually edit already-applied migration files after teammates have run them. Add a new migration instead.
- Do not use `php artisan migrate`; this project currently runs on Express, not Laravel.
- Keep `.env` private. Commit `.env.example`, not `.env`.
- The database name used by default is `travelgo`.
- If local data gets messy, prefer fixing it with a migration or a clear seed/update script. Only drop/reset your own local database when you understand that all local data will be lost.

## Useful Commands

```bash
npm install          # install dependencies
npm run migrate     # apply pending database migrations
npm run migrate:status
npm start           # start app at http://localhost:3000
npm run dev         # start with nodemon
```