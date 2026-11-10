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

        $path = Page::path($page);
        if (str_starts_with($path, dirname(__DIR__) . '/View/')) {
            $view = substr($path, strlen(dirname(__DIR__) . '/View/'), -4);
            App::view($view, ['page' => $page]);
            return;
        }
        App::view('page', ['page' => $page, 'source' => $path]);
    }
}

