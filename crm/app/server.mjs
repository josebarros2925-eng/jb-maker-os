// Servidor local do CRM: http://localhost:4317
// Só escuta no próprio computador (127.0.0.1). Os dados ficam em crm/dados/leads/.
import http from 'node:http';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listarLeads, lerLead, criarLead, salvarLead, apagarLead,
  PASTA_LEADS, PASTA_WORKSPACE, ETAPAS, NOMES_ETAPAS,
} from './lib/dados.mjs';
import { calcularIndicadores } from './lib/indicadores.mjs';
import { gerarPainel } from './painel.mjs';
import { lerGestao, adicionarCaixa, alternarTarefa } from './lib/gestao.mjs';

const PORTA = Number(process.env.PORTA_CRM) || 4317;
const aqui = path.dirname(fileURLToPath(import.meta.url));
const PUBLICO = path.join(aqui, 'public');
const ENDERECO = `http://localhost:${PORTA}`;

// `node server.mjs --abrir` abre o navegador assim que o servidor estiver pronto.
function abrirNavegador() {
  if (!process.argv.includes('--abrir')) return;
  const comando = process.platform === 'win32' ? `start "" "${ENDERECO}"` : process.platform === 'darwin' ? `open ${ENDERECO}` : `xdg-open ${ENDERECO}`;
  exec(comando);
}

const ESTATICOS = {
  '/vendor/chart.js': path.join(aqui, 'node_modules', 'chart.js', 'dist', 'chart.umd.min.js'),
  '/logo.png': path.join(PASTA_WORKSPACE, 'identidade', 'logo.png'),
};
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

function responder(res, status, corpo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(corpo));
}

async function lerCorpo(req) {
  const partes = [];
  for await (const parte of req) partes.push(parte);
  const texto = Buffer.concat(partes).toString('utf8');
  return texto ? JSON.parse(texto) : {};
}

// O painel é regerado depois de qualquer gravação, pela tela ou por fora (IA, Obsidian).
let agendado = null;
function atualizarPainel() {
  clearTimeout(agendado);
  agendado = setTimeout(() => gerarPainel().catch((e) => console.error('Erro ao gerar o painel:', e.message)), 400);
}

async function api(req, res, url) {
  const [, , recurso, id] = url.pathname.split('/');
  if (recurso === 'dados' && req.method === 'GET') {
    const leads = await listarLeads();
    return responder(res, 200, { leads, indicadores: calcularIndicadores(leads), etapas: ETAPAS, nomesEtapas: NOMES_ETAPAS });
  }
  // Gestão: semana, entregas, caixa, placar e YouTube (notas em gestao/ e no hub do canal)
  if (recurso === 'gestao' && req.method === 'GET') return responder(res, 200, await lerGestao());
  if (recurso === 'caixa' && req.method === 'POST') {
    await adicionarCaixa(await lerCorpo(req));
    return responder(res, 201, await lerGestao());
  }
  if (recurso === 'tarefa' && req.method === 'POST') {
    const { arquivo, linha } = await lerCorpo(req);
    await alternarTarefa(arquivo, Number(linha));
    return responder(res, 200, await lerGestao());
  }
  if (recurso !== 'leads') return responder(res, 404, { erro: 'Rota não encontrada' });

  if (!id && req.method === 'POST') {
    const lead = await criarLead(await lerCorpo(req));
    atualizarPainel();
    return responder(res, 201, lead);
  }
  if (id && req.method === 'GET') return responder(res, 200, await lerLead(id));
  if (id && req.method === 'PUT') {
    const lead = await salvarLead(id, await lerCorpo(req));
    atualizarPainel();
    return responder(res, 200, lead);
  }
  if (id && req.method === 'DELETE') {
    await apagarLead(id);
    atualizarPainel();
    return responder(res, 200, { ok: true });
  }
  return responder(res, 405, { erro: 'Método não suportado' });
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);

    const arquivo = ESTATICOS[url.pathname]
      || path.join(PUBLICO, url.pathname === '/' ? 'index.html' : path.normalize(url.pathname).replace(/^([/\\])+/, ''));
    if (!arquivo.startsWith(PUBLICO) && !Object.values(ESTATICOS).includes(arquivo)) return responder(res, 403, { erro: 'Proibido' });
    const conteudo = await fsp.readFile(arquivo);
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(conteudo);
  } catch (erro) {
    if (erro.code === 'ENOENT') return responder(res, 404, { erro: 'Não encontrado' });
    console.error(erro);
    responder(res, 400, { erro: erro.message });
  }
});

servidor.on('error', (erro) => {
  if (erro.code === 'EADDRINUSE') {
    console.log(`O CRM já está aberto em ${ENDERECO}`);
    abrirNavegador();
    setTimeout(() => process.exit(0), 500);
  }
  throw erro;
});

servidor.listen(PORTA, '127.0.0.1', () => {
  console.log(`CRM JB Maker rodando em ${ENDERECO}`);
  abrirNavegador();
  console.log('Pra fechar, feche esta janela.');
  atualizarPainel();
  try {
    fs.watch(PASTA_LEADS, (_, nome) => { if (nome && nome.endsWith('.md')) atualizarPainel(); });
  } catch { /* sem watch, o painel segue sendo gerado pelas gravações da tela */ }
});
