---
name: revisao
description: >
  Revisão semanal da JB Maker: monta o placar da semana (abordagens, respostas, propostas, fechamentos,
  recebido, gastos, conteúdo), compara com a semana anterior, registra o aprendizado e propõe ajustes na
  estratégia e pautas pro YouTube. Use quando o usuário disser "/revisao", "revisão da semana",
  "como foi a semana", "fechar a semana", "placar", ou numa sexta.
---

# /revisao: placar e aprendizado da semana

O usuário quer **evoluir**. Então a revisão compara ele com ele mesmo na semana anterior, com números reais.

## 1. Período

Segunda a domingo da semana atual (ou a semana que o usuário disser). Achar a nota em `gestao/semanas/Semana <segunda>.md`.

## 2. Levantar os números (sem perguntar o que dá pra calcular)

- **Abordagens:** fichas em `crm/dados/leads/` com `data_contato` no período
- **Respostas:** só quem respondeu **a abordagem** (fichas com `data_conversa` no período + fichas com linha de histórico no período mostrando que o lead respondeu, inclusive os que responderam e foram perdidos, como "já tem fornecedor"). Responder só o "bom dia" e recepção dizendo "vou passar o recado" **não contam**: aparecem em linhas separadas na revisão (`Só o "bom dia"` e `Recepção passando recado`) e ficam fora da coluna Respostas do Placar. Conferir pelo histórico, não só pela `data_conversa`
- **Propostas:** `data_proposta` no período · **Fechamentos:** `data_entrada` no período
- **Recebido:** `lancamentos` com `status: recebido` e data no período + entradas do Caixa no período (um número só, sem separar produto)
- **Gastos:** saídas do Caixa no período
- **Saldo em caixa:** saldo atual (fórmula do `/financeiro`)
- **Metas:** a seção Metas da nota da semana e os dias marcados `[x]`
- **Conteúdo:** pastas criadas no período em `saidas/marketing/conteudo/`

Um comando ajuda: `grep -l "data_contato: AAAA-MM-" crm/dados/leads/*.md`, ajustando pro período.

## 3. Perguntar só o que não dá pra saber (no máximo 2 perguntas)

1. "O que você publicou essa semana?" (só se não der pra saber pelas pastas)
2. "Uma coisa que você aprendeu ou percebeu essa semana?"

## 4. Registrar

1. Linha nova em `gestao/Placar Semanal.md`, na tabela, no mesmo formato das colunas (Semana em `DD/MM`, valores em `R$ 1.234,56`). A aba Placar semanal do CRM lê essa tabela
2. Na nota da semana, preencher `## Revisão`:

```markdown
## Revisão
| | Essa semana | Semana anterior |
|---|---|---|
| Abordagens | 8 | 11 |
| ... | | |

**Metas:** 8/10 abordagens · 2/2 posts · YouTube: roteiro feito
**O que funcionou:** ...
**O que travou:** ...
**Aprendizado:** ...
**Leva pra próxima semana:** ...
```

## 5. Responder

Curto:
- O placar comparado (melhorou, piorou, igual), em 3 a 5 linhas
- **Um** padrão que os dados mostram (ex.: "as 3 respostas vieram de quem já roda anúncio")
- **Uma** mudança pra próxima semana
- Se o aprendizado é duradouro, perguntar: "Isso mudou algo no teu contexto. Quer que eu atualize a estratégia?" e mostrar a linha antes de salvar em `_memoria/estrategia.md`
- Se a semana teve algo que dá vídeo (marco, número novo, erro que ensinou), sugerir: "Isso dá pauta pro YouTube. Anoto no Canal YouTube?" e, se sim, adicionar em `saidas/marketing/conteudo/youtube/Canal YouTube.md` na seção Ideias

## Regras

- Semana fraca não é fracasso. Mostrar o número e o motivo sem drama, e propor o ajuste
- Amostra pequena: dizer que é pista, não conclusão
- Não inventar número. Se não deu pra levantar, escrever "—" e dizer por quê
