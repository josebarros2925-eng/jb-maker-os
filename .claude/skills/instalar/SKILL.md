---
name: instalar
description: >
  Configura o workspace JB Maker pela primeira vez: confere as dependências (Node, Git), instala os pacotes
  do CRM e do render, entrevista o usuário sobre o negócio e preenche `_memoria/`, `identidade/design-guide.md`,
  `clientes/prospeccao/Minhas Ofertas.md` e a seção "Meu negócio" do `CLAUDE.md`. Use quando o usuário disser
  "/instalar", "configurar", "primeira vez", "começar a usar", ou quando `_memoria/empresa.md` estiver vazio.
---

# /instalar — Primeira configuração

Objetivo: em uma conversa curta, deixar o workspace com a cara do negócio do usuário. Pode ser rodado de novo pra refazer uma parte.

## Passo 1 — Dependências

Rodar e mostrar só o resultado (ok / falta):
- `node --version` (precisa 20+). Se faltar: mandar baixar em https://nodejs.org e parar aqui
- `git --version`. Se faltar: https://git-scm.com (só precisa pro `/salvar`)
- `npm install` em `crm/app/`
- Se o usuário for usar `/carrossel` ou `/motion-graphics` (perguntar): `npm install` e `npx playwright install chromium` em `scripts/render/`
- FFmpeg (`ffmpeg -version`): opcional, só pra vídeo

## Passo 2 — Entrevista (uma pergunta por vez, em blocos curtos)

1. **Quem é você:** nome, empresa, cidade, trabalha sozinho ou com equipe
2. **O que vende:** serviços ou produtos, faixa de preço, pra quem
3. **Clientes:** atuais (nome + o que faz pra cada) e leads em negociação. Pode pular
4. **Tom de voz:** como fala com cliente. Pedir uma mensagem real que já mandou, como exemplo. O que evitar
5. **Foco agora:** a prioridade dos próximos meses, metas e prazos, o que está pausado
6. **Visual:** cores (hex se souber), fontes, estilo; pedir pra colocar a logo como `identidade/logo.png`
7. **Prospecção:** ofertas que usa pra abordar, preço, prazo e cases que pode citar

Se o usuário responder várias coisas de uma vez, aproveitar e não perguntar de novo.

## Passo 3 — Preencher

- `_memoria/empresa.md`, `_memoria/preferencias.md`, `_memoria/estrategia.md`
- `identidade/design-guide.md`
- `clientes/prospeccao/Minhas Ofertas.md`
- `CLAUDE.md`: só a seção "# Meu negócio" (trocar os `<...>` pelo que ele disse e renomear o título pra "# <Nome> / <Empresa>"). Não mexer nas regras de cima
- Cada cliente atual: pasta `clientes/<nome>/` com a nota `<Nome do Cliente>.md` (base `templates/obsidian/cliente.md`) e um `CLAUDE.md` curto, linkados em `clientes/Clientes.md`; e uma ficha no CRM seguindo `crm/CLAUDE.md`
- Rodar `node crm/app/painel.mjs` e `node scripts/gerar-mapa.js`

## Passo 4 — Fechar

Mostrar o que foi preenchido (lista curta de arquivos) e os próximos passos:
- Abrir o CRM: dois cliques em `crm/Abrir CRM.bat` (ou `node crm/app/server.mjs`)
- Começar o dia: `/hoje 1h`
- Planejar a semana: `/semana`
- Pesquisar clientes: `/pesquisar-leads <nicho> em <cidade>` (precisa da chave do Google Places, ver `LEIA-ME.md`)
- Salvar no GitHub: `/salvar`

## Regras
- Nunca inventar dado do negócio: campo sem resposta fica em branco
- Não pedir senha, chave ou token na conversa. Chaves vão no arquivo `.env` que o usuário cria
