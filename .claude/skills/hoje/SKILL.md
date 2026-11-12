---
name: hoje
description: >
  Gerente do dia da JB Maker: monta a lista do dia do tamanho do tempo que o usuário tem (o tempo varia de dia pra dia), na ordem de prioridade, puxando do CRM, das entregas, do caixa e da semana.
  Use quando o usuário disser "/hoje", "o que eu faço hoje", "tenho X minutos/horas", "monta meu dia",
  "começar o dia", "por onde começo".
---

# /hoje: o dia do tamanho do tempo disponível

O usuário toca o negócio sozinho e divide o tempo com outras coisas. O tempo muda todo dia. Essa skill decide **o que fazer com o tempo que ele tem hoje**, nunca uma lista maior do que cabe.

## 1. Tempo disponível

- Ler o tempo do argumento (`/hoje 40min`, `/hoje 2h`, `/hoje 1h30`)
- Se não veio, perguntar só isso: "Quanto tempo você tem hoje pra JB Maker?" e parar

## 2. Ler (só isso, nessa ordem)

1. Data de hoje e dia da semana (`date +%F` e `date +%A`)
2. `crm/Painel CRM.md`: seção **Cobrar** (atrasados, hoje) e **Resumo** (vencido)
3. `gestao/Entregas.md`: o que está "Esperando: eu" e próximos toques vencidos ou de hoje
4. Nota da semana atual em `gestao/semanas/` (a da segunda-feira desta semana): metas, foco e o que já foi feito nos dias anteriores
5. `_memoria/estrategia.md`: só se a semana não tiver nota

Não abrir fichas do CRM nem notas de cliente nesse passo. Só quando for executar uma tarefa.

## 3. Montar a lista pela prioridade

| Prioridade | O que entra | Tempo estimado |
|---|---|---|
| 1. Não pode esperar | Cliente esperando resposta ou entrega; follow-ups atrasados e de hoje; cobrança vencida | 5 min por mensagem |
| 2. Entrega | Trabalho de cliente "Esperando: eu" | blocos de 45 a 90 min |
| 3. Vendas | Abordagens novas que faltam pra meta da semana (no perfil da estratégia) | 10 a 15 min por abordagem com pesquisa |
| 4. Conteúdo | Peça do Instagram (case primeiro) ou etapa do vídeo do YouTube | post 45 a 60 min · etapa de vídeo 30 a 90 min |
| 5. Arrumação | Completar fichas, registrar gastos | 5 a 15 min |

Encaixe pelo tempo:
- **Até 30 min:** só a prioridade 1. Se sobrar, 1 ou 2 abordagens
- **30 min a 1h30:** prioridade 1 + o que for mais urgente entre entrega e vendas
- **1h30 a 3h:** + um bloco de conteúdo
- **Mais de 3h:** dia completo, incluindo trabalho de foco (entrega longa, gravar ou editar vídeo)

Sempre deixar **10% do tempo de folga** e 5 min no fim pra registrar no CRM.

Ajustes pelo dia:
- **Segunda** sem nota da semana: o primeiro item é `/semana` (10 min)
- **Sexta** (ou último dia de trabalho da semana): o último item é `/revisao` (15 min)
- Se a semana estiver atrás da meta, a prioridade 3 sobe na frente da 4

## 4. Responder

Formato curto, cabe numa tela:

```
Hoje · <dia da semana> <DD/MM> · <tempo>

1. [ ] <tarefa> (<min>) — <por quê, em poucas palavras>
2. [ ] ...

Fica pra depois: <o que não coube, se for importante>
Começo pelo 1? <oferta concreta: "Já deixo os 4 follow-ups prontos">
```

- Cada tarefa é uma ação concreta com nome (lead, cliente, peça), nunca "fazer prospecção"
- Dizer qual skill executa, quando houver (`/abordagem`, `/entregas`, `/carrossel`, `/youtube`)

## 5. Registrar

Acrescentar na nota da semana, na seção `## Dias`, um bloco:

```
### <Dia> <DD/MM> · <tempo>
- [ ] tarefa 1
- [ ] tarefa 2
```

Se a nota da semana não existir, criar com o modelo do `/semana` (só com a seção Dias preenchida) e avisar.

Quando o usuário disser que terminou algo ("mandei os follow-ups", "terminei"), marcar `[x]` no bloco do dia e registrar no lugar certo (CRM, Entregas, Caixa).

## Regras

- Nunca montar mais do que cabe no tempo. Se não cabe, vai pra "Fica pra depois"
- Semana de prova ou dia sem tempo nenhum: só os follow-ups atrasados, e isso é um dia bom
- Tom: direto, sem motivacional. Nada de "bora", "foco total", "vamos com tudo"
