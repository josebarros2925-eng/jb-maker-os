# JB Maker — Sistema operacional do negócio

Sua empresa roda em cima desse arquivo. Aqui ficam as regras de operação
da JB Maker — como o Claude lê o contexto, aprende com correções, mantém
tudo atualizado e cria skills novas conforme a operação evolui.

Esse arquivo é editável. O final dessa página tem as regras específicas do seu negócio (preenchidas pelo `/instalar`).

---

## Contexto do negócio

No início de toda conversa, ler os seguintes arquivos (quando existirem
e estiverem preenchidos):

1. `_memoria/empresa.md` — quem é o usuário, o que faz, como funciona o negócio
2. `_memoria/preferencias.md` — tom de voz, estilo de escrita, o que evitar
3. `_memoria/estrategia.md` — foco atual, prioridades, prazos

Usar essas informações como base pra qualquer resposta ou decisão. Ao
sugerir prioridades, formatos ou abordagens, considerar o foco atual
descrito em `estrategia.md`.

Pra qualquer tarefa visual (carrossel, post, landing page), consultar
`identidade/design-guide.md` como referência de estilo.

Não é necessário listar o que foi lido nem confirmar a leitura. Apenas
usar o contexto naturalmente.

---

## Fluxo de trabalho

Antes de executar qualquer tarefa, verificar se existe skill relevante
em `.claude/skills/`. Se encontrar, seguir as instruções da skill. Se
não encontrar, executar a tarefa normalmente.

Ao concluir uma tarefa que não tinha skill mas parece repetível (o
usuário provavelmente vai pedir de novo no futuro), perguntar:

> "Isso pode virar uma skill pra próxima vez. Quer que eu crie?"

Não perguntar pra tarefas pontuais ou perguntas simples. Só quando o
padrão de repetição for claro.

---

## Aprender com correções

