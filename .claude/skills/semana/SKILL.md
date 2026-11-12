---
name: semana
description: >
  Plano da semana da JB Maker: define as metas pelo tamanho da carga da semana do usuário (leve, normal,
  pesada), lista os compromissos já marcados (follow-ups, entregas, cobranças) e o foco da semana, e cria
  a nota da semana em gestao/semanas/. Use quando o usuário disser "/semana", "plano da semana",
  "planejar a semana", "começar a semana", ou numa segunda-feira sem nota da semana.
---

# /semana: plano da semana

## 1. Perguntar uma coisa só

> "Como está a carga da semana: leve, normal ou pesada?"

Se o usuário já disse no pedido, não perguntar.

## 2. Ler

1. `gestao/Placar Semanal.md`: última linha (a semana anterior)
2. A nota da semana anterior em `gestao/semanas/` (seção Revisão: aprendizado e o que ficou pra trás)
3. `crm/Painel CRM.md`: Cobrar, Propostas abertas, Resumo
4. `gestao/Entregas.md`
5. `_memoria/estrategia.md`: prioridade principal

## 3. Definir metas

Base pela semana (ajustar pelo placar: se a semana anterior bateu a meta, subir um pouco; se ficou bem abaixo, manter):

| Semana | Abordagens novas | Posts no Instagram | YouTube |
|---|---|---|---|
| Leve | 15 | 3 | 1 etapa grande (roteiro, gravação ou edição) |
| Normal | 10 | 2 | 1 etapa |
| Pesada | 5 | 1 | nada |

Metas de vendas seguem a estratégia (`_memoria/estrategia.md`) e o que o CRM mostrar na aba Cliente ideal.

Foco da semana: **uma frase**, a coisa que, se acontecer, faz a semana valer (ex.: "fechar o lead X ou descartar", "publicar o case do cliente Y").

## 4. Criar a nota

Arquivo: `gestao/semanas/Semana AAAA-MM-DD.md` (data da segunda-feira da semana).

```markdown
# Semana DD/MM a DD/MM

> Volta: [[gestao/Gestão|Gestão]] · Placar: [[gestao/Placar Semanal|Placar Semanal]]

**Carga da semana:** normal
**Foco:** <uma frase>

## Metas
- [ ] 10 abordagens novas (0/10)
- [ ] 2 posts no Instagram (0/2)
- [ ] YouTube: <etapa>

## Compromissos
- Seg DD/MM · <follow-up, entrega, cobrança> (de onde veio)
- ...

## Dias
(preenchido pelo /hoje)

## Revisão
(preenchido pelo /revisao)
```

Se a nota já existir (criada pelo `/hoje`), completar as seções que faltam sem apagar o que tem.

## 5. Responder

Mostrar as metas, o foco e os 3 compromissos mais importantes em poucas linhas. Fechar com: "Quer que eu monte o `/hoje` agora?"

## Regras

- Metas pequenas que acontecem valem mais que metas grandes que não acontecem
- Não repetir na nota o que já está no Painel CRM. Só os compromissos da semana com data
- Datas `AAAA-MM-DD` nos arquivos, `DD/MM` no texto
