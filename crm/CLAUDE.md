# CRM JB Maker

Pasta do CRM próprio da JB Maker: funil de clientes, ganhos e indicadores de cliente ideal.
Tudo roda no computador do usuário e os dados são arquivos desta pasta. Instruções aqui valem quando o assunto for leads, clientes, funil ou ganhos.

## Onde está cada coisa

- `Painel CRM.md`: resumo gerado (funil, quem cobrar, ganhos, cliente ideal). **Ler primeiro** pra qualquer pergunta sobre o CRM. Não editar à mão
- `dados/leads/<id>.md`: uma ficha por lead ou cliente (fonte da verdade)
- `app/`: servidor local (`server.mjs`), indicadores (`lib/indicadores.mjs`), gerador do painel (`painel.mjs`), importador de pesquisa (`importar-pesquisa.mjs`) e a tela (`public/`)
- `Abrir CRM.bat`: dois cliques abre o CRM em http://localhost:4317
- Abas de gestão (Minha semana, Entregas, Caixa, Placar semanal, YouTube): leem as notas em `gestao/` e `saidas/marketing/conteudo/youtube/Canal YouTube.md` (`app/lib/gestao.mjs`). A tela só escreve em dois lugares: lançamento novo no Caixa e marcar tarefa na nota da semana. Manter os formatos dessas notas, senão a aba não acha os dados

## Formato da ficha

```yaml
---
tipo: crm-lead
nome: Clínica Exemplo
etapa: conversa            # pesquisado | contato | conversa | proposta | entrada | cliente | perdido
perdido_em_etapa:          # só se perdido: etapa em que estava
motivo_perda:              # só se perdido: preço, sumiu / não respondeu, fechou com outro...
prioridade: quente         # quente | morno | frio (leads de pesquisa)
nicho: odontologia         # minúsculo, sempre o mesmo nome pro mesmo nicho
cidade: Sua Cidade
origem: instagram          # instagram, indicação, pesquisa de leads, google...
abordagem: whatsapp        # como a conversa foi aberta
sinal: inauguração         # sinal de momento visto na abordagem: inauguração, nova unidade, contratando, investindo em conteúdo, serviço novo, domínio sem site, site velho, sem sinal
servicos: [site, google meu negócio]
valor_proposta: 350
responsavel: Nome do Dono
telefone: (15) 99999-9999
instagram: https://...
site: https://...
proximo_passo: Reunião com o dono
proximo_toque: 2026-10-30  # data em que o usuário precisa voltar a falar com o lead
nota_cliente: "[[clientes/<pasta>/<Nome>|<Nome>]]"   # quando virar cliente com pasta própria
data_contato: 2026-10-27   # uma data por etapa alcançada (data_pesquisado ... data_cliente, data_perdido)
data_conversa: 2026-10-27
lancamentos:
  - data: 2026-10-20
    valor: 200
    servico: site          # site, crm, tráfego, conteúdo...
    tipo: projeto          # projeto | recorrente
    status: recebido       # recebido | a receber
    descricao: entrada
---
# Nome

> Ficha do CRM · [[crm/Painel CRM|Painel CRM]]

## Notas
Texto livre.

## Histórico
- 2026-10-27 · whatsapp · O que aconteceu, numa linha
```

## Regras pra editar pelo Claude

- Pode editar as fichas direto. Manter o formato acima: datas `AAAA-MM-DD`, histórico com ` · ` entre data, canal e texto, uma linha por registro
- **Abordagem é obrigatória:** todo lead que passou de `pesquisado` precisa ter `abordagem` (o que foi feito, escrito curto). Ao registrar um envio, preencher sempre. Se não souber qual foi, perguntar ao usuário antes de salvar. A tela marca "sem abordagem" e pede o campo ao mudar de etapa
- Origem: quem o usuário acha pelo anúncio da empresa no Instagram é `anúncio no instagram`
- Ao mudar `etapa`, preencher `data_<etapa>` com a data do dia (as taxas e os tempos do funil saem dessas datas). Ao marcar `perdido`, preencher `perdido_em_etapa`, `motivo_perda` e `data_perdido`
- Pagamento combinado entra em `lancamentos` como `a receber`; quando cair, trocar pra `recebido`. Recorrência (tráfego, conteúdo) = um lançamento por mês
- Lead novo: arquivo `dados/leads/<nome-em-slug>.md` (minúsculo, sem acento, hífen no lugar de espaço)
- Depois de editar, rodar `node crm/app/painel.mjs` pra atualizar o `Painel CRM.md` (com a tela aberta isso acontece sozinho)
- Pesquisa de leads nova: `node crm/app/importar-pesquisa.mjs <json> --cidade <Cidade> [--prioridades <json>]` (pula quem já está no CRM)
- Apagar ficha é definitivo (a tela remove o arquivo, sem lixeira). Só apagar quando o usuário pedir
- Telefones e nomes de donos vêm de fontes públicas (Google, Receita). Não guardar senha nem dado sensível aqui

## Como os indicadores são calculados

- **Abordado** = chegou em `contato`. "Pesquisado" fica fora das taxas
- **Fechou** = chegou em `entrada` (pagou a entrada)
- **Taxa de fechamento** = fechados ÷ abordados, geral e por nicho, origem, abordagem, sinal de momento, cidade e serviço
- **Ticket médio** = recebido ÷ clientes com algum recebimento
- **Cliente ideal** = grupo com maior taxa de fechamento (desempate: ticket); com menos de 10 abordados é só pista
