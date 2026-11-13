# Estrutura e manutenção

## Como a aplicação está organizada

- `index.php` é o front controller PHP: resolve a rota da página e chama o controlador.
- `Controller/` contém os controladores HTTP; `Model/` mantém o mapeamento das páginas.
- `View/` contém as telas de autenticação migradas para PHP e os templates compartilhados.
- As demais telas ainda são HTML em `src/pages/`, incluídas pelo template `View/page.php`; não foram convertidas individualmente para views PHP.
- `api/index.php` concentra a API REST. `api/Domain.php` contém regras de domínio, `api/Supabase.php` acessa o Supabase e `Config/` centraliza configuração.
- `src/js/` e `src/css/` contêm os módulos do navegador e seus estilos; `supabase/migrations/` versiona alterações de banco.
- `tests/` contém os testes automatizados executados por `npm test`.

## Fluxo das requisições

1. A requisição de página chega ao front controller e é associada a um nome de rota.
2. O controlador valida a rota usando o mapeamento de páginas.
3. O template entrega uma view PHP ou inclui uma página HTML legada.
4. Rotas de dados passam por `/api/index.php?route=...` e devem validar autenticação e autorização antes de acessar dados.

## Convenções de manutenção

- Mantenha HTTP em `Controller/`, regras de negócio em `api/Domain.php`, persistência em `api/Supabase.php` e apresentação em `View/` ou `src/`.
- Não exponha segredos no navegador. Use variáveis de ambiente e valide permissões no backend e nas políticas RLS.
- Migre páginas legadas uma por vez, preservando as URLs públicas e validando cada fluxo antes de remover o HTML antigo.
- Prefira nomes descritivos, funções com uma responsabilidade e blocos condicionais com chaves.
- Use `.editorconfig` como padrão de encoding, indentação e finais de linha: quatro espaços em PHP e dois nos demais arquivos.
- Antes do push, rode `npm test`, verifique a sintaxe PHP/JavaScript alterada e `git diff --check`.

## Estado da migração MVC

A aplicação já tem front controller, controladores, mapeamento de páginas e templates PHP. A migração é parcial: autenticação está em `View/auth/`, enquanto perfil, financeiro, mensagens e LGPD ainda são HTML legado servido pelo template compartilhado. Não considere essas páginas MVC completo até convertê-las e validá-las individualmente.
