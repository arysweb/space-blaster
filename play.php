<?php
// play.php - gated entry to the Space Blaster game shell

// If cookie not set, send back to main screen so the name modal runs.
if (empty($_COOKIE['sb_player_id'])) {
    header('Location: ./'); // redirect to the SPA shell in the same directory
    exit;
}

// If cookie exists, serve the SPA shell (index.html)
readfile(__DIR__ . '/index.html');