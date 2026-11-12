// Leitura (e poucas escritas) das notas de gestão em gestao/ e do hub do YouTube,
// pra tela do CRM mostrar semana, entregas, caixa, placar e canal.
// As notas continuam sendo a fonte da verdade: o Claude e o Obsidian editam os mesmos arquivos.
import fs from 'node:fs/promises';
import path from 'node:path';
import { PASTA_WORKSPACE } from './dados.mjs';

export const PASTA_GESTAO = path.join(PASTA_WORKSPACE, 'gestao');
const PASTA_SEMANAS = path.join(PASTA_GESTAO, 'semanas');
const ARQ = {
  caixa: path.join(PASTA_GESTAO, 'Caixa.md'),
  entregas: path.join(PASTA_GESTAO, 'Entregas.md'),
  placar: path.join(PASTA_GESTAO, 'Placar Semanal.md'),
  youtube: path.join(PASTA_WORKSPACE, 'saidas', 'marketing', 'conteudo', 'youtube', 'Canal YouTube.md'),
};

async function ler(arquivo) {
  try { return (await fs.readFile(arquivo, 'utf8')).replace(/\r\n/g, '\n'); } catch { return ''; }
}

// [[caminho|Nome]] → Nome ; [[caminho]] → último trecho do caminho
const semLinks = (t) => String(t ?? '').replace(/\[\[([^\]|]+)(?:\\?\|([^\]]+))?\]\]/g, (_, c, n) => n || c.split('/').pop());
const linkDe = (t) => { const m = String(t ?? '').match(/\[\[([^\]|]+)/); return m ? m[1] : null; };
const limpar = (t) => semLinks(t).replace(/\*\*/g, '').trim();

// Seções "## Título" → { titulo, linhas[], inicio }
function secoes(texto, nivel = '## ') {
  const linhas = texto.split('\n');
  const out = [];
  let atual = null;
  linhas.forEach((l, i) => {
    if (l.startsWith(nivel)) { atual = { titulo: l.slice(nivel.length).trim(), linhas: [], inicio: i }; out.push(atual); }
    else if (atual) atual.linhas.push({ texto: l, n: i });
  });
  return out;
}

// Linhas de tabela Markdown (sem cabeçalho e separador)
function tabela(linhas) {
  const rows = linhas.map((l) => (typeof l === 'string' ? l : l.texto)).filter((l) => l.trim().startsWith('|'));
  return rows.slice(2).map((r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
}

const numero = (t) => {
  const s = String(t ?? '').replace(/[R$\s]/g, '');
  if (!s || s === '—') return null;
  const n = s.includes(',') ? Number(s.replace(/\./g, '').replace(',', '.')) : Number(s);
  return Number.isFinite(n) ? n : null;
};

// ---------- caixa ----------
export async function lerCaixa() {
  const texto = await ler(ARQ.caixa);
  const m = texto.match(/\*\*Saldo inicial:\*\*\s*([\d.,]+)\s*em\s*(\d{4}-\d{2}-\d{2})/);
  const sec = secoes(texto).find((s) => s.titulo.startsWith('Lançamentos'));
  const lancamentos = sec ? tabela(sec.linhas).filter((c) => c.length >= 5).map(([data, tipo, categoria, descricao, valor]) => ({
    data, tipo: tipo.toLowerCase(), categoria, descricao: limpar(descricao), valor: numero(valor) || 0,
  })) : [];
  return { existe: !!texto, saldoInicial: m ? numero(m[1]) : null, dataSaldo: m ? m[2] : null, lancamentos };
}

const TIPOS_CAIXA = ['entrada', 'saida', 'retirada'];
export async function adicionarCaixa({ data, tipo, categoria, descricao, valor }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '')) throw new Error('Data inválida');
  if (!TIPOS_CAIXA.includes(tipo)) throw new Error('Tipo inválido');
  const v = Number(valor);
  if (!(v > 0)) throw new Error('Valor precisa ser maior que zero');
  const celula = (t) => String(t ?? '').replace(/[|\n]/g, ' ').trim();
  const linhaNova = `| ${data} | ${tipo} | ${celula(categoria) || (tipo === 'saida' ? 'outros' : tipo)} | ${celula(descricao)} | ${v.toFixed(2)} |`;
  const linhas = (await ler(ARQ.caixa)).split('\n');
  const ini = linhas.findIndex((l) => l.startsWith('## Lançamentos'));
  if (ini < 0) throw new Error('Seção "## Lançamentos" não encontrada no Caixa');
  let ultima = -1;
  for (let i = ini + 1; i < linhas.length && !linhas[i].startsWith('## '); i++) if (linhas[i].trim().startsWith('|')) ultima = i;
  if (ultima < 0) throw new Error('Tabela de lançamentos não encontrada no Caixa');
  linhas.splice(ultima + 1, 0, linhaNova);
  await fs.writeFile(ARQ.caixa, linhas.join('\n'), 'utf8');
}

// ---------- entregas ----------
export async function lerEntregas() {
  const texto = await ler(ARQ.entregas);
  return secoes(texto).map((s) => {
    const projetos = [];
    let atual = null;
    const soltos = [];
    for (const { texto: l } of s.linhas) {
      if (l.startsWith('### ')) {
        const t = l.slice(4);
        const [nome, ...resto] = semLinks(t).split(' · ');
        atual = { nome: nome.trim(), entrega: resto.join(' · ').trim(), nota: linkDe(t), campos: {} };
        projetos.push(atual);
      } else if (/^- \*\*[^*]+:\*\*/.test(l) && atual) {
        const m = l.match(/^- \*\*([^*]+):\*\*\s*(.*)$/);
        atual.campos[m[1].trim().toLowerCase()] = limpar(m[2]);
      } else if (l.startsWith('- ') && !atual) {
        soltos.push(limpar(l.slice(2)));
      }
    }
    return { titulo: s.titulo, projetos, itens: soltos };
  });
}

// ---------- placar ----------
export async function lerPlacar() {
  const texto = await ler(ARQ.placar);
  const linhas = texto.split('\n');
  const cab = linhas.find((l) => l.trim().startsWith('| Semana'));
  if (!cab) return { colunas: [], semanas: [] };
  const colunas = cab.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const semanas = tabela(linhas).filter((c) => c.length >= colunas.length - 1).map((c) =>
    Object.fromEntries(colunas.map((nome, i) => [nome, c[i] ?? ''])));
  return { colunas, semanas };
}

// ---------- semana ----------
export async function lerSemana() {
  let arquivos = [];
  try { arquivos = (await fs.readdir(PASTA_SEMANAS)).filter((f) => /^Semana \d{4}-\d{2}-\d{2}\.md$/.test(f)).sort(); } catch { /* pasta vazia */ }
  if (!arquivos.length) return null;
  const arquivo = arquivos[arquivos.length - 1];
  const texto = await ler(path.join(PASTA_SEMANAS, arquivo));
  const titulo = (texto.match(/^# (.+)$/m) || [])[1] || arquivo.replace('.md', '');
  const campo = (nome) => limpar((texto.match(new RegExp(`^\\*\\*${nome}:\\*\\*\\s*(.*)$`, 'mi')) || [])[1] || '');
  const tarefa = ({ texto: l, n }) => {
    const m = l.match(/^\s*- \[( |x|X)\] (.*)$/);
    return m ? { feito: m[1] !== ' ', texto: limpar(m[2]), linha: n } : null;
  };
  const sec = secoes(texto);
  const pegar = (nome) => sec.find((s) => s.titulo.toLowerCase().startsWith(nome)) || { linhas: [], inicio: -1 };
  const metas = pegar('metas').linhas.map(tarefa).filter(Boolean);
  const compromissos = pegar('compromissos').linhas.filter((l) => l.texto.startsWith('- ')).map((l) => limpar(l.texto.slice(2)));
  // Dias: blocos "### Dia DD/MM · tempo" dentro de "## Dias"
  const dias = [];
  for (const l of pegar('dias').linhas) {
    if (l.texto.startsWith('### ')) dias.push({ titulo: limpar(l.texto.slice(4)), tarefas: [] });
    else if (dias.length) { const t = tarefa(l); if (t) dias[dias.length - 1].tarefas.push(t); }
  }
  const revisao = pegar('revisão').linhas.map((l) => l.texto).join('\n').trim();
  return {
    arquivo, titulo: limpar(titulo), estudo: campo('Carga da semana'), foco: campo('Foco'),
    metas, compromissos, dias, revisao: revisao.startsWith('(') ? '' : revisao,
  };
}

export async function alternarTarefa(arquivo, linha) {
  if (!/^Semana \d{4}-\d{2}-\d{2}\.md$/.test(arquivo || '')) throw new Error('Arquivo inválido');
  const caminho = path.join(PASTA_SEMANAS, arquivo);
  const linhas = (await ler(caminho)).split('\n');
  const l = linhas[linha];
  if (!l || !/^\s*- \[( |x|X)\] /.test(l)) throw new Error('Essa linha não é uma tarefa');
  linhas[linha] = /- \[ \]/.test(l) ? l.replace('- [ ]', '- [x]') : l.replace(/- \[(x|X)\]/, '- [ ]');
  await fs.writeFile(caminho, linhas.join('\n'), 'utf8');
}

// ---------- youtube ----------
export async function lerYoutube() {
  const texto = await ler(ARQ.youtube);
  const sec = secoes(texto);
  // Tabela com coluna Plataforma (Data | Plataforma | Título | Link | Pendente); a antiga, de 4 colunas, conta como YouTube.
  const videos = tabela((sec.find((s) => s.titulo.startsWith('Vídeos')) || { linhas: [] }).linhas)
    .map((c) => (c.length >= 5 ? c : [c[0], 'YouTube', ...c.slice(1)]))
    .map(([data, plataforma, titulo, link, pendente]) => ({
      data, plataforma: limpar(plataforma) || 'YouTube', titulo: limpar(titulo), link: (link || '').trim(), pendente: limpar(pendente),
    }));
  const lista = (achar) => (sec.find(achar) || { linhas: [] }).linhas
    .filter((l) => l.texto.startsWith('- ')).map((l) => limpar(l.texto.slice(2)));
  const ideias = lista((s) => s.titulo.startsWith('Ideias') && !/tiktok/i.test(s.titulo));
  const ideiasTiktok = lista((s) => /^Ideias TikTok/i.test(s.titulo));
  return { videos, ideias, ideiasTiktok };
}

export async function lerGestao() {
  const [caixa, entregas, placar, semana, youtube] = await Promise.all([lerCaixa(), lerEntregas(), lerPlacar(), lerSemana(), lerYoutube()]);
  return { caixa, entregas, placar, semana, youtube };
}
