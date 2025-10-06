<?php
// Copy this file and adjust as needed for your environment.

// Allow environment overrides for Docker and deployments
$env = fn($key, $default = null) => getenv($key) !== false ? getenv($key) : $default;

// CORS origins can be comma-separated via CORS_ORIGINS
$cors = $env('CORS_ORIGINS');
$cors_origins = $cors ? array_map('trim', explode(',', $cors)) : ['http://localhost:5173', 'http://127.0.0.1:5173'];

return [
    'db' => [
        'host' => $env('DB_HOST', '127.0.0.1'),
        'port' => (int)$env('DB_PORT', 3306),
        'database' => $env('DB_DATABASE', 'notbetreurung'),
        'user' => $env('DB_USER', 'root'),
        'password' => $env('DB_PASSWORD', ''),
        'charset' => $env('DB_CHARSET', 'utf8mb4'),
    ],
    // Allowed CORS origins for dev; use ['*'] for open or set to your frontend origin
    'cors_origins' => $cors_origins,
];
