# Mapa do workspace

<!-- mapa:auto:inicio -->
## Arquivos (gerado em 2026-11-12 por `node scripts/gerar-mapa.js`)

### (raiz)
- `CLAUDE.md` — JB Maker — Sistema operacional do negócio: Sua empresa roda em cima desse arquivo.
- `Início.md` — Início: Nota central do cofre.

### _memoria/
- `_memoria/empresa.md` — Empresa: (Um link por cliente: Nome do Cliente)
- `_memoria/estrategia.md` — Estratégia
- `_memoria/preferencias.md` — Preferências

### clientes/
- `clientes/Clientes.md` — Clientes
- `clientes/prospeccao/Minhas Ofertas.md` — Minhas Ofertas
- `clientes/prospeccao/Prospecção.md` — Prospecção: 1. `/pesquisar-leads <nicho> em <cidade>`: acha as empresas, audita site e anúncios e entrega a mensagem pron…

### crm/
- `crm/app/lib/` — dados.mjs, gestao.mjs, indicadores.mjs
- `crm/app/public/` — app.js, index.html, styles.css
- `crm/app/` — 5 arquivos (mjs, json)
- `crm/CLAUDE.md` — CRM JB Maker: Pasta do CRM próprio da JB Maker: funil de clientes, ganhos e indicadores de cliente ideal.
- `crm/Painel CRM.md` — Painel CRM: Gerado automaticamente pelo CRM (`crm/app/painel.mjs`) em 12/11/2026.
- `crm/` — Abrir CRM.bat

### dados/
- `dados/Dados.md` — Dados: Solte aqui arquivos pra analisar (CSV, PDF, planilha) e rode `/analisar-dados`.

### gestao/
- `gestao/Caixa.md` — Caixa: Saldo da conta da empresa e o que entra e sai dela.
- `gestao/Entregas.md` — Entregas: Quadro dos projetos dos clientes: o que está em andamento, o que falta e com quem está a bola.
- `gestao/Gestão.md` — Gestão: 1. **Não pode esperar:** cliente esperando resposta, follow-up vencido, cobrança vencida
- `gestao/Placar Semanal.md` — Placar Semanal: Evolução semana a semana.

### identidade/
- `identidade/design-guide.md` — Design Guide: Referência visual pra carrosséis, posts, sites e vídeos.

### saidas/
- `saidas/marketing/cases.md` — Cases
- `saidas/marketing/conteudo/youtube/Canal YouTube.md` — Canal YouTube: Diário de progresso: a jornada, os números reais e os bastidores.
- `saidas/marketing/Marketing.md` — Marketing

### scripts/
- `scripts/lib/` — site.js
- `scripts/render/` — package-lock.json, package.json
- `scripts/Scripts.md` — Scripts: Utilitários que as skills chamam.
- `scripts/` — gerar-mapa.js, prospectar-leads.js

### templates/
- `templates/ferramentas/` — catalogo.md
- `templates/skills/` — catalogo.md

