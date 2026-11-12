---
name: mapa
description: >
  Atualiza o `_mapa.md`, o índice do workspace que o Claude lê em vez de varrer as pastas
  (economiza créditos). Roda `node scripts/gerar-mapa.js` e, se a estrutura mudou, ajusta a
  tabela "Onde fica o quê". Use quando o usuário disser "/mapa", "atualiza o mapa",
  "mapear pastas". Só rodar quando o usuário pedir, nunca por conta própria.
---

# /mapa — Índice do workspace

O `_mapa.md` tem duas partes:

- **"Onde fica o quê"** (editada à mão): tabela de rotas, ou seja, que tipo de coisa fica em qual pasta e qual skill gera.
- **"Arquivos"** (gerada pelo script, entre `<!-- mapa:auto:inicio -->` e `<!-- mapa:auto:fim -->`): cada nota com título e descrição curta, pastas de arquivos resumidas numa linha, skills com a descrição.

## Workflow

1. Rodar `node scripts/gerar-mapa.js` da raiz do workspace. O script só reescreve a parte gerada, a parte manual é preservada.
2. Ler o `_mapa.md` resultante.
3. Se apareceu pasta ou tipo de arquivo novo que não tem rota na tabela "Onde fica o quê", adicionar uma linha nela. Não reformatar a tabela inteira.
4. Se uma nota ficou sem descrição útil no mapa, é porque a primeira linha `>` dela tem só links. Sugerir uma linha `>` descritiva logo abaixo do título da nota.
5. Responder em até 3 linhas: quantas entradas, o que mudou na tabela (se mudou).

## Como usar o mapa (todas as tarefas, não só nessa skill)

- Pra achar um arquivo, ler `_mapa.md` primeiro. Só usar Glob/Grep/ls se o mapa não resolver.
- Abrir só os arquivos que a tarefa precisa. O mapa já diz o que cada um contém.
- Não atualizar o mapa por conta própria: o usuário avisa quando quer (`/mapa`). Se um arquivo novo não estiver no mapa, procurar com Glob normalmente.

## Regras

- Não editar à mão a parte entre os marcadores `mapa:auto`. Ela é sobrescrita.
- O script ignora `.git`, `.obsidian`, `.copilot`, `copilot`, `node_modules`, pastas de build (`dist`, `build`, `.next`, `coverage`, `test-results`) e, dentro de `.claude`, tudo menos `skills`. Pra ignorar outra pasta, editar `IGNORAR` no script.
- Se o Node não estiver instalado, avisar o usuário. Não tentar gerar o mapa à mão varrendo tudo, isso anula a economia.
