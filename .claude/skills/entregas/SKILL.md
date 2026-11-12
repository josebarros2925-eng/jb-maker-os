---
name: entregas
description: >
  Quadro de entregas da JB Maker: mostra o status dos projetos dos clientes (site, CRM, tráfego), o que
  falta e com quem está a bola, atualiza quando algo anda, prepara a mensagem pra cobrar material do
  cliente e, quando a entrega termina, puxa o case e o próximo serviço. Use quando o usuário disser
  "/entregas", "como estão os projetos", "o cliente mandou", "terminei o site", "o que falta pra X",
  "cobrar material", "entreguei".
---

# /entregas

Arquivo: `gestao/Entregas.md`. Detalhes de cada cliente ficam na nota do cliente em `clientes/<pasta>/<Nome>.md` e no `CLAUDE.md` da pasta.

## Formato de cada projeto

```markdown
### [[clientes/<pasta>/<Nome>|<Nome>]] · <entrega>
- **Status:** <onde está, em uma linha>
- **Esperando:** eu | cliente | combinar com o cliente
- **Falta:** <itens, dizendo de quem é cada um>
- **A receber:** R$ X (vencido desde DD/MM) | —
- **Próximo passo:** <ação concreta>
- **Próximo toque:** AAAA-MM-DD
```

Seções: `## Em andamento` · `## Parado` · `## Entregues`.

## Modos

### Ver ("como estão os projetos")
Ler `gestao/Entregas.md` e responder em poucas linhas, primeiro o que depende do usuário, depois o que está travado no cliente há mais tempo.

### Atualizar ("o cliente mandou as fotos")
- Editar só os campos que mudaram no quadro
- Atualizar a seção "Próximo passo" da nota do cliente, se mudou
- Pagamento envolvido → seguir o `/financeiro` (lançamento na ficha do CRM)

### Cobrar material ("cobra o cliente X")
Mensagem pronta no tom do usuário (`_memoria/preferencias.md`): diz o que já está pronto, lista exatamente o que falta e por quê, e fecha pedindo uma data. Ex.: "Oi! O site já está com a estrutura toda pronta. Pra publicar, só faltam as fotos dos projetos e 2 ou 3 depoimentos de clientes. Consegue me mandar até sexta?" Depois de enviada, marcar o próximo toque pra 2 dias.

### Entregou ("terminei o site da X")
1. Mover pra `## Entregues` com a data
2. Ficha do CRM: conferir se tem pagamento a receber
3. Perguntar: "Vira case? Posso registrar em `saidas/marketing/cases.md` e preparar o post." (o foco atual é conseguir clientes, e case vende)
4. Sugerir o próximo serviço pro cliente (conteúdo, tráfego, CRM), conforme o que ele ainda não tem

## Regras

- Cliente esperando o usuário há mais de 2 dias entra como prioridade 1 no `/hoje`
- Material do cliente atrasado mais de 7 dias: sugerir uma conversa curta, não só mais uma cobrança
- Não guardar senha no quadro. Acessos ficam na nota do cliente (só onde estão)
