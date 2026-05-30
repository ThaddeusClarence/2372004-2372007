# TravelGo — Developer Setup Guide

Welcome to the **TravelGo** developer setup guide! This document will walk you through setting up your local environment using Node.js, Express, and MySQL (via XAMPP or standard MySQL).

For a high-level architectural overview, requirements, design documentation, and roadmap details, please refer to the **[README.md](README.md)**.

---

## Prerequisites

Ensure you have the following installed on your machine:

| Software | Version | Download |
| :--- | :--- | :--- |
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| **XAMPP** (or MySQL Server) | Any (MySQL 5.7+ / MariaDB 10.3+) | [apachefriends.org](https://www.apachefriends.org/) |
| MySQL Workbench *(Optional)* | Latest | [dev.mysql.com](https://dev.mysql.com/downloads/workbench/) |

> [!NOTE]
> This is a Node.js / Express / Pug application. You **do not** need PHP, Composer, or Laravel. Do not run any `composer install` or `php artisan` commands.

---

## Step-by-Step Installation

### Step 1 — Clone the Repository

Clone this project repository to your local machine and navigate into the project directory:

```bash
git clone <repository-url>
cd 2372004-2372007
```

### Step 2 — Install Node.js Dependencies

Install all dependencies listed in `package.json`:

```bash
npm install
```

### Step 3 — Configure Environment Variables

1. Copy the example environment configuration file to create your active `.env` file:

   * **Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```
   * **macOS / Linux / Git Bash**:
     ```bash
     cp .env.example .env
     ```

2. Open the `.env` file in your editor and configure the database details to match your MySQL server:

   ```dotenv
   APP_NAME=TravelGo
   APP_ENV=local
   APP_URL=http://localhost:3000
   PORT=3000

   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=travelgo
   DB_USERNAME=root
   DB_PASSWORD=

   SESSION_SECRET=travelgo-secret-key
   ```

   > [!NOTE]
   > For default XAMPP setups, the database username is `root` and the password is blank (empty).

### Step 4 — Check Database Connectivity

Start **MySQL** from your XAMPP Control Panel (or your standalone MySQL server), then verify that the database connection configuration is correct and that the database is reachable:

```bash
node check-db.js
```

If it connects, you will see a list of tables (or an empty list if this is a fresh setup). If it fails, check that your MySQL server is running and that your `.env` settings are correct.

### Step 5 — Run Database Migrations

You do not need to manually import a `.sql` dump. The project contains a built-in migration runner that will automatically create the database (if it doesn't exist), establish all schemas, and seed the default accounts:

```bash
npm run migrate
```

Verify that all migrations have been successfully applied by checking their status:

```bash
npm run migrate:status
```

---

## Default Accounts

The initial database migrations seed two default accounts for testing:

### 🛡️ Admin Account
* **Email**: `admin@travelgo.com`
* **Username**: `admin123`
* **Password**: `admin123`

### 👤 Customer Account
* **Email**: `budi@example.com`
* **Username**: `budi`
* **Password**: `cust123`

---

## Running the Application

To start the server in production/normal mode:

```bash
npm start
```

For development mode (starts the application with `nodemon` for auto-restarting when files are modified):

```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**! 🎉

---

## Database Migration & Schema Change Workflow

To ensure clean teamwork and smooth integration of changes, follow these strict database guidelines.

### 1. After pulling updates (`git pull`)
Whenever you pull new commits from GitHub, your database might need schema updates. Run:

```bash
git pull
npm install
npm run migrate
```

This will run **only** the new migration scripts, preserving all your existing local databases and data.

### 2. When creating a database schema change
**Rule 1: Never edit an already-applied migration file.** Since the migration runner tracks applied filenames in the `schema_migrations` table, editing a file that has already run locally or on a classmate's machine will not trigger updates.

**Rule 2: Always create a new migration file.** Follow these steps to introduce columns, tables, or indexes:

1. Look in the `migrations/` folder to find the next available sequential number. For example:
   ```text
   001_initial_schema.sql
   002_seed_default_users.sql
   003_normalize_notifications_table.sql
   004_add_current_app_indexes.sql
   ```
2. Create the next file, starting with the padded sequential number and a descriptive name. E.g., `005_add_cancellation_requests.sql`.
3. Add your standard DDL SQL queries (use `IF NOT EXISTS` where applicable for safety). E.g.:
   ```sql
   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_reason TEXT NULL;
   ```
4. Run your migration locally to test it:
   ```bash
   npm run migrate
   npm run migrate:status
   ```
5. Commit the migration file alongside the JavaScript code that depends on it.

---

## Troubleshooting

### "Error: ER_BAD_DB_ERROR: Unknown database 'travelgo'"
The database does not exist. Run `npm run migrate`, which will auto-create the database schema for you.

### "Nodemon command not found"
If you run `npm run dev` and nodemon is not recognized, run `npm install` again to ensure development dependencies are fully installed, or install nodemon globally: `npm install -g nodemon`.

### MySQL connection times out or fails
* Check that **MySQL** is running in your XAMPP Control Panel.
* Check that your `.env` port (`3306`) is not being used by a standalone MySQL/MariaDB service. If it is, either shut down that service or configure XAMPP/standalone to use a different port and update `DB_PORT` in your `.env`.
