// ── Estado global ──────────────────────────
let contatos = [];
let templates = [];
let templateAtivoId = null;
let agendadoTemplates = [];

// ── Navegação ──────────────────────────────
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    item.classList.add("active");
    document.getElementById("page-" + item.dataset.page).classList.add("active");
    carregarDadosPagina(item.dataset.page);
  });
});

function carregarDadosPagina(page) {
  if (page === "dashboard") carregarDashboard();
  if (page === "contatos") carregarContatos();
  if (page === "templates") carregarTemplates();
  if (page === "disparar") { carregarContatos(); carregarTemplatesSelect(); }
  if (page === "whatsapp") carregarWhatsappHistorico();
  if (page === "agendar") { carregarTemplatesSelect("ag-template"); carregarAgendados(); }
  if (page === "followup") carregarFollowup();
  if (page === "blacklist") carregarBlacklist();
  if (page === "campanhas") carregarCampanhas();
  if (page === "historico") carregarHistorico();
}

// ── Toast ──────────────────────────────────
function toast(msg, tipo = "") {
  const wrap = document.getElementById("toast-wrap");
  const el = document.createElement("div");
  el.className = "toast " + tipo;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Dashboard ──────────────────────────────
async function carregarDashboard() {
  const stats = await fetch("/api/stats").then(r => r.json());
  document.getElementById("stat-grid").innerHTML = `
    <div class="stat-card"><div class="val">${stats.contatos}</div><div class="lbl">Contatos</div></div>
    <div class="stat-card"><div class="val">${stats.enviados}</div><div class="lbl">E-mails enviados</div></div>
    <div class="stat-card"><div class="val">${stats.aberturas}</div><div class="lbl">Aberturas rastreadas</div></div>
    <div class="stat-card"><div class="val">${stats.taxa_abertura}%</div><div class="lbl">Taxa de abertura</div></div>
    <div class="stat-card"><div class="val">${stats.campanhas}</div><div class="lbl">Campanhas</div></div>
    <div class="stat-card"><div class="val">${stats.blacklist}</div><div class="lbl">Blacklist</div></div>
  `;

  const camps = await fetch("/api/campanhas").then(r => r.json());
  const tbody = document.getElementById("tbl-dash-campanhas").querySelector("tbody");
  if (camps.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Nenhuma campanha ainda</td></tr>`;
  } else {
    tbody.innerHTML = camps.slice(0, 8).map(c => {
      const taxa = c.total > 0 ? Math.round(c.enviados / c.total * 100) : 0;
      return `<tr><td>${c.nome}</td><td>${c.template}</td><td>${c.data}</td><td>${c.enviados}/${c.total}</td><td><span class="badge badge-gold">${taxa}%</span></td></tr>`;
    }).join("");
  }
}

// ── Contatos ───────────────────────────────
async function carregarContatos() {
  contatos = await fetch("/api/contatos").then(r => r.json());
  document.getElementById("total-contatos").textContent = contatos.length;
  const tbody = document.getElementById("tbl-contatos");
  if (!tbody) return;
  if (contatos.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Nenhum contato cadastrado ainda</td></tr>`;
    return;
  }
  tbody.innerHTML = contatos.map(c => `
    <tr>
      <td>${c.nome}</td><td>${c.email}</td><td>${c.empresa}</td>
      <td><span class="badge ${c.tipo === 'clinica' ? 'badge-blue' : 'badge-gold'}">${c.tipo === 'clinica' ? 'Clínica' : 'Escritório'}</span></td>
      <td>${c.whatsapp || '—'}</td>
      <td><button class="btn btn-sm btn-danger" onclick="delContato('${c.id}')"><i class="ti ti-trash"></i></button></td>
    </tr>
  `).join("");
}

async function addContato() {
  const nome = document.getElementById("c-nome").value.trim();
  const email = document.getElementById("c-email").value.trim();
  const empresa = document.getElementById("c-empresa").value.trim();
  const tipo = document.getElementById("c-tipo").value;
  const whatsapp = document.getElementById("c-whatsapp").value.trim();
  if (!nome || !email || !empresa) { toast("Preencha nome, e-mail e empresa", "error"); return; }
  const r = await fetch("/api/contatos", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({nome,email,empresa,tipo,whatsapp}) }).then(r => r.json());
  if (r.ok) {
    ["c-nome","c-email","c-empresa","c-whatsapp"].forEach(id => document.getElementById(id).value = "");
    toast("Contato adicionado!", "success");
    carregarContatos();
  }
}

async function delContato(id) {
  await fetch("/api/contatos/" + id, { method: "DELETE" });
  carregarContatos();
}

async function limparContatos() {
  if (!confirm("Remover TODOS os contatos?")) return;
  await fetch("/api/contatos/limpar", { method: "POST" });
  carregarContatos();
}

