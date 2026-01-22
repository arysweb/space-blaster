<?php
// Space Blaster backend API entrypoint.
// This will serve JSON only and is designed to support the SPA frontend.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Basic CORS preflight handling for POST/JSON
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

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

    // Register / upsert a player by name.
    if ($method === 'POST' && $path === 'player/register') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!is_array($data) || !isset($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing player name']);
            exit;
        }

        $name = trim((string) $data['name']);
        if ($name === '') {
            // Generate an anonymous name like Anon_1234
            $suffix = random_int(1000, 9999);
            $name = 'Anon_' . $suffix;
        }

        $pdo = sb_get_pdo();

        // Try to find existing player by name.
        $stmt = $pdo->prepare('SELECT id FROM players WHERE name = :name LIMIT 1');
        $stmt->execute([':name' => $name]);
        $row = $stmt->fetch();

        if ($row) {
            $playerId = (int) $row['id'];
            // For existing players, just bump last_seen_at; created_at is handled by MySQL.
            $pdo->prepare('UPDATE players SET last_seen_at = NOW() WHERE id = :id')
                ->execute([':id' => $playerId]);
        } else {
            // For new players, insert only the columns that actually exist in the schema
            // (id, name, created_at, last_seen_at). created_at defaults to CURRENT_TIMESTAMP.
            $stmt = $pdo->prepare(
                'INSERT INTO players (name, last_seen_at)
                 VALUES (:name, NOW())'
            );
            $stmt->execute([':name' => $name]);
            $playerId = (int) $pdo->lastInsertId();
        }

        // Remember this player via cookie for future requests.
        // 30-day lifetime, HttpOnly so JS doesn't touch it.
        setcookie('sb_player_id', (string) $playerId, [
            'expires'  => time() + 60 * 60 * 24 * 30,
            'path'     => '/',
            'secure'   => false,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        echo json_encode([
            'id' => $playerId,
            'name' => $name,
        ]);
        exit;
    }

    if ($method === 'POST' && $path === 'player/stats') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid payload']);
            exit;
        }

        if (empty($_COOKIE['sb_player_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing player']);
            exit;
        }

        $playerId = (int) $_COOKIE['sb_player_id'];

        $minutesPlayed = max(0, (int) ($data['minutesPlayed'] ?? 0));
        $kills         = max(0, (int) ($data['kills'] ?? 0));
        $deaths        = max(0, (int) ($data['deaths'] ?? 0));
        $score         = max(0, (int) ($data['score'] ?? 0));
        $coins         = max(0, (int) ($data['coins'] ?? 0));

        $pdo = sb_get_pdo();

        $stmt = $pdo->prepare(
            'INSERT INTO player_stats (player_id, started_at, ended_at, minutes_played, kills, deaths, score, coins)
             VALUES (:player_id, NOW(), NOW(), :minutes_played, :kills, :deaths, :score, :coins)'
        );

        $stmt->execute([
            ':player_id'      => $playerId,
            ':minutes_played' => $minutesPlayed,
            ':kills'          => $kills,
            ':deaths'         => $deaths,
            ':score'          => $score,
            ':coins'          => $coins,
        ]);

        echo json_encode(['ok' => true]);
        exit;
    }

    if ($method === 'GET' && $path === 'health') {
        echo json_encode(['status' => 'ok']);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
} catch (Throwable $e) {
    // Log detailed error server-side for debugging, but keep response minimal.
    $logLine = sprintf("[%s] %s in %s:%d\n", date('Y-m-d H:i:s'), $e->getMessage(), $e->getFile(), $e->getLine());
    @file_put_contents(__DIR__ . '/../error.log', $logLine, FILE_APPEND);

    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
    ]);
}
