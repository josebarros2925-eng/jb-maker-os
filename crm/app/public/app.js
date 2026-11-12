// CRM JB Maker: telas do painel, funil, lista, ficha e ganhos.
// Os dados vêm de /api (que lê crm/dados/leads/*.md) e voltam pra lá a cada gravação.

const estado = { leads: [], ind: null, etapas: [], nomes: {}, aba: 'nicho', filtro: '', verPerdidos: false, quando: '', periodo: 30, graficoPrincipal: 'ganhos', selecionados: new Set(), ganhosPeriodo: 'mes', ganhosDe: '', ganhosAte: '', gestao: null };
const graficos = [];
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const conteudo = $('#conteudo');

const CANAIS = ['whatsapp', 'instagram', 'ligação', 'reunião', 'e-mail', 'presencial', 'nota'];
const PRIORIDADES = ['quente', 'morno', 'frio'];

// ---------- utilidades ----------
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const real = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const realCurto = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (v) => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`);
const dataBR = (d) => (d ? d.split('-').reverse().join('/') : '—');
const mesBR = (m) => {
  const [a, n] = m.split('-');
  return `${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(n) - 1]}/${a.slice(2)}`;
};
const hoje = () => new Date().toLocaleDateString('sv-SE');
const somarMeses = (data, n) => {
  const [a, m, d] = data.split('-').map(Number);
  const alvo = new Date(a, m - 1 + n, 1);
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(d, ultimo));
  return alvo.toLocaleDateString('sv-SE');
};
const cor = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
const opcoes = (lista, atual, rotulo = (x) => x) =>
  lista.map((x) => `<option value="${esc(x)}" ${x === atual ? 'selected' : ''}>${esc(rotulo(x))}</option>`).join('');
const valoresDe = (campo) => [...new Set(estado.leads.flatMap((l) => (Array.isArray(l[campo]) ? l[campo] : [l[campo]])).filter(Boolean))].sort();

function aviso(texto) {
  const a = $('#aviso');
  a.textContent = texto;
  a.classList.add('visivel');
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => a.classList.remove('visivel'), 2200);
}

function etiquetaToque(lead) {
  if (!lead.proximo_toque || ['perdido'].includes(lead.etapa)) return '';
  const h = hoje();
  if (lead.proximo_toque < h) return `<span class="etiqueta atrasado">atrasado · ${dataBR(lead.proximo_toque)}</span>`;
  if (lead.proximo_toque === h) return '<span class="etiqueta hoje">cobrar hoje</span>';
  return `<span class="etiqueta">${dataBR(lead.proximo_toque)}</span>`;
}
const etiquetaPrioridade = (p) => (p ? `<span class="etiqueta ${esc(p)}">${esc(p)}</span>` : '');

// ---------- API ----------
async function api(caminho, opcoes = {}) {
  const resp = await fetch(caminho, { headers: { 'Content-Type': 'application/json' }, ...opcoes });
  const corpo = await resp.json();
  if (!resp.ok) throw new Error(corpo.erro || 'Erro ao falar com o CRM');
  return corpo;
}

async function carregar() {
  const [d, g] = await Promise.all([api('/api/dados'), api('/api/gestao')]);
  Object.assign(estado, { leads: d.leads, ind: d.indicadores, etapas: d.etapas, nomes: d.nomesEtapas, gestao: g });
}

async function salvar(lead, mensagem = 'Salvo') {
  const { id, ...dados } = lead;
  await api(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
  await carregar();
  aviso(mensagem);
}

const leadPorId = (id) => estado.leads.find((l) => l.id === id);

// ---------- roteamento ----------
function atualizarDica() {
  const t = estado.ind.toques;
  const n = t.atrasados.length + t.hoje.length;
  $('#dica-texto').textContent = n
    ? `Você tem ${n} ${n === 1 ? 'lead' : 'leads'} pra cobrar hoje. Abra o funil e mande a próxima mensagem.`
    : 'Registre nicho e origem de cada lead: é isso que revela o seu cliente ideal.';
}

async function rotear() {
  graficos.splice(0).forEach((g) => g.destroy());
  const [aba, id] = (location.hash.slice(1) || 'painel').split('/');
  document.querySelectorAll('.menu a').forEach((a) => a.classList.toggle('ativa', a.dataset.aba === aba || (aba === 'lead' && a.dataset.aba === 'leads')));
  try {
    if (!estado.ind) await carregar();
    atualizarDica();
    if (aba === 'analise') return telaAnalise();
    if (aba === 'funil') return telaFunil();
    if (aba === 'leads') return telaLista();
    if (aba === 'financeiro') return telaGanhos();
    if (aba === 'lead') return telaFicha(decodeURIComponent(id));
    if (aba === 'semana') return telaSemana();
    if (aba === 'entregas') return telaEntregas();
    if (aba === 'caixa') return telaCaixa();
    if (aba === 'placar') return telaPlacar();
    if (aba === 'youtube') return telaYoutube();
    return telaPainel();
  } catch (e) {
    conteudo.innerHTML = `<div class="cartao"><h2>Não consegui abrir o CRM</h2><p class="mudo">${esc(e.message)}</p></div>`;
  }
}

// ---------- gráficos ----------
// Área sob a linha: degradê da cor da série até transparente.
function degrade(hex) {
  return (ctx) => {
    const { chartArea, ctx: c } = ctx.chart;
    if (!chartArea) return 'transparent';
    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, `${hex}55`);
    g.addColorStop(1, `${hex}00`);
    return g;
  };
}

function baseGrafico() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'start', labels: { color: cor('--texto-2'), boxWidth: 12, boxHeight: 12, useBorderRadius: true, borderRadius: 3 } },
      tooltip: {
        backgroundColor: cor('--superficie-3'), titleColor: cor('--texto'), bodyColor: cor('--texto-2'), footerColor: cor('--texto'),
        borderColor: cor('--borda-forte'), borderWidth: 1, padding: 12, boxPadding: 4, cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { color: cor('--eixo') }, ticks: { color: cor('--texto-3') } },
      y: { beginAtZero: true, grid: { color: cor('--grade') }, border: { display: false }, ticks: { color: cor('--texto-3'), precision: 0 } },
    },
  };
}

function graficoGanhos(canvas, meses) {
  const opc = baseGrafico();
  opc.scales.x.stacked = true;
  opc.scales.y.stacked = true;
  opc.scales.y.ticks.callback = (v) => realCurto(v);
  opc.plugins.tooltip.callbacks = {
    label: (c) => ` ${c.dataset.label}: ${real(c.raw)}`,
    footer: (itens) => `Total: ${real(itens.reduce((s, i) => s + i.raw, 0))}`,
  };
  const barra = { borderRadius: 4, borderSkipped: 'start', borderWidth: { top: 2 }, borderColor: cor('--superficie-solida'), maxBarThickness: 36 };
  graficos.push(new Chart(canvas, {
    type: 'bar',
    data: {
      labels: meses.map((m) => m.rotulo ?? mesBR(m.mes)),
      datasets: [
        { label: 'Projeto', data: meses.map((m) => m.projeto), backgroundColor: cor('--serie-1'), ...barra },
        { label: 'Recorrente', data: meses.map((m) => m.recorrente), backgroundColor: cor('--serie-2'), ...barra },
        { label: 'A receber', data: meses.map((m) => m.aReceber), backgroundColor: cor('--serie-neutra'), ...barra },
      ],
    },
    options: opc,
  }));
}

function graficoAtividade(canvas, semanas) {
  const opc = baseGrafico();
  const linha = (label, campo, c) => ({
    label, data: semanas.map((s) => s[campo]), borderColor: cor(c), backgroundColor: degrade(cor(c)),
    pointBackgroundColor: cor(c), pointBorderColor: cor('--superficie-solida'), pointBorderWidth: 2, fill: 'origin',
    borderWidth: 2, pointRadius: 3.5, pointHoverRadius: 6, cubicInterpolationMode: 'monotone',
  });
  graficos.push(new Chart(canvas, {
    type: 'line',
    data: {
      labels: semanas.map((s) => dataBR(s.semana).slice(0, 5)),
      datasets: [linha('Abordagens', 'contatos', '--serie-1'), linha('Conversas', 'conversas', '--serie-2'), linha('Fechamentos', 'fechamentos', '--serie-3')],
    },
    options: opc,
  }));
}

function barrasHTML(itens, { rotulo, valor, formato = (v) => v, extra = () => '' }) {
  const max = Math.max(...itens.map(valor), 1);
  return `<div class="barras">${itens.map((i) => `
    <div class="barra" title="${esc(rotulo(i))}: ${esc(formato(valor(i)))}">
      <span class="rot">${esc(rotulo(i))}</span>
      <span class="trilho"><span class="preenche" style="width:${(valor(i) / max) * 100}%"></span></span>
      <span class="val">${formato(valor(i))} ${extra(i)}</span>
    </div>`).join('')}</div>`;
}

// ---------- período do painel ----------
const PERIODOS = { 30: 'Últimos 30 dias', 90: 'Últimos 90 dias', 365: 'Últimos 12 meses' };
// Etapas em tons de azul, do mais escuro (início) ao mais claro (cliente).
const CORES_ETAPA = { pesquisado: '#52525b', contato: '#1e40af', conversa: '#2563eb', proposta: '#3b82f6', entrada: '#60a5fa', cliente: '#93c5fd', perdido: '#f87171' };
const somarDias = (data, n) => {
  const d = new Date(`${data}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('sv-SE');
};

// Números do período escolhido, do período anterior (pra comparar) e uma série em 12 fatias pros mini gráficos.
function metricasPeriodo(dias) {
  const fim = hoje();
  const ini = somarDias(fim, -dias + 1);
  const recebidos = estado.ind.lancamentos.filter((l) => l.status === 'recebido');
  const dentro = (d, a, b) => d && d >= a && d <= b;
  const calc = (a, b) => ({
    recebido: recebidos.filter((l) => dentro(l.data, a, b)).reduce((s, l) => s + l.valor, 0),
    abordagens: estado.leads.filter((l) => dentro(l.data_contato, a, b)).length,
    conversas: estado.leads.filter((l) => dentro(l.data_conversa, a, b)).length,
    fechamentos: estado.leads.filter((l) => dentro(l.data_entrada, a, b)).length,
  });
  const fatia = dias / 12;
  const series = Array.from({ length: 12 }, (_, i) =>
    calc(somarDias(ini, Math.round(i * fatia)), somarDias(ini, Math.round((i + 1) * fatia) - 1)));
  return {
    atual: calc(ini, fim),
    anterior: calc(somarDias(ini, -dias), somarDias(ini, -1)),
    serie: (campo) => series.map((s) => s[campo]),
  };
}

function variacao(atual, anterior) {
  if (!atual && !anterior) return '<span class="delta neutro">—</span>';
  if (!anterior) return '<span class="delta sobe">novo</span>';
  const v = (atual - anterior) / anterior;
  return `<span class="delta ${v >= 0 ? 'sobe' : 'desce'}">${v >= 0 ? '↑' : '↓'} ${pct(Math.abs(v))}</span>`;
}

function miniGrafico(canvas, dados, corHex) {
  graficos.push(new Chart(canvas, {
    type: 'line',
    data: { labels: dados.map((_, i) => i), datasets: [{ data: dados, borderColor: corHex, backgroundColor: degrade(corHex), fill: 'origin', borderWidth: 2, pointRadius: 0, cubicInterpolationMode: 'monotone' }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 900 }, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false, beginAtZero: true } }, elements: { line: { capBezierPoints: true } } },
  }));
}

function graficoFunil(canvas, etapas) {
  graficos.push(new Chart(canvas, {
    type: 'doughnut',
    data: { labels: etapas.map((e) => estado.nomes[e.etapa]), datasets: [{ data: etapas.map((e) => e.total), backgroundColor: etapas.map((e) => CORES_ETAPA[e.etapa]), borderColor: cor('--superficie-solida'), borderWidth: 3, hoverOffset: 6, }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '76%',
      plugins: { legend: { display: false }, tooltip: { ...baseGrafico().plugins.tooltip, callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } } },
    },
  }));
}

