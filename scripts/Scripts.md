# Scripts

> Volta: [[Início]]

Utilitários que as skills chamam.

| Script | Skill | O que faz |
|---|---|---|
| `prospectar-leads.js` | `/pesquisar-leads` | Busca empresas no Google Places (chave em `GOOGLE_PLACES_API_KEY` ou `.env/google-places.txt`), audita sites e consulta o CNPJ na BrasilAPI |
| `lib/site.js` | `/pesquisar-leads` | Funções de site, CNPJ e domínio usadas pelo script acima |
| `gerar-mapa.js` | `/mapa` | Gera a parte automática do `_mapa.md` |
| `render/` | `/motion-graphics`, `/carrossel` | Playwright instalado aqui. O `render.js` de cada peça usa ele pra gerar PNG e vídeo (com FFmpeg) |

Pré-requisitos: Node.js 20+, FFmpeg no PATH (vídeos). O `instalar.bat` instala as dependências.
