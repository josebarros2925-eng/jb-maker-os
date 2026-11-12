// Indicadores do CRM: funil, ganhos e perfil de cliente ideal.
// Usado pela tela (server.mjs) e pelo resumo pra IA (painel.mjs), então os números batem nos dois.
import { ETAPAS, NOMES_ETAPAS, hoje } from './dados.mjs';

const FUNIL = ETAPAS.slice(1); // "pesquisado" ainda não foi abordado, fica fora das taxas
const MS_DIA = 86400000;

const dias = (de, ate) => Math.round((new Date(ate) - new Date(de)) / MS_DIA);
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const mesDe = (data) => String(data).slice(0, 7);

// Até que etapa o lead chegou (vale também pros perdidos).
export function alcancou(lead, etapa) {
  const alvo = ETAPAS.indexOf(etapa);
  if (lead[`data_${etapa}`]) return true;
  const atual = lead.etapa === 'perdido' ? lead.perdido_em_etapa : lead.etapa;
  return ETAPAS.indexOf(atual) >= alvo;
}

// Fechou = pagou a entrada.
export const fechou = (lead) => alcancou(lead, 'entrada');

export const receitaRecebida = (lead) =>
  lead.lancamentos.filter((l) => l.status === 'recebido').reduce((s, l) => s + l.valor, 0);