const iniciais = (nome) => String(nome).replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
function avatar(nome) {
  let h = 0;
  for (const c of String(nome)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `<span class="avatar" style="--h:${h}">${esc(iniciais(nome))}</span>`;
}

// Anel com o avanço do lead no funil (contato = 1 de 5 ... cliente = 5 de 5).
function anelEtapa(etapa) {
  const passo = Math.max(0, estado.etapas.indexOf(etapa));
    const c = 2 * Math.PI * 15;
  return `<span class="anel" title="${esc(estado.nomes[etapa])}">
    <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" class="trilha"/><circle cx="18" cy="18" r="15" style="stroke:var(--azul);stroke-dasharray:${(passo / 5) * c} ${c}"/></svg>
    <b>${passo}/5</b></span>`;
}

function quandoToque(data) {
  if (!data) return '<span class="mudo">sem data</span>';
  const d = Math.round((new Date(`${data}T12:00:00`) - new Date(`${hoje()}T12:00:00`)) / 86400000);
  if (d < 0) return `<span class="txt-critico">atrasado ${-d} ${-d === 1 ? 'dia' : 'dias'}</span>`;
  if (d === 0) return '<span class="txt-destaque">hoje</span>';
  if (d === 1) return 'amanhã';
  return `em ${d} dias`;
}

const etiquetaEtapa = (etapa) => `<span class="etiqueta" style="--cor:${CORES_ETAPA[etapa]}">${esc(estado.nomes[etapa])}</span>`;

const ICONES = {
  nicho: '<svg viewBox="0 0 24 24"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/></svg>',
  origem: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.7 5.4 3.7 8.5s-1.2 5.9-3.7 8.5c-2.5-2.6-3.7-5.4-3.7-8.5s1.2-5.9 3.7-8.5Z"/></svg>',
  abordagem: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4V5Z"/></svg>',
  servicos: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
};

function melhorGrupo(chave) {
  return estado.ind.grupos[chave].filter((g) => g.fechados > 0)
    .sort((a, b) => b.taxaFechamento - a.taxaFechamento || (b.ticket || 0) - (a.ticket || 0))[0] || null;
}

// ---------- tela: painel ----------
function telaPainel() {
  const { ind } = estado;
  const g = ind.ganhos;
  const p = ind.perfilIdeal;
  const dias = Number(estado.periodo || 30);
  const m = metricasPeriodo(dias);
  const comparacao = `vs. ${dias === 365 ? '12 meses' : `${dias} dias`} anteriores`;

  const ativosPorEtapa = estado.etapas.map((etapa) => ({ etapa, total: ind.porEtapa[etapa] })).filter((e) => e.total);
  const totalAtivos = ativosPorEtapa.reduce((s, e) => s + e.total, 0);

  const proximos = estado.leads
    .filter((l) => ['contato', 'conversa', 'proposta', 'entrada'].includes(l.etapa) || (l.etapa === 'pesquisado' && l.prioridade === 'quente'))
    .sort((a, b) => String(a.proximo_toque || '9999').localeCompare(String(b.proximo_toque || '9999'))
      || estado.etapas.indexOf(b.etapa) - estado.etapas.indexOf(a.etapa))
    .slice(0, 6);

  const destaques = [['nicho', 'Nicho'], ['origem', 'Origem'], ['abordagem', 'Abordagem'], ['servicos', 'Serviço']].map(([k, nome]) => {
    const melhor = melhorGrupo(k);
    return `<div class="gatilho">
      <span class="icone">${ICONES[k]}</span>
      <div>
        <div class="gatilho-titulo">${nome} ${melhor ? `<span class="etiqueta" style="--cor:var(--azul-claro)">${esc(melhor.nome)}</span>` : ''}</div>
        <p>${melhor
          ? `${melhor.fechados} de ${melhor.abordados} abordados fecharam${melhor.ticket ? ` · ticket ${real(melhor.ticket)}` : ''}`
          : 'Nenhum fechamento com esse campo preenchido ainda.'}</p>
      </div>
      <div class="gatilho-num"><small>fecha</small><b>${melhor ? pct(melhor.taxaFechamento) : '—'}</b></div>
    </div>`;
  }).join('');

  const insight = p.nicho
    ? `Quem mais fecha com você é <b>${esc(p.nicho.nome)}</b>${p.origem ? `, vindo de <b>${esc(p.origem.nome)}</b>` : ''}${p.servico ? `, comprando <b>${esc(p.servico.nome)}</b>` : ''}: ${pct(p.nicho.taxaFechamento)} de fechamento${p.nicho.ticket ? ` e ticket de ${real(p.nicho.ticket)}` : ''}.`
    : 'Ainda não há fechamento com nicho e origem preenchidos.';
  const insightExtra = p.amostra < 10
    ? `Base de ${p.amostra} leads abordados: trate como pista e siga registrando pra o padrão ficar confiável.`
    : `Base de ${p.amostra} leads abordados. Priorize a prospecção nesse perfil.`;
  const pendentes = ind.toques.atrasados.length + ind.toques.hoje.length;

  conteudo.innerHTML = `
    <div class="cabecalho">
      <div>
        <p class="sobrelinha">Visão geral</p>
        <h1>Painel da JB Maker</h1>
        <p>Funil, ganhos e o perfil de cliente que mais fecha com você.</p>
      </div>
      <div class="filtros">
        <label class="seletor-periodo"><svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>
          <select id="periodo">${Object.entries(PERIODOS).map(([v, n]) => `<option value="${v}" ${Number(v) === dias ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </label>
        <a class="botao" href="#funil"><svg viewBox="0 0 24 24"><path d="M4 5h16l-6 8v6l-4-2v-4L4 5Z"/></svg>${pendentes ? `${pendentes} pra cobrar` : 'Funil'}</a>
      </div>
    </div>

    ${faixaGestao()}

    <section class="grade kpis">
      <div class="cartao kpi">
        <div class="rotulo">Recebido</div>
        <div class="linha-valor"><span class="valor">${real(m.atual.recebido)}</span>${variacao(m.atual.recebido, m.anterior.recebido)}</div>
        <div class="extra">no período · ${comparacao}</div>
        <div class="mini"><canvas id="mini-1"></canvas></div>
      </div>
      <div class="cartao kpi">
        <div class="rotulo">A receber</div>
        <div class="linha-valor"><span class="valor">${real(g.aReceber)}</span>${g.vencido ? `<span class="delta desce">${realCurto(g.vencido)} vencido</span>` : '<span class="delta neutro">em dia</span>'}</div>
        <div class="extra">parcelas e recorrências combinadas</div>
        <div class="mini"><canvas id="mini-2"></canvas></div>
      </div>
      <div class="cartao kpi">
        <div class="rotulo">Abordagens</div>
        <div class="linha-valor"><span class="valor">${m.atual.abordagens}</span>${variacao(m.atual.abordagens, m.anterior.abordagens)}</div>
        <div class="extra">${m.atual.conversas} ${m.atual.conversas === 1 ? 'conversa aberta' : 'conversas abertas'} no período</div>
        <div class="mini"><canvas id="mini-3"></canvas></div>
      </div>
      <div class="cartao kpi">
        <div class="rotulo">Fechamentos</div>
        <div class="linha-valor"><span class="valor">${m.atual.fechamentos}</span>${variacao(m.atual.fechamentos, m.anterior.fechamentos)}</div>
        <div class="extra">taxa geral de ${pct(p.taxaFechamento)} (${ind.totais.fechados} de ${ind.totais.abordados})</div>
        <div class="mini"><canvas id="mini-4"></canvas></div>
      </div>
    </section>

    <section class="grade principal">
      <div class="cartao">
        <div class="titulo-cartao">
          <h2>${estado.graficoPrincipal === 'atividade' ? 'Atividade' : 'Ganhos'}</h2>
          <select id="grafico-principal" class="select-pequeno">
            <option value="ganhos" ${estado.graficoPrincipal !== 'atividade' ? 'selected' : ''}>Ganhos por mês</option>
            <option value="atividade" ${estado.graficoPrincipal === 'atividade' ? 'selected' : ''}>Atividade por semana</option>
          </select>
        </div>
        <div class="grafico-com-destaques">
          <div class="grafico"><canvas id="g-principal"></canvas></div>
          <div class="destaques">
            <div class="destaque ativo"><b>${real(g.recorrenteMes)}</b><span>Recorrente no mês</span></div>
            <div class="destaque"><b>${g.ticketMedio ? real(g.ticketMedio) : '—'}</b><span>Ticket médio · ${g.clientesAtivos} ${g.clientesAtivos === 1 ? 'cliente ativo' : 'clientes ativos'}</span></div>
          </div>
        </div>
      </div>
      <div class="cartao">
        <div class="titulo-cartao"><h2>Funil agora</h2></div>
        <div class="rosca-wrap">
          <div class="rosca"><canvas id="g-funil"></canvas><div class="rosca-centro"><b>${totalAtivos}</b><span>no funil</span></div></div>
          <ul class="legenda">${ativosPorEtapa.map((e) => `<li><i style="--cor:${CORES_ETAPA[e.etapa]}"></i><div><b>${esc(estado.nomes[e.etapa])}</b><span>${e.total} (${pct(e.total / totalAtivos)})</span></div></li>`).join('')}</ul>
        </div>
      </div>
    </section>

    <section class="grade principal">
      <div class="cartao">
        <div class="titulo-cartao"><h2>Próximos passos</h2></div>
        <div class="tabela-wrap">
          ${proximos.length ? `<table class="tabela-leads">
            <thead><tr><th>Lead</th><th>Avanço</th><th class="col-passo">Próximo passo</th><th>Próximo toque</th><th class="col-mais"></th></tr></thead>
            <tbody>${proximos.map((l) => `<tr class="clicavel" data-id="${l.id}">
              <td><div class="pessoa">${avatar(l.nome)}<div><b>${esc(l.nome)}</b><span>${esc([l.nicho, l.cidade].filter(Boolean).join(' · '))}</span></div></div></td>
              <td><div class="avanco">${anelEtapa(l.etapa)}${etiquetaEtapa(l.etapa)}</div></td>
              <td class="passo-celula col-passo">${esc(l.proximo_passo || '—')}</td>
              <td class="nowrap">${quandoToque(l.proximo_toque)}</td>
              <td class="mais col-mais">⋮</td>
            </tr>`).join('')}</tbody></table>` : '<p class="mudo">Nenhum lead em andamento.</p>'}
        </div>
        <a class="botao" href="#leads" style="margin-top:16px">Ver todos os leads <span>→</span></a>
      </div>
      <div class="cartao">
        <div class="titulo-cartao"><h2>Quem mais fecha</h2></div>
        <div class="gatilhos">${destaques}</div>
        <a class="botao" href="#analise" style="margin-top:16px">Ver análise completa <span>→</span></a>
      </div>
    </section>

    <section class="cartao insight">
      <span class="icone-insight"><svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4L12 3Z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z"/></svg></span>
      <div class="insight-texto"><h2>Insight</h2><p>${insight}</p><p class="mudo">${esc(insightExtra)}</p></div>
      <a class="botao primario" href="#funil">${pendentes ? 'Ver quem cobrar' : 'Abrir o funil'} <span>→</span></a>
    </section>`;

  const coresKpi = Array(4).fill(cor('--azul'));
  miniGrafico($('#mini-1'), m.serie('recebido'), coresKpi[0]);
  miniGrafico($('#mini-2'), g.faturamentoMensal.slice(-12).map((x) => x.aReceber), coresKpi[1]);
  miniGrafico($('#mini-3'), m.serie('abordagens'), coresKpi[2]);
  miniGrafico($('#mini-4'), m.serie('fechamentos'), coresKpi[3]);
  if (estado.graficoPrincipal === 'atividade') graficoAtividade($('#g-principal'), ind.atividade);
  else graficoGanhos($('#g-principal'), g.faturamentoMensal);
  if (totalAtivos) graficoFunil($('#g-funil'), ativosPorEtapa);

  $('#periodo').addEventListener('change', (e) => { estado.periodo = e.target.value; rotear(); });
  $('#grafico-principal').addEventListener('change', (e) => { estado.graficoPrincipal = e.target.value; rotear(); });
  conteudo.querySelectorAll('tr.clicavel').forEach((tr) => tr.addEventListener('click', () => { location.hash = `lead/${tr.dataset.id}`; }));
}

// ---------- tela: cliente ideal ----------
function telaAnalise() {
  const { ind } = estado;
  const g = ind.ganhos;
  conteudo.innerHTML = `
    <div class="cabecalho">
      <div><p class="sobrelinha">Análise</p><h1>Cliente ideal</h1><p>Quem responde, quem fecha, quanto paga e onde você perde.</p></div>
    </div>

    <section class="grade duas">
      <div class="cartao">
        <h2>Quem compra</h2>
        <p class="sub">Leads abordados, resposta e fechamento por grupo</p>
        <div class="seletor" id="seletor-grupo">
          ${[['nicho', 'Nicho'], ['origem', 'Origem'], ['abordagem', 'Abordagem'], ['sinal', 'Sinal'], ['cidade', 'Cidade'], ['servicos', 'Serviço']]
            .map(([k, n]) => `<button type="button" data-grupo="${k}" class="${estado.aba === k ? 'ativo' : ''}">${n}</button>`).join('')}
        </div>
        <div class="tabela-wrap" id="tabela-grupo"></div>
      </div>
      <div class="cartao">
        <h2>Conversão do funil</h2>
        <p class="sub">Quantos leads chegaram em cada etapa e quantos passaram da anterior</p>
        ${barrasHTML(ind.funil, {
          rotulo: (f) => f.nome,
          valor: (f) => f.chegaram,
          extra: (f) => `<small>${f.conversao === null ? '' : `${pct(f.conversao)} da anterior`}</small>`,
        })}
        <p class="sub" style="margin:14px 0 0">${ind.porEtapa.pesquisado} empresas pesquisadas esperando a primeira mensagem.${ind.funil.some((f) => f.diasDesdeAnterior !== null) ? ` Tempo médio entre etapas: ${ind.funil.filter((f) => f.diasDesdeAnterior !== null).map((f) => `${f.nome.toLowerCase()} ${Math.round(f.diasDesdeAnterior)}d`).join(' · ')}.` : ''}</p>
      </div>
    </section>

    <section class="grade duas">
      <div class="cartao">
        <h2>Atividade por semana</h2>
        <p class="sub">Abordagens feitas, conversas abertas e fechamentos nas últimas 12 semanas</p>
        <div class="grafico"><canvas id="g-atividade"></canvas></div>
      </div>
      <div class="cartao">
        <h2>Por que perdi</h2>
        <p class="sub">Motivos registrados e em que etapa o lead saiu</p>
        ${ind.motivosPerda.length ? barrasHTML(ind.motivosPerda, { rotulo: (x) => x.motivo, valor: (x) => x.total }) : '<p class="mudo">Nenhum lead perdido.</p>'}
        ${ind.perdasPorEtapa.length ? `<p class="sub" style="margin:14px 0 0">Onde saiu: ${ind.perdasPorEtapa.map((x) => `${esc(x.etapa)} (${x.total})`).join(' · ')}</p>` : ''}
        ${ind.propostasAbertas.length ? `<h2 style="margin-top:22px">Propostas abertas</h2><div style="margin-top:10px">${ind.propostasAbertas.map((x) => `<a href="#lead/${x.id}">${esc(x.nome)}</a> <span class="mudo">${x.valor ? real(x.valor) : 'sem valor'} · desde ${dataBR(x.desde)}</span>`).join('<br>')}</div>` : ''}
      </div>
    </section>

    <section class="grade duas">
      <div class="cartao">
        <h2>Receita por serviço</h2>
        <p class="sub">O que mais trouxe dinheiro (recebido)</p>
        ${g.porServico.length ? barrasHTML(g.porServico, { rotulo: (s) => s.servico, valor: (s) => s.valor, formato: real }) : '<p class="mudo">Nenhum lançamento recebido ainda.</p>'}
      </div>
      <div class="cartao">
        <h2>Receita por cliente</h2>
        <p class="sub">Quanto cada cliente já pagou</p>
        ${g.porCliente.length ? barrasHTML(g.porCliente, { rotulo: (c) => c.nome, valor: (c) => c.valor, formato: real }) : '<p class="mudo">Nenhum lançamento recebido ainda.</p>'}
      </div>
    </section>`;

  graficoAtividade($('#g-atividade'), ind.atividade);
  desenharGrupo();
  $('#seletor-grupo').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    estado.aba = b.dataset.grupo;
    document.querySelectorAll('#seletor-grupo button').forEach((x) => x.classList.toggle('ativo', x === b));
    desenharGrupo();
  });
}

function desenharGrupo() {
  const grupos = estado.ind.grupos[estado.aba].filter((g) => g.abordados > 0);
  const alvo = $('#tabela-grupo');
  if (!grupos.length) {
    alvo.innerHTML = '<p class="mudo">Nenhum lead abordado com esse campo preenchido.</p>';
    return;
  }
  alvo.innerHTML = `<table>
    <thead><tr><th>Grupo</th><th class="num">Abordados</th><th class="num">Resposta</th><th>Fechamento</th><th class="num">Receita</th><th class="num">Ticket</th></tr></thead>
    <tbody>${grupos.map((g) => `<tr>
      <td>${esc(g.nome)}</td>
      <td class="num">${g.abordados}</td>
      <td class="num">${pct(g.taxaResposta)}</td>
      <td style="white-space:nowrap"><span class="mini-barra" style="width:${Math.max(2, (g.taxaFechamento || 0) * 60)}px"></span>${pct(g.taxaFechamento)} <span class="mudo">(${g.fechados})</span></td>
      <td class="num">${real(g.receita)}</td>
      <td class="num">${g.ticket ? real(g.ticket) : '—'}</td>
    </tr>`).join('')}</tbody></table>`;
}

// Filtro de data do funil, pelo próximo toque. "Hoje" junta os atrasados, os de hoje
// e os pesquisados que ainda esperam a primeira mensagem.
function dataLocal(dias = 0) {
  const d = new Date(); d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function noPeriodo(l, quando) {
  if (!quando) return true;
  if (['cliente', 'perdido'].includes(l.etapa) && quando !== 'semana') return false;
  const t = String(l.proximo_toque || '').slice(0, 10);
  const hoje = dataLocal();
  if (quando === 'hoje') return l.etapa === 'pesquisado' || Boolean(t && t <= hoje);
  if (quando === 'atrasados') return Boolean(t && t < hoje);
  if (quando === 'amanha') return t === dataLocal(1);
  if (quando === 'semana') return Boolean(t && t >= hoje && t <= dataLocal(7));
  return true;
}
const OPCOES_QUANDO = [['', 'Todas as datas'], ['hoje', 'Hoje (abordar e cobrar)'], ['atrasados', 'Atrasados'], ['amanha', 'Amanhã'], ['semana', 'Próximos 7 dias']];

// ---------- tela: funil ----------
function telaFunil() {
  const { ind } = estado;
  const termo = estado.filtro.toLowerCase();
  const visiveis = estado.leads.filter((l) => !termo || [l.nome, l.nicho, l.cidade, l.responsavel].join(' ').toLowerCase().includes(termo))
    .filter((l) => noPeriodo(l, estado.quando));
  const colunas = [...estado.etapas, ...(estado.verPerdidos ? ['perdido'] : [])];
  const ordemPrioridade = (l) => (PRIORIDADES.indexOf(l.prioridade) + 1 || 9);
  const cobrar = [...ind.toques.atrasados, ...ind.toques.hoje];

  conteudo.innerHTML = `
    <div class="cabecalho">
      <div><p class="sobrelinha">Vendas</p><h1>Funil</h1><p>Arraste o card pra mudar de etapa. Clique pra abrir a ficha.</p></div>
      <div class="filtros">
        <input type="search" id="busca" placeholder="Buscar nome, nicho, cidade…" value="${esc(estado.filtro)}">
        <select id="quando" title="Filtrar pelo próximo toque">${OPCOES_QUANDO.map(([v, t]) => `<option value="${v}" ${estado.quando === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <label class="marcador"><input type="checkbox" id="ver-perdidos" ${estado.verPerdidos ? 'checked' : ''}> Mostrar perdidos (${ind.porEtapa.perdido})</label>
      </div>
    </div>
    ${cobrar.length ? `<div class="cobrar"><span class="titulo">Cobrar:</span>${cobrar.map((x) => `<a href="#lead/${x.id}">${etiquetaToque(leadPorId(x.id))} ${esc(x.nome)}</a>`).join('')}</div>` : ''}
    <div class="quadro">
      ${colunas.map((etapa) => {
        const doEtapa = visiveis.filter((l) => l.etapa === etapa)
          .sort((a, b) => ordemPrioridade(a) - ordemPrioridade(b) || String(a.proximo_toque || '9').localeCompare(String(b.proximo_toque || '9')));
        return `<section class="coluna" data-etapa="${etapa}">
          <header><b>${esc(estado.nomes[etapa])}</b><span>${doEtapa.length}</span></header>
          <div class="lista">${doEtapa.map(cardLead).join('')}</div>
        </section>`;
      }).join('')}
    </div>`;

  const busca = $('#busca');
  busca.addEventListener('input', () => {
    estado.filtro = busca.value;
    const pos = busca.selectionStart;
    telaFunil();
    const nova = $('#busca');
    nova.focus();
    nova.setSelectionRange(pos, pos);
  });
  $('#ver-perdidos').addEventListener('change', (e) => { estado.verPerdidos = e.target.checked; telaFunil(); });
  $('#quando').addEventListener('change', (e) => { estado.quando = e.target.value; telaFunil(); });
  ativarArrastar();
}

function cardLead(l) {
  const receita = l.lancamentos.filter((x) => x.status === 'recebido').reduce((s, x) => s + x.valor, 0);
  return `<article class="card" draggable="true" data-id="${l.id}">
    <div class="nome">${esc(l.nome)}</div>
    <div class="meta">${esc([l.nicho, l.cidade].filter(Boolean).join(' · ') || 'sem nicho')}</div>
    ${l.proximo_passo ? `<div class="passo">${esc(l.proximo_passo)}</div>` : ''}
    ${l.etapa === 'perdido' && l.motivo_perda ? `<div class="passo">Motivo: ${esc(l.motivo_perda)}</div>` : ''}
    <div class="linha">${etiquetaPrioridade(l.prioridade)}${etiquetaToque(l)}${receita ? `<span class="etiqueta recebido">${realCurto(receita)}</span>` : ''}${l.valor_proposta && l.etapa === 'proposta' ? `<span class="etiqueta">${realCurto(l.valor_proposta)}</span>` : ''}${semAbordagem(l) ? '<span class="etiqueta atrasado">sem abordagem</span>' : l.abordagem && precisaAbordagem(l.etapa) ? `<span class="etiqueta">${esc(l.abordagem)}</span>` : ''}</div>
  </article>`;
}

function ativarArrastar() {
  let arrastado = null;
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => { location.hash = `lead/${card.dataset.id}`; });
    card.addEventListener('dragstart', (e) => { arrastado = card.dataset.id; card.classList.add('arrastando'); e.dataTransfer.effectAllowed = 'move'; });
    card.addEventListener('dragend', () => card.classList.remove('arrastando'));
  });
  document.querySelectorAll('.coluna').forEach((col) => {
    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('sobre'); });
    col.addEventListener('dragleave', () => col.classList.remove('sobre'));
    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('sobre');
      const lead = leadPorId(arrastado);
      if (!(await mudarEtapa(lead, col.dataset.etapa))) return;
      telaFunil();
    });
  });
}

