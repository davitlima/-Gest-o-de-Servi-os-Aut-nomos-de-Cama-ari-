# Verificação em duas etapas por e-mail

## Intenção

Substituir completamente o MFA por aplicativo autenticador por um fluxo obrigatório em todo login: senha e, depois, link de acesso enviado ao e-mail confirmado da conta.

## Desenho aprovado

- A primeira etapa usa `signInWithPassword`.
- O backend só cria um desafio se o JWT recebido registrar autenticação recente por senha.
- O Supabase envia o link de uso único por e-mail com `signInWithOtp` e `shouldCreateUser: false`.
- Após a abertura do link, o backend confirma que o mesmo usuário concluiu o desafio pendente e registra a sessão Supabase atual como verificada.
- Endpoints protegidos aceitam somente sessões registradas como verificadas por e-mail; cadastro e confirmação inicial de e-mail permanecem inalterados.
- A tela não exibe QR Code nem menciona aplicativo autenticador.

## Segurança e estados

- Solicitar OTP diretamente, sem uma etapa de senha registrada pelo backend, não libera acesso.
- Desafios expiram, são de uso único e pertencem ao usuário que os criou.
- Sessões verificadas expiram junto com a sessão Supabase e são identificadas pelo `session_id` do JWT.
- O fator TOTP incompleto existente será removido, pois não será mais usado.

## Alternativas consideradas

- Resend/SMTP com código próprio: seguro, mas exige outro serviço e credencial.
- Apenas confirmação de e-mail no cadastro: mais simples, mas não atende à exigência de duas etapas em cada login.
- OTP do Supabase sem vínculo com a senha: rejeitado porque permitiria contornar a primeira etapa.

## Aceite

Senha válida envia o link; link válido libera a aplicação; link sem senha prévia, expirado ou de outro usuário é recusado; recarregar após a segunda etapa mantém a sessão liberada; nenhum QR Code aparece.

