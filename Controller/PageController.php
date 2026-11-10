<?php

declare(strict_types=1);

namespace Nexlar\Mvc;

final class PageController
{
    public function show(string $page): void
    {
        if (!Page::exists($page)) {
            http_response_code(404);
            App::view('errors/404');
            return;
        }

        App::view('page', [
            'page' => $page,
            'source' => Page::path($page),
        ]);
    }
}