// ---------- modal ----------
function abrirModal(html, aoEnviar) {
  const modal = $('#modal');
  const form = $('#modal-form');
  form.innerHTML = html;
  modal.showModal();
  return new Promise((resolve) => {
    form.onsubmit = async (e) => {
      if (e.submitter?.value === 'cancelar') { resolve(null); return; }
      e.preventDefault();
      try {
        const r = await aoEnviar(new FormData(form));
        modal.close();
        resolve(r);
      } catch (erro) {
        aviso(erro.message);
      }
    };
    modal.onclose = () => resolve(null);
  });
}

function perguntarMotivo(lead) {
  const motivos = ['preço', 'sumiu / não respondeu', 'sem prioridade agora', 'fechou com outro', 'recusou após a primeira versão', ...valoresDe('motivo_perda')];
  return abrirModal(`
    <h2>Por que perdeu ${esc(lead.nome)}?</h2>
    <p class="mudo" style="margin:0">Esse motivo alimenta o gráfico "Por que perdi".</p>
    <label>Motivo <input name="motivo" list="lista-motivos" required autofocus></label>
    <datalist id="lista-motivos">${[...new Set(motivos)].map((m) => `<option value="${esc(m)}">`).join('')}</datalist>
    <div class="linha-acoes"><button class="botao" value="cancelar" formnovalidate>Cancelar</button><button class="botao primario">Marcar como perdido</button></div>
  `, (f) => f.get('motivo').trim());
}

function novoLead() {
  const lista = (id, campo) => `<datalist id="${id}">${valoresDe(campo).map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`;
  abrirModal(`
    <h2>Novo lead</h2>
    <label>Nome da empresa <input name="nome" required autofocus></label>
    <div class="campos">
      <label>Nicho <input name="nicho" list="l-nicho" placeholder="ex: odontologia"></label>
      <label>Cidade <input name="cidade" list="l-cidade"></label>
      <label>Origem <input name="origem" list="l-origem" placeholder="instagram, indicação…"></label>
      <label>Etapa <select name="etapa">${opcoes(estado.etapas, 'contato', (e) => estado.nomes[e])}</select></label>
      <label>Telefone <input name="telefone"></label>
      <label>Abordagem usada <input name="abordagem" list="l-abordagem" placeholder="ex: WhatsApp, direct (obrigatória se já abordou)"></label>
      <label>Sinal de momento <input name="sinal" list="l-sinal" placeholder="ex: inauguração"></label>
    </div>
    ${lista('l-nicho', 'nicho')}${lista('l-cidade', 'cidade')}${lista('l-origem', 'origem')}<datalist id="l-abordagem">${[...new Set([...valoresDe('abordagem'), ...PECAS_COFRE])].map((v) => `<option value="${esc(v)}">`).join('')}</datalist>${lista('l-sinal', 'sinal')}
    <div class="linha-acoes"><button class="botao" value="cancelar" formnovalidate>Cancelar</button><button class="botao primario">Criar</button></div>
  `, async (f) => {
    const dados = Object.fromEntries([...f].map(([k, v]) => [k, String(v).trim()]).filter(([, v]) => v));
    if (dados.nicho) dados.nicho = dados.nicho.toLowerCase();
    if (dados.origem) dados.origem = dados.origem.toLowerCase();
    if (dados.sinal) dados.sinal = dados.sinal.toLowerCase();
    if (precisaAbordagem(dados.etapa) && !dados.abordagem) throw new Error('Registre a abordagem usada (ex: WhatsApp). Ela entra na análise.');
    if (dados.abordagem) dados.abordagem = dados.abordagem.toUpperCase().replace(/^([A-Z]{2})(d)/, '$1-0$2');
    const lead = await api('/api/leads', { method: 'POST', body: JSON.stringify(dados) });
    await carregar();
    aviso('Lead criado');
    location.hash = `lead/${lead.id}`;
    return lead;
  });
}

