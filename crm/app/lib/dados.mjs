// Leitura e escrita das fichas do CRM.
// Cada lead ou cliente é uma nota Markdown em crm/dados/leads/<id>.md:
// propriedades no frontmatter (YAML) e o histórico de conversas no corpo.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const aqui = path.dirname(fileURLToPath(import.meta.url));
export const PASTA_CRM = path.resolve(aqui, '..', '..');
export const PASTA_WORKSPACE = path.resolve(PASTA_CRM, '..');
export const PASTA_LEADS = path.join(PASTA_CRM, 'dados', 'leads');

// Ordem do funil. "perdido" fica fora da sequência.
export const ETAPAS = ['pesquisado', 'contato', 'conversa', 'proposta', 'entrada', 'cliente'];
export const NOMES_ETAPAS = {
  pesquisado: 'Pesquisado',
  contato: 'Contato',
  conversa: 'Conversa',
  proposta: 'Proposta',
  entrada: 'Entrada paga',
  cliente: 'Cliente',
  perdido: 'Perdido',
};

// Ordem das propriedades na nota (o que não estiver aqui vai pro fim).
const CAMPOS = [
  'tipo', 'nome', 'etapa', 'perdido_em_etapa', 'motivo_perda', 'prioridade',
  'nicho', 'cidade', 'origem', 'abordagem', 'sinal', 'servicos', 'valor_proposta',
  'responsavel', 'telefone', 'instagram', 'site', 'maps',
  'proximo_passo', 'proximo_toque', 'nota_cliente',
  ...ETAPAS.map((e) => `data_${e}`), 'data_perdido',
  'lancamentos',
];

const TITULO_HISTORICO = '## Histórico';
const LINHA_HISTORICO = /^- (\d{4}-\d{2}-\d{2}) · ([^·]+?) · (.*)$/;

export function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function slug(texto) {
  return String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'lead';
}

