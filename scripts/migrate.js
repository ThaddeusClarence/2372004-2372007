const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

const migrationsDir = path.resolve(__dirname, '..', 'migrations');
const schemaTable = 'schema_migrations';

function quoteIdentifier(identifier) {
    if (!/^[A-Za-z0-9_$]+$/.test(identifier)) {
        throw new Error(`Unsafe SQL identifier: ${identifier}`);
    }
    return `\`${identifier}\``;
}

async function getMigrationFiles() {
    const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
        .map((entry) => entry.name)
        .sort();
}

async function createConnection(includeDatabase = true) {
    return mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: includeDatabase ? dbConfig.database : undefined,
        multipleStatements: true
    });
}

async function ensureDatabase() {
    const connection = await createConnection(false);
    try {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(dbConfig.database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
    } finally {
        await connection.end();
    }
}

async function ensureSchemaTable(connection) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS ${quoteIdentifier(schemaTable)} (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function getAppliedMigrations(connection) {
    const [rows] = await connection.query(`SELECT filename FROM ${quoteIdentifier(schemaTable)} ORDER BY filename`);
    return new Set(rows.map((row) => row.filename));
}

async function printStatus(connection, files) {
    const applied = await getAppliedMigrations(connection);
    for (const file of files) {
        const status = applied.has(file) ? 'applied' : 'pending';
        console.log(`${status.padEnd(8)} ${file}`);
    }
}

async function run() {
    const showStatus = process.argv.includes('--status');
    const showHelp = process.argv.includes('--help') || process.argv.includes('-h');

    if (showHelp) {
        console.log('Usage: npm run migrate [-- --status]');
        console.log('Runs pending SQL migrations from the migrations/ directory.');
        return;
    }

    try {
        await ensureDatabase();
    } catch (err) {
        console.warn(`Warning: Could not ensure database existence: ${err.message}. Proceeding to connect directly...`);
    }
    const connection = await createConnection(true);

    try {
        await ensureSchemaTable(connection);
        const files = await getMigrationFiles();

        if (showStatus) {
            await printStatus(connection, files);
            return;
        }

        const applied = await getAppliedMigrations(connection);
        let appliedCount = 0;

        for (const file of files) {
            if (applied.has(file)) continue;

            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf8');

            console.log(`Applying ${file}...`);
            await connection.query(sql);
            await connection.execute(`INSERT INTO ${quoteIdentifier(schemaTable)} (filename) VALUES (?)`, [file]);
            appliedCount += 1;
        }

        if (appliedCount === 0) {
            console.log('Database is already up to date.');
        } else {
            console.log(`Applied ${appliedCount} migration(s).`);
        }
    } finally {
        await connection.end();
    }
}

run().catch((error) => {
    console.error('Migration failed:');
    console.error(error.message);
    process.exit(1);
});