// ---------- tela: lista ----------
function telaLista() {
  const termo = estado.filtro.toLowerCase();
  const achados = estado.leads.filter((l) => !termo || [l.nome, l.nicho, l.cidade, l.origem, l.responsavel, l.etapa, l.abordagem].join(' ').toLowerCase().includes(termo));
  // Seleção só guarda fichas que ainda existem.
  const existentes = new Set(estado.leads.map((l) => l.id));
  for (const id of estado.selecionados) if (!existentes.has(id)) estado.selecionados.delete(id);
  const marcados = estado.selecionados.size;

  const recebido = (l) => l.lancamentos.filter((x) => x.status === 'recebido').reduce((s, x) => s + x.valor, 0);
  const aReceber = (l) => l.lancamentos.filter((x) => x.status !== 'recebido').reduce((s, x) => s + x.valor, 0);
  const ordemEtapa = { proposta: 0, entrada: 0, conversa: 1, contato: 2 };
  const porToque = (a, b) => (a.proximo_toque || '9999').localeCompare(b.proximo_toque || '9999');
  const GRUPOS = [
    { k: 'negociando', nome: 'Negociando', desc: 'Já abordados. Os mais avançados e com toque mais perto aparecem primeiro',
      filtro: (l) => ['contato', 'conversa', 'proposta', 'entrada'].includes(l.etapa),
      ordem: (a, b) => (ordemEtapa[a.etapa] - ordemEtapa[b.etapa]) || porToque(a, b) },
    { k: 'clientes', nome: 'Clientes', desc: 'Quem já fechou com você',
      filtro: (l) => l.etapa === 'cliente', ordem: (a, b) => recebido(b) - recebido(a) },
    { k: 'abordar', nome: 'A abordar', desc: 'Pesquisados que ainda não receberam mensagem',
      filtro: (l) => l.etapa === 'pesquisado', ordem: (a, b) => PRIORIDADES.indexOf(a.prioridade) - PRIORIDADES.indexOf(b.prioridade) },
    { k: 'perdidos', nome: 'Perdidos', desc: 'Não seguiram. O motivo ajuda a ajustar a abordagem',
      filtro: (l) => l.etapa === 'perdido', ordem: (a, b) => (b.data_perdido || '').localeCompare(a.data_perdido || '') },
  ];
  if (!GRUPOS.some((g) => g.k === estado.grupoLista)) estado.grupoLista = 'todos';
  const contagem = Object.fromEntries(GRUPOS.map((g) => [g.k, achados.filter(g.filtro).length]));
  const visiveis = GRUPOS.filter((g) => (estado.grupoLista === 'todos' || estado.grupoLista === g.k) && contagem[g.k]);

  const coluna = (g, l) => {
    if (g.k === 'clientes') {
      const r = recebido(l), p = aReceber(l);
      return `<b>${real(r)}</b>${p ? `<br><span class="txt-alerta">${real(p)} a receber</span>` : ''}`;
    }
    if (g.k === 'perdidos') return `<span class="mudo">${esc(l.motivo_perda || 'sem motivo')}</span><br><span class="mudo">em ${esc(estado.nomes[l.perdido_em_etapa] || l.perdido_em_etapa || '—')} · ${dataBR(l.data_perdido)}</span>`;
    if (g.k === 'abordar') return l.sinal ? `<span class="mudo">${esc(l.sinal)}</span>` : '<span class="mudo">—</span>';
    return l.valor_proposta ? `<b>${realCurto(l.valor_proposta)}</b><br><span class="mudo">proposta</span>` : '<span class="mudo">—</span>';
  };
  const tituloColuna = { negociando: 'Proposta', clientes: 'Recebido', abordar: 'Sinal', perdidos: 'Motivo' };
  const linha = (g, l) => `<tr class="clicavel ${estado.selecionados.has(l.id) ? 'selecionada' : ''}" data-id="${l.id}">
    <td class="col-check"><input type="checkbox" class="marcar" data-id="${l.id}" aria-label="Selecionar ${esc(l.nome)}" ${estado.selecionados.has(l.id) ? 'checked' : ''}></td>
    <td><b>${esc(l.nome)}</b> ${g.k === 'abordar' ? etiquetaPrioridade(l.prioridade) : ''}<br><span class="mudo">${esc([l.nicho, l.cidade].filter(Boolean).join(' · ') || '—')}</span></td>
    ${g.k === 'negociando' ? `<td><span class="etapa-pill e-${esc(l.etapa)}">${esc(estado.nomes[l.etapa] || l.etapa)}</span></td>` : ''}
    ${g.k === 'perdidos' ? '' : `<td class="col-passo">${esc(l.proximo_passo || '')}${l.proximo_passo ? '<br>' : ''}${etiquetaToque(l) || (l.proximo_passo ? '' : '<span class="mudo">—</span>')}</td>`}
    <td>${l.abordagem ? `<code>${esc(l.abordagem)}</code>` : (g.k === 'abordar' ? '<span class="mudo">—</span>' : '<span class="etiqueta atrasado">sem abordagem</span>')}</td>
    <td class="num">${coluna(g, l)}</td>
  </tr>`;
  const secao = (g) => {
    const itens = achados.filter(g.filtro).sort(g.ordem);
    const todos = itens.every((l) => estado.selecionados.has(l.id));
    return `<section class="cartao grupo-lista g-${g.k}">
      <div class="grupo-topo"><h2>${g.nome} <span class="contador">${itens.length}</span></h2><p class="sub">${g.desc}</p></div>
      <div class="tabela-wrap"><table>
        <thead><tr><th class="col-check"><input type="checkbox" class="marcar-grupo" data-grupo="${g.k}" aria-label="Selecionar ${g.nome}" ${todos ? 'checked' : ''}></th><th>Empresa</th>
          ${g.k === 'negociando' ? '<th>Etapa</th>' : ''}${g.k === 'perdidos' ? '' : '<th>Próximo passo</th>'}<th>Abordagem</th><th class="num">${tituloColuna[g.k]}</th></tr></thead>
        <tbody>${itens.map((l) => linha(g, l)).join('')}</tbody>
      </table></div>
    </section>`;
  };

  conteudo.innerHTML = `
    <div class="cabecalho">
      <div><p class="sobrelinha">Contatos</p><h1>Leads e clientes</h1><p>${estado.leads.length} fichas, separadas pela situação. Clique numa linha pra abrir a ficha</p></div>
      <div class="filtros"><input type="search" id="busca" placeholder="Buscar nome, nicho, cidade…" value="${esc(estado.filtro)}"></div>
    </div>
    <div class="seletor seletor-lista" id="seletor-lista">
      <button type="button" data-g="todos" class="${estado.grupoLista === 'todos' ? 'ativo' : ''}">Todos <span class="contador">${achados.length}</span></button>
      ${GRUPOS.map((g) => `<button type="button" data-g="${g.k}" class="${estado.grupoLista === g.k ? 'ativo' : ''}">${g.nome} <span class="contador">${contagem[g.k]}</span></button>`).join('')}
    </div>
    ${marcados ? `<div class="barra-selecao">
      <span><b>${marcados}</b> ${marcados === 1 ? 'ficha selecionada' : 'fichas selecionadas'}</span>
      <button type="button" class="botao" id="limpar-selecao">Limpar seleção</button>
      <button type="button" class="botao perigo-cheio" id="apagar-selecionados">Apagar selecionados</button>
    </div>` : ''}
    ${visiveis.length ? visiveis.map(secao).join('') : '<div class="cartao"><p class="mudo" style="margin:0">Nenhuma ficha encontrada.</p></div>'}`;
  conteudo.querySelectorAll('#seletor-lista button').forEach((b) => b.addEventListener('click', () => { estado.grupoLista = b.dataset.g; telaLista(); }));
  conteudo.querySelectorAll('input.marcar-grupo').forEach((c) => c.addEventListener('change', () => {
    const g = GRUPOS.find((x) => x.k === c.dataset.grupo);
    for (const l of achados.filter(g.filtro)) {
      if (c.checked) estado.selecionados.add(l.id);
      else estado.selecionados.delete(l.id);
    }
    telaLista();
  }));
  conteudo.querySelectorAll('tr.clicavel').forEach((tr) => tr.addEventListener('click', (e) => {
    if (e.target.closest('.col-check')) return;
    location.hash = `lead/${tr.dataset.id}`;
  }));
  conteudo.querySelectorAll('.col-check').forEach((td) => td.addEventListener('click', (e) => {
    // Clicar em qualquer ponto da célula marca a caixa.
    const caixa = td.querySelector('input');
    if (e.target !== caixa) caixa.click();
  }));
  conteudo.querySelectorAll('input.marcar').forEach((c) => c.addEventListener('change', () => {
    if (c.checked) estado.selecionados.add(c.dataset.id);
    else estado.selecionados.delete(c.dataset.id);
    telaLista();
  }));
  if (marcados) {
    $('#limpar-selecao').addEventListener('click', () => { estado.selecionados.clear(); telaLista(); });
    $('#apagar-selecionados').addEventListener('click', apagarSelecionados);
  }
  const busca = $('#busca');
  busca.addEventListener('input', () => {
    estado.filtro = busca.value;
    const pos = busca.selectionStart;
    telaLista();
    const nova = $('#busca');
    nova.focus();
    nova.setSelectionRange(pos, pos);
  });
}

async function apagarSelecionados() {
  const alvos = estado.leads.filter((l) => estado.selecionados.has(l.id));
  const ok = await abrirModal(`
    <h2>Apagar ${alvos.length} ${alvos.length === 1 ? 'ficha' : 'fichas'}?</h2>
    <p class="mudo" style="margin:0">As fichas são apagadas de vez e saem do funil e dos indicadores. Não dá pra desfazer.</p>
    <ul class="lista-apagar">${alvos.map((l) => `<li>${esc(l.nome)} <span class="mudo">· ${esc(estado.nomes[l.etapa] || l.etapa)}</span></li>`).join('')}</ul>
    <div class="linha-acoes"><button class="botao" value="cancelar" formnovalidate>Cancelar</button><button class="botao perigo-cheio">Apagar ${alvos.length}</button></div>
  `, () => true);
  if (!ok) return;
  const falhas = [];
  for (const l of alvos) {
    try {
      await api(`/api/leads/${l.id}`, { method: 'DELETE' });
      estado.selecionados.delete(l.id);
    } catch {
      falhas.push(l.nome);
    }
  }
  await carregar();
  aviso(falhas.length ? `Não consegui apagar: ${falhas.join(', ')}` : `${alvos.length} ${alvos.length === 1 ? 'ficha apagada' : 'fichas apagadas'}`);
  telaLista();
}

// ---------- tela: ficha ----------
// ---------- abordagem obrigatória ----------
// Canais comuns de abordagem (dá pra escrever qualquer outro).
const PECAS_COFRE = ['WhatsApp', 'Direct', 'E-mail', 'Ligação', 'Áudio', 'Comentário no anúncio'];
const precisaAbordagem = (etapa) => etapa && etapa !== 'pesquisado' && etapa !== 'perdido';
const semAbordagem = (l) => precisaAbordagem(l.etapa) && !String(l.abordagem || '').trim();

// Botões de sugestão embaixo de um campo de texto livre: clicar preenche, mas dá pra escrever qualquer coisa.
function sugestoes(campo, valores) {
  const unicos = [...new Set(valores.filter(Boolean))];
  if (!unicos.length) return '';
  return `<div class="sugestoes" data-para="${campo}">${unicos.map((v) => `<button type="button" class="chip" data-valor="${esc(v)}">${esc(v)}</button>`).join('')}</div>`;
}
function ativarSugestoes(raiz = document) {
  raiz.querySelectorAll('.sugestoes').forEach((s) => s.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const input = raiz.querySelector(`[name="${s.dataset.para}"]`);
    input.value = b.dataset.valor;
    input.focus();
  }));
}

function perguntarAbordagem(lead) {
  const usadas = valoresDe('abordagem');
  const p = abrirModal(`
    <h2>Qual abordagem abriu a conversa com ${esc(lead.nome)}?</h2>
    <p class="mudo" style="margin:0">Toda abordagem fica registrada pra saber qual mensagem funciona. Escreva o que fez (ex: WhatsApp reparei uma coisa).</p>
    <label>Abordagem <input name="abordagem" required autofocus placeholder="WhatsApp, direct, comentei no anúncio…"></label>
    ${sugestoes('abordagem', usadas)}
    <details class="mais-pecas"><summary>Ver canais comuns</summary>${sugestoes('abordagem', PECAS_COFRE)}</details>
    <div class="linha-acoes"><button class="botao" value="cancelar" formnovalidate>Cancelar</button><button class="botao primario">Registrar</button></div>
  `, (f) => f.get('abordagem').trim().toUpperCase().replace(/^([A-Z]{2})(\d)/, '$1-0$2'));
  ativarSugestoes($('#modal-form'));
  return p;
}

// Troca de etapa com as perguntas obrigatórias (motivo da perda, abordagem usada).
async function mudarEtapa(lead, etapa) {
  if (!lead || lead.etapa === etapa) return false;
  const novo = { ...lead, etapa };
  if (etapa === 'perdido' && !lead.motivo_perda) {
    const motivo = await perguntarMotivo(lead);
    if (motivo === null) return false;
    novo.motivo_perda = motivo;
  }
  if (precisaAbordagem(etapa) && !String(lead.abordagem || '').trim()) {
    const ab = await perguntarAbordagem(lead);
    if (ab === null) return false;
    novo.abordagem = ab;
  }
  await salvar(novo, `${lead.nome} → ${estado.nomes[etapa]}`);
  return true;
}