function ultimosMeses(n, ref) {
  const [a, m] = ref.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(a, m - 1 - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

function inicioSemana(data) {
  const d = new Date(`${data}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

// Agrupa os leads por uma propriedade e mede cada grupo.
function porGrupo(leads, chave) {
  const grupos = new Map();
  for (const lead of leads) {
    const valores = Array.isArray(lead[chave]) ? lead[chave] : [lead[chave]];
    for (const v of valores.filter(Boolean)) {
      const nome = String(v).trim().toLowerCase();
      if (!grupos.has(nome)) grupos.set(nome, []);
      grupos.get(nome).push(lead);
    }
  }
  return [...grupos].map(([nome, ls]) => {
    const abordados = ls.filter((l) => alcancou(l, 'contato'));
    const responderam = abordados.filter((l) => alcancou(l, 'conversa'));
    const fechados = abordados.filter(fechou);
    const receita = fechados.reduce((s, l) => s + receitaRecebida(l), 0);
    const ciclos = fechados.filter((l) => l.data_contato && l.data_entrada).map((l) => dias(l.data_contato, l.data_entrada));
    return {
      nome,
      leads: ls.length,
      abordados: abordados.length,
      responderam: responderam.length,
      fechados: fechados.length,
      taxaResposta: abordados.length ? responderam.length / abordados.length : null,
      taxaFechamento: abordados.length ? fechados.length / abordados.length : null,
      receita,
      ticket: fechados.length ? receita / fechados.length : null,
      diasAteFechar: media(ciclos),
    };
  }).sort((a, b) => b.fechados - a.fechados || b.receita - a.receita || b.abordados - a.abordados);
}

function melhor(grupos) {
  const comFechamento = grupos.filter((g) => g.fechados > 0);
  if (!comFechamento.length) return null;
  return [...comFechamento].sort((a, b) =>
    b.taxaFechamento - a.taxaFechamento || (b.ticket || 0) - (a.ticket || 0) || b.fechados - a.fechados)[0];
}

export function calcularIndicadores(leads, dataRef = hoje()) {
  const mesAtual = mesDe(dataRef);
  const ativos = leads.filter((l) => l.etapa !== 'perdido');

  // ----- funil -----
  const funil = FUNIL.map((etapa, i) => {
    const chegaram = leads.filter((l) => alcancou(l, etapa)).length;
    const anterior = i ? leads.filter((l) => alcancou(l, FUNIL[i - 1])).length : null;
    const tempos = i
      ? leads.filter((l) => l[`data_${FUNIL[i - 1]}`] && l[`data_${etapa}`])
          .map((l) => dias(l[`data_${FUNIL[i - 1]}`], l[`data_${etapa}`]))
      : [];
    return {
      etapa,
      nome: NOMES_ETAPAS[etapa],
      agora: leads.filter((l) => l.etapa === etapa).length,
      chegaram,
      conversao: anterior ? chegaram / anterior : null,
      diasDesdeAnterior: media(tempos),
    };
  });
  const porEtapa = Object.fromEntries([...ETAPAS, 'perdido'].map((e) => [e, leads.filter((l) => l.etapa === e).length]));

  const perdidos = leads.filter((l) => l.etapa === 'perdido');
  const motivosPerda = Object.entries(perdidos.reduce((acc, l) => {
    const m = (l.motivo_perda || 'sem motivo registrado').toLowerCase();
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {})).map(([motivo, total]) => ({ motivo, total })).sort((a, b) => b.total - a.total);

  const perdasPorEtapa = FUNIL.map((e) => ({
    etapa: NOMES_ETAPAS[e], total: perdidos.filter((l) => l.perdido_em_etapa === e).length,
  })).filter((x) => x.total);

  // ----- ganhos -----
  const lancamentos = leads.flatMap((l) => l.lancamentos.map((x) => ({ ...x, lead: l.id, nomeLead: l.nome })))
    .sort((a, b) => a.data.localeCompare(b.data));
  const recebidos = lancamentos.filter((l) => l.status === 'recebido');
  const soma = (xs) => xs.reduce((s, l) => s + l.valor, 0);

  const meses = ultimosMeses(12, dataRef);
  // Inclui meses futuros com valores a receber (parcelas e recorrência já combinadas).
  const futuros = [...new Set(lancamentos.filter((l) => l.status === 'a receber' && mesDe(l.data) > mesAtual).map((l) => mesDe(l.data)))].sort().slice(0, 6);
  const faturamentoMensal = [...meses, ...futuros].map((mes) => {
    const doMes = lancamentos.filter((l) => mesDe(l.data) === mes);
    return {
      mes,
      projeto: soma(doMes.filter((l) => l.status === 'recebido' && l.tipo === 'projeto')),
      recorrente: soma(doMes.filter((l) => l.status === 'recebido' && l.tipo === 'recorrente')),
      aReceber: soma(doMes.filter((l) => l.status === 'a receber')),
    };
  });

  const clientesComReceita = leads.filter((l) => receitaRecebida(l) > 0);
  const recebidoMes = soma(recebidos.filter((l) => mesDe(l.data) === mesAtual));
  const mesPassado = ultimosMeses(2, dataRef)[0];
  const recebidoMesPassado = soma(recebidos.filter((l) => mesDe(l.data) === mesPassado));

  const ganhos = {
    recebidoMes,
    recebidoMesPassado,
    recebidoTotal: soma(recebidos),
    aReceber: soma(lancamentos.filter((l) => l.status === 'a receber')),
    vencido: soma(lancamentos.filter((l) => l.status === 'a receber' && l.data < dataRef)),
    recorrenteMes: soma(lancamentos.filter((l) => l.tipo === 'recorrente' && mesDe(l.data) === mesAtual)),
    ticketMedio: clientesComReceita.length ? soma(recebidos) / clientesComReceita.length : null,
    clientesAtivos: leads.filter((l) => l.etapa === 'cliente').length,
    porServico: Object.entries(recebidos.reduce((acc, l) => {
      const s = (l.servico || 'outro').toLowerCase();
      acc[s] = (acc[s] || 0) + l.valor;
      return acc;
    }, {})).map(([servico, valor]) => ({ servico, valor })).sort((a, b) => b.valor - a.valor),
    porCliente: clientesComReceita.map((l) => ({ id: l.id, nome: l.nome, valor: receitaRecebida(l) }))
      .sort((a, b) => b.valor - a.valor),
    faturamentoMensal,
  };

  // ----- atividade (12 semanas) -----
  const semanas = [];
  const base = new Date(`${inicioSemana(dataRef)}T12:00:00`);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i * 7);
    semanas.push(d.toISOString().slice(0, 10));
  }
  const contar = (campo, semana) => leads.filter((l) => l[campo] && inicioSemana(l[campo]) === semana).length;
  const atividade = semanas.map((semana) => ({
    semana,
    contatos: contar('data_contato', semana),
    conversas: contar('data_conversa', semana),
    fechamentos: contar('data_entrada', semana),
  }));

  // ----- cliente ideal -----
  const grupos = {
    nicho: porGrupo(leads, 'nicho'),
    origem: porGrupo(leads, 'origem'),
    abordagem: porGrupo(leads, 'abordagem'),
    sinal: porGrupo(leads, 'sinal'),
    cidade: porGrupo(leads, 'cidade'),
    servicos: porGrupo(leads, 'servicos'),
  };
  const abordados = leads.filter((l) => alcancou(l, 'contato'));
  const fechados = abordados.filter(fechou);
  const ciclos = fechados.filter((l) => l.data_contato && l.data_entrada).map((l) => dias(l.data_contato, l.data_entrada));
  const perfilIdeal = {
    nicho: melhor(grupos.nicho),
    origem: melhor(grupos.origem),
    servico: melhor(grupos.servicos),
    amostra: abordados.length,
    taxaFechamento: abordados.length ? fechados.length / abordados.length : null,
    diasAteFechar: media(ciclos),
  };

  // ----- próximos toques -----
  const comToque = ativos.filter((l) => l.proximo_toque);
  const emSete = new Date(new Date(`${dataRef}T12:00:00`).getTime() + 7 * MS_DIA).toISOString().slice(0, 10);
  const resumoLead = (l) => ({ id: l.id, nome: l.nome, etapa: l.etapa, proximo_toque: l.proximo_toque, proximo_passo: l.proximo_passo || '' });
  const toques = {
    atrasados: comToque.filter((l) => l.proximo_toque < dataRef).map(resumoLead),
    hoje: comToque.filter((l) => l.proximo_toque === dataRef).map(resumoLead),
    semana: comToque.filter((l) => l.proximo_toque > dataRef && l.proximo_toque <= emSete).map(resumoLead),
  };
  for (const lista of Object.values(toques)) lista.sort((a, b) => a.proximo_toque.localeCompare(b.proximo_toque));

  const propostasAbertas = leads.filter((l) => l.etapa === 'proposta')
    .map((l) => ({ id: l.id, nome: l.nome, valor: Number(l.valor_proposta) || 0, desde: l.data_proposta }));

  return {
    dataRef,
    totais: { leads: leads.length, ativos: ativos.length, abordados: abordados.length, fechados: fechados.length },
    porEtapa,
    funil,
    motivosPerda,
    perdasPorEtapa,
    ganhos,
    atividade,
    grupos,
    perfilIdeal,
    toques,
    propostasAbertas,
    lancamentos,
  };
}
