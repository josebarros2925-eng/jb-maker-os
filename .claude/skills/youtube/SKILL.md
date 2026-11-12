---
name: youtube
description: >
  Produz o diário de progresso do usuário no YouTube (sobre ele e a jornada, não só sobre a JB Maker), no formato
  falando pra câmera com slides animados em HTML, números reais e
  transparência. Faz pauta a partir do Placar Semanal, roteiro, slides e checklist de gravação. Use quando o
  usuário disser "/youtube", "vídeo pro youtube", "pauta", "roteiro do vídeo", "slides do vídeo",
  "o que eu gravo", "próximo vídeo".
---

# /youtube: diário de progresso

## O canal
- **Sobre:** o usuário e o progresso dele (empresa, produtos, estudo, erros, números). A JB Maker aparece como parte da história, não como propaganda
- **Formato:** o usuário falando pra câmera + slides animados em tela cheia, 6 a 8 minutos, 4K
- **Tom:** transparente e pé no chão. "Não sou milionário, vou mostrar cada real." Nada de guru, promessa ou "renda passiva fácil"
- **Hub:** `saidas/marketing/conteudo/youtube/Canal YouTube.md` (vídeos publicados e ideias)

## Etapas

Cada etapa é uma sessão separada (o tempo do usuário varia). Perguntar em qual ele está, ou seguir a próxima que falta no hub.

### 1. Pauta
1. Ler `Canal YouTube.md` (o que já saiu e as Ideias), `gestao/Placar Semanal.md` e as revisões das semanas desde o último vídeo em `gestao/semanas/`
2. Propor **3 pautas**, cada uma com: título (até 60 caracteres, com número ou contraste quando couber), o gancho dos primeiros 10 segundos e o número real que sustenta o vídeo
3. Boas fontes de pauta: marco novo (primeiro cliente de um nicho, mês com receita maior), erro com número ("mandei 11 mensagens e ninguém fechou"), bastidor (como organizo empresa e estudo), resposta ao que pediram nos comentários do vídeo anterior
4. Se o vidIQ estiver conectado, pode usar `vidiq_score_title` e `vidiq_keyword_research` pra comparar títulos, como apoio

### 2. Roteiro
Arquivo: `saidas/marketing/conteudo/youtube/<tema>-<AAAA-MM-DD>/Roteiro <Título curto>.md`

Estrutura do modelo:
1. **Gancho (0 a 15 s):** o número ou a virada, direto
2. **Quebra de expectativa:** quem eu sou de verdade (sem pose)
3. **Blocos (2 a 4):** cada um com a fala em tópicos (não texto pra ler) e o slide que acompanha. Mostrar prova: tela ao vivo, print, número
4. **Placar:** a conta fechando na tela
5. **Fecho:** uma frase que fica + pergunta pros comentários ("comenta o número")

Marcar `[TELA]` onde corta pra gravação de tela e `[SLIDE n]` onde entra slide.

### 3. Slides
- Copiar a pasta do modelo como base (`slides.html` + `assets/inter.woff2`) pra pasta do vídeo e adaptar os slides ao roteiro
- Manter o padrão: palco 1920x1080, fundo `#050608`, azul `#0067F5`, ciano `#18C2FE`, Inter, número grande com contador, revelação por partes com →, placar
- Controles iguais ao modelo (→ avança, ← volta, R repete, F tela cheia, H número do slide)
- Testar abrindo no navegador antes de entregar

### 4. Gravação
Checklist curto na ficha do vídeo: ordem das falas, telas a gravar, o que borrar, título, descrição e ideia de thumbnail (rosto + número).

### 5. Publicado
Registrar em `Canal YouTube.md` (data, título, link) e perguntar o número que o pessoal comentou, pra virar pauta.

## Ficha do vídeo
Cada pasta de vídeo tem uma ficha com nome descritivo (ex.: `Slides Como Organizo Empresa e Estudo.md`) com link de volta pra `[[saidas/marketing/conteudo/youtube/Canal YouTube|Canal YouTube]]`, o roteiro dos slides, os arquivos e o que está pendente. O `.mp4` fica fora do Git.

## Regras
- **Cliente nunca aparece sem autorização:** nome, logo e telefone borrados, e anotar em "Pendente" que precisa confirmar com o cliente
- Só número real, tirado do Placar, do CRM, do Caixa ou da Cakto. Se não tem o número, perguntar
- Não mostrar dado sensível na tela (saldo bancário completo, CPF, e-mail de cliente)
