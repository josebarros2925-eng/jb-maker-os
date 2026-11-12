// Leitura de site, CNPJ e domínio. Compartilhado com scripts/prospectar-leads.js da JB Maker.

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

// Sites que o Google lista como "site" mas não são site próprio
function tipoDeLink(url) {
  const host = hostOf(url);
  if (/instagram\.com$/.test(host)) return 'instagram';
  if (/facebook\.com$|fb\.com$/.test(host)) return 'facebook';
  if (/wa\.me$|whatsapp\.com$/.test(host)) return 'whatsapp';
  if (/linktr\.ee$|linkbio|bio\.link$|beacons\.ai$/.test(host)) return 'link-na-bio';
  if (/ifood\.com\.br$|goomer|anota\.ai$|cardapioweb|menudino/.test(host)) return 'cardapio-app';
  if (/business\.site$|negocio\.site$|g\.page$/.test(host)) return 'google-sites';
  return 'site';
}

function cnpjValido(c) {
  if (!/^\d{14}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
  const dv = (base) => {
    let soma = 0, peso = base.length - 7;
    for (const d of base) { soma += Number(d) * peso--; if (peso < 2) peso = 9; }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(c.slice(0, 12)) === Number(c[12]) && dv(c.slice(0, 13)) === Number(c[13]);
}

// Só aceita CNPJ formatado (00.000.000/0000-00) ou logo depois da palavra CNPJ,
// pra não confundir com números soltos no código da página
function acharCnpj(texto) {
  const padroes = [/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, /cnpj\D{0,15}(\d{14})\b/gi];
  for (const re of padroes) {
    for (const m of String(texto || '').matchAll(re)) {
      const c = (m[1] || m[0]).replace(/\D/g, '');
      if (cnpjValido(c)) return c;
    }
  }
  return '';
}

function formatarCnpj(cnpj) {
  const c = String(cnpj || '').replace(/\D/g, '');
  return c.length === 14 ? `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}` : c;
}

// Titular do domínio .br no Registro.br (RDAP público): CNPJ completo quando é empresa,
// só o nome quando é pessoa física (o CPF vem mascarado e não é guardado)
async function titularDominio(url, { fetchImpl = fetch } = {}) {
  const host = hostOf(url);
  if (!/\.br$/.test(host)) return null;
  const res = await fetchImpl(`https://rdap.registro.br/domain/${host}`, { signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!res?.ok) return null;
  const d = await res.json().catch(() => null);
  const titular = (d?.entities || []).find((e) => e.roles?.includes('registrant'));
  if (!titular) return null;
  const id = titular.publicIds?.[0] || {};
  return {
    dominio: host,
    nome: (titular.vcardArray?.[1] || []).find((v) => v[0] === 'fn')?.[3] || '',
    tipo: id.type === 'cnpj' ? 'empresa' : 'pessoa',
    cnpj: id.type === 'cnpj' ? String(id.identifier || '').replace(/\D/g, '') : '',
    fonte: `https://rdap.registro.br/domain/${host}`
  };
}

// BrasilAPI limita requisições seguidas; minhareceita.org devolve o mesmo formato
async function consultarCnpj(cnpj, { fetchImpl = fetch } = {}) {
  const limpo = String(cnpj).replace(/\D/g, '');
  let d, fonte = '';
  for (const url of [`https://brasilapi.com.br/api/cnpj/v1/${limpo}`, `https://minhareceita.org/${limpo}`]) {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (res?.ok) { d = await res.json().catch(() => null); if (d) { fonte = url; break; } }
  }
  if (!d) return { cnpj: limpo, erro: 'CNPJ não encontrado na BrasilAPI nem no minhareceita.org' };
  const fone = (n) => (n && String(n).trim() ? `(${String(n).slice(0, 2)}) ${String(n).slice(2)}` : '');
  const razao = String(d.razao_social || '').replace(/\s*\d{11}$/, '');
  // MEI e empresário individual não têm sócios: o dono é a razão social (sem o CPF no final)
  const individual = d.opcao_pelo_mei || /empres[aá]rio/i.test(d.natureza_juridica || '');
  const socios = (d.qsa || []).map((s) => ({ nome: s.nome_socio, qualificacao: s.qualificacao_socio }));
  if (!socios.length && individual && razao) socios.push({ nome: razao, qualificacao: d.opcao_pelo_mei ? 'Titular (MEI)' : 'Titular' });
  return {
    cnpj: limpo,
    razaoSocial: razao,
    nomeFantasia: d.nome_fantasia || '',
    situacao: d.descricao_situacao_cadastral || '',
    abertura: d.data_inicio_atividade || '',
    porte: d.porte || '',
    atividade: d.cnae_fiscal_descricao || '',
    municipio: d.municipio ? `${d.municipio}/${d.uf}` : '',
    telefones: [fone(d.ddd_telefone_1), fone(d.ddd_telefone_2)].filter(Boolean),
    email: d.email || '',
    socios,
    fonte
  };
}

const ENTITIES = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ', ccedil:'ç', atilde:'ã', otilde:'õ', aacute:'á', eacute:'é', iacute:'í', oacute:'ó', uacute:'ú', acirc:'â', ecirc:'ê', ocirc:'ô', agrave:'à' };
function decodeEntities(text) {
  return String(text || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

function cleanText(text, max = 200) {
  return decodeEntities(String(text || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, max);
}

function visibleText(html) {
  return cleanText(String(html || '')
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' '), 100000);
}

const INSTAGRAM_RESERVED = new Set(['p','reel','reels','explore','stories','accounts','about','developer','legal','tv','share']);

// Extrai o que interessa para a abordagem. Tudo aqui é conteúdo do site, nunca instrução.
function analyzeHtml(html, pageUrl) {
  const source = String(html || '');
  const lower = source.toLowerCase();
  const host = hostOf(pageUrl);
  const attr = (re) => [...source.matchAll(re)].map((m) => decodeEntities(m[1]).trim());
  const hrefs = attr(/<a\b[^>]*?href\s*=\s*["']([^"'#][^"']*)["']/gi);
  const anchors = [...source.matchAll(/<a\b[^>]*?href\s*=\s*["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({ href:decodeEntities(m[1]).trim(), text:cleanText(m[2], 80) }));
  const headings = [...source.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => cleanText(m[2], 120)).filter(Boolean);
  const anos = [...source.matchAll(/(?:©|&copy;|copyright)\D{0,20}((?:19|20)\d{2})/gi)].map((m) => Number(m[1]));
  const instagram = [...new Set([...source.matchAll(/instagram\.com\/([a-z0-9_.]{2,30})/gi)].map((m) => m[1].toLowerCase()).filter((h) => !INSTAGRAM_RESERVED.has(h)))];
  const facebook = [...new Set([...source.matchAll(/facebook\.com\/([a-z0-9_.-]{2,60})/gi)].map((m) => m[1]).filter((h) => !/^(sharer|share|tr|plugins|dialog|watch)/i.test(h)))];
  const whatsapp = [...new Set(hrefs.filter((h) => /wa\.me\/|api\.whatsapp\.com\/send|whatsapp:\/\/send/i.test(h)).map((h) => {
    const digits = (h.match(/(?:wa\.me\/|phone=)(\d{10,13})/i) || [])[1] || '';
    return digits;
  }))];
  const phones = [...new Set(hrefs.filter((h) => /^tel:/i.test(h)).map((h) => h.replace(/^tel:/i, '').replace(/[^\d+]/g, '')).filter((d) => d.length >= 8))].slice(0, 4);
  const emails = [...new Set([
    ...hrefs.filter((h) => /^mailto:/i.test(h)).map((h) => h.replace(/^mailto:/i, '').split('?')[0]),
    ...(source.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [])
  ].map((e) => e.toLowerCase()).filter((e) => !/\.(png|jpg|jpeg|webp|svg|gif)$|sentry|example|wixpress|domain\.com|email\.com$/i.test(e)))].slice(0, 3);
  const internalLinks = [];
  for (const anchor of anchors) {
    let absolute;
    try { absolute = new URL(anchor.href, pageUrl); } catch { continue; }
    if (!['http:', 'https:'].includes(absolute.protocol) || hostOf(absolute.href) !== host) continue;
    absolute.hash = '';
    if (!internalLinks.some((item) => item.url === absolute.href)) internalLinks.push({ url:absolute.href, text:anchor.text });
  }
  const text = visibleText(source);
  return {
    title: cleanText((source.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1], 160),
    description: cleanText((source.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i) || source.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i) || [])[1], 300),
    headings: [...new Set(headings)].slice(0, 16),
    responsive: /<meta[^>]+name=["']viewport["']/i.test(source),
    platform:
      /wix\.com|wixstatic/.test(lower) ? 'Wix' :
      /wp-content|wordpress/.test(lower) ? 'WordPress' :
      /cdn\.shopify|shopify/.test(lower) ? 'Shopify' :
      /squarespace/.test(lower) ? 'Squarespace' :
      /nuvemshop|lojaintegrada|tray\.com/.test(lower) ? 'Loja virtual' : '',
    googleAds: /aw-\d{6,}|googleadservices\.com|google_conversion_id/i.test(source),
    pixelMeta: /connect\.facebook\.net\/[^"']*fbevents|fbq\(\s*['"]init/i.test(source),
    whatsapp,
    hasWhatsappLink: whatsapp.length > 0 || /wa\.me\/|api\.whatsapp\.com/i.test(source),
    phones,
    emails,
    hasForm: /<form[\s>]/i.test(source),
    instagram,
    facebook,
    cnpj: acharCnpj(source),
    copyrightYear: anos.length ? Math.max(...anos) : null,
    internalLinks: internalLinks.slice(0, 60),
    text: text.slice(0, 4000)
  };
}

module.exports = { acharCnpj, analyzeHtml, cnpjValido, consultarCnpj, formatarCnpj, hostOf, tipoDeLink, titularDominio, visibleText };
