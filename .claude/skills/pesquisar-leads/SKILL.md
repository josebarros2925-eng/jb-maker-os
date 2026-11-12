---
name: pesquisar-leads
description: >
  Pesquisa empresas de um nicho numa região que podem virar clientes da JB Maker: busca no
  Google Places, audita o site (sem site, fora do ar, lento, não responsivo, sem WhatsApp),
  detecta se roda Google Ads ou Pixel da Meta, encontra o CNPJ e, por ele, o dono e o contato,
  analisa as dores que a JB Maker resolve e já entrega a mensagem de abordagem pronta pra cada
  lead.
  Use quando o usuário disser "pesquisar leads", "achar clientes em [cidade]", "empresas de
  [nicho] em [região]", "quem não tem site", "lista de prospecção", ou /pesquisar-leads.
---

# /pesquisar-leads — Pesquisa de leads por região

## Dependências

- **Script:** `node scripts/prospectar-leads.js` (chave do Google Places em `GOOGLE_PLACES_API_KEY` ou em `.env/google-places.txt`; nunca mostrar a chave)
- **Ofertas e cases:** `clientes/prospeccao/Minhas Ofertas.md`
- **Tom:** `_memoria/preferencias.md`
- **Funil:** CRM em `crm/` (fichas em `crm/dados/leads/`, formato em `crm/CLAUDE.md`); lista de pesquisas em `clientes/prospeccao/Prospecção.md`

Custo: cada busca é 1 chamada ao Google Places por bloco de 20 empresas (centavos). Receita (BrasilAPI) é grátis.

---

## Passo 1 — Definir a busca

Precisa de: **nicho** e **região** (cidade + UF, ou bairro + cidade). Quantidade padrão: 20.

Se o usuário não disser o nicho, sugerir 2 ou 3 a partir do que já tem case em `Minhas Ofertas.md` e do foco em `_memoria/estrategia.md`. Não perguntar o que dá pra decidir com bom senso.

## Passo 2 — Rodar a busca

```bash
node scripts/prospectar-leads.js "<nicho>" "<cidade UF>" --max 20 --saida "clientes/prospeccao/pesquisas/dados/<nicho>-<cidade>-<AAAA-MM-DD>.json"
```

O JSON traz por empresa: nome, telefone, endereço, link do Maps, nota e nº de avaliações, se tem horário no Google, site e a `auditoria` do site. Quando o CNPJ aparece no site, já vem `receita` com razão social, situação, abertura, porte, telefones, e-mail e sócios (em MEI, o titular).

Ler o JSON com um resumo via `node -e`, sem despejar o arquivo inteiro na conversa.

## Passo 3 — Enriquecer (os 10 mais promissores)

Priorizar pelo Passo 4 e aprofundar só nos melhores. Pra cada um:

1. **CNPJ, se não veio do site:** nessa ordem:
   - `dominio` no JSON (titular do `.com.br` no Registro.br): quando é empresa, já traz o CNPJ e a `receita`. Quando é pessoa, o nome é "possível dono" (pode ser quem fez o site): só vira dono se bater com um sócio da Receita
   - Páginas do site que costumam ter CNPJ: `/politica-de-privacidade`, `/contato`, `/sobre` (curl + regex de CNPJ formatado)
   - WebSearch `"<nome>" <cidade> CNPJ` (funciona mal pra nome fantasia; último recurso). Pegar o candidato cujo endereço ou atividade bate com o Google e confirmar com `node scripts/prospectar-leads.js --cnpj <número>`. Se não bater com segurança, deixar "não confirmado". Nunca chutar.
2. **Dono e contato pelo CNPJ:** da consulta `--cnpj`, pegar:
   - **Nome do dono:** sócio-administrador, ou o titular em MEI e empresário individual. Na mensagem, usar só o primeiro nome, com a grafia normal ("Nelson", não "NELSON")
   - **Contato:** telefone e e-mail cadastrados na Receita. Comparar com o telefone do Google. Se for celular (9 dígitos) e diferente do número da loja, é provavelmente o do dono: é o canal preferido pra primeira mensagem. Se for fixo ou de escritório de contabilidade (e-mail com "contab", mesmo número em várias empresas), marcar "provavelmente do contador" e usar o WhatsApp do Google
   - Cruzar com o Instagram ou o site ("sobre", "quem somos") quando ajudar a confirmar o nome
