#!/usr/bin/env node
// Gera a parte automática do _mapa.md: lista cada nota com título e descrição
// curta, e resume pastas de arquivos (PNG, HTML, CSV...) em uma linha.
// Uso: node scripts/gerar-mapa.js  (rodar da raiz do workspace ou de qualquer lugar)

const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const MAPA = path.join(RAIZ, "_mapa.md");
const INICIO = "<!-- mapa:auto:inicio -->";
const FIM = "<!-- mapa:auto:fim -->";

// Pastas que não entram no mapa (config de ferramenta, não conteúdo)
const IGNORAR = new Set([".git", ".obsidian", ".copilot", "copilot", "node_modules", ".vscode", "dist", "build", ".next", "coverage", "test-results"]);
// Dentro de .claude, só as skills interessam
const CLAUDE_PERMITIDO = "skills";
// Pastas de referência: entram como uma linha só por subpasta
const RESUMIR = new Set(["templates"]);

const LIMITE_DESC = 110;

function lerDescricao(arquivo) {
  const texto = fs.readFileSync(arquivo, "utf8").replace(/^﻿/, "");
  const linhas = texto.split(/\r?\n/);
  let titulo = "";
  let desc = "";
  let i = 0;

  // Frontmatter: description (skills) ou status/servicos (briefings de cliente)
  if (linhas[0] === "---") {
    const campos = {};
    let j = 1;
    for (; j < linhas.length && linhas[j] !== "---"; j++) {
      const m = linhas[j].match(/^(\w+):\s*(.*)$/);
      if (!m) continue;
      let partes = [m[2].replace(/^[>|]-?\s*$/, "")];
      for (let k = j + 1; k < linhas.length && /^\s+\S/.test(linhas[k]); k++) partes.push(linhas[k].trim());
      campos[m[1]] = partes.join(" ").trim();
    }
    if (campos.description) desc = campos.description;
    else if (campos.status || campos.servicos) {
      desc = [campos.status && `status: ${campos.status}`, campos.servicos && `serviços: ${campos.servicos.replace(/[\[\]]/g, "")}`]
        .filter(Boolean).join(" · ");
    }
    i = j + 1;
  }

  for (; i < linhas.length; i++) {
    const l = linhas[i].trim();
    if (!titulo && l.startsWith("# ")) { titulo = l.slice(2).trim(); continue; }
    // Linhas que são só navegação ([[links]]) não descrevem a nota
    if (!desc && l.startsWith(">") && !l.includes("[[")) desc = l.replace(/^>\s*/, "");
    if (!desc && titulo && l && !/^[#>\-|*]/.test(l)) desc = l;
    if (titulo && desc) break;
  }

  desc = desc.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, alvo, rotulo) => rotulo || alvo);
  const frase = desc.match(/^.*?[.!?](\s|$)/);
  if (frase && frase[0].length > 20) desc = frase[0].trim();
  if (desc.length > LIMITE_DESC) desc = desc.slice(0, LIMITE_DESC - 1).trimEnd() + "…";
  return { titulo, desc };
}

function listarArquivos(dir, prefixo = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listarArquivos(path.join(dir, e.name), `${prefixo}${e.name}/`) : [`${prefixo}${e.name}`]
  );
}

function varrer(dir, rel, saida) {
  let entradas;
  try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  entradas.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const outros = [];
  for (const e of entradas) {
    const caminhoRel = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (IGNORAR.has(e.name)) continue;
      if (rel === ".claude" && e.name !== CLAUDE_PERMITIDO) continue;
      if (RESUMIR.has(rel)) {
        const todos = listarArquivos(path.join(dir, e.name));
        saida.push({ tipo: "arquivos", caminho: `${caminhoRel}/`, desc: todos.join(", ") });
        continue;
      }
      varrer(path.join(dir, e.name), caminhoRel, saida);
    } else if (e.name.endsWith(".md")) {
      if (caminhoRel === "_mapa.md") continue;
      saida.push({ tipo: "nota", caminho: caminhoRel, ...lerDescricao(path.join(dir, e.name)) });
    } else if (rel && !e.name.startsWith(".")) {
      outros.push(e.name);
    }
  }

  if (outros.length) {
    const exts = [...new Set(outros.map((n) => path.extname(n).slice(1).toLowerCase() || "sem extensão"))];
    const lista = outros.length <= 3 ? outros.join(", ") : `${outros.length} arquivos (${exts.join(", ")})`;
    saida.push({ tipo: "arquivos", caminho: `${rel}/`, desc: lista });
  }
}

function montar(itens) {
  const grupos = new Map();
  for (const it of itens) {
    const topo = it.caminho.includes("/") ? it.caminho.split("/")[0] + "/" : "(raiz)";
    if (!grupos.has(topo)) grupos.set(topo, []);
    grupos.get(topo).push(it);
  }

  // Raiz e memória primeiro, skills por último
  const peso = (t) => (t === "(raiz)" ? 0 : t === "_memoria/" ? 1 : t === ".claude/" ? 9 : 5);
  const ordenados = [...grupos].sort((a, b) => peso(a[0]) - peso(b[0]));

  const out = [];
  for (const [topo, lista] of ordenados) {
    out.push(`### ${topo === ".claude/" ? "skills (.claude/skills/)" : topo}`);
    for (const it of lista) {
      if (it.tipo === "arquivos") {
        out.push(`- \`${it.caminho}\` — ${it.desc}`);
      } else if (it.caminho.startsWith(".claude/skills/")) {
        const nome = it.caminho.split("/")[2];
        out.push(`- \`/${nome}\` — ${it.desc}`);
      } else {
        const texto = [it.titulo, it.desc].filter(Boolean).join(": ");
        out.push(`- \`${it.caminho}\`${texto ? " — " + texto : ""}`);
      }
    }
    out.push("");
  }
  return out.join("\n").trimEnd();
}

const itens = [];
varrer(RAIZ, "", itens);

const hoje = new Date().toISOString().slice(0, 10);
const auto = `${INICIO}\n## Arquivos (gerado em ${hoje} por \`node scripts/gerar-mapa.js\`)\n\n${montar(itens)}\n${FIM}`;

let manual = "# Mapa do workspace\n\n";
if (fs.existsSync(MAPA)) {
  const atual = fs.readFileSync(MAPA, "utf8");
  const pos = atual.indexOf(INICIO);
  manual = pos >= 0 ? atual.slice(0, pos) : atual.trimEnd() + "\n\n";
}

fs.writeFileSync(MAPA, manual + auto + "\n", "utf8");
console.log(`_mapa.md atualizado: ${itens.length} entradas.`);
