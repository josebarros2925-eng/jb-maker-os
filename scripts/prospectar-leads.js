#!/usr/bin/env node
// Busca empresas de um nicho numa região (Google Places),
// audita o site de cada uma (velocidade, celular, SEO básico, tags de Google Ads,
// Pixel da Meta, WhatsApp) e, quando o CNPJ aparece no site, puxa os dados da
// Receita pela BrasilAPI (razão social, situação, telefone, e-mail, sócios).
// Uso: node scripts/prospectar-leads.js "marcenaria" "Campinas SP" [--max 20] [--saida arquivo.json]
//      node scripts/prospectar-leads.js --cnpj 12345678000190   (só a consulta do CNPJ)
//      node scripts/prospectar-leads.js --site https://exemplo.com.br   (só a auditoria do site)
//      node scripts/prospectar-leads.js --dominio exemplo.com.br   (titular do domínio no Registro.br)

const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
// Funções de site, CNPJ e domínio (scripts/lib/site.js)
const { acharCnpj, consultarCnpj, tipoDeLink, titularDominio } = require("./lib/site");
const ARQUIVO_CHAVE = path.join(RAIZ, ".env", "google-places.txt");
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";

function lerChave() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY.trim();
  if (!fs.existsSync(ARQUIVO_CHAVE)) throw new Error("Chave do Google Places não encontrada (GOOGLE_PLACES_API_KEY ou .env/google-places.txt).");
  const m = fs.readFileSync(ARQUIVO_CHAVE, "utf8").trim().match(/^(?:GOOGLE_PLACES_API_KEY\s*=\s*)?(\S+)$/);
  if (!m) throw new Error("Formato inesperado em .env/google-places.txt.");
  return m[1];
}

