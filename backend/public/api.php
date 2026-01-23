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

    // Return full skills tree (all defined skills).
    if ($method === 'GET' && $path === 'skills/tree') {
        $pdo = sb_get_pdo();

        $stmt = $pdo->query('SELECT id, `key`, name, icon, description, x, y, base_cost, cost_per_level, max_level, effect_type, effect_value_per_level FROM skills ORDER BY id');
        $skills = $stmt->fetchAll();

        echo json_encode($skills);
        exit;
    }

    // Return current player's coins summary and owned skill levels.
    if ($method === 'GET' && $path === 'player/skills') {
        if (empty($_COOKIE['sb_player_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing player']);
            exit;
        }

        $playerId = (int) $_COOKIE['sb_player_id'];
        $pdo = sb_get_pdo();

        // Aggregate total coins from player_stats for this player.
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(coins), 0) AS total_coins FROM player_stats WHERE player_id = :player_id');
        $stmt->execute([':player_id' => $playerId]);
        $row = $stmt->fetch();
        $coins = (int) ($row['total_coins'] ?? 0);

        // Fetch current levels per skill for this player.
        $stmt = $pdo->prepare('SELECT s.`key` AS skillKey, ps.current_level FROM player_skills ps JOIN skills s ON ps.skill_id = s.id WHERE ps.player_id = :player_id');
        $stmt->execute([':player_id' => $playerId]);
        $skills = $stmt->fetchAll();

        echo json_encode([
            'coins' => $coins,
            'skills' => $skills,
        ]);
        exit;
    }

    // Unlock or level-up a single skill for the current player.
    if ($method === 'POST' && $path === 'player/skills/unlock') {
        if (empty($_COOKIE['sb_player_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing player']);
            exit;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!is_array($data) || empty($data['skillKey'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing skillKey']);
            exit;
        }

        $skillKey = (string) $data['skillKey'];
        $playerId = (int) $_COOKIE['sb_player_id'];
        $pdo = sb_get_pdo();

        // Look up the skill.
        $stmt = $pdo->prepare('SELECT * FROM skills WHERE `key` = :key LIMIT 1');
        $stmt->execute([':key' => $skillKey]);
        $skill = $stmt->fetch();

        if (!$skill) {
            http_response_code(404);
            echo json_encode(['error' => 'Unknown skill']);
            exit;
        }

        $skillId   = (int) $skill['id'];
        $x         = (int) $skill['x'];
        $y         = (int) $skill['y'];
        $baseCost  = (int) $skill['base_cost'];
        $stepCost  = (int) $skill['cost_per_level'];
        $maxLevel  = (int) $skill['max_level'];

        // Compute current level if it exists.
        $stmt = $pdo->prepare('SELECT current_level FROM player_skills WHERE player_id = :player_id AND skill_id = :skill_id LIMIT 1');
        $stmt->execute([
            ':player_id' => $playerId,
            ':skill_id'  => $skillId,
        ]);
        $row = $stmt->fetch();
        $currentLevel = $row ? (int) $row['current_level'] : 0;

        if ($currentLevel >= $maxLevel) {
            http_response_code(400);
            echo json_encode(['error' => 'Skill already at max level']);
            exit;
        }

        $nextLevel = $currentLevel + 1;

        // Enforce simple positional prerequisite: nearest skill toward (0,0) must be owned.
        if (!($x === 0 && $y === 0)) {
            $parentX = $x;
            $parentY = $y;

            if ($x > 0) {
                $parentX = $x - 2;
            } elseif ($x < 0) {
                $parentX = $x + 2;
            } elseif ($y > 0) {
                $parentY = $y - 2;
            } elseif ($y < 0) {
                $parentY = $y + 2;
            }

            // If parent is not the center, assume any level >= 1 is enough.
            $stmt = $pdo->prepare('SELECT id FROM skills WHERE x = :x AND y = :y LIMIT 1');
            $stmt->execute([
                ':x' => $parentX,
                ':y' => $parentY,
            ]);
            $parent = $stmt->fetch();

            if ($parent) {
                $parentId = (int) $parent['id'];
                $stmt = $pdo->prepare('SELECT current_level FROM player_skills WHERE player_id = :player_id AND skill_id = :skill_id LIMIT 1');
                $stmt->execute([
                    ':player_id' => $playerId,
                    ':skill_id'  => $parentId,
                ]);
                $parentRow = $stmt->fetch();

                if (!$parentRow || (int) $parentRow['current_level'] < 1) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing prerequisite']);
                    exit;
                }
            }
        }

        // Compute cost for this level.
        $cost = $baseCost + $stepCost * ($nextLevel - 1);

        // Compute total coins earned so far.
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(coins), 0) AS total_coins FROM player_stats WHERE player_id = :player_id');
        $stmt->execute([':player_id' => $playerId]);
        $row = $stmt->fetch();
        $totalCoins = (int) ($row['total_coins'] ?? 0);

        // Compute total coins already spent on skills.
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(spent_cost), 0) AS spent FROM (
            SELECT ps.current_level,
                   (s.base_cost * ps.current_level + s.cost_per_level * (ps.current_level * (ps.current_level - 1) / 2)) AS spent_cost
            FROM player_skills ps
            JOIN skills s ON ps.skill_id = s.id
            WHERE ps.player_id = :player_id_inner
        ) AS t');
        $stmt->execute([':player_id_inner' => $playerId]);
        $row = $stmt->fetch();
        $spentCoins = (int) ($row['spent'] ?? 0);

        $availableCoins = $totalCoins - $spentCoins;

        if ($availableCoins < $cost) {
            http_response_code(400);
            echo json_encode(['error' => 'Not enough coins', 'available' => $availableCoins, 'required' => $cost]);
            exit;
        }

        // Upsert player_skills row.
        if ($currentLevel === 0) {
            $stmt = $pdo->prepare('INSERT INTO player_skills (player_id, skill_id, current_level, unlocked_at) VALUES (:player_id, :skill_id, :level, NOW())');
        } else {
            $stmt = $pdo->prepare('UPDATE player_skills SET current_level = :level WHERE player_id = :player_id AND skill_id = :skill_id');
        }

        $stmt->execute([
            ':player_id' => $playerId,
            ':skill_id'  => $skillId,
            ':level'     => $nextLevel,
        ]);

        // Recalculate available coins after this purchase.
        $availableCoins -= $cost;

        echo json_encode([
            'ok' => true,
            'skillKey' => $skillKey,
            'current_level' => $nextLevel,
            'availableCoins' => $availableCoins,
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
    // Log detailed error server-side for debugging, but keep response minimal.
    $logLine = sprintf("[%s] %s in %s:%d\n", date('Y-m-d H:i:s'), $e->getMessage(), $e->getFile(), $e->getLine());
    @file_put_contents(__DIR__ . '/../error.log', $logLine, FILE_APPEND);

    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
    ]);
}
