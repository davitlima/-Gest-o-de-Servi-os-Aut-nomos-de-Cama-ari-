<?php

declare(strict_types=1);

namespace Nexlar;

final class Supabase
{
    public function __construct(
        private readonly string $url,
        private readonly string $publicKey,
        private readonly string $serviceKey,
    ) {
    }

    public static function fromEnvironment(): self
    {
        return new self(
            rtrim(Config::get('SUPABASE_URL'), '/'),
            Config::get('SUPABASE_PUBLISHABLE_KEY'),
            Config::get('SUPABASE_SERVICE_ROLE_KEY', false),
        );
    }

    public function user(string $token): array
    {
        return $this->request('GET', '/auth/v1/user', null, $token, false);
    }

    public function rest(string $method, string $path, ?array $body, string $token, bool $service = false): array
    {
        return $this->request($method, '/rest/v1/' . ltrim($path, '/'), $body, $token, $service);
    }

    private function request(string $method, string $path, ?array $body, string $token, bool $service): array
    {
        $key = $service ? $this->serviceKey : $this->publicKey;
        if ($service && $key === '') {
            throw new \RuntimeException('SUPABASE_SERVICE_ROLE_KEY é necessária para confirmar pagamentos.');
        }
        $headers = [
            'apikey: ' . $key,
            'Authorization: Bearer ' . ($service ? $key : $token),
            'Accept: application/json',
            'Content-Type: application/json',
            'Prefer: return=representation',
        ];

        $handle = curl_init($this->url . $path);
        curl_setopt_array($handle, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
        ]);
        if ($body !== null) {
            curl_setopt($handle, CURLOPT_POSTFIELDS, json_encode($body, JSON_THROW_ON_ERROR));
        }

        $response = curl_exec($handle);
        $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $error = curl_error($handle);
        if ($response === false) {
            throw new \RuntimeException('Falha de conexão com o Supabase: ' . $error);
        }

        $decoded = $response === '' ? [] : json_decode($response, true);
        if ($status < 200 || $status >= 300) {
            $message = is_array($decoded) ? ($decoded['message'] ?? $decoded['msg'] ?? 'Erro no banco de dados') : 'Erro no banco de dados';
            throw new HttpError($status ?: 502, (string) $message);
        }

        return is_array($decoded) ? $decoded : [];
    }
}

final class HttpError extends \RuntimeException
{
    public function __construct(public readonly int $status, string $message)
    {
        parent::__construct($message);
    }
}


