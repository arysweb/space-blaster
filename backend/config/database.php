<?php
// Basic MySQL configuration for Space Blaster.
// NOTE: Set your own credentials here and keep them out of version control in real projects.

$DB_HOST = 'localhost';
$DB_NAME = 'space_blaster';
$DB_USER = 'root';
$DB_PASS = '';

function sb_get_pdo(): PDO {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;

    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];

    return new PDO($dsn, $DB_USER, $DB_PASS, $options);
}
