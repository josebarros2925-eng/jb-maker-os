# JB Maker: sistema operacional do seu negócio

Um workspace pronto para o **Claude Code** tocar a operação de um pequeno negócio ou freelancer: memória do negócio, rotina diária e semanal, CRM local, financeiro, entregas de clientes, prospecção e produção de conteúdo.

Você conversa com o Claude dentro do VS Code, e ele lê e mantém essas notas por você.

## O que vem pronto

| Área | Comandos |
|---|---|
| Configuração | `/instalar` (entrevista e preenche tudo), `/atualizar`, `/mapa`, `/salvar` |
| Rotina | `/hoje 1h`, `/semana`, `/revisao` |
| Clientes e dinheiro | `/entregas`, `/financeiro`, `/novo-projeto`, CRM local (`crm/Abrir CRM.bat`) |
| Vendas | `/pesquisar-leads`, `/email-profissional`, `/responder-avaliacoes` |
| Marketing | `/carrossel`, `/motion-graphics`, `/youtube`, `/seo`, `/anuncio-google`, `/relatorio-ads`, `/analisar-dados` |

## Instalação

### 1. Instale os programas
- [VS Code](https://code.visualstudio.com)
- A extensão **Claude Code** no VS Code (precisa de uma conta Claude com plano pago)
- [Node.js](https://nodejs.org) versão 20 ou mais nova
- [Git](https://git-scm.com)
- Opcional: [FFmpeg](https://ffmpeg.org) (para renderizar vídeos) e [Obsidian](https://obsidian.md) (para ver as notas em gráfico)

### 2. Pegue sua cópia
No GitHub, clique em **Use this template → Create a new repository** (deixe **privado**: seus dados de clientes vão ficar nele). Depois clone:

```bash
git clone https://github.com/<seu-usuario>/<seu-repositorio>.git
```

Ou baixe o ZIP em **Code → Download ZIP** e extraia.

### 3. Instale as dependências
- Windows: dois cliques em `instalar.bat`
- Mac/Linux: `sh instalar.sh`

### 4. Configure com o Claude
Abra a pasta no VS Code, abra o Claude Code e digite:

```
/instalar
```

Ele faz algumas perguntas (quem é você, o que vende, tom de voz, foco, visual, ofertas) e preenche `_memoria/`, `identidade/`, `CLAUDE.md` e o CRM.

### 5. Chaves (opcional)
Copie `.env.example` como `.env` e preencha:
- `GOOGLE_PLACES_API_KEY`: para o `/pesquisar-leads` (Google Cloud → Places API)
- `OPENAI_API_KEY`: para fotos com IA no `/carrossel`

O `.env` nunca vai para o GitHub.

## Como usar no dia a dia
- Comece o dia com `/hoje 1h` (ou o tempo que tiver)
- Segunda: `/semana`. Sexta: `/revisao`
- Abra o CRM com dois cliques em `crm/Abrir CRM.bat` (abre em http://localhost:4317)
- Salve tudo no GitHub com `/salvar`

## Estrutura

```
_memoria/        quem você é, tom de voz, estratégia
identidade/      cores, fontes, logo
clientes/        uma pasta por cliente + prospecção
crm/             CRM local (fichas em Markdown + app)
gestao/          semana, entregas, caixa, placar
saidas/          marketing, propostas, análises
scripts/         utilitários usados pelas skills
templates/       moldes de notas e catálogo de skills
.claude/skills/  os comandos (/hoje, /semana...)
```

Tudo é editável. As regras de como o Claude trabalha ficam em `CLAUDE.md`.

## Créditos
Construído a partir do [MazyOS](https://github.com/mazzeoia/MazyOS), de mazzeoia: as regras base do `CLAUDE.md` e as skills `/seo`, `/carrossel`, `/anuncio-google`, `/relatorio-ads`, `/responder-avaliacoes`, `/email-profissional`, `/analisar-dados`, `/novo-projeto`, `/atualizar` e `/salvar`.

A skill `/motion-graphics` é de Felipe Borges (licença MIT, em `.claude/skills/motion-graphics/LICENSE`).