function vazio(v) {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

// ---------- leitura ----------

export function interpretarNota(id, texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const props = m ? (YAML.parse(m[1]) || {}) : {};
  const corpo = (m ? m[2] : texto).replace(/\r\n/g, '\n');

  // Separa o bloco "## Histórico" do resto do corpo, que fica intocado.
  const linhas = corpo.split('\n');
  const inicio = linhas.findIndex((l) => l.trim() === TITULO_HISTORICO);
  let historico = [];
  let antes = corpo;
  let depois = '';
  if (inicio >= 0) {
    let fim = linhas.findIndex((l, i) => i > inicio && /^## /.test(l));
    if (fim < 0) fim = linhas.length;
    historico = linhas.slice(inicio + 1, fim)
      .map((l) => l.match(LINHA_HISTORICO))
      .filter(Boolean)
      .map(([, data, canal, texto]) => ({ data, canal: canal.trim(), texto: texto.trim() }));
    antes = linhas.slice(0, inicio).join('\n');
    depois = linhas.slice(fim).join('\n');
  }

  const lancamentos = (props.lancamentos || []).map((l) => ({
    data: String(l.data || ''),
    valor: Number(l.valor) || 0,
    servico: l.servico || '',
    tipo: l.tipo === 'recorrente' ? 'recorrente' : 'projeto',
    status: l.status === 'a receber' ? 'a receber' : 'recebido',
    descricao: l.descricao || '',
  }));

  const lead = { id, ...props, servicos: props.servicos || [], lancamentos, historico };
  for (const k of Object.keys(lead)) {
    if (/^data_/.test(k) || k === 'proximo_toque') lead[k] = lead[k] ? String(lead[k]) : '';
  }
  Object.defineProperty(lead, '_corpo', { value: { antes, depois }, enumerable: false, writable: true });
  // Notas: só leitura pra tela (o texto continua intocado no arquivo, via _corpo).
  const notas = antes.match(/^## Notas\n([\s\S]*)$/m);
  lead.notas = notas ? notas[1].replace(/\n## [\s\S]*$/, '').trim() : '';
  return lead;
}

export async function listarLeads() {
  await fs.mkdir(PASTA_LEADS, { recursive: true });
  const arquivos = (await fs.readdir(PASTA_LEADS)).filter((f) => f.endsWith('.md'));
  const leads = await Promise.all(arquivos.map(async (f) => {
    const texto = await fs.readFile(path.join(PASTA_LEADS, f), 'utf8');
    return interpretarNota(f.slice(0, -3), texto);
  }));
  return leads.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
}

export async function lerLead(id) {
  const texto = await fs.readFile(caminho(id), 'utf8');
  return interpretarNota(id, texto);
}

function caminho(id) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('id inválido');
  return path.join(PASTA_LEADS, `${id}.md`);
}

// ---------- escrita ----------

export function montarNota(lead) {
  const props = { tipo: 'crm-lead' };
  const chaves = [...CAMPOS, ...Object.keys(lead).filter((k) => !CAMPOS.includes(k))];
  for (const k of chaves) {
    if (['id', 'historico', 'tipo', 'notas'].includes(k) || k.startsWith('_')) continue;
    const v = lead[k];
    if (vazio(v)) continue;
    props[k] = v;
  }
  const yaml = YAML.stringify(props, { lineWidth: 0 }).trimEnd();

  const corpoOriginal = lead._corpo;
  const antes = corpoOriginal
    ? corpoOriginal.antes.trimEnd()
    : `# ${lead.nome}\n\n> Ficha do CRM · [[crm/Painel CRM|Painel CRM]]\n\n## Notas\n${lead.notas ? `${lead.notas.trim()}\n` : ''}`;
  const depois = corpoOriginal ? corpoOriginal.depois.trim() : '';

  const historico = [...(lead.historico || [])]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((h) => `- ${h.data} · ${h.canal || 'nota'} · ${String(h.texto).replace(/\n+/g, ' ')}`)
    .join('\n');

  return `---\n${yaml}\n---\n${antes.trimEnd()}\n\n${TITULO_HISTORICO}\n${historico}${historico ? '\n' : ''}${depois ? `\n${depois}\n` : ''}`;
}

// Mudança de etapa: registra a data da etapa nova e, se perdeu, em que etapa estava.
export function aplicarEtapa(novo, anterior) {
  const etapa = novo.etapa || 'contato';
  novo.etapa = etapa;
  const mudou = !anterior || anterior.etapa !== etapa;
  if (mudou && !novo[`data_${etapa}`]) novo[`data_${etapa}`] = hoje();
  if (etapa === 'perdido') {
    if (!novo.perdido_em_etapa) {
      novo.perdido_em_etapa = anterior && anterior.etapa !== 'perdido' ? anterior.etapa : 'contato';
    }
  } else {
    delete novo.perdido_em_etapa;
    delete novo.motivo_perda;
    delete novo.data_perdido;
  }
  return novo;
}

async function gravar(id, lead) {
  await fs.mkdir(PASTA_LEADS, { recursive: true });
  const destino = caminho(id);
  const temp = `${destino}.tmp`;
  await fs.writeFile(temp, montarNota(lead), 'utf8');
  await fs.rename(temp, destino);
}

export async function criarLead(dados) {
  if (!dados.nome) throw new Error('O lead precisa de um nome');
  const base = slug(dados.nome);
  const existentes = new Set((await fs.readdir(PASTA_LEADS).catch(() => [])).map((f) => f.replace(/\.md$/, '')));
  let id = base;
  for (let n = 2; existentes.has(id); n++) id = `${base}-${n}`;
  const lead = aplicarEtapa({ ...dados, historico: dados.historico || [], lancamentos: dados.lancamentos || [] });
  await gravar(id, lead);
  return lerLead(id);
}

export async function salvarLead(id, dados) {
  const anterior = await lerLead(id);
  const lead = aplicarEtapa({ ...dados }, anterior);
  lead._corpo = anterior._corpo;
  await gravar(id, lead);
  return lerLead(id);
}

// Apagar remove a nota de vez (não tem lixeira).
export async function apagarLead(id) {
  await fs.unlink(caminho(id));
}