async function buscarEmpresas(nicho, regiao, max) {
  const chave = lerChave();
  const empresas = [];
  let pageToken;
  while (empresas.length < max) {
    const body = { textQuery: `${nicho} em ${regiao}`, languageCode: "pt-BR", regionCode: "BR", pageSize: Math.min(20, max - empresas.length) };
    if (pageToken) body.pageToken = pageToken;
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": chave,
        "X-Goog-FieldMask": [
          "places.displayName", "places.formattedAddress", "places.nationalPhoneNumber", "places.websiteUri",
          "places.googleMapsUri", "places.businessStatus", "places.primaryTypeDisplayName", "places.rating",
          "places.userRatingCount", "places.regularOpeningHours.weekdayDescriptions", "nextPageToken",
        ].join(","),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Google Places: ${data.error?.message || "HTTP " + res.status}`);
    for (const p of data.places || []) {
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      empresas.push({
        nome: p.displayName?.text || "",
        tipo: p.primaryTypeDisplayName?.text || "",
        endereco: p.formattedAddress || "",
        telefone: p.nationalPhoneNumber || "",
        site: p.websiteUri || "",
        maps: p.googleMapsUri || "",
        nota: p.rating ?? null,
        avaliacoes: p.userRatingCount ?? 0,
        horarioCadastrado: Boolean(p.regularOpeningHours?.weekdayDescriptions?.length),
      });
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return empresas.slice(0, max);
}

async function auditarSite(url) {
  const r = { url, tipoLink: tipoDeLink(url), ok: false };
  if (r.tipoLink !== "site") return r;
  const inicio = Date.now();
  let res, html;
  try {
    res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    html = await res.text();
  } catch (e) {
    r.erro = e.name === "TimeoutError" ? "não carregou em 20s" : "fora do ar ou com erro de conexão";
    return r;
  }
  const h = html.toLowerCase();
  const titulo = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || "";
  const descricao = (html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i) || [])[1] || "";
  const anos = [...html.matchAll(/(?:©|&copy;|copyright)\D{0,20}((?:19|20)\d{2})/gi)].map((m) => Number(m[1]));
  Object.assign(r, {
    ok: res.ok,
    status: res.status,
    urlFinal: res.url,
    https: res.url.startsWith("https://"),
    tempoMs: Date.now() - inicio,
    tamanhoKb: Math.round(Buffer.byteLength(html) / 1024),
    responsivo: /<meta[^>]+name=["']viewport["']/i.test(html),
    titulo,
    temDescricao: Boolean(descricao.trim()),
    h1: (h.match(/<h1[\s>]/g) || []).length,
    plataforma:
      /wix\.com|wixstatic/.test(h) ? "Wix" :
      /wp-content|wordpress/.test(h) ? "WordPress" :
      /cdn\.shopify|shopify/.test(h) ? "Shopify" :
      /squarespace/.test(h) ? "Squarespace" :
      /nuvemshop|lojaintegrada|tray\.com/.test(h) ? "Loja virtual (Nuvemshop/Tray/Loja Integrada)" : "",
    googleAds: /aw-\d{6,}|googleadservices\.com|google_conversion_id/i.test(html),
    googleAnalytics: /g-[a-z0-9]{6,}|ua-\d{4,}-\d|googletagmanager\.com\/gtag/i.test(html),
    tagManager: /gtm-[a-z0-9]{4,}/i.test(html),
    pixelMeta: /connect\.facebook\.net\/[^"']*fbevents|fbq\(\s*['"]init/i.test(html),
    linkWhatsapp: /wa\.me\/|whatsapp/i.test(html),
    formulario: /<form[\s>]/i.test(html),
    instagram: (html.match(/instagram\.com\/([a-z0-9_.]{2,30})/i) || [])[1] || "",
    emails: [...new Set((html.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).filter((e) => !/\.(png|jpg|webp|svg)$|sentry|example|wixpress/i.test(e)))].slice(0, 3),
    anoCopyright: anos.length ? Math.max(...anos) : null,
    cnpj: acharCnpj(html),
  });
  return r;
}

async function emLotes(itens, tamanho, fn) {
  const saida = [];
  for (let i = 0; i < itens.length; i += tamanho) saida.push(...(await Promise.all(itens.slice(i, i + tamanho).map(fn))));
  return saida;
}

async function main() {
  const args = process.argv.slice(2);
  const opcao = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const cnpj = opcao("--cnpj");
  const site = opcao("--site");
  const dominio = opcao("--dominio");
  const max = Number(opcao("--max") || 20);
  const saida = opcao("--saida");

  let resultado;
  if (cnpj) resultado = await consultarCnpj(cnpj);
  else if (site) resultado = await auditarSite(site);
  else if (dominio) resultado = await titularDominio(dominio.includes("://") ? dominio : `https://${dominio}`);
  else {
    const [nicho, regiao] = args;
    if (!nicho || !regiao) {
      console.error('Uso: node scripts/prospectar-leads.js "<nicho>" "<cidade UF>" [--max 20] [--saida arquivo.json]');
      process.exit(1);
    }
    const empresas = await buscarEmpresas(nicho, regiao, max);
    resultado = await emLotes(empresas, 5, async (e) => {
      if (e.site) e.auditoria = await auditarSite(e.site);
      return e;
    });
    for (const e of resultado) {
      if (e.auditoria?.tipoLink === "site") e.dominio = await titularDominio(e.site);
      if (e.auditoria && !e.auditoria.cnpj && e.dominio?.cnpj) e.auditoria.cnpj = e.dominio.cnpj;
      if (e.auditoria?.cnpj) e.receita = await consultarCnpj(e.auditoria.cnpj).catch((err) => ({ erro: err.message }));
    }
    resultado = { nicho, regiao, geradoEm: new Date().toISOString(), total: resultado.length, empresas: resultado };
  }

  const json = JSON.stringify(resultado, null, 2);
  if (saida) {
    fs.mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
    fs.writeFileSync(saida, json);
    console.log(`Salvo em ${saida}`);
  } else console.log(json);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