async function importarArquivo() {
  const file = document.getElementById("file-importar").files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("arquivo", file);
  document.getElementById("import-status").textContent = "Importando...";
  const r = await fetch("/api/contatos/importar", { method: "POST", body: fd }).then(r => r.json());
  if (r.ok) {
    document.getElementById("import-status").textContent = `${r.adicionados} contatos importados com sucesso!`;
    toast(`${r.adicionados} contatos importados`, "success");
    carregarContatos();
  } else {
    document.getElementById("import-status").textContent = "Erro: " + (r.erro || "falha ao importar");
    toast("Erro ao importar arquivo", "error");
  }
}

// ── Templates ──────────────────────────────
async function carregarTemplates() {
  templates = await fetch("/api/templates").then(r => r.json());
  const list = document.getElementById("tmpl-list");
  list.innerHTML = templates.map(t => `
    <div class="tmpl-item ${t.id === templateAtivoId ? 'active' : ''}" onclick="selecionarTemplate(${t.id})">
      <i class="ti ${t.tipo === 'clinica' ? 'ti-building-hospital' : 'ti-building'}"></i>
      <span>${t.nome}</span>
    </div>
  `).join("");
  if (templates.length && templateAtivoId === null) selecionarTemplate(templates[0].id);
}

function selecionarTemplate(id) {
  templateAtivoId = id;
  const t = templates.find(x => x.id === id);
  if (!t) return;
  document.getElementById("t-nome").value = t.nome;
  document.getElementById("t-tipo").value = t.tipo;
  document.getElementById("t-assunto").value = t.assunto;
  document.getElementById("t-corpo").value = t.corpo;
  document.querySelectorAll(".tmpl-item").forEach(el => el.classList.remove("active"));
  carregarTemplates();
}

async function novoTemplate() {
  const r = await fetch("/api/templates", { method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({nome: "Novo template", tipo: "clinica", assunto: "Assunto", corpo: "Olá, [Nome],\n\n\n\nAtt,\nApolux"}) }).then(r => r.json());
  templateAtivoId = r.novo_id;
  toast("Template criado!", "success");
  carregarTemplates();
}

async function salvarTemplate() {
  if (templateAtivoId === null) { toast("Selecione um template", "error"); return; }
  const nome = document.getElementById("t-nome").value.trim();
  const tipo = document.getElementById("t-tipo").value;
  const assunto = document.getElementById("t-assunto").value.trim();
  const corpo = document.getElementById("t-corpo").value.trim();
  if (!nome || !assunto || !corpo) { toast("Preencha todos os campos", "error"); return; }
  await fetch("/api/templates/" + templateAtivoId, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({nome,tipo,assunto,corpo}) });
  toast("Template salvo!", "success");
  carregarTemplates();
}

async function duplicarTemplate() {
  if (templateAtivoId === null) return;
  await fetch(`/api/templates/${templateAtivoId}/duplicar`, { method: "POST" });
  toast("Template duplicado!", "success");
  carregarTemplates();
}

async function deletarTemplate() {
  if (templateAtivoId === null) return;
  if (!confirm("Deletar este template?")) return;
  await fetch("/api/templates/" + templateAtivoId, { method: "DELETE" });
  templateAtivoId = null;
  toast("Template deletado", "success");
  carregarTemplates();
}

// ── Disparar ───────────────────────────────
async function carregarTemplatesSelect(selectId = "d-template") {
  const t = await fetch("/api/templates").then(r => r.json());
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = t.map(x => `<option value="${x.id}">${x.tipo === 'clinica' ? '🏥' : '🏢'} ${x.nome}</option>`).join("");
}

function marcarContatos(modo) {
  document.querySelectorAll(".check-row input[type=checkbox]").forEach(chk => {
    const tipo = chk.dataset.tipo;
    if (modo === "todos") chk.checked = true;
    else if (modo === "nenhum") chk.checked = false;
    else chk.checked = (tipo === modo);
  });
}

function renderCheckContatos() {
  const wrap = document.getElementById("check-contatos");
  if (!wrap) return;
  if (contatos.length === 0) {
    wrap.innerHTML = `<p class="text-muted">Nenhum contato cadastrado. Vá em Contatos para adicionar.</p>`;
    return;
  }
  wrap.innerHTML = contatos.map(c => `
    <label class="check-row">
      <input type="checkbox" value="${c.id}" data-tipo="${c.tipo}"/>
      <span>${c.nome}</span><span class="meta">${c.empresa} · ${c.email}</span>
    </label>
  `).join("");
}

let disparoPolling = null;

