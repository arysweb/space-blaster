<?php
// Basic MySQL configuration for Space Blaster.
// Loads credentials from backend/.env so they are easy to change without
// modifying code. Falls back to safe defaults for local development.

// Simple .env loader (KEY=VALUE per line, # for comments).
function sb_load_env(string $path): void {
    if (!is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }

        [$key, $value] = array_pad(explode('=', $line, 2), 2, null);
        $key = trim((string) $key);
        if ($key === '') {
            continue;
        }

        $value = $value === null ? '' : trim($value);
        // Strip surrounding quotes if present.
        if ($value !== '' && ($value[0] === '"' || $value[0] === '\'')) {
            $value = trim($value, "\"'");
        }

        $_ENV[$key] = $value;
    }
}

// Load env file located at backend/.env
sb_load_env(__DIR__ . '/../.env');

$DB_HOST = $_ENV['DB_HOST'] ?? 'localhost';
$DB_NAME = $_ENV['DB_NAME'] ?? 'space_blaster';
$DB_USER = $_ENV['DB_USER'] ?? 'root';
$DB_PASS = $_ENV['DB_PASS'] ?? '';

function sb_get_pdo(): PDO {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;

    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];

    return new PDO($dsn, $DB_USER, $DB_PASS, $options);
}