// ---------- tela: ficha ----------
const linkWhats = (tel) => {
  const d = String(tel || '').replace(/\D/g, '');
  if (d.length < 10) return null;
  return `https://wa.me/${d.startsWith('55') ? d : `55${d}`}`;
};
const linkExterno = (url) => (url && !/^https?:\/\//.test(url) ? `https://${url}` : url);

function telaFicha(id) {
  const l = leadPorId(id);
  if (!l) {
    conteudo.innerHTML = '<div class="cartao"><h2>Ficha não encontrada</h2><p><a href="#leads">Voltar pra lista</a></p></div>';
    return;
  }
  const recebido = l.lancamentos.filter((x) => x.status === 'recebido').reduce((s, x) => s + x.valor, 0);
  const aReceber = l.lancamentos.filter((x) => x.status === 'a receber').reduce((s, x) => s + x.valor, 0);
  const nota = String(l.nota_cliente || '').match(/\[\[([^|\]]+)/);
  const whats = linkWhats(l.telefone);
  const perdido = l.etapa === 'perdido';
  const idxAtual = estado.etapas.indexOf(perdido ? l.perdido_em_etapa : l.etapa);
  const mostrarDinheiro = l.lancamentos.length || ['proposta', 'entrada', 'cliente'].includes(l.etapa);

  const passos = estado.etapas.map((e, i) => {
    const classe = perdido ? (i <= idxAtual ? 'feito perdido' : '') : i < idxAtual ? 'feito' : i === idxAtual ? 'atual' : '';
    return `<button type="button" class="passo-funil ${classe}" data-etapa="${e}" title="Mover pra ${esc(estado.nomes[e])}">
      <i>${i < idxAtual || (perdido && i <= idxAtual) ? '✓' : i + 1}</i><span>${esc(estado.nomes[e])}</span>
      ${l[`data_${e}`] ? `<small>${dataBR(l[`data_${e}`]).slice(0, 5)}</small>` : '<small>&nbsp;</small>'}</button>`;
  }).join('<span class="linha-funil"></span>');

  const item = (rotulo, valor, falta = false) => `<div class="item-resumo ${falta ? 'falta' : ''}"><span>${rotulo}</span><b>${valor}</b></div>`;
  const resumo = [
    item('Abordagem', l.abordagem ? esc(l.abordagem) : 'não registrada', semAbordagem(l)),
    item('Origem', esc(l.origem || '—')),
    item('Sinal de momento', esc(l.sinal || '—')),
    item('Serviços', esc((l.servicos || []).join(', ') || '—')),
    item('Proposta', l.valor_proposta ? real(l.valor_proposta) : '—'),
    item('Responsável', esc(l.responsavel || '—')),
    item('Telefone', esc(l.telefone || '—')),
    ...(perdido ? [item('Motivo da perda', esc(l.motivo_perda || '—'))] : []),
  ].join('');

  conteudo.innerHTML = `
    <div class="cabecalho">
      <div>
        <p class="sobrelinha"><a href="#funil">← Funil</a></p>
        <h1>${esc(l.nome)}</h1>
        <p>${[l.nicho, l.cidade].filter(Boolean).map(esc).join(' · ') || '&nbsp;'}</p>
      </div>
      <div class="filtros">
        ${whats ? `<a class="botao" href="${whats}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        ${l.instagram ? `<a class="botao" href="${esc(linkExterno(l.instagram))}" target="_blank" rel="noopener">Instagram</a>` : ''}
        ${l.site ? `<a class="botao" href="${esc(linkExterno(l.site))}" target="_blank" rel="noopener">Site</a>` : ''}
        <a class="botao" href="${esc(l.maps ? linkExterno(l.maps) : 'https://www.google.com/search?q=' + encodeURIComponent([l.nome, l.cidade].filter(Boolean).join(' ')))}" target="_blank" rel="noopener">Google</a>
        <button class="botao" id="editar">Editar dados</button>
      </div>
    </div>

    <div class="cartao funil-ficha">
      <div class="passos-funil">${passos}</div>
      ${perdido ? `<p class="aviso-perdido">Perdido${l.perdido_em_etapa ? ` em ${esc(estado.nomes[l.perdido_em_etapa] || l.perdido_em_etapa)}` : ''}${l.data_perdido ? ` · ${dataBR(l.data_perdido)}` : ''}: ${esc(l.motivo_perda || 'sem motivo')}</p>`
        : '<button type="button" class="botao pequeno perigo" id="marcar-perdido">Marcar como perdido</button>'}
    </div>

    ${semAbordagem(l) ? `<form class="cartao alerta-abordagem" id="form-abordagem">
      <div><b>Falta registrar a abordagem</b><p>Qual mensagem abriu a conversa? Sem isso, a análise de "qual abordagem funciona" fica incompleta.</p></div>
      <input name="abordagem" required placeholder="WhatsApp, direct…" list="l-pecas">
      <datalist id="l-pecas">${[...new Set([...valoresDe('abordagem'), ...PECAS_COFRE])].map((v) => `<option value="${esc(v)}">`).join('')}</datalist>
      <button class="botao primario">Salvar</button>
    </form>` : ''}

    <div class="ficha">
      <div class="grade">
        ${perdido ? '' : `<form class="cartao cartao-proximo" id="form-proximo">
          <div class="titulo-cartao"><h2>Próximo passo</h2>${l.proximo_toque ? `<span class="quando-grande">${quandoToque(l.proximo_toque)}</span>` : ''}</div>
          <input name="proximo_passo" value="${esc(l.proximo_passo || '')}" placeholder="O que precisa acontecer agora? Ex: follow-up, mandar proposta">
          <div class="linha-proximo">
            <label>Quando <input type="date" name="proximo_toque" value="${esc(l.proximo_toque || '')}"></label>
            <div class="atalhos-data">${[[1, 'amanhã'], [2, '+2 dias'], [5, '+5 dias'], [7, '+1 semana']].map(([d, n]) => `<button type="button" class="chip" data-dias="${d}">${n}</button>`).join('')}</div>
            <button class="botao primario">Salvar</button>
          </div>
        </form>`}

        <section class="cartao">
          <div class="titulo-cartao"><h2>Histórico</h2><span class="mudo" style="font-size:13px">${l.historico.length} ${l.historico.length === 1 ? 'registro' : 'registros'}</span></div>
          <form id="form-hist" class="form-hist">
            <input name="texto" required placeholder="O que aconteceu? Ex: mandei o follow-up, respondeu que vai ver">
            <select name="canal">${opcoes(CANAIS, l.historico.length ? l.historico[l.historico.length - 1].canal : 'whatsapp')}</select>
            <input type="date" name="data" value="${hoje()}" required>
            <button class="botao">Registrar</button>
          </form>
          <ul class="historico">${[...l.historico].reverse().map((h) => `<li><div class="quando">${dataBR(h.data)} · ${esc(h.canal)}</div>${esc(h.texto)}</li>`).join('') || '<li class="mudo" style="border:0">Nada registrado ainda.</li>'}</ul>
        </section>
      </div>

      <div class="grade">
        <section class="cartao">
          <div class="titulo-cartao"><h2>Resumo</h2><button type="button" class="botao pequeno" id="editar-2">Editar</button></div>
          <div class="resumo-ficha">${resumo}</div>
        </section>

        ${mostrarDinheiro ? `<section class="cartao">
          <div class="titulo-cartao"><h2>Dinheiro</h2><button type="button" class="botao pequeno" id="novo-lanc">+ Lançamento</button></div>
          <div class="dinheiro">
            <div><span>Recebido</span><b class="txt-bom">${real(recebido)}</b></div>
            <div><span>A receber</span><b class="${aReceber ? 'txt-alerta' : ''}">${real(aReceber)}</b></div>
          </div>
          ${l.lancamentos.length ? `<ul class="lancamentos">${l.lancamentos.map((x, i) => `<li>
            <div><b>${real(x.valor)}</b><span>${dataBR(x.data)} · ${esc(x.servico)}${x.descricao ? ` · ${esc(x.descricao)}` : ''}${x.tipo === 'recorrente' ? ' · recorrente' : ''}</span></div>
            <button class="botao pequeno" data-alternar="${i}" title="Clique pra trocar">${x.status === 'recebido' ? '<span class="etiqueta recebido">recebido</span>' : `<span class="etiqueta ${x.data < hoje() ? 'atrasado' : 'receber'}">${x.data < hoje() ? 'vencido' : 'a receber'}</span>`}</button>
            <button class="botao pequeno perigo" data-remover="${i}" title="Remover lançamento">×</button>
          </li>`).join('')}</ul>` : '<p class="mudo">Nenhum lançamento ainda.</p>'}
        </section>` : ''}

        ${l.notas ? `<section class="cartao"><div class="titulo-cartao"><h2>Notas</h2></div><p class="texto-nota">${esc(l.notas)}</p></section>` : ''}
      </div>
    </div>`;

  const recarregar = () => telaFicha(id);

  conteudo.querySelectorAll('.passo-funil').forEach((b) => b.addEventListener('click', async () => {
    if (await mudarEtapa(l, b.dataset.etapa)) recarregar();
  }));
  $('#marcar-perdido')?.addEventListener('click', async () => { if (await mudarEtapa(l, 'perdido')) recarregar(); });
  $('#editar').addEventListener('click', () => editarFicha(l));
  $('#editar-2').addEventListener('click', () => editarFicha(l));

  $('#form-abordagem')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = new FormData(e.target).get('abordagem').trim().toUpperCase().replace(/^([A-Z]{2})(\d)/, '$1-0$2');
    await salvar({ ...l, abordagem: v }, 'Abordagem registrada');
    recarregar();
  });

  const formProx = $('#form-proximo');
  if (formProx) {
    formProx.querySelectorAll('[data-dias]').forEach((b) => b.addEventListener('click', () => {
      formProx.querySelector('[name="proximo_toque"]').value = somarDias(hoje(), Number(b.dataset.dias));
    }));
    formProx.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      await salvar({ ...l, proximo_passo: f.get('proximo_passo').trim(), proximo_toque: f.get('proximo_toque') }, 'Próximo passo salvo');
      recarregar();
    });
  }

  $('#form-hist').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    await salvar({ ...l, historico: [...l.historico, { data: f.data, canal: f.canal, texto: f.texto.trim() }] }, 'Registrado no histórico');
    recarregar();
  });

  $('#novo-lanc')?.addEventListener('click', () => novoLancamentoLead(l));
  conteudo.querySelectorAll('[data-alternar]').forEach((b) => b.addEventListener('click', async () => {
    const i = Number(b.dataset.alternar);
    const lancamentos = l.lancamentos.map((x, j) => (j === i ? { ...x, status: x.status === 'recebido' ? 'a receber' : 'recebido' } : x));
    await salvar({ ...l, lancamentos });
    recarregar();
  }));
  conteudo.querySelectorAll('[data-remover]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Remover esse lançamento?')) return;
    const i = Number(b.dataset.remover);
    await salvar({ ...l, lancamentos: l.lancamentos.filter((_, j) => j !== i) }, 'Lançamento removido');
    recarregar();
  }));
}

// Todos os dados do lead num modal, pra ficha ficar limpa.
function editarFicha(l) {
  const campo = (nome, rotulo, extra = '') => `<label>${rotulo}<input name="${nome}" value="${esc(l[nome] ?? '')}" ${extra}></label>`;
  const lista = (lid, valores) => `<datalist id="${lid}">${[...new Set(valores)].map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`;
  const p = abrirModal(`
    <h2>Editar ${esc(l.nome)}</h2>
    <div class="campos">
      <label class="largo">Nome<input name="nome" value="${esc(l.nome)}" required></label>
      ${campo('abordagem', 'Abordagem usada', `list="e-abordagem" placeholder="WhatsApp, direct…" ${precisaAbordagem(l.etapa) ? 'required' : ''}`)}
      ${campo('origem', 'Origem', 'list="e-origem"')}
      ${campo('nicho', 'Nicho', 'list="e-nicho"')}
      ${campo('cidade', 'Cidade', 'list="e-cidade"')}
      ${campo('sinal', 'Sinal de momento', 'list="e-sinal"')}
      <label>Prioridade<select name="prioridade"><option value="">—</option>${opcoes(PRIORIDADES, l.prioridade)}</select></label>
      <label class="largo">Serviços (separados por vírgula)<input name="servicos" value="${esc((l.servicos || []).join(', '))}" placeholder="site, crm, tráfego"></label>
      ${campo('valor_proposta', 'Valor da proposta (R$)', 'type="number" step="0.01" min="0"')}
      ${campo('responsavel', 'Responsável / dono')}
      ${campo('telefone', 'Telefone / WhatsApp')}
      ${campo('instagram', 'Instagram')}
      ${campo('site', 'Site')}
      ${campo('maps', 'Google (link do Maps)')}
      ${l.etapa === 'perdido' ? campo('motivo_perda', 'Motivo da perda', 'list="e-motivo"') : ''}
    </div>
    ${lista('e-abordagem', [...valoresDe('abordagem'), ...PECAS_COFRE])}${lista('e-origem', valoresDe('origem'))}${lista('e-nicho', valoresDe('nicho'))}
    ${lista('e-cidade', valoresDe('cidade'))}${lista('e-sinal', valoresDe('sinal'))}${lista('e-motivo', valoresDe('motivo_perda'))}
    <p class="mudo" style="margin:0;font-size:12px">Arquivo: <code>crm/dados/leads/${esc(l.id)}.md</code></p>
    <div class="linha-acoes">
      <button type="button" class="botao perigo" id="apagar" style="margin-right:auto">Apagar ficha</button>
      <button class="botao" value="cancelar" formnovalidate>Cancelar</button><button class="botao primario">Salvar</button>
    </div>
  `, async (f) => {
    const novo = { ...l };
    for (const [k, v] of f) novo[k] = String(v).trim();
    novo.servicos = novo.servicos ? novo.servicos.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : [];
    novo.valor_proposta = novo.valor_proposta ? Number(novo.valor_proposta) : '';
    for (const k of ['nicho', 'origem', 'sinal']) if (novo[k]) novo[k] = novo[k].toLowerCase();
    if (novo.abordagem) novo.abordagem = novo.abordagem.toUpperCase().replace(/^([A-Z]{2})(\d)/, '$1-0$2');
    await salvar(novo);
    telaFicha(l.id);
    return true;
  });
  $('#apagar').addEventListener('click', async () => {
    if (!confirm(`Apagar a ficha de ${l.nome}? Ela será apagada de vez.`)) return;
    $('#modal').close();
    await api(`/api/leads/${l.id}`, { method: 'DELETE' });
    await carregar();
    aviso('Ficha apagada');
    location.hash = 'funil';
  });
  return p;
}

function novoLancamentoLead(l) {
  const servicos = [...new Set([...(l.servicos || []), ...valoresDe('servicos'), ...estado.ind.ganhos.porServico.map((s) => s.servico)])];
  const p = abrirModal(`
    <h2>Novo lançamento · ${esc(l.nome)}</h2>
    <div class="campos">
      <label>Valor (R$)<input name="valor" inputmode="decimal" placeholder="200" required autofocus></label>
      <label>Data<input type="date" name="data" value="${hoje()}" required></label>
      <label>Status<select name="status"><option value="recebido">recebido</option><option value="a receber">a receber</option></select></label>
      <label>Tipo<select name="tipo"><option value="projeto">projeto (uma vez)</option><option value="recorrente">recorrente (todo mês)</option></select></label>
      <label class="largo">Serviço (escolha ou escreva)<input name="servico" required placeholder="site, tráfego, manutenção…"></label>
    </div>
    ${sugestoes('servico', servicos)}
    <div class="campos">
      <label class="largo">Descrição<input name="descricao" placeholder="ex: entrada, parcela final, gestão de novembro"></label>
      <label>Repetir por (meses)<input type="number" name="repetir" min="1" max="24" value="1"></label>
    </div>
    <div class="linha-acoes"><button class="botao" value="cancelar" formnovalidate>Cancelar</button><button class="botao primario">Lançar</button></div>
  `, async (f) => {
    const valor = numeroBR(f.get('valor'));
    if (!valor) throw new Error('Valor inválido');
    const vezes = Math.max(1, Number(f.get('repetir')) || 1);
    const novos = Array.from({ length: vezes }, (_, i) => ({
      data: somarMeses(f.get('data'), i),
      valor,
      servico: f.get('servico').trim().toLowerCase(),
      tipo: f.get('tipo'),
      // Só o primeiro mês herda "recebido"; os seguintes ficam a receber.
      status: i === 0 ? f.get('status') : 'a receber',
      descricao: f.get('descricao').trim(),
    }));
    await salvar({ ...l, lancamentos: [...l.lancamentos, ...novos] }, vezes > 1 ? `${vezes} lançamentos adicionados` : 'Lançamento adicionado');
    telaFicha(l.id);
    return true;
  });
  ativarSugestoes($('#modal-form'));
  return p;
}

// ---------- tela: ganhos ----------
const PERIODOS_GANHOS = [['semana', 'Última semana'], ['mes', 'Último mês'], ['ano', 'Último ano'], ['sempre', 'Sempre'], ['personalizado', 'Personalizado']];
const diasEntre = (de, ate) => Math.round((new Date(`${ate}T12:00:00`) - new Date(`${de}T12:00:00`)) / 86400000);

// Início e fim do período escolhido. "dias" fica nulo quando não há período anterior pra comparar.
function intervaloGanhos() {
  const fim = hoje();
  const fixos = { semana: 7, mes: 30, ano: 365 };
  if (fixos[estado.ganhosPeriodo]) {
    const dias = fixos[estado.ganhosPeriodo];
    return { de: somarDias(fim, -(dias - 1)), ate: fim, dias };
  }
  if (estado.ganhosPeriodo === 'personalizado') {
    let de = estado.ganhosDe || somarDias(fim, -29);
    let ate = estado.ganhosAte || fim;
    if (de > ate) [de, ate] = [ate, de];
    return { de, ate, dias: diasEntre(de, ate) + 1 };
  }
  // Sempre: do primeiro lançamento até o último (inclui parcelas futuras).
  const datas = estado.ind.lancamentos.map((l) => l.data).filter(Boolean).sort();
  return { de: datas[0] || fim, ate: datas.length && datas[datas.length - 1] > fim ? datas[datas.length - 1] : fim, dias: null };
}

// Fatias do gráfico: por dia até 31 dias, por semana até 120, por mês acima disso.
function fatiasGanhos(de, ate) {
  const total = diasEntre(de, ate) + 1;
  const fatias = [];
  if (total <= 31) {
    for (let d = de; d <= ate; d = somarDias(d, 1)) fatias.push({ de: d, ate: d, rotulo: dataBR(d).slice(0, 5) });
  } else if (total <= 120) {
    for (let d = de; d <= ate; d = somarDias(d, 7)) {
      const f = somarDias(d, 6);
      fatias.push({ de: d, ate: f < ate ? f : ate, rotulo: dataBR(d).slice(0, 5) });
    }
  } else {
    let [a, m] = de.slice(0, 7).split('-').map(Number);
    const ultimo = ate.slice(0, 7);
    for (;;) {
      const mes = `${a}-${String(m).padStart(2, '0')}`;
      if (mes > ultimo) break;
      fatias.push({ de: `${mes}-01`, ate: `${mes}-31`, rotulo: mesBR(mes) });
      if (++m > 12) { m = 1; a++; }
    }
  }
  return fatias;
}

function telaGanhos() {
  const { ind } = estado;
  const { de, ate, dias } = intervaloGanhos();
  const dentro = (l, a, b) => l.data >= a && l.data <= b;
  const linhas = ind.lancamentos.filter((l) => dentro(l, de, ate)).slice().reverse();
  const soma = (xs) => xs.reduce((s, l) => s + l.valor, 0);
  const recebido = soma(linhas.filter((l) => l.status === 'recebido'));
  const aReceber = soma(linhas.filter((l) => l.status === 'a receber'));
  const vencido = soma(linhas.filter((l) => l.status === 'a receber' && l.data < hoje()));
  const recorrente = soma(linhas.filter((l) => l.tipo === 'recorrente'));
  const recebidoAnterior = dias
    ? soma(ind.lancamentos.filter((l) => l.status === 'recebido' && dentro(l, somarDias(de, -dias), somarDias(de, -1))))
    : null;
  const nomePeriodo = Object.fromEntries(PERIODOS_GANHOS)[estado.ganhosPeriodo];

  const fatias = fatiasGanhos(de, ate).map((f) => {
    const doPeriodo = linhas.filter((l) => dentro(l, f.de, f.ate));
    return {
      rotulo: f.rotulo,
      projeto: soma(doPeriodo.filter((l) => l.status === 'recebido' && l.tipo === 'projeto')),
      recorrente: soma(doPeriodo.filter((l) => l.status === 'recebido' && l.tipo === 'recorrente')),
      aReceber: soma(doPeriodo.filter((l) => l.status === 'a receber')),
    };
  });
  const porDia = diasEntre(de, ate) + 1 <= 31;

  conteudo.innerHTML = `
    <div class="cabecalho">
      <div><p class="sobrelinha">Financeiro</p><h1>Ganhos</h1><p>Lançamentos de ${dataBR(de)} a ${dataBR(ate)}. Pra lançar um valor, abra a ficha do cliente.</p></div>
      <div class="filtros periodo-ganhos">
        <div class="seletor sem-margem" id="seletor-periodo">
          ${PERIODOS_GANHOS.map(([k, n]) => `<button type="button" data-periodo="${k}" class="${estado.ganhosPeriodo === k ? 'ativo' : ''}">${n}</button>`).join('')}
        </div>
        ${estado.ganhosPeriodo === 'personalizado' ? `<div class="datas-personalizadas">
          <label>De<input type="date" id="ganhos-de" value="${de}"></label>
          <label>Até<input type="date" id="ganhos-ate" value="${ate}"></label>
        </div>` : ''}
      </div>
    </div>
    <section class="grade kpis">
      <div class="cartao kpi">
        <div class="rotulo">Recebido</div>
        <div class="linha-valor"><span class="valor">${real(recebido)}</span>${dias ? variacao(recebido, recebidoAnterior) : ''}</div>
        <div class="extra">${dias ? `antes: ${real(recebidoAnterior)} nos ${dias} dias anteriores` : 'desde o primeiro lançamento'}</div>
      </div>
      <div class="cartao kpi">
        <div class="rotulo">A receber</div>
        <div class="linha-valor"><span class="valor">${real(aReceber)}</span>${vencido ? `<span class="delta desce">${realCurto(vencido)} vencido</span>` : ''}</div>
        <div class="extra">com vencimento no período</div>
      </div>
      <div class="cartao kpi">
        <div class="rotulo">Recorrente</div>
        <div class="linha-valor"><span class="valor">${real(recorrente)}</span></div>
        <div class="extra">tráfego, manutenção, conteúdo</div>
      </div>
      <div class="cartao kpi">
        <div class="rotulo">Lançamentos</div>
        <div class="linha-valor"><span class="valor">${linhas.length}</span></div>
        <div class="extra">${nomePeriodo.toLowerCase()}</div>
      </div>
    </section>
    <div class="cartao" style="margin-bottom:16px">
      <h2>Ganhos ${porDia ? 'por dia' : diasEntre(de, ate) + 1 <= 120 ? 'por semana' : 'por mês'}</h2>
      <p class="sub">Recebido (projeto e recorrente) e o que ainda vai entrar · ${nomePeriodo.toLowerCase()}</p>
      <div class="grafico"><canvas id="g-ganhos"></canvas></div>
    </div>
    <div class="cartao tabela-wrap">
      ${linhas.length ? `<table>
        <thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Tipo</th><th>Descrição</th><th class="num">Valor</th><th>Status</th></tr></thead>
        <tbody>${linhas.map((x) => `<tr class="clicavel" data-id="${x.lead}">
          <td>${dataBR(x.data)}</td><td><b>${esc(x.nomeLead)}</b></td><td>${esc(x.servico)}</td><td>${esc(x.tipo)}</td>
          <td class="mudo">${esc(x.descricao)}</td><td class="num">${real(x.valor)}</td>
          <td>${x.status === 'recebido' ? '<span class="etiqueta recebido">recebido</span>' : `<span class="etiqueta ${x.data < hoje() ? 'atrasado' : 'receber'}">${x.data < hoje() ? 'vencido' : 'a receber'}</span>`}</td>
        </tr>`).join('')}</tbody></table>`
        : `<p class="mudo">Nenhum lançamento ${estado.ganhosPeriodo === 'sempre' ? 'ainda. Abra a ficha de um cliente e use "Novo lançamento"' : 'nesse período'}.</p>`}
    </div>`;

  graficoGanhos($('#g-ganhos'), fatias);
  const redesenhar = () => { graficos.splice(0).forEach((g) => g.destroy()); telaGanhos(); };
  $('#seletor-periodo').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    estado.ganhosPeriodo = b.dataset.periodo;
    if (b.dataset.periodo === 'personalizado' && !estado.ganhosDe) {
      estado.ganhosDe = de;
      estado.ganhosAte = ate;
    }
    redesenhar();
  });
  if (estado.ganhosPeriodo === 'personalizado') {
    $('#ganhos-de').addEventListener('change', (e) => { estado.ganhosDe = e.target.value; redesenhar(); });
    $('#ganhos-ate').addEventListener('change', (e) => { estado.ganhosAte = e.target.value; redesenhar(); });
  }
  conteudo.querySelectorAll('tr.clicavel').forEach((tr) => tr.addEventListener('click', () => { location.hash = `lead/${tr.dataset.id}`; }));
}

// ---------- gestão: semana, entregas, caixa, placar, YouTube ----------
// Os dados vêm das notas em gestao/ (as mesmas que o Claude e o Obsidian editam).
const numeroBR = (t) => {
  const s = String(t ?? '').replace(/[R$\s]/g, '');
  if (!s || s === '—') return null;
  const n = s.includes(',') ? Number(s.replace(/\./g, '').replace(',', '.')) : Number(s);
  return Number.isFinite(n) ? n : null;
};
const vazioCartao = (titulo, texto) => `<div class="cartao vazio"><h2>${titulo}</h2><p class="mudo">${texto}</p></div>`;
const comando = (c) => `<code class="comando">${esc(c)}</code>`;

// Movimentos da conta da empresa: saldo inicial + recebidos do CRM desde a data do saldo + lançamentos do Caixa.
function movimentosCaixa() {
  const cx = estado.gestao?.caixa;
  if (!cx || cx.saldoInicial === null) return null;
  const desde = cx.dataSaldo;
  const doCrm = estado.ind.lancamentos
    .filter((l) => l.status === 'recebido' && l.data >= desde)
    .map((l) => ({ data: l.data, tipo: 'entrada', categoria: 'cliente', descricao: `${l.nomeLead}${l.servico ? ` · ${l.servico}` : ''}`, valor: l.valor, lead: l.lead }));
  const doCaixa = cx.lancamentos.filter((l) => l.data >= desde);
  const movs = [...doCrm, ...doCaixa].sort((a, b) => a.data.localeCompare(b.data));
  const sinal = (m) => (m.tipo === 'entrada' ? 1 : -1);
  let saldo = cx.saldoInicial;
  const serie = [{ data: desde, saldo }];
  for (const m of movs) { saldo += sinal(m) * m.valor; serie.push({ data: m.data, saldo }); }
  return { saldoInicial: cx.saldoInicial, desde, movs, saldo, serie, sinal };
}

function tarefaHTML(t, arquivo) {
  return `<label class="tarefa ${t.feito ? 'feita' : ''}">
    <input type="checkbox" data-arquivo="${esc(arquivo)}" data-linha="${t.linha}" ${t.feito ? 'checked' : ''}>
    <span>${esc(t.texto)}</span></label>`;
}

function ativarTarefas() {
  conteudo.querySelectorAll('.tarefa input').forEach((c) => c.addEventListener('change', async () => {
    try {
      estado.gestao = await api('/api/tarefa', { method: 'POST', body: JSON.stringify({ arquivo: c.dataset.arquivo, linha: c.dataset.linha }) });
      aviso(c.checked ? 'Feito ✓' : 'Desmarcado');
      rotear();
    } catch (e) { aviso(e.message); }
  }));
}

// Progresso de meta escrito como "(3/10)" no texto
const progressoMeta = (texto) => {
  const m = texto.match(/\((\d+)\s*\/\s*(\d+)\)/);
  return m ? { feito: Number(m[1]), total: Number(m[2]) } : null;
};

// Compromissos dos próximos 7 dias, ao vivo: toques do CRM + próximos toques das entregas
function compromissosSemana() {
  const h = hoje();
  const limite = somarDias(h, 7);
  const t = estado.ind.toques;
  const doCrm = [...t.atrasados, ...t.hoje, ...t.semana].map((l) => ({ data: l.proximo_toque, nome: l.nome, oque: l.proximo_passo, link: `#lead/${l.id}`, tipo: 'vendas' }));
  const deEntregas = (estado.gestao?.entregas || []).flatMap((s) => s.projetos)
    .filter((p) => p.campos['próximo toque'] && p.campos['próximo toque'] <= limite)
    .map((p) => ({ data: p.campos['próximo toque'], nome: p.nome, oque: p.campos['próximo passo'], link: '#entregas', tipo: 'entrega' }));
  return [...doCrm, ...deEntregas].sort((a, b) => a.data.localeCompare(b.data));
}

const esperandoVoce = () => (estado.gestao?.entregas || []).filter((s) => s.titulo !== 'Entregues')
  .flatMap((s) => s.projetos).filter((p) => /josé|jose|você/i.test(p.campos.esperando || ''));

// Faixa no topo do painel: o resumo da gestão em 4 cartões clicáveis
function faixaGestao() {
  const g = estado.gestao;
  if (!g) return '';
  const cx = movimentosCaixa();
  const s = g.semana;
  const metas = s ? s.metas : [];
  const ult = g.placar.semanas[g.placar.semanas.length - 1];
  const comp = compromissosSemana();
  const atrasados = comp.filter((c) => c.data < hoje()).length;
  const ativos = (g.entregas.find((x) => x.titulo === 'Em andamento')?.projetos || []).length;
  return `<section class="grade kpis faixa-gestao">
    <a class="cartao kpi clicavel-cartao" href="#caixa">
      <div class="rotulo">Saldo em caixa</div>
      <div class="linha-valor"><span class="valor">${cx ? real(cx.saldo) : '—'}</span></div>
      <div class="extra">${cx ? `desde ${dataBR(cx.desde)} · ${cx.movs.length} ${cx.movs.length === 1 ? 'movimento' : 'movimentos'}` : 'informe o saldo no Caixa'}</div>
    </a>
    <a class="cartao kpi clicavel-cartao" href="#semana">
      <div class="rotulo">Minha semana</div>
      <div class="linha-valor"><span class="valor">${comp.length}</span>${atrasados ? `<span class="delta desce">${atrasados} atrasado${atrasados > 1 ? 's' : ''}</span>` : '<span class="delta neutro">em dia</span>'}</div>
      <div class="extra">${s ? `${metas.filter((m) => m.feito).length} de ${metas.length} metas · ` : ''}compromissos em 7 dias</div>
    </a>
    <a class="cartao kpi clicavel-cartao" href="#entregas">
      <div class="rotulo">Entregas</div>
      <div class="linha-valor"><span class="valor">${ativos}</span>${esperandoVoce().length ? `<span class="delta desce">${esperandoVoce().length} com você</span>` : '<span class="delta neutro">nada com você</span>'}</div>
      <div class="extra">projetos em andamento</div>
    </a>
    <a class="cartao kpi clicavel-cartao" href="#placar">
      <div class="rotulo">Placar da semana</div>
      <div class="linha-valor"><span class="valor">${ult ? esc(ult.Abordagens || '—') : '—'}</span>${ult ? '<span class="delta neutro">abordagens</span>' : ''}</div>
      <div class="extra">${ult ? `semana ${esc(ult.Semana)}` : 'primeira linha na sexta, com /revisao'}</div>
    </a>
  </section>`;
}

// ---------- tela: minha semana ----------
function telaSemana() {
  const s = estado.gestao?.semana;
  const comp = compromissosSemana();
  const h = hoje();
  const ddmm = dataBR(h).slice(0, 5);
  const diaHoje = s?.dias.find((d) => d.titulo.includes(ddmm));
  const outrosDias = (s?.dias || []).filter((d) => d !== diaHoje).reverse();
  const metasFeitas = s ? s.metas.filter((m) => m.feito).length : 0;
  const tarefasHoje = diaHoje ? diaHoje.tarefas : [];

  conteudo.innerHTML = `
    <div class="cabecalho">
      <div><p class="sobrelinha">Gestão</p><h1>${s ? esc(s.titulo) : 'Minha semana'}</h1>
        <p>${s?.foco ? `Foco: <b>${esc(s.foco)}</b>` : 'O plano da semana, o dia de hoje e o que está marcado.'}</p></div>
      <div class="filtros">${s?.estudo ? `<span class="etiqueta">carga da semana ${esc(s.estudo)}</span>` : ''}</div>
    </div>

    <section class="grade kpis">
      <div class="cartao kpi"><div class="rotulo">Hoje</div>
        <div class="linha-valor"><span class="valor">${tarefasHoje.filter((t) => t.feito).length}/${tarefasHoje.length}</span></div>
        <div class="extra">${diaHoje ? esc(diaHoje.titulo) : 'sem plano pra hoje'}</div></div>
      <div class="cartao kpi"><div class="rotulo">Metas da semana</div>
        <div class="linha-valor"><span class="valor">${s ? `${metasFeitas}/${s.metas.length}` : '—'}</span></div>
        <div class="extra">${s ? 'metas batidas' : 'defina com /semana'}</div></div>
      <div class="cartao kpi"><div class="rotulo">Compromissos</div>
        <div class="linha-valor"><span class="valor">${comp.length}</span>${comp.some((c) => c.data < h) ? `<span class="delta desce">${comp.filter((c) => c.data < h).length} atrasado</span>` : ''}</div>
        <div class="extra">nos próximos 7 dias</div></div>
      <div class="cartao kpi"><div class="rotulo">Esperando você</div>
        <div class="linha-valor"><span class="valor">${esperandoVoce().length}</span></div>
        <div class="extra">entregas de clientes</div></div>
    </section>

    <section class="grade duas">
      <div class="cartao">
        <div class="titulo-cartao"><h2>Hoje · ${ddmm}</h2></div>
        ${diaHoje ? `<div class="tarefas">${diaHoje.tarefas.map((t) => tarefaHTML(t, s.arquivo)).join('')}</div>`
          : `<p class="mudo">Ainda sem plano pra hoje. No Claude, digite ${comando('/hoje 1h')} com o tempo que você tem e a lista aparece aqui.</p>`}
      </div>
      <div class="cartao">
        <div class="titulo-cartao"><h2>Metas da semana</h2></div>
        ${s && s.metas.length ? `<div class="metas">${s.metas.map((m) => {
          const p = progressoMeta(m.texto);
          return `<div class="meta">${tarefaHTML(m, s.arquivo)}${p ? `<div class="trilho-meta"><span style="width:${Math.min(100, (p.feito / p.total) * 100)}%"></span></div>` : ''}</div>`;
        }).join('')}</div>` : `<p class="mudo">Sem metas ainda. Na segunda, digite ${comando('/semana')} no Claude.</p>`}
      </div>
    </section>

    <div class="cartao" style="margin-bottom:16px">
      <div class="titulo-cartao"><h2>Compromissos dos próximos 7 dias</h2><span class="mudo" style="font-size:13px">ao vivo, do CRM e das entregas</span></div>
      ${comp.length ? `<div class="tabela-wrap"><table>
        <thead><tr><th>Quando</th><th>Quem</th><th>O quê</th><th>Área</th></tr></thead>
        <tbody>${comp.map((c) => `<tr class="clicavel" data-link="${c.link}">
          <td class="nowrap">${quandoToque(c.data)} <span class="mudo">· ${dataBR(c.data).slice(0, 5)}</span></td>
          <td><b>${esc(c.nome)}</b></td><td class="passo-celula">${esc(c.oque || '—')}</td>
          <td><span class="etiqueta ${c.tipo === 'entrega' ? 'receber' : ''}">${c.tipo}</span></td></tr>`).join('')}</tbody></table></div>`
        : '<p class="mudo">Nada marcado pros próximos 7 dias.</p>'}
    </div>

    ${outrosDias.length ? `<div class="cartao" style="margin-bottom:16px"><div class="titulo-cartao"><h2>Dias anteriores</h2></div>
      <div class="dias">${outrosDias.map((d) => `<div class="dia"><b>${esc(d.titulo)}</b><span class="mudo">${d.tarefas.filter((t) => t.feito).length} de ${d.tarefas.length} feitas</span>
        <div class="tarefas">${d.tarefas.map((t) => tarefaHTML(t, s.arquivo)).join('')}</div></div>`).join('')}</div></div>` : ''}

    ${s?.revisao ? `<div class="cartao"><div class="titulo-cartao"><h2>Revisão da semana</h2></div><pre class="texto-nota">${esc(s.revisao)}</pre></div>` : ''}`;

  ativarTarefas();
  conteudo.querySelectorAll('tr.clicavel').forEach((tr) => tr.addEventListener('click', () => { location.hash = tr.dataset.link.slice(1); }));
}

// ---------- tela: entregas ----------
function telaEntregas() {
  const secoes = estado.gestao?.entregas || [];
  const corEsperando = (e) => (/josé|jose|você/i.test(e) ? 'atrasado' : /cliente/i.test(e) && !/combinar/i.test(e) ? 'receber' : '');
  const cartaoProjeto = (p) => {
    const c = p.campos;
    const vencido = /vencido/i.test(c['a receber'] || '');
    return `<div class="card entrega">
      <div class="nome">${esc(p.nome)}</div>
      <div class="linha">${p.entrega ? `<span class="etiqueta" style="--cor:var(--azul-claro)">${esc(p.entrega)}</span>` : ''}
        ${c.esperando ? `<span class="etiqueta ${corEsperando(c.esperando)}">esperando ${esc(c.esperando)}</span>` : ''}</div>
      ${c.status ? `<div class="passo">${esc(c.status)}</div>` : ''}
      ${c.falta ? `<div class="campo-entrega"><small>Falta</small>${esc(c.falta)}</div>` : ''}
      ${c['a receber'] && c['a receber'] !== '—' ? `<div class="campo-entrega"><small>A receber</small><span class="${vencido ? 'txt-critico' : ''}">${esc(c['a receber'])}</span></div>` : ''}
      ${c['próximo passo'] ? `<div class="campo-entrega"><small>Próximo passo</small>${esc(c['próximo passo'])}</div>` : ''}
      ${c['próximo toque'] ? `<div class="meta">${quandoToque(c['próximo toque'])} · ${dataBR(c['próximo toque'])}</div>` : ''}
    </div>`;
  };
  conteudo.innerHTML = `
    <div class="cabecalho">
      <div><p class="sobrelinha">Gestão</p><h1>Entregas</h1><p>Projetos dos clientes: o que falta e com quem está a bola. Pra atualizar, fale com o Claude (${comando('/entregas')}).</p></div>
    </div>
    ${secoes.length ? `<div class="quadro quadro-entregas">${secoes.map((s) => `
      <div class="coluna" data-secao="${esc(s.titulo.toLowerCase())}">
        <header><b>${esc(s.titulo)}</b><span>${s.projetos.length + s.itens.length}</span></header>
        <div class="lista">${s.projetos.map(cartaoProjeto).join('')}
          ${s.itens.map((i) => `<div class="card entrega"><div class="nome">${esc(i)}</div></div>`).join('')}
          ${!s.projetos.length && !s.itens.length ? '<p class="mudo" style="padding:6px">Nada aqui.</p>' : ''}</div>
      </div>`).join('')}</div>` : vazioCartao('Sem entregas', 'O quadro fica em gestao/Entregas.md.')}`;
}

// ---------- tela: caixa ----------
function telaCaixa() {
  const cx = movimentosCaixa();
  if (!cx) {
    conteudo.innerHTML = `<div class="cabecalho"><div><p class="sobrelinha">Gestão</p><h1>Caixa</h1></div></div>
      ${vazioCartao('Saldo não informado', 'Escreva no gestao/Caixa.md a linha **Saldo inicial:** 0000.00 em AAAA-MM-DD, ou peça pro Claude registrar o saldo.')}`;
    return;
  }
  const mes = hoje().slice(0, 7);
  const doMes = cx.movs.filter((m) => m.data.startsWith(mes));
  const soma = (xs) => xs.reduce((s, m) => s + m.valor, 0);
  const entrou = soma(doMes.filter((m) => m.tipo === 'entrada'));
  const saiu = soma(doMes.filter((m) => m.tipo === 'saida'));
  const retirou = soma(doMes.filter((m) => m.tipo === 'retirada'));
  const g = estado.ind.ganhos;
  const porCategoria = Object.entries(doMes.filter((m) => m.tipo === 'saida').reduce((acc, m) => ({ ...acc, [m.categoria || 'outros']: (acc[m.categoria || 'outros'] || 0) + m.valor }), {}))
    .map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  const ROT = { entrada: 'entrada', saida: 'saída', retirada: 'retirada' };

  conteudo.innerHTML = `
    <div class="cabecalho">
      <div><p class="sobrelinha">Gestão</p><h1>Caixa</h1><p>Conta da empresa desde ${dataBR(cx.desde)} (saldo inicial ${real(cx.saldoInicial)}). Pagamentos de clientes entram sozinhos pelo CRM.</p></div>
      <div class="filtros"><button class="botao primario" id="novo-mov">+ Lançamento</button></div>
    </div>
    <section class="grade kpis">
      <div class="cartao kpi"><div class="rotulo">Saldo atual</div>
        <div class="linha-valor"><span class="valor">${real(cx.saldo)}</span>${cx.saldo !== cx.saldoInicial ? variacao(cx.saldo, cx.saldoInicial) : ''}</div>
        <div class="extra">${cx.saldo === cx.saldoInicial ? 'igual ao saldo inicial' : `saldo inicial: ${real(cx.saldoInicial)}`}</div></div>
      <div class="cartao kpi"><div class="rotulo">Entrou no mês</div>
        <div class="linha-valor"><span class="valor">${real(entrou)}</span></div>
        <div class="extra">clientes e outras entradas</div></div>
      <div class="cartao kpi"><div class="rotulo">Saiu no mês</div>
        <div class="linha-valor"><span class="valor">${real(saiu + retirou)}</span></div>
        <div class="extra">gastos ${real(saiu)} · retiradas ${real(retirou)}</div></div>
      <div class="cartao kpi"><div class="rotulo">A receber</div>
        <div class="linha-valor"><span class="valor">${real(g.aReceber)}</span>${g.vencido ? `<span class="delta desce">${realCurto(g.vencido)} vencido</span>` : ''}</div>
        <div class="extra">de clientes, pelo CRM</div></div>
    </section>
    <section class="grade principal">
      <div class="cartao"><div class="titulo-cartao"><h2>Saldo ao longo do tempo</h2></div>
        <div class="grafico"><canvas id="g-saldo"></canvas></div></div>
      <div class="cartao"><div class="titulo-cartao"><h2>Pra onde foi o dinheiro</h2><span class="mudo" style="font-size:13px">gastos do mês</span></div>
        ${porCategoria.length ? barrasHTML(porCategoria, { rotulo: (i) => i.nome, valor: (i) => i.valor, formato: real }) : '<p class="mudo">Nenhum gasto registrado no mês.</p>'}</div>
    </section>
    <div class="cartao tabela-wrap">
      ${cx.movs.length ? `<table>
        <thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th class="num">Valor</th></tr></thead>
        <tbody>${cx.movs.slice().reverse().map((m) => `<tr ${m.lead ? `class="clicavel" data-id="${m.lead}"` : ''}>
          <td>${dataBR(m.data)}</td><td><span class="etiqueta ${m.tipo === 'entrada' ? 'recebido' : m.tipo === 'retirada' ? 'receber' : 'atrasado'}">${ROT[m.tipo] || esc(m.tipo)}</span></td>
          <td>${esc(m.categoria)}</td><td class="mudo">${esc(m.descricao)}</td>
          <td class="num ${m.tipo === 'entrada' ? 'txt-bom' : ''}">${m.tipo === 'entrada' ? '+' : '−'} ${real(m.valor)}</td></tr>`).join('')}</tbody></table>`
        : '<p class="mudo">Nenhum movimento desde o saldo inicial. Use "+ Lançamento" ou fale pro Claude ("gastei 50 no domínio").</p>'}
    </div>`;

  const opc = baseGrafico();
  opc.plugins.legend.display = false;
  opc.scales.y.beginAtZero = false;
  opc.scales.y.ticks.callback = (v) => realCurto(v);
  opc.plugins.tooltip.callbacks = { label: (c) => ` Saldo: ${real(c.raw)}` };
  const serie = cx.serie.length > 1 ? cx.serie : [...cx.serie, { data: hoje(), saldo: cx.saldo }];
  graficos.push(new Chart($('#g-saldo'), {
    type: 'line',
    data: { labels: serie.map((p) => dataBR(p.data).slice(0, 5)), datasets: [{ data: serie.map((p) => p.saldo), borderColor: cor('--serie-1'), backgroundColor: degrade(cor('--serie-1')), fill: 'origin', borderWidth: 2, pointRadius: 3.5, pointBackgroundColor: cor('--serie-1'), stepped: 'before' }] },
    options: opc,
  }));

  $('#novo-mov').addEventListener('click', novoMovimento);
  conteudo.querySelectorAll('tr.clicavel').forEach((tr) => tr.addEventListener('click', () => { location.hash = `lead/${tr.dataset.id}`; }));
}

function novoMovimento() {
  const CATS = ['ferramentas', 'dominio-hospedagem', 'anuncio', 'impostos', 'equipamento', 'outros'];
  abrirModal(`
    <h2>Novo lançamento no caixa</h2>
    <p class="mudo" style="margin:0">Pagamento de cliente? Lance na ficha dele, pra contar no funil também.</p>
    <div class="campos">
      <label>Tipo <select name="tipo"><option value="saida">saída (gasto)</option><option value="entrada">entrada</option><option value="retirada">retirada (pra mim)</option></select></label>
      <label>Data <input type="date" name="data" value="${hoje()}" required></label>
      <label>Valor (R$) <input name="valor" inputmode="decimal" placeholder="49,90" required autofocus></label>
      <label class="largo">Categoria (escolha ou escreva a sua) <input name="categoria" placeholder="ex: ferramentas, curso, transporte…"></label>
    </div>
    ${sugestoes('categoria', [...CATS, ...(estado.gestao?.caixa?.lancamentos || []).map((x) => x.categoria)])}
    <div class="campos"><label class="largo">Descrição <input name="descricao" placeholder="Domínio jbmaker.com.br (anual)"></label></div>
    <div class="linha-acoes"><button class="botao" value="cancelar" formnovalidate>Cancelar</button><button class="botao primario">Lançar</button></div>
  `, async (f) => {
    const valor = numeroBR(f.get('valor'));
    if (!valor) throw new Error('Valor inválido');
    const tipo = f.get('tipo');
    estado.gestao = await api('/api/caixa', { method: 'POST', body: JSON.stringify({
      tipo, data: f.get('data'), valor, descricao: f.get('descricao'),
      categoria: f.get('categoria') || (tipo === 'saida' ? 'outros' : tipo),
    }) });
    aviso('Lançado no caixa');
    rotear();
  });
  ativarSugestoes($('#modal-form'));
}

// ---------- tela: placar ----------
function telaPlacar() {
  const { colunas, semanas } = estado.gestao?.placar || { colunas: [], semanas: [] };
  const cab = `<div class="cabecalho"><div><p class="sobrelinha">Gestão</p><h1>Placar semanal</h1><p>Você comparado com você na semana anterior. Uma linha nova a cada ${comando('/revisao')}.</p></div></div>`;
  if (!semanas.length) {
    conteudo.innerHTML = `${cab}${vazioCartao('Primeira semana chegando', `A primeira linha entra na sexta, quando você rodar ${comando('/revisao')} no Claude. A partir da segunda semana, aparece aqui o gráfico de evolução.`)}`;
    return;
  }
  const ult = semanas[semanas.length - 1];
  const ant = semanas[semanas.length - 2];
  const kpi = (nome, formato = (v) => v) => {
    const a = numeroBR(ult[nome]);
    const b = ant ? numeroBR(ant[nome]) : null;
    return `<div class="cartao kpi"><div class="rotulo">${esc(nome)}</div>
      <div class="linha-valor"><span class="valor">${a === null ? esc(ult[nome] || '—') : formato(a)}</span>${ant && a !== null && b !== null ? variacao(a, b) : ''}</div>
      <div class="extra">${ant ? `antes: ${esc(ant[nome] || '—')}` : 'primeira semana'}</div></div>`;
  };
  conteudo.innerHTML = `${cab}
    <section class="grade kpis">${kpi('Abordagens')}${kpi('Respostas')}${kpi('Fechamentos')}${kpi('Recebido', real)}</section>
    <div class="cartao" style="margin-bottom:16px"><div class="titulo-cartao"><h2>Evolução</h2></div><div class="grafico"><canvas id="g-placar"></canvas></div></div>
    <div class="cartao tabela-wrap"><table>
      <thead><tr>${colunas.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${semanas.slice().reverse().map((s) => `<tr>${colunas.map((c) => `<td class="${c === 'Aprendizado' ? 'passo-celula' : ''}">${esc(s[c])}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;

  const opc = baseGrafico();
  const linha = (nome, c) => ({ label: nome, data: semanas.map((s) => numeroBR(s[nome]) || 0), borderColor: cor(c), backgroundColor: degrade(cor(c)), fill: 'origin', borderWidth: 2, pointRadius: 3.5, pointBackgroundColor: cor(c), cubicInterpolationMode: 'monotone' });
  graficos.push(new Chart($('#g-placar'), {
    type: 'line',
    data: { labels: semanas.map((s) => s.Semana), datasets: [linha('Abordagens', '--serie-1'), linha('Respostas', '--serie-2'), linha('Fechamentos', '--serie-3')] },
    options: opc,
  }));
}

// ---------- tela: YouTube ----------
function telaYoutube() {
  const y = estado.gestao?.youtube || { videos: [], ideias: [], ideiasTiktok: [] };
  const tiktok = y.ideiasTiktok || [];
  const doTipo = (p) => y.videos.filter((v) => (v.plataforma || 'YouTube').toLowerCase() === p);
  const kpi = (rotulo, lista) => `<div class="cartao kpi"><div class="rotulo">${rotulo}</div><div class="linha-valor"><span class="valor">${lista.length}</span></div>
        <div class="extra">${lista.length ? `último em ${dataBR(lista[lista.length - 1].data)}` : 'nenhum ainda'}</div></div>`;
  const ideiasHtml = (lista) => (lista.length ? `<ol class="ideias">${lista.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>` : '<p class="mudo">Sem ideias anotadas.</p>');
  conteudo.innerHTML = `
    <div class="cabecalho">
      <div><p class="sobrelinha">Conteúdo</p><h1>YouTube e TikTok</h1><p>Diário de progresso: os vídeos longos, os cortes curtos e as ideias de pauta. Pra produzir, ${comando('/youtube')} no Claude.</p></div>
    </div>
    <section class="grade kpis">
      ${kpi('Vídeos no YouTube', doTipo('youtube'))}
      ${kpi('Vídeos no TikTok', doTipo('tiktok'))}
      <div class="cartao kpi"><div class="rotulo">Ideias na fila</div><div class="linha-valor"><span class="valor">${y.ideias.length + tiktok.length}</span></div>
        <div class="extra">${y.ideias.length} YouTube · ${tiktok.length} TikTok</div></div>
    </section>
    <section class="cartao">
      <div class="titulo-cartao"><h2>Vídeos</h2></div>
        ${y.videos.length ? `<div class="tabela-wrap"><table><thead><tr><th>Data</th><th>Plataforma</th><th>Título</th><th>Pendente</th></tr></thead>
          <tbody>${y.videos.slice().reverse().map((v) => `<tr><td class="nowrap">${dataBR(v.data)}</td>
            <td class="nowrap">${esc(v.plataforma || 'YouTube')}</td>
            <td><b>${/^https?:\/\//.test(v.link) ? `<a href="${esc(v.link)}" target="_blank" rel="noopener">${esc(v.titulo)}</a>` : esc(v.titulo)}</b></td>
            <td class="passo-celula">${esc(v.pendente || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="mudo">Nenhum vídeo registrado.</p>'}
    </section>
    <section class="grade duas">
      <div class="cartao"><div class="titulo-cartao"><h2>Ideias YouTube</h2></div>${ideiasHtml(y.ideias)}</div>
      <div class="cartao"><div class="titulo-cartao"><h2>Ideias TikTok</h2></div>${ideiasHtml(tiktok)}</div>
    </section>`;
}

// ---------- início ----------
$('#novo-lead').addEventListener('click', novoLead);
window.addEventListener('hashchange', rotear);
// Quando a IA ou o Obsidian mudam uma ficha, a tela pega a versão nova ao voltar pra janela.
window.addEventListener('focus', async () => {
  if ($('#modal').open || document.activeElement?.closest('form')) return;
  await carregar();
  rotear();
});
rotear();
