<?php

declare(strict_types=1);

if (!isset($source) || !is_string($source) || !is_file($source)) {
    http_response_code(404);
    echo 'Página não encontrada.';
    return;
}

readfile($source);

