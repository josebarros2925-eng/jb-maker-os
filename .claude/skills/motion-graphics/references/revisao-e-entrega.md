# Revisão e entrega

## O que verificar

Compare com a versão vigente do briefing. Não revise o pedido retroativamente para acomodar um defeito. Registre mudanças deliberadas como mudanças.

| Critério | Evidência útil |
|---|---|
| Comunicação | A ação e sequência permitem entender a mensagem ou impressão desejada? |
| Fidelidade | Comparação com a referência nos momentos correspondentes; escala, posição, câmera, transições e leitura. |
| Movimento | Reprodução integral, entrada/saída das cenas, fluidez, continuidade e acomodação. |
| Texto/dados | Conteúdo exato, legibilidade, contraste, unidades, datas, posições, cortes e colisões. |
| Identidade | Logos, proporções, rosto, produto e regiões protegidas conforme combinado. |
| Som | Audição efetiva, sincronização, ausência de voz indesejada, final e faixas corretas. |
| Arquivo | Decodificação, duração, dimensões, proporção, fps e áudio reais do export. |

Use **verificado**, **problema** ou **não inspecionado**, com momento/arquivo observado e ação necessária. Amostragem demonstra apenas o que cobre. Quadros não comprovam fluidez ou áudio. Se não houver reprodução/audição disponível, declare a limitação; não simule aprovação.

Confira primeiro sentido, movimento e leitura. Metadados corretos não corrigem uma ação ausente. Para composição por código, execute as verificações próprias do motor e depois confira o MP4. Inspecione o final e o início após exportação.

Quando houver efeito escolhido no [catálogo](catalogo.md), confira também a revisão específica de seu guia e as variações confirmadas. Registre a ação solicitada, seu momento no vídeo e o resultado observado. Não avalie um produto explodido apenas pelo material: separação, persistência das peças e remontagem, quando combinada, precisam ser verificadas.

## Correções proporcionais

| Problema | Correção a considerar |
|---|---|
| Cena bonita, mensagem confusa | Rever relação entre ação e conteúdo, hierarquia e ordem. |
| Movimento distante da referência | Rever trajetória, amplitude e tempo no trecho correspondente. |
| Texto incorreto | Corrigir strings/camada de texto; preservar materiais aprovados. |
| Leitura rápida | Ajustar conteúdo/tempo com autorização quando mudar o combinado; descontar entradas/saídas da janela útil. |
| Borda instável | Inspecionar quadros consecutivos, rastreamento, máscara e contaminação de borda. |
| Som deslocado | Corrigir marcadores e duplicações, mantendo visual quando aprovado. |
| Mudança localizada | Comparar regiões e recursos protegidos; evitar reconstrução completa. |
| Exportação diferente da prévia | Verificar mídia, fontes, tempo, cor/faixa, codificação e recursos locais. |

Geração corretiva paga só dentro do pacote autorizado; fora dele, nova estimativa e autorização. Se a técnica não consegue atingir precisão necessária, explique o limite e uma alternativa concreta antes de mudar método. Preserve a versão anterior.

## Critério de conclusão

Conclua quando o pedido, seus requisitos verificáveis e a inspeção da entrega estiverem satisfeitos. Melhorias adicionais precisam resolver um problema identificado. Não mantenha um ciclo indefinido de efeitos e gerações.

Entregue o arquivo final acessível e o projeto editável se solicitado, com recursos necessários e instruções de reprodução. Informe duração, formato, áudio e limitações relevantes de forma curta. Diferencie previsto, enviado, concluído e inspecionado. Não diga “custo real” se só tem estimativa. Não publique materiais sem pedido.

## Inspecao tecnica opcional

`scripts/inspect_video.py` usa FFprobe para conferir propriedades de um arquivo local. Requer Python 3.10+ e FFprobe no PATH. Ele não chama rede, não altera vídeo e não faz análise visual, sonora ou decodificação integral.

```sh
python3 /caminho/da/skill/scripts/inspect_video.py /caminho/do/projeto/video.mp4 --duration 12 --size 1080x1920 --fps 30 --audio absent
```

Use `--audio present`, `absent` ou `any` conforme o combinado; `any` é o padrão. Omita expectativas não definidas. `--duration-tolerance` permite tolerância explícita em segundos (padrão 0.1). Saída JSON inclui propriedades, verificações e limites. Código 0 indica que os campos solicitados passaram; 1 indica divergência; 2 indica impossibilidade de inspeção/entrada inválida. Isso nunca significa aprovação estética.
