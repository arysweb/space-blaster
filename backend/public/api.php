<?php
// Space Blaster backend API entrypoint.
// This will serve JSON only and is designed to support the SPA frontend.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';

try {
    if ($method === 'GET' && $path === 'stats') {
        echo json_encode([
            'totalPlayers' => null,
            'totalGamesPlayed' => null,
            'topScore' => null,
        ]);
        exit;
    }

    if ($method === 'GET' && $path === 'health') {
        echo json_encode(['status' => 'ok']);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage(),
    ]);
}
