// Gera crm/Painel CRM.md: o resumo do CRM que a IA lê antes de abrir as fichas.
// Roda sozinho a cada mudança feita pela tela. Depois de editar uma ficha à mão: `node crm/app/painel.mjs`.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listarLeads, PASTA_CRM, NOMES_ETAPAS } from './lib/dados.mjs';
import { calcularIndicadores } from './lib/indicadores.mjs';

export const ARQUIVO_PAINEL = path.join(PASTA_CRM, 'Painel CRM.md');

const real = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v) => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`);
const num = (v) => (v === null || v === undefined ? '—' : String(Math.round(v)));
const data = (d) => (d ? d.split('-').reverse().join('/') : '—');
const celula = (t) => String(t ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
// Dentro de tabela o "|" do link precisa de escape.
const link = (l, tabela = false) => `[[crm/dados/leads/${l.id}${tabela ? '\\|' : '|'}${celula(l.nome)}]]`;

function tabelaGrupo(titulo, grupos) {
  const linhas = grupos.filter((g) => g.abordados > 0);
  if (!linhas.length) return `### ${titulo}\nSem leads abordados ainda.\n`;
  return [
    `### ${titulo}`,
    '| Grupo | Abordados | Responderam | Fecharam | Taxa de fechamento | Receita | Ticket médio | Dias até fechar |',
    '|---|---|---|---|---|---|---|---|',
    ...linhas.map((g) => `| ${celula(g.nome)} | ${g.abordados} | ${g.responderam} (${pct(g.taxaResposta)}) | ${g.fechados} | ${pct(g.taxaFechamento)} | ${real(g.receita)} | ${g.ticket ? real(g.ticket) : '—'} | ${num(g.diasAteFechar)} |`),
    '',
  ].join('\n');
}

export function montarPainel(leads, ind) {
  const g = ind.ganhos;
  const p = ind.perfilIdeal;
  const t = ind.toques;
  const linhaToque = (x) => `- ${data(x.proximo_toque)} · ${link(x)} (${NOMES_ETAPAS[x.etapa]})${x.proximo_passo ? `: ${x.proximo_passo}` : ''}`;
  const ativosPorEtapa = Object.keys(NOMES_ETAPAS).map((etapa) => {
    const ls = leads.filter((l) => l.etapa === etapa);
    if (!ls.length) return null;
    return `| ${NOMES_ETAPAS[etapa]} | ${ls.length} | ${ls.map((l) => link(l, true)).join(', ')} |`;
  }).filter(Boolean);

  const perfil = p.nicho
    ? `Nicho **${p.nicho.nome}** (${pct(p.nicho.taxaFechamento)} de fechamento, ticket ${p.nicho.ticket ? real(p.nicho.ticket) : '—'})`
      + (p.origem ? `, vindo de **${p.origem.nome}**` : '')
      + (p.servico ? `, comprando **${p.servico.nome}**` : '')
      + `. Base: ${p.amostra} leads abordados${p.amostra < 10 ? ' (amostra pequena, tratar como pista)' : ''}.`
    : 'Ainda sem fechamento registrado com nicho e origem preenchidos.';

  return `---
tipo: crm-painel
gerado_em: ${ind.dataRef}
---
# Painel CRM

> Gerado automaticamente pelo CRM (\`crm/app/painel.mjs\`) em ${data(ind.dataRef)}. **Não editar à mão:** a próxima mudança sobrescreve.
> Fichas completas em \`crm/dados/leads/\`. Formato e regras em [[crm/CLAUDE|CRM — instruções]]. Abrir a tela: \`crm/Abrir CRM.bat\` (http://localhost:4317).

## Resumo
- **Recebido no mês:** ${real(g.recebidoMes)} (mês passado: ${real(g.recebidoMesPassado)})
- **A receber:** ${real(g.aReceber)}${g.vencido ? ` · **vencido:** ${real(g.vencido)}` : ''}
- **Recorrente no mês:** ${real(g.recorrenteMes)}
- **Recebido no total:** ${real(g.recebidoTotal)} · **ticket médio por cliente:** ${g.ticketMedio ? real(g.ticketMedio) : '—'}
- **Clientes ativos:** ${g.clientesAtivos} · **leads em aberto:** ${ind.totais.ativos - g.clientesAtivos} · **taxa de fechamento:** ${pct(p.taxaFechamento)} (${ind.totais.fechados} de ${ind.totais.abordados} abordados)

## Cliente ideal até agora
${perfil}

## Cobrar
${t.atrasados.length ? `**Atrasados**\n${t.atrasados.map(linhaToque).join('\n')}\n` : ''}${t.hoje.length ? `**Hoje**\n${t.hoje.map(linhaToque).join('\n')}\n` : ''}${t.semana.length ? `**Próximos 7 dias**\n${t.semana.map(linhaToque).join('\n')}\n` : ''}${!t.atrasados.length && !t.hoje.length && !t.semana.length ? 'Nenhum toque marcado pros próximos 7 dias.\n' : ''}
## Funil agora
| Etapa | Qtde | Quem |
|---|---|---|
${ativosPorEtapa.join('\n')}

## Conversão por etapa
| Etapa | Chegaram | Conversão da anterior | Dias desde a anterior |
|---|---|---|---|
${ind.funil.map((f) => `| ${f.nome} | ${f.chegaram} | ${pct(f.conversao)} | ${num(f.diasDesdeAnterior)} |`).join('\n')}

${ind.motivosPerda.length ? `**Motivos de perda:** ${ind.motivosPerda.map((m) => `${m.motivo} (${m.total})`).join(', ')}\n` : ''}${ind.perdasPorEtapa.length ? `**Onde perdeu:** ${ind.perdasPorEtapa.map((m) => `${m.etapa} (${m.total})`).join(', ')}\n` : ''}
## Propostas abertas
${ind.propostasAbertas.length ? ind.propostasAbertas.map((x) => `- ${link(x)}: ${x.valor ? real(x.valor) : 'valor não registrado'}, desde ${data(x.desde)}`).join('\n') : 'Nenhuma.'}

## Ganhos por mês
| Mês | Projeto | Recorrente | A receber |
|---|---|---|---|
${g.faturamentoMensal.filter((m) => m.projeto || m.recorrente || m.aReceber).map((m) => `| ${m.mes.split('-').reverse().join('/')} | ${real(m.projeto)} | ${real(m.recorrente)} | ${real(m.aReceber)} |`).join('\n') || '| — | — | — | — |'}

**Por serviço:** ${g.porServico.map((s) => `${s.servico} ${real(s.valor)}`).join(' · ') || '—'}
**Por cliente:** ${g.porCliente.map((c) => `${link(c)} ${real(c.valor)}`).join(' · ') || '—'}

## Quem compra (cliente ideal)
${tabelaGrupo('Por nicho', ind.grupos.nicho)}
${tabelaGrupo('Por origem', ind.grupos.origem)}
${tabelaGrupo('Por abordagem ', ind.grupos.abordagem)}
${tabelaGrupo('Por sinal de momento', ind.grupos.sinal)}
${tabelaGrupo('Por cidade', ind.grupos.cidade)}
${tabelaGrupo('Por serviço', ind.grupos.servicos)}`;
}

export async function gerarPainel() {
  const leads = await listarLeads();
  const ind = calcularIndicadores(leads);
  await fs.writeFile(ARQUIVO_PAINEL, montarPainel(leads, ind), 'utf8');
  return ind;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await gerarPainel();
  console.log(`Painel atualizado: ${ARQUIVO_PAINEL}`);
}
