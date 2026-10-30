# Nexlar Backend Design

## Intento

Transformar o protótipo estático em uma plataforma funcional que conecta clientes, autônomos e empresas, mantendo a interface existente.

## Papéis e acesso

- Cliente contrata, conversa e avalia; não vê portfólio próprio nem financeiro.
- Autônomo oferece serviços, mantém portfólio, conversa, recebe propostas e usa o financeiro.
- Empresa pode contratar e oferecer serviços; por isso possui portfólio e financeiro.

## Arquitetura escolhida

- PHP 8.3 expõe uma API JSON e integra o Mercado Pago sem expor credenciais.
- Supabase fornece autenticação, confirmação de e-mail, MFA TOTP e Postgres com RLS.
- JavaScript consome a API para chat, propostas, avaliações e financeiro.
- Mercado Pago Checkout Pro cria o checkout; webhook confirma o resultado no backend.

## Fluxos

- Cadastro separado por papel, confirmação de e-mail e configuração de aplicativo autenticador.
- Conversa persistente entre dois perfis; prestador cria proposta com descrição e valor.
- Contratante aceita a proposta e abre o checkout. Só o webhook altera o pagamento para aprovado.
- Após serviço concluído, o contratante registra uma avaliação de 1 a 5 estrelas, uma vez por contratação.
- Prestadores adicionam, editam e excluem lançamentos financeiros; os gráficos são recalculados após carregar os dados persistidos.

## Abordagens consideradas

- PHP + Supabase REST, escolhida por preservar o frontend e exigir pouca infraestrutura.
- Reescrever em framework PHP, rejeitada por aumentar o escopo sem benefício para o protótipo.
- Backend inteiramente no navegador, rejeitada porque exporia segredos e não validaria pagamentos com segurança.

## Restrições

- Credenciais ficam em variáveis de ambiente e nunca no repositório.
- Todas as tabelas públicas usam RLS.
- O backend valida a sessão Supabase antes de qualquer operação privada.
- A primeira versão não cobra comissão da plataforma.

