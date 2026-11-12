---
name: financeiro
description: >
  Financeiro da JB Maker: registra gastos, entradas e retiradas no Caixa, mostra o saldo atual e o resumo do
  mês (entrou, saiu, sobrou) juntando o CRM e o Caixa, e lista quem está devendo com a mensagem de cobrança
  pronta. Tudo aparece na aba Caixa do CRM. Use quando o usuário disser "/financeiro", "gastei", "paguei", "assinei",
  "recebi", "quanto entrou", "quanto sobrou", "resumo do mês", "quem me deve", "cobrar pagamento".
---

# /financeiro

Fonte da verdade:
- **Pagamentos de clientes:** `lancamentos` das fichas em `crm/dados/leads/` (seguir `crm/CLAUDE.md`)
- **Todo o resto:** `gestao/Caixa.md` (saldo inicial, gastos, outras entradas, retiradas)
- **Saldo atual** = `**Saldo inicial:**` do Caixa + pagamentos de clientes `recebido` a partir da data do saldo + entradas − saídas − retiradas do Caixa (a aba Caixa do CRM calcula sozinha)

Nunca registrar o mesmo dinheiro nos dois lugares.

## Modos

### Registrar ("gastei 50 no domínio", "assinei o Claude", "recebi 300 do cliente X")
- Pagamento de cliente → lançamento na ficha do CRM (`recebido` ou `a receber`) e rodar `node crm/app/painel.mjs`
- Outra entrada, gasto ou retirada → linha nova na tabela do Caixa: `| AAAA-MM-DD | tipo | categoria | descrição | valor |` (valor com ponto decimal, sem R$)
- "Meu saldo hoje é X" → trocar a linha `**Saldo inicial:** X em AAAA-MM-DD` pela data de hoje e mover os lançamentos antigos pra uma seção `## Histórico` (fora da tabela de Lançamentos)
- Gasto recorrente (assinatura): registrar o mês e anotar "(mensal)" na descrição
- Confirmar mostrando a linha adicionada

### Resumo do mês ("quanto entrou", "resumo de outubro")
1. Clientes: lançamentos `recebido` do mês nas fichas (ou "Ganhos por mês" do `crm/Painel CRM.md`)
2. Outras entradas, gastos e retiradas: Caixa no mês
3. Saldo atual pela fórmula acima
4. Responder:

```
<Mês>/<Ano>
Saldo atual: R$ S
Entrou: R$ X (clientes R$ A · outras R$ B)
Saiu: R$ Y (ferramentas R$ ... · anúncio R$ ...)
Sobrou na empresa: R$ X − Y
Você retirou: R$ Z
A receber: R$ W (vencido: R$ V)
Comparado ao mês passado: <subiu/caiu R$ e %>
```

5. Gravar o resumo em `## Resumo por mês` do Caixa (uma linha por mês, substituindo a do mesmo mês)

### Quem me deve ("cobrar", "quem está devendo")
- Lançamentos `a receber` nas fichas, com data passada = vencido
- Pra cada um: cliente, valor, desde quando e uma mensagem de cobrança pronta no tom do usuário (`_memoria/preferencias.md`): educada, direta, lembrando o combinado e propondo como pagar. Ex.: "Oi, tudo bem? Passando pra lembrar do restante de R$ 100 do site, combinado em 20/10. Posso te mandar o Pix?"
- Também cruzar com `gestao/Entregas.md` (o campo A receber)

## Regras

- Tudo da JB Maker entra e sai pela conta separada. Se o usuário comentar que pagou algo da empresa com dinheiro pessoal, registrar mesmo assim e lembrar da regra uma vez
- Não guardar senha, número de cartão, chave Pix de terceiros ou dado bancário
- Impostos, MEI ou CNPJ: não dar parecer fiscal. Quando a receita ficar constante por uns meses, sugerir conversar com um contador (algumas atividades de programação não podem ser MEI)
- Se o resumo mostrar gasto subindo mais que a receita por 2 meses seguidos, avisar