3. **Instagram:** veio na auditoria ou WebSearch `"<nome>" <cidade> instagram`. Anotar o @ e, se der pra ver, se posta com frequência.
4. **Anúncios:**
   - Google Ads: `auditoria.googleAds` = tag de conversão no site (forte indício de que roda ou já rodou). Sempre deixar o link pra conferir: `https://adstransparency.google.com/?region=BR&domain=<dominio>`
   - Meta: `auditoria.pixelMeta` + link `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=<nome codificado>`
5. **Confirmar o site no celular antes de usar como observação:** a auditoria lê o HTML, e site montado por JavaScript parece vazio ou sem WhatsApp quando não está. Tirar print dos sites dos quentes e mornos com o Playwright de `scripts/render/` (viewport de iPhone, esperar carregar) e olhar. Conferir também: erro de servidor (503) pode ser passageiro, então testar de novo; rolagem lateral (`scrollWidth > innerWidth`); botão de WhatsApp; nome do site diferente do Google. Só o que aparece no print vira [OBSERVACAO].

**Contatos: só canais públicos do negócio** (telefone e WhatsApp do Google, telefone e e-mail da Receita, Instagram, e-mail do site) e o nome do dono. Não buscar CPF, endereço residencial nem celular pessoal em sites agregadores. É prospecção B2B, dentro da LGPD (interesse legítimo, dado público do negócio).

## Passo 4 — Diagnóstico e prioridade

Dores que a JB Maker resolve (ligar cada uma a uma oferta dos presets):

| Sinal no JSON | Dor | Oferta |
|---|---|---|
| sem `site`, ou `tipoLink` instagram/facebook/link-na-bio/whatsapp | Não tem site, depende do Instagram | Site one-page com orçamento no WhatsApp |
| `auditoria.ok` false / `erro` | Site fora do ar | Site novo (urgente, ótima observação) |
| `https` false | Site "não seguro" no navegador | Site novo ou migração |
| `responsivo` false | Site quebra no celular | Site novo |
| `tempoMs` > 4000 ou `tamanhoKb` muito alto | Site lento | Site novo |
| `anoCopyright` antigo (3+ anos) | Site abandonado | Site novo |
| `plataforma` Wix/Google Sites + sem `temDescricao` | Site amador, sem SEO | Site + SEO local |
| `linkWhatsapp` false e `formulario` false | Site sem caminho pra pedir orçamento | Ajuste de conversão |
| `googleAds` false com muitas avaliações | Movimento bom, sem tráfego pago | Google Ads |
| `googleAds` true e site fraco | Paga anúncio pra um site que não converte | Site + gestão de Ads |
| `horarioCadastrado` false, poucas avaliações, nota < 4 | Google Meu Negócio mal cuidado | Google Meu Negócio |
| muitos orçamentos/equipe (marcenaria, solar, reforma) | Orçamento perdido no WhatsApp | CRM |

**Sinal de momento** (tabela completa em `clientes/prospeccao/Prospecção.md`): fecha quem está no momento de evoluir a empresa e quando a conversa é com o dono. Pra cada um dos 10 mais promissores, olhar:
- **Momento:** CNPJ aberto há menos de 12 meses (`receita.abertura`), Maps com poucas avaliações e todas recentes, Instagram com destaque "Inauguração", nova unidade ou reforma, vagas abertas, ritmo de posts subindo, serviço novo, domínio registrado sem site, site velho com perfil ativo. Sinal contra: perfil parado há meses, site novo, já roda Ads com site bom
- **Dono acessível:** MEI ou empresa de 1 a 5 pessoas, sócio único na Receita, telefone do Google é celular (fixo costuma ser recepção), perfil pessoal do profissional

**Prioridade (pontuação):** momento (0 a 3, um ponto por sinal) + dono acessível (0 a 2: 2 = o dono atende, 1 = dono identificado mas com recepção, 0 = não identificado) + sem site ou site ruim (0 a 1).
- **Quente (4 a 6):** abordar no mesmo dia, com a Sequência Momento da `/abordagem`
- **Morno (2 a 3):** abordar com peça de dor e curiosidade se tiver observação forte
- **Frio (0 a 1):** não abordar agora. Também frio: situação na Receita diferente de ATIVA, ou site bom e já roda Ads (só vale como gestão de tráfego)

## Passo 5 — Gerar a abordagem de cada lead (quentes e mornos)

Pra cada lead quente ou morno, montar a mensagem pronta:

1. **Escolher o ângulo** pelo que a pesquisa encontrou:
   - Sinal de momento (inauguração, mudança, anúncio novo) → falar do momento e oferecer uma primeira versão rápida
   - Problema concreto e verificável (site fora do ar, quebra no celular, Google sem horário, link do WhatsApp quebrado) → "reparei uma coisa"
   - Trabalho bom e presença fraca (muitas avaliações boas, sem site) → elogio verdadeiro + o que falta
   - Nicho que vive no Instagram → direct em vez de WhatsApp
