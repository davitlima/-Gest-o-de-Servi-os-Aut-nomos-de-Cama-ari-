<?php

declare(strict_types=1);

require __DIR__ . '/../api/Domain.php';

use Nexlar\Domain;

function expect(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

expect(Domain::canOfferServices('cliente') === false, 'Cliente não pode oferecer serviços');
expect(Domain::canOfferServices('autonomo') === true, 'Autônomo pode oferecer serviços');
expect(Domain::canOfferServices('empresa') === true, 'Empresa pode oferecer serviços');
expect(Domain::canUseFinance('cliente') === false, 'Cliente não pode acessar financeiro');
expect(Domain::canUseFinance('autonomo') === true, 'Autônomo pode acessar financeiro');
expect(Domain::canUseFinance('empresa') === true, 'Empresa pode acessar financeiro');
expect(Domain::validMoney(0) === false, 'Valor zero é inválido');
expect(Domain::validMoney(0.01) === true, 'Valor positivo é válido');
expect(Domain::canTransitionContract('proposta', 'aguardando_pagamento') === true, 'Proposta aceita inicia pagamento');
expect(Domain::canTransitionContract('aguardando_pagamento', 'pago') === true, 'Webhook aprova pagamento');
expect(Domain::canTransitionContract('proposta', 'pago') === false, 'Pagamento não pode pular checkout');
expect(Domain::canReview('concluido', false) === true, 'Serviço concluído pode ser avaliado uma vez');
expect(Domain::canReview('pago', false) === false, 'Serviço não concluído não pode ser avaliado');
expect(Domain::canReview('concluido', true) === false, 'Avaliação duplicada é inválida');
expect(Domain::jwtAssuranceLevel('eyJhbGciOiJub25lIn0.' . rtrim(strtr(base64_encode('{"aal":"aal2"}'), '+/', '-_'), '=') . '.x') === 'aal2', 'Extrai aal2 do token');
expect(Domain::jwtAssuranceLevel('token-invalido') === null, 'Token inválido não possui AAL');

$apiSource = file_get_contents(__DIR__ . '/../api/index.php');
$supabaseSource = file_get_contents(__DIR__ . '/../api/Supabase.php');
expect(str_contains($apiSource, 'reviews!reviews_provider_id_fkey'), 'Consultas públicas devem indicar a relação de avaliações recebidas');
expect(!str_contains($apiSource, 'curl_close('), 'API deve ser compatível com PHP 8.5 sem curl_close obsoleto');
expect(!str_contains($supabaseSource, 'curl_close('), 'Cliente Supabase deve ser compatível com PHP 8.5 sem curl_close obsoleto');

$homepageCss = file_get_contents(__DIR__ . '/../src/css/homepage.css');
expect(substr_count($homepageCss, '{') === substr_count($homepageCss, '}'), 'CSS da homepage deve ter blocos balanceados');

fwrite(STDOUT, "Todos os testes passaram.\n");

