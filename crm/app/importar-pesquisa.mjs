// Importa o JSON de uma pesquisa de leads (skill /pesquisar-leads) pro CRM, na etapa "pesquisado".
// Uso: node crm/app/importar-pesquisa.mjs <arquivo.json> [--nicho "<nicho>"] [--cidade <Cidade>] [--prioridades prioridades.json]
// --prioridades: JSON { "Nome da empresa": { "prioridade": "quente", "abordagem": "whatsapp", "sinal": "inauguração", "responsavel": "..." } }
// Empresa que já está no CRM (mesmo nome) é pulada.
import fs from 'node:fs/promises';
import path from 'node:path';
import { listarLeads, criarLead, slug, hoje } from './lib/dados.mjs';
import { gerarPainel } from './painel.mjs';

const args = process.argv.slice(2);
const opcao = (nome) => { const i = args.indexOf(`--${nome}`); return i >= 0 ? args[i + 1] : undefined; };
const arquivo = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!arquivo) {
  console.error('Uso: node crm/app/importar-pesquisa.mjs <arquivo.json> [--nicho X] [--cidade Y] [--prioridades arquivo.json]');
  process.exit(1);
}

const pesquisa = JSON.parse(await fs.readFile(arquivo, 'utf8'));
const extras = opcao('prioridades') ? JSON.parse(await fs.readFile(opcao('prioridades'), 'utf8')) : {};
const extrasPorSlug = Object.fromEntries(Object.entries(extras).map(([k, v]) => [slug(k), v]));
const nicho = (opcao('nicho') || pesquisa.nicho || '').toLowerCase();
const cidade = opcao('cidade') || String(pesquisa.regiao || '').split(/[,-]/)[0].trim();
const dataPesquisa = String(pesquisa.geradoEm || hoje()).slice(0, 10);
const relatorio = path.basename(arquivo, '.json');

const existentes = new Set((await listarLeads()).map((l) => slug(l.nome)));
let criados = 0;
for (const e of pesquisa.empresas || []) {
  const nome = e.nome.length > 3 && e.nome === e.nome.toUpperCase()
    ? e.nome.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
    : e.nome;
  if (existentes.has(slug(nome)) || existentes.has(slug(e.nome))) continue;
  const a = e.auditoria || {};
  const problemas = [
    a.ok === false && 'site fora do ar',
    a.ok && a.responsivo === false && 'site não responsivo',
    a.ok && !a.linkWhatsapp && 'site sem WhatsApp',
    a.tempoMs > 4000 && `site lento (${(a.tempoMs / 1000).toFixed(1)} s)`,
    !e.site && 'sem site',
  ].filter(Boolean);
  const extra = extrasPorSlug[slug(e.nome)] || extrasPorSlug[slug(nome)] || {};
  await criarLead({
    nome,
    etapa: 'pesquisado',
    nicho,
    cidade,
    origem: 'pesquisa de leads',
    telefone: e.telefone || '',
    site: e.site || '',
    maps: e.maps || '',
    data_pesquisado: dataPesquisa,
    ...extra,
    notas: [
      `- Google: ${e.nota ?? '—'} (${e.avaliacoes ?? 0} avaliações)${e.endereco ? ` · ${e.endereco}` : ''}`,
      `- Site: ${a.plataforma || '—'} · Google Ads: ${a.googleAds ? 'sim' : 'não'} · Pixel da Meta: ${a.pixelMeta ? 'sim' : 'não'}`,
      problemas.length ? `- Problemas: ${problemas.join(', ')}` : '',
      `- Pesquisa: \`${relatorio}\``,
    ].filter(Boolean).join('\n'),
  });
  existentes.add(slug(nome));
  criados++;
}
await gerarPainel();
console.log(`${criados} leads importados (${(pesquisa.empresas || []).length - criados} já estavam no CRM).`);