2. **Preencher** com o primeiro nome do dono (se confirmado), o nome do negócio e um fato da pesquisa escrito como uma pessoa falaria ("o site de vocês não abriu aqui no celular"). Ofertas e cases de `Minhas Ofertas.md`.
3. **Crivo:** cabe numa tela, uma pergunta só, sem travessão, emoji ou lista, fala do negócio dele, observação real, sem cara de vendedor, cumprimento separado ("Bom dia, tudo bem?" sozinho antes). Falhou: reescrever.
4. **Escrever também o próximo passo, completo:** o follow-up de 2 dias depois e a resposta pra objeção mais provável do nicho.

Nunca usar na mensagem um dado que não foi verificado. Nunca citar CNPJ, Receita ou "pesquisei sua empresa" (soa invasivo). A mensagem fala só do que um cliente veria.

## Passo 6 — Salvar o relatório

Nota do Obsidian em `clientes/prospeccao/pesquisas/<Nicho> em <Cidade> <AAAA-MM-DD>.md`:

```markdown
# <Nicho> em <Cidade> — <data>

> Pesquisa de leads. Funil: [[clientes/prospeccao/Prospecção|Prospecção]] · Dados brutos: `dados/<arquivo>.json`

## Resumo
<N> empresas · <x> sem site · <y> com site com problema · <z> rodando Google Ads

## Leads por prioridade
| # | Empresa | Prioridade | Site | Ads | Dono | Contato | Dor principal |
|---|---------|-----------|------|-----|------|---------|---------------|

## Fichas (quentes e mornos)
### <Empresa>
- **Dono:** <nome> (<qualificação>) · **CNPJ:** <número> (<situação>, aberta em <ano>)
- **Contato do dono (Receita):** <telefone/e-mail> (<provável dono / provável contador / não informado>)
- **Contato do negócio:** <WhatsApp/telefone do Google> · <Instagram> · <e-mail do site>
- **Google:** <nota> (<n> avaliações) · [Maps](<link>)
- **Site:** <url ou "não tem"> — <o que está ruim>
- **Anúncios:** Google Ads <sim/não/indício> ([conferir](<link transparência>)) · Meta <sim/não> ([biblioteca](<link>))
- **Dores:** <lista curta>
- **Oferta:** <oferta>
- **Abordagem:** <ângulo> · enviar por: <canal e número>

> <mensagem pronta pra copiar>

- **Se não responder em 2 dias :**

> <follow-up preenchido pra esse lead>

- **Se responder "<objeção provável>":**

> <resposta pronta>
```

Criar a pasta `pesquisas/` se não existir. Linkar a nota nova na seção "Pesquisas de leads" do `Prospecção.md`.

Importar as empresas pro CRM na etapa "pesquisado" (pula quem já está lá). Antes, salvar um JSON de prioridades no scratchpad no formato `{ "<nome exato do JSON>": { "prioridade": "quente", "abordagem": "reparei uma coisa", "sinal": "inauguração", "responsavel": "<dono confirmado>", "proximo_passo": "Primeira mensagem: <observação>" } }`, só com dono confirmado (`sinal` = sinal de momento achado, ou "sem sinal"):

```bash
node crm/app/importar-pesquisa.mjs "clientes/prospeccao/pesquisas/dados/<arquivo>.json" --cidade "<Cidade>" --prioridades "<prioridades.json>"
```

## Passo 7 — Entregar e registrar

Mostrar na conversa: o resumo, a tabela e, pra cada lead quente, o dono, o contato e a mensagem pronta num bloco de copiar. Link da nota no fim.

Fechar perguntando quais mensagens o usuário enviou. As enviadas passam pra `etapa: contato` na ficha do CRM (ângulo em `abordagem`, `data_contato`, `proximo_toque` em 2 dias).

---

## Regras
- Nunca inventar dado: o que não foi confirmado fica "não encontrado" ou "não confirmado"
- Tag de Ads no site é indício, não prova de campanha ativa: dizer isso e deixar o link de conferência
- Não incluir clientes atuais nem leads que já estão no funil (conferir em `crm/dados/leads/`); marcar "já no funil" se aparecerem
- Nicho de cliente atual: avisar no relatório que são concorrentes do cliente e não usar o case dele como prova social sem o usuário decidir
- Pesquisa grande (mais de 40 empresas): avisar o custo e confirmar antes