async function disparar() {
  const templateId = parseInt(document.getElementById("d-template").value);
  const campanha = document.getElementById("d-campanha").value.trim() || `Campanha ${new Date().toLocaleDateString('pt-BR')}`;
  const delayMin = parseInt(document.getElementById("d-delay-min").value) || 5;
  const delayMax = parseInt(document.getElementById("d-delay-max").value) || 10;
  const ids = [...document.querySelectorAll(".check-row input:checked")].map(c => c.value);

  if (!templateId) { toast("Selecione um template", "error"); return; }
  if (ids.length === 0) { toast("Selecione ao menos um destinatário", "error"); return; }

  const r = await fetch("/api/disparar", { method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({template_id: templateId, contato_ids: ids, campanha, delay_min: delayMin, delay_max: delayMax}) }).then(r => r.json());

  if (r.erro) { toast(r.erro, "error"); return; }

  document.getElementById("btn-disparar").disabled = true;
  document.getElementById("btn-cancelar").disabled = false;
  document.getElementById("disparo-log").innerHTML = "";
  let logCount = 0;

  disparoPolling = setInterval(async () => {
    const status = await fetch("/api/disparo/status").then(r => r.json());
    const pct = status.total > 0 ? Math.round(status.progresso / status.total * 100) : 0;
    document.getElementById("disparo-progress").style.width = pct + "%";
    document.getElementById("disparo-progress-label").textContent = `${status.progresso} de ${status.total} processados`;

    const logEl = document.getElementById("disparo-log");
    if (status.log.length > logCount) {
      const novos = status.log.slice(logCount);
      novos.forEach(l => {
        const div = document.createElement("div");
        div.className = "log-line " + l.tipo;
        div.textContent = l.msg;
        logEl.appendChild(div);
      });
      logEl.scrollTop = logEl.scrollHeight;
      logCount = status.log.length;
    }

    if (!status.rodando) {
      clearInterval(disparoPolling);
      document.getElementById("btn-disparar").disabled = false;
      document.getElementById("btn-cancelar").disabled = true;
      toast("Disparo concluído!", "success");
      carregarDadosPagina("disparar");
    }
  }, 1000);
}

async function cancelarDisparo() {
  await fetch("/api/disparo/cancelar", { method: "POST" });
}

// ── WhatsApp ───────────────────────────────
async function abrirWhatsapp() {
  const telefone = document.getElementById("w-tel").value.trim();
  const nome = document.getElementById("w-nome").value.trim();
  const empresa = document.getElementById("w-empresa").value.trim();
  const mensagem = document.getElementById("w-msg").value.trim();
  if (!telefone) { toast("Informe o telefone", "error"); return; }
  const r = await fetch("/api/whatsapp/link", { method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({telefone, nome, empresa, mensagem}) }).then(r => r.json());
  window.open(r.url, "_blank");
  carregarWhatsappHistorico();
}

async function carregarWhatsappHistorico() {
  const wpp = await fetch("/api/whatsapp/historico").then(r => r.json());
  const tbody = document.getElementById("tbl-whatsapp");
  if (!tbody) return;
  if (wpp.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Nenhum envio ainda</td></tr>`; return; }
  tbody.innerHTML = wpp.map(w => `<tr><td>${w.data}</td><td>${w.nome}</td><td>${w.telefone}</td><td>${w.empresa}</td><td><span class="badge badge-gold">${w.status}</span></td></tr>`).join("");
}

// ── Agendamento ────────────────────────────
async function agendar() {
  const nome = document.getElementById("ag-nome").value.trim();
  const templateId = parseInt(document.getElementById("ag-template").value);
  const data = document.getElementById("ag-data").value.trim();
  const hora = document.getElementById("ag-hora").value.trim();
  const destinatarios = document.getElementById("ag-dest").value;
  if (!nome || !data || !hora) { toast("Preencha todos os campos", "error"); return; }
  const r = await fetch("/api/agendados", { method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({nome, template_id: templateId, data, hora, destinatarios}) }).then(r => r.json());
  if (r.erro) { toast(r.erro, "error"); return; }
  toast("Disparo agendado!", "success");
  document.getElementById("ag-nome").value = "";
  carregarAgendados();
}

async function carregarAgendados() {
  const ags = await fetch("/api/agendados").then(r => r.json());
  const tbody = document.getElementById("tbl-agendados");
  if (!tbody) return;
  if (ags.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Nenhum agendamento</td></tr>`; return; }
  tbody.innerHTML = ags.map(a => `
    <tr><td>${a.nome}</td><td>${a.template_nome}</td><td>${a.data_hora}</td><td>${a.destinatarios}</td>
    <td><span class="badge ${a.status === 'Executado' ? 'badge-success' : 'badge-gold'}">${a.status}</span></td>
    <td><button class="btn btn-sm btn-danger" onclick="delAgendado('${a.id}')"><i class="ti ti-trash"></i></button></td></tr>
  `).join("");
}