Quando o usuário corrigir algo, melhorar uma resposta ou dar uma
instrução que parece permanente (frases como "na verdade é assim", "não
faça mais isso", "prefiro assim", "sempre que...", "evita...", "da
próxima vez..."), perguntar:

> "Quer que eu salve isso pra não precisar repetir?"

Se sim, identificar onde faz mais sentido salvar:

- **Sobre o negócio** (clientes, serviços, mercado) → `_memoria/empresa.md`
- **Sobre preferências e estilo** (tom de voz, formato, o que evitar) → `_memoria/preferencias.md`
- **Sobre prioridades e foco** (projetos, metas, prazos) → `_memoria/estrategia.md`
- **Regra de comportamento nessa pasta** → próprio `CLAUDE.md`

Salvar com uma linha nova clara, sem reformatar o arquivo inteiro.
Confirmar mostrando a linha adicionada.

Não perguntar se a correção for óbvia de contexto imediato (ex: "na
verdade o arquivo se chama X"). Só perguntar quando a informação tiver
valor duradouro.

---

## Manter contexto atualizado

Ao terminar uma tarefa que mudou algo relevante (cliente novo, skill
nova, mudança de foco, processo novo, ferramenta instalada, estrutura
alterada), perguntar:

> "Isso mudou algo no teu contexto. Quer que eu atualize a memória?"

Se sim, identificar o que atualizar:

- **Cliente, serviço, ferramenta, equipe** → `_memoria/empresa.md`
- **Mudança de prioridade ou foco** → `_memoria/estrategia.md`
- **Tom ou estilo** → `_memoria/preferencias.md`
- **Pasta, regra de organização, skill criada** → `CLAUDE.md`
- **Visual (cores, fontes, logo)** → `identidade/design-guide.md`

Mostrar o que vai mudar antes de salvar. Não reformatar o arquivo
inteiro, só adicionar ou editar a linha relevante.

**Quando NÃO perguntar:**
- Tarefas pontuais sem impacto no contexto (escrever um email avulso, criar um post)
- Perguntas simples ou conversas sem ação
- Mudanças já salvas pelo bloco "Aprender com correções"

**Dica:** rode `/atualizar` pra uma varredura completa quando houver dúvida.

---

## Criação de skills

Quando o usuário pedir skill nova:

1. Verificar se existe template relevante em `templates/skills/`. Se
   existir, usar como base e adaptar pro contexto
2. Perguntar se é específica desse projeto ou útil em qualquer:
   - Específica → `.claude/skills/nome-da-skill/SKILL.md` (local)
   - Universal → `~/.claude/skills/nome-da-skill/SKILL.md` (global)
3. Ler `_memoria/empresa.md` e `_memoria/preferencias.md` pra calibrar
   o conteúdo da skill ao contexto do negócio
4. Se a skill precisar de arquivos de apoio (templates, exemplos),
   criar dentro da pasta da skill
5. Seguir o fluxo da skill-creator nativa do Claude Code

---

# Meu negócio

> Seção preenchida pelo `/instalar`. Ajuste à vontade.

## O que é esse workspace

<Uma ou duas frases sobre o que você faz aqui.>

**Estrutura de pastas:**
- `_memoria/`: quem eu sou, como falo, o que está em foco
- `identidade/`: cores, fontes, logo (`logo.png`)
- `Início.md`: nota central do Obsidian, liga todas as áreas
- `_mapa.md`: índice de todos os arquivos (gerado por `scripts/gerar-mapa.js`, skill `/mapa`)
- `clientes/`: uma pasta por cliente (`clientes/<nome>/` com `CLAUDE.md` + a nota do cliente com o nome dele) e `prospeccao/` (`Prospecção.md`, `Minhas Ofertas.md` e as pesquisas em `pesquisas/`)
- `gestao/`: rotina (`Gestão.md`, `Placar Semanal.md`, `Entregas.md`, `Caixa.md` e uma nota por semana em `semanas/`)
- `crm/`: CRM local (fichas em `dados/leads/`, resumo `Painel CRM.md`, app em `app/`, abre com `Abrir CRM.bat`)
- `saidas/marketing/`: conteúdo, SEO, campanhas e `cases.md`
- `saidas/`: análises, e-mails, propostas e documentos pontuais
- `dados/`: arquivos a analisar (CSV, PDF, planilha)
- `scripts/`: utilitários
- `templates/`: moldes (`templates/obsidian/` = notas do Obsidian, `templates/skills/` = catálogo de skills externas)

## Quem sou

<Nome, empresa, o que faz.>

## O que produzo

-

## Meus clientes

<Atuais e leads com proposta aberta.>

## Tom de voz

<Como você fala. Um exemplo de frase.>

Evitar:

## Posicionamento

<Pra quem você vende e por que você.>

## Regras do sistema

- **Navegação econômica:** pra achar arquivo, ler `_mapa.md` primeiro e abrir só o necessário. Glob/Grep/ls só se o mapa não resolver. Só atualizar o mapa quando o usuário pedir (`/mapa`)
- Conteúdo próprio: Instagram em `saidas/marketing/conteudo/insta/<tipo>-<tema>-<data>/`, YouTube em `saidas/marketing/conteudo/youtube/`. Conteúdo feito para cliente vai em `clientes/<nome>/conteudo/`
- Vídeos em motion (Reels, criativos de anúncio): skill `/motion-graphics`; render com Playwright de `scripts/render/` e FFmpeg
- Material de cliente: salvar em `clientes/<nome>/`
- Código de cliente: subpasta por entrega (`site/`, `crm/`, `app/`). Não versionar `.env*` nem `.vercel/`
- **CRM:** funil, ganhos e indicadores ficam em `crm/`. Pra qualquer pergunta sobre leads, clientes, funil, quem cobrar ou quanto entrou, ler `crm/Painel CRM.md` primeiro e abrir só as fichas necessárias em `crm/dados/leads/`. Pra editar, seguir `crm/CLAUDE.md` e depois rodar `node crm/app/painel.mjs`
- **Rotina:** `/hoje <tempo>` monta o dia pelo tempo disponível; `/semana` e `/revisao` planejam e medem; `/financeiro` (gastos, resumo, cobranças; pagamento de cliente no CRM, o resto no Caixa); `/entregas` (projetos dos clientes); `/youtube` (vídeos). Pesquisa pesada vai pro agente `pesquisador` (`.claude/agents/`)
- Prospecção: skill `/pesquisar-leads` (acha empresas por nicho e região, audita site e Ads, CNPJ e dono; relatórios em `clientes/prospeccao/pesquisas/`)

## Obsidian

Essa pasta pode ser aberta como cofre do Obsidian. Pra manter o gráfico conectado:
- Links entre notas em formato wiki com caminho completo: `[[clientes/<pasta>/<Nome>|<Nome>]]`
- Cliente novo: criar `clientes/<nome>/<Nome do Cliente>.md` (base: `templates/obsidian/cliente.md`) e linkar em `Início.md`, `clientes/Clientes.md` e `_memoria/empresa.md`
- Lead fechado: mover de `clientes/prospeccao/Prospecção.md` pra "Fechados" com link pro briefing
- Case publicado: registrar em `saidas/marketing/cases.md` com link pro cliente
- Nome de nota: sempre descritivo (nome do cliente ou da peça), nunca genérico como `README` ou `briefing`. Exceções: `CLAUDE.md` e os `README.md` dentro do código

## Ferramentas conectadas

- [ ] Obsidian
- [ ] Notion
- [ ] Canva
- [ ] Google Calendar
- [ ] Meta Ads
- [ ] Google Ads

*(Marcar conforme for instalando os MCPs)*
