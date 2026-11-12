# Ferramentas, materiais e orçamento

## Duas escolhas separadas

1. **Origem das imagens:** fornecidas, ferramenta de imagens do ambiente GPT, Higgsfield, outro gerador ou combinação.
2. **Produção do movimento:** composição por código, geometria 3D, edição de filmagem, vídeo gerado ou composição híbrida.

Pergunte sobre a origem das imagens quando ausente. Proponha o método de animação pela necessidade de precisão, identidade, organicidade, edição e orçamento. Confirme antes de construir. “Pode usar Higgsfield para imagens” não escolhe nem autoriza geração do filme inteiro.

| Necessidade | Rota a considerar, se disponível |
|---|---|
| Texto/dados exatos e revisões locais | Texto/gráfico editável e animação determinística. |
| Folhas curvas, objetos articulados e câmera controlável | Geometria 3D com materiais e luz. |
| Fogo, fumaça, tecido ou ambiente orgânico | Filmagem existente ou geração de clipe, conforme controle necessário. |
| Mesmo rosto/ambiente, mudando somente interface | Edição localizada, rastreamento e máscaras. Não regenerar tudo por padrão. |
| Imagens cinematográficas e textos precisos | Imagens/clipes combinados com tipografia e composição editáveis. |

Não imponha uma ferramenta nem substitua uma escolha explícita sem combinar. Se um serviço estiver indisponível, finalize o planejamento que puder e explique alternativas concretas. Não instale extensões, altere contas ou autentique em nome do usuário sem pedido.

## Verificação de acesso e capacidade

Inspecione ferramentas realmente expostas. Consulte modelos, parâmetros, papéis de referência, resoluções, proporções, duração, áudio e limites atuais. Um modelo listado não prova que a conta pode usá-lo. Preço histórico não é preço vigente. Use somente leitura; não submeta jobs, uploads ou cobranças para testar conexão.

Se a ferramenta de imagens do ambiente GPT estiver disponível e for escolhida, siga suas instruções; não afirme que o modelo de linguagem emite vídeo nativamente. Explique limites de uso conhecidos sem inventar uma equivalência entre assinatura, créditos e dinheiro.

## Planeje cada material antes de gerar

Reutilize o fornecido e o já aprovado. Declare função, quantidade, enquadramento e resolução necessários. Não gerar uma imagem por cena automaticamente. Uma única identidade pode servir a várias cenas; uma prancha não equivale a vários jobs.

Proporção, resolução da imagem, resolução do clipe e resolução final são campos diferentes. “1K” não significa 1080×1920, nem uma proporção. Confira dimensões efetivas retornadas. Use mais resolução quando recorte, zoom ou detalhe justificarem; não aumente por hábito. Prefira texto/logo separados da imagem quando precisam permanecer exatos.

## Aprovação externa antes da construção

Após alinhamento e análise, levante custo de **toda geração externa prevista**, inclusive quadros de direção, testes de movimento, imagens, clipes, áudio, upscale e tentativas adicionais. Não execute essas etapas como parte do levantamento.

Apresente:

- Provedor/modelo e configuração que influencia preço.
- Quantidade de materiais e unidade de cobrança: imagem, job, segundo ou outra.
- Custo unitário ou intervalo fundamentado, fonte da consulta e data.
- Tentativas planejadas e o que está incluído no pacote.
- Total por provedor e moeda/unidade. Não some créditos de serviços diferentes nem converta em reais sem taxa fundamentada.
- Estimativa, incertezas, saldo/franquia apenas se verificados e limite que está sendo solicitado.

Exemplo de pergunta, preenchido com a cotação real da sessão:

> Para esta rodada, proponho [itens e configurações]. O custo estimado é [total por serviço], com [tentativas incluídas]. Você autoriza essa rodada, com limite de [teto informado], para começarmos a construção?

Preencha o escopo e total antes de perguntar. Não apresente campos vazios como orçamento pronto. Uma cotação fechada verificável também serve: declare o pacote, suas condições e total, sem inventar preço unitário ou dividir o total e chamar a média de tarifa. Registre detalhes não fornecidos como indisponíveis; antes da execução, confirme as capacidades/configurações necessárias para reproduzir aquele pacote.

Se preço não puder ser consultado, peça a tabela/estimativa atual ao usuário ou apresente rota sem esse gasto para escolha. Não peça “aprovação” para um custo desconhecido como se fosse estimado. Se ferramenta exigir submissão para revelar preço, pare antes da submissão e explique.

Zero confirmado, franquia ou plano sem cobrança incremental devem ser descritos com limites conhecidos e confirmados antes do uso externo. Nunca trate desconhecido como gratuito. Uma faixa de custo precisa ter fundamento; para autorização, explicite seu teto. Estimativa não garante a cobrança final: explique variabilidade e só opere num pacote que caiba no limite verificável.

## Execução e revisões

Registre a resposta explícita, itens, teto e escopo autorizados. Um “sim” responde à proposta apresentada, não a qualquer gasto futuro. Aprovação cobre a rodada definida; mudanças que a excedam exigem nova proposta. Depois de aprovado, não repita pedidos para os mesmos passos.

Mantenha registro privado de cotação, modelo/configuração, materiais enviados, IDs, estado e resultado. Em timeout/resposta incerta, consulte a solicitação existente. Não faça nova cobrança para compensar falta de retorno. Antes de retry, determine falha, custo e cobertura pelo pacote aprovado.

Respeite o mecanismo de espera e intervalo indicados pelo provedor. Se não houver orientação, faça consultas espaçadas e evite repetição rápida; mantenha o usuário informado de mudanças relevantes. Se consultas continuarem inconclusivas, conserve o job e marque a entrega como pendente. Explique qual status/cobrança falta e peça evidência do painel ou uma ação concreta apenas se ela for necessária. Não prometa monitoramento futuro que não foi configurado, nem fique consultando indefinidamente, nem reenvie o job. Retome a mesma solicitação quando houver informação nova.

Diferencie estimativa de valor efetivamente cobrado. Reporte cobrança somente quando conhecida. Se faltar saldo, explique opções: reduzir materiais, reaproveitar, mudar resolução/método ou aguardar. O usuário escolhe; não troque unilateralmente.

## Calculadora local

`scripts/estimate_budget.py` soma **cotações inseridas**. Não chama provedores, consulta preços, verifica saldo ou concede autorização. Requer Python 3.10+. Exemplo fictício, exclusivamente didático:

```json
{
  "items": [
    {
      "label": "Duas imagens, uma tentativa cada",
      "provider": "Provedor didático",
      "model": "Modelo de exemplo",
      "settings": "Formato confirmado; resolução de exemplo",
      "unit": "credito-demo",
      "unit_cost": "2.50",
      "quantity": 2,
      "attempts": 1,
      "quote_source": "Exemplo fictício; substituir por consulta real",
      "quoted_at": "2026-01-01"
    }
  ]
}
```

`quantity` é o número de unidades cobradas por tentativa. Para 2 clipes de 4 segundos cobrados por segundo, use 8. `attempts` é o multiplicador de tentativas **planejadas para esse grupo**, incluindo a primeira. Itens com políticas distintas devem ser linhas separadas. O total representa toda a rodada planejada; não é previsão de quantas tentativas falharão.

```sh
python3 /caminho/da/skill/scripts/estimate_budget.py /caminho/do/projeto/cotacao.json
```

Saída: itens calculados e totais separados por provedor/unidade, sempre identificados como estimativas. Valores ausentes, negativos, não finitos ou unidades ambíguas por omissão são rejeitados. Fonte/data registradas não são verificação automática de validade.
