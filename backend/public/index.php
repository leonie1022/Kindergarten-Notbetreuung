<?php

declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../db.php';

// CORS
$config = require __DIR__ . '/../config.php';
$allowedOrigins = $config['cors_origins'] ?? ['*'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array('*', $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: *');
} elseif ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function input_params(): array {
    // Prefer form-encoded POST to avoid CORS preflight; otherwise use JSON body
    if (!empty($_POST)) {
        return $_POST;
    }
    // Some servers send content-type with charset; check contains
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ct, 'application/x-www-form-urlencoded') !== false) {
        return $_POST ?? [];
    }
    return json_input();
}

function error_json(string $message, int $status = 400): void {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

function ok_json($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Routing
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Strip query string
if (($qpos = strpos($uri, '?')) !== false) {
    $uri = substr($uri, 0, $qpos);
}

// Only handle /api/*
if (!str_starts_with($uri, '/api')) {
    error_json('Not Found', 404);
}

$pdo = get_pdo();

// Routes
// GET /api/dates
if ($method === 'GET' && $uri === '/api/dates') {
    $stmt = $pdo->query('SELECT id, date_value AS date, label FROM dates ORDER BY date_value ASC');
    $rows = $stmt->fetchAll();
    ok_json($rows);
}

// GET /api/offers?date_id=...
if ($method === 'GET' && $uri === '/api/offers') {
    $dateId = isset($_GET['date_id']) ? (int)$_GET['date_id'] : 0;
    if ($dateId <= 0) error_json('Missing or invalid date_id');
    $stmt = $pdo->prepare('SELECT id, date_id, child_name, `group`, taken_by_name, created_at, taken_at
                           FROM offers WHERE date_id = ? ORDER BY created_at ASC');
    $stmt->execute([$dateId]);
    ok_json($stmt->fetchAll());
}

// POST /api/offers
if ($method === 'POST' && $uri === '/api/offers') {
    $body = input_params();
    $dateId = (int)($body['date_id'] ?? 0);
    $childName = trim((string)($body['child_name'] ?? ''));
    $group = strtoupper(trim((string)($body['group'] ?? '')));
    if ($dateId <= 0 || $childName === '' || !in_array($group, ['A', 'B', 'C', 'D'], true)) {
        error_json('Invalid payload: date_id, child_name, group required');
    }

    // Ensure date exists
    $chk = $pdo->prepare('SELECT id FROM dates WHERE id = ?');
    $chk->execute([$dateId]);
    if (!$chk->fetch()) error_json('Unknown date_id', 404);

    $stmt = $pdo->prepare('INSERT INTO offers (date_id, child_name, `group`) VALUES (?, ?, ?)');
    $stmt->execute([$dateId, $childName, $group]);
    $id = (int)$pdo->lastInsertId();

    $row = [
        'id' => $id,
        'date_id' => $dateId,
        'child_name' => $childName,
        'group' => $group,
        'taken_by_name' => null,
        'created_at' => date('c'),
        'taken_at' => null,
    ];
    ok_json($row, 201);
}

// POST /api/offers/{id}/take
if ($method === 'POST' && preg_match('#^/api/offers/(\d+)/take$#', $uri, $m)) {
    $offerId = (int)$m[1];
    if ($offerId <= 0) error_json('Invalid offer id');
    $body = input_params();
    $takerName = trim((string)($body['taker_name'] ?? ''));
    if ($takerName === '') error_json('taker_name required');

    // Atomic take: only if not taken yet
    $stmt = $pdo->prepare('UPDATE offers SET taken_by_name = ?, taken_at = NOW() WHERE id = ? AND taken_by_name IS NULL');
    $stmt->execute([$takerName, $offerId]);
    if ($stmt->rowCount() === 0) {
        error_json('Offer already taken or does not exist', 409);
    }

    // Return updated row
    $sel = $pdo->prepare('SELECT id, date_id, child_name, `group`, taken_by_name, created_at, taken_at FROM offers WHERE id = ?');
    $sel->execute([$offerId]);
    $row = $sel->fetch();
    ok_json($row);
}

error_json('Not Found', 404);