### skills (.claude/skills/)
- `/analisar-dados` — Analisa um arquivo de dados (CSV, Excel, TXT, JSON) e gera um resumo executivo com os principais insights, te…
- `/anuncio-google` — Cria estrutura completa de campanha do Google Ads a partir de um briefing ou da pesquisa SEO.
- `/atualizar` — Varre o projeto e atualiza os arquivos de contexto (`_memoria/empresa.md`, `preferencias.md`, `estrategia.md`…
- `/carrossel` — Cria carrosséis e posts visuais pra Instagram, TikTok, LinkedIn com a identidade visual da marca.
- `/email-profissional` — Rascunha um email profissional a partir de um contexto livre.
- `/entregas` — Quadro de entregas da JB Maker: mostra o status dos projetos dos clientes (site, CRM, tráfego), o que falta e…
- `/financeiro` — Financeiro da JB Maker: registra gastos, entradas e retiradas no Caixa, mostra o saldo atual e o resumo do mê…
- `/hoje` — Gerente do dia da JB Maker: monta a lista do dia do tamanho do tempo que o usuário tem (o tempo varia de dia…
- `/instalar` — Configura o workspace JB Maker pela primeira vez: confere as dependências (Node, Git), instala os pacotes do…
- `/mapa` — Atualiza o `_mapa.md`, o índice do workspace que o Claude lê em vez de varrer as pastas (economiza créditos).
- `.claude/skills/motion-graphics/agents/` — openai.yaml
- `/motion-graphics` — Copie para a pasta do projeto se útil.
- `.claude/skills/motion-graphics/assets/` — galeria.html
- `/motion-graphics` — Este pacote foi preparado para Felipe Borges como uma skill educacional de motion graphics.
- `/motion-graphics` — Leia pedido, anexos disponíveis e decisões anteriores.
- `/motion-graphics` — Este índice ajuda a conversar sobre intenção.
- `/motion-graphics` — Traduza “cinemático” para o projeto: luz, materiais, contraste, profundidade, câmera, textura e cadência.
- `/motion-graphics` — Exemplos didáticos de uso.
- `/motion-graphics` — 1. **Origem das imagens:** fornecidas, ferramenta de imagens do ambiente GPT, Higgsfield, outro gerador ou co…
- `/motion-graphics` — Use para representar uma tese, pergunta ou relação causal por recortes, imagens e diagramas.
- `/motion-graphics` — Leia este guia e somente os modelos escolhidos.
- `/motion-graphics` — Use para explicar um serviço, processo ou benefício por personagens e formas simples.
- `/motion-graphics` — Use para acrescentar motion a uma filmagem existente, mantendo o que foi definido como protegido.
- `/motion-graphics` — Use para histórias em que figuras gráficas interagem com objetos volumétricos.
- `/motion-graphics` — Use para um lançamento de software ou serviço em que painéis com profundidade mostram um processo.
- `/motion-graphics` — Use para transformar ingredientes ou partes reconhecíveis em uma apresentação enérgica do produto.
- `/motion-graphics` — Use para revelar arquitetura pela transformação entre desenho, volume e material.
- `/motion-graphics` — Use para revelar construção, encaixes ou detalhes internos de um produto.
- `/motion-graphics` — Use quando ambiente natural, frescor ou ingredientes fizerem parte da mensagem de uma bebida, cosmético ou ou…
- `/motion-graphics` — Use quando palavras e sua organização carregam a mensagem.
- `/motion-graphics` — Determine se recebeu imagem, vídeo, página ou material misto.
- `/motion-graphics` — Compare com a versão vigente do briefing.
- `/motion-graphics` — Leia somente a seção necessária.
- `.claude/skills/motion-graphics/scripts/` — estimate_budget.py, inspect_video.py
- `/motion-graphics` — Planejar, criar, adaptar e revisar motion graphics com briefing conversado, análise temporal de referências,…
- `.claude/skills/motion-graphics/` — LICENSE
- `/novo-projeto` — Cria uma pasta de projeto nova com `CLAUDE.md` dedicado, depois de uma entrevista curta sobre o projeto (clie…
- `/pesquisar-leads` — Pesquisa empresas de um nicho numa região que podem virar clientes da JB Maker: busca no Google Places, audit…
- `/relatorio-ads` — Gera relatório semanal de performance de anúncios pagos (Google Ads + Meta Ads).
- `/responder-avaliacoes` — Escreve respostas curtas e humanas pras avaliações do Google Meu Negócio.
- `/revisao` — Revisão semanal da JB Maker: monta o placar da semana (abordagens, respostas, propostas, fechamentos, recebid…
- `/salvar` — Salva o trabalho da JB Maker no GitHub (commit + push).
- `/semana` — Plano da semana da JB Maker: define as metas pelo tamanho da carga da semana do usuário (leve, normal, pesada…
- `/seo` — Fluxo completo de SEO, GEO e Google Ads em 8 passos: pesquisa de demanda, análise de concorrência, Google Meu…
- `/youtube` — Produz o diário de progresso do usuário no YouTube (sobre ele e a jornada, não só sobre a JB Maker), no forma…
<!-- mapa:auto:fim -->