async function delAgendado(id) {
  await fetch("/api/agendados/" + id, { method: "DELETE" });
  carregarAgendados();
}

// ── Follow-up ──────────────────────────────
async function carregarFollowup() {
  const fus = await fetch("/api/followup").then(r => r.json());
  const tbody = document.getElementById("tbl-followup");
  if (fus.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Nenhum follow-up pendente</td></tr>`; return; }
  tbody.innerHTML = fus.map(f => `
    <tr><td>${f.nome}</td><td>${f.email}</td><td>${f.empresa}</td><td>${f.data_envio}</td>
    <td><span class="badge ${f.followup_enviado ? 'badge-success' : 'badge-gold'}">${f.followup_enviado ? 'Enviado' : 'Pendente'}</span></td></tr>
  `).join("");
}

async function dispararFollowup() {
  const dias = parseInt(document.getElementById("fu-dias").value) || 3;
  const assunto = document.getElementById("fu-assunto").value.trim();
  const corpo = document.getElementById("fu-corpo").value.trim();
  const r = await fetch("/api/followup/disparar", { method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({assunto, corpo, dias}) }).then(r => r.json());
  if (r.erro) { toast(r.erro, "error"); return; }
  toast(`Disparando ${r.pendentes} follow-up(s)...`, "success");
  setTimeout(carregarFollowup, 3000);
}

// ── Blacklist ──────────────────────────────
async function carregarBlacklist() {
  const bl = await fetch("/api/blacklist").then(r => r.json());
  const tbody = document.getElementById("tbl-blacklist");
  if (bl.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="2">Nenhum e-mail bloqueado</td></tr>`; return; }
  tbody.innerHTML = bl.map(e => `<tr><td>${e}</td><td><button class="btn btn-sm btn-danger" onclick="delBlacklist('${e}')"><i class="ti ti-trash"></i></button></td></tr>`).join("");
}

async function addBlacklist() {
  const email = document.getElementById("bl-email").value.trim();
  if (!email) return;
  await fetch("/api/blacklist", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({email}) });
  document.getElementById("bl-email").value = "";
  toast("Adicionado à blacklist", "success");
  carregarBlacklist();
}

async function delBlacklist(email) {
  await fetch("/api/blacklist/" + encodeURIComponent(email), { method: "DELETE" });
  carregarBlacklist();
}

// ── Campanhas ──────────────────────────────
async function carregarCampanhas() {
  const camps = await fetch("/api/campanhas").then(r => r.json());
  const tbody = document.getElementById("tbl-campanhas");
  if (camps.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Nenhuma campanha ainda</td></tr>`; return; }
  tbody.innerHTML = camps.map(c => {
    const taxa = c.total > 0 ? Math.round(c.enviados / c.total * 100) : 0;
    return `<tr><td>${c.nome}</td><td>${c.template}</td><td>${c.data}</td><td>${c.total}</td><td>${c.enviados}</td><td>${c.bloqueados}</td><td>${c.erros}</td><td><span class="badge badge-gold">${taxa}%</span></td></tr>`;
  }).join("");
}

// ── Histórico ──────────────────────────────
async function carregarHistorico() {
  const hist = await fetch("/api/historico").then(r => r.json());
  const tbody = document.getElementById("tbl-historico");
  if (hist.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Nenhum envio registrado</td></tr>`; return; }
  tbody.innerHTML = hist.map(r => {
    let badgeClass = "badge-muted";
    if (r.status === "Enviado") badgeClass = "badge-success";
    else if (r.status === "Erro") badgeClass = "badge-danger";
    else if (r.status === "Blacklist") badgeClass = "badge-gold";
    return `<tr><td>${r.data}</td><td>${r.nome}</td><td>${r.email}</td><td>${r.empresa}</td><td>${r.campanha}</td><td><span class="badge ${badgeClass}">${r.status}</span></td><td>${r.abertura || '—'}</td></tr>`;
  }).join("");
}

async function limparHistorico() {
  if (!confirm("Limpar todo o histórico?")) return;
  await fetch("/api/historico/limpar", { method: "POST" });
  carregarHistorico();
}

// ── Init ───────────────────────────────────
(async function init() {
  await carregarContatos();
  renderCheckContatos();
  await carregarTemplatesSelect();
  carregarDashboard();

  const hoje = new Date();
  hoje.setDate(hoje.getDate() + 1);
  document.getElementById("ag-data").value = hoje.toLocaleDateString('pt-BR');
  document.getElementById("d-campanha").value = "Campanha " + new Date().toLocaleDateString('pt-BR');
})();

// Re-render checklist sempre que contatos mudam
const origCarregarContatos = carregarContatos;
carregarContatos = async function() {
  await origCarregarContatos();
  renderCheckContatos();
};
