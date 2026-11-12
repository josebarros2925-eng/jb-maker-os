# Escolher e executar a técnica

Leia somente a seção necessária. Estes critérios não substituem a documentação atual da ferramenta.

## Composição por código

Boa opção para tipografia, interfaces, dados e tempos exatos. Derive o estado visual do tempo da composição. Reproduzir ou avançar até o mesmo instante deve produzir o mesmo quadro. Evite relógio real, sorteio não controlado, requisições durante render e callbacks dependentes exclusivamente de reprodução contínua.

Se houver aleatoriedade estética, fixe uma semente e recalcule pelo tempo. Pré-carregue mídia/fontes e verifique estados no início, fim e após saltos. Vídeos embutidos precisam acompanhar o tempo corretamente e aparecer no MP4 final, não apenas na prévia.

Com HyperFrames disponível, use sua skill de entrada e documentação atual para contrato de timeline, mídia, verificação e exportação. Não copie parâmetros de uma versão antiga sem conferir. Com outro motor, adapte esses invariantes. Registre versões por projeto. Não instale uma pilha nova apenas porque esta skill foi ativada.

Se o roteador técnico apontar para uma skill `motion-graphics` e esse nome resolver de volta para esta mesma pasta, não reinicie o fluxo nem entre em recursão. Consulte diretamente a documentação ou guias de composição, animação e CLI pertinentes ao projeto. Preserve as escolhas e aprovações já registradas; padrões de outra ferramenta não substituem o formato, áudio ou limite de gastos do usuário.

## Objetos 3D

Para uma vista explodida com separação, inspeção e eventual remontagem, leia o [guia de produto explodido](modelos/produto-explodido.md). Para partes que chegam e constroem o produto, leia [montagem dinâmica](modelos/montagem-dinamica.md). São coreografias diferentes; um giro genérico não substitui essas ações.

Planeje geometria, materiais, luz, câmera, articulações e texturas por face. Em livro, frente e verso de uma folha pertencem à mesma geometria; fechamento envolve capa/bloco e dobradiça. Confirme ausência de interseções, faces espelhadas, bordas cortadas e saltos de textura.

Textos/logos exatos podem ser texturas ou elementos separados com posição coerente. Teste legibilidade durante a pose de leitura. Use sombras e reflexos proporcionais ao material. O motor pode ser Three.js, Blender ou outro disponível e escolhido; a skill não exige um deles.

## Filmagem, interfaces e recortes

Separe regiões alteráveis e protegidas. Se a pessoa/ambiente deve permanecer, preserve a filmagem e edite localmente quando viável. Rastreie o plano de inserção e o contorno relevante. Examine estabilidade temporal, vazamentos, halos, bordas contaminadas e oclusões.

Segmentação de um quadro não comprova o vídeo inteiro. Use inspeção densa nos trechos defeituosos e estabilização temporal quando necessária. Não reduza a taxa de atualização da máscara sem verificar o efeito. Preserve escala, posição, áudio e sequência aprovados.

Reexportação pode introduzir mudanças de cor, faixa ou compressão. Verifique a saída e distinga preservação antes da compressão de igualdade pixel a pixel após codificação. Não prometa identidade binária sem medir.

## Geração de imagens e clipes

Descreva sujeito, ação, enquadramento, espaço para sobreposições, materiais, iluminação e identidade. Use papéis de referência aceitos pelo serviço. Texto obrigatório e dados podem precisar de composição exata posterior; decida antes de produzir.

Uma imagem gerada não é prova de movimento. Um clipe pode variar anatomia, texto, textura e duração; inspecione. Gerar filme completo ou clipes separados é decisão do projeto. Continuidade de personagem/câmera e controle editorial orientam a escolha. Não divida automaticamente uma ação contínua por causa de uma falha do provedor.

Siga orçamento e pacote autorizados. Material de teste também consome orçamento quando externo. Não use o melhor vídeo de uma galeria como evidência da qualidade do seu resultado.

## Gráficos e números

Preserve dados de origem, unidades, período, escala, observações e fonte. Mantenha valor final visível quando solicitado. Se houver simplificação/suavização, conserve extremos, âncoras e pontos finais; verifique que a curva não cria valores falsos. Identifique escalas logarítmicas e ligações esquemáticas.

Separe geometria, rótulos e narração. Um evento aparecer antes de uma alta/queda não demonstra sua causalidade isolada. Verifique a alegação adequada. Use dados fictícios claramente identificados em exercícios, nunca como estatísticas reais.

Mostre destaques em sequência com tempo de leitura. Colunas ou áreas separadas podem evitar colisão. Faça verificações de posições ao longo do tempo, não apenas no quadro final.

## Áudio

Defina marcadores compartilhados para som e gesto. O pico de um arraste pode coincidir com sua maior velocidade; impacto com contato; papel com a virada. Meça a percepção no arquivo, sem aplicar um deslocamento fixo universal.

Música, efeitos, voz existente e nova locução são decisões separadas. Se substituir efeitos, remova ou neutralize os antigos para evitar duplicação. Faça fades/crossfades quando adequados, preserve inteligibilidade e confira cortes, picos e final. Sem áudio solicitado significa conferir ausência de faixa quando esse for o acordo.

## Adaptação de formato

Recomponha trajetórias, centro de atenção, espaçamento e quebras de linha. Use áreas seguras do destino quando conhecidas. Um mesmo fundo pode exigir novo recorte ou resolução. Não apresente esticamento, barras ou corte que removem conteúdo como adaptação equivalente sem combinar.
