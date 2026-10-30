const seed = { clientes: [], tvs: [], materiais: [], ordens: [] };
let db = structuredClone(seed);
let tvClientQuery = "";
let page = "inicio",
  selectedOS = null,
  selectedClient = null,
  selectedTV = null,
  selectedMaterial = null,
  query = "",
  osStatus = "TODOS",
  modoOS = "detalhes";
const $ = (id) => document.getElementById(id);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) =>
  Number(n || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
const orderTotal = (order) =>
  order.itens.reduce(
    (sum, item) => sum + Math.round(item.preco * 100) * item.qtd,
    0,
  ) / 100;
const next = (a) => Math.max(0, ...a.map((x) => x.id)) + 1;
async function api(method, path, body) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique se o TonySystems Web está em execução.");
  }
  if (!response.ok) {
    let error = {};
    try { error = await response.json(); } catch { error = {}; }
    throw new Error(error.message || `Erro HTTP ${response.status}.`);
  }
  return method === "GET" ? response.json() : null;
}
async function reloadData() {
  db = await api("GET", "/api/dados");
  render();
}
function showApiError(error) {
  notifyError(error.message || "Não foi possível concluir a operação.");
}
const find = (a, id) => a.find((x) => x.id === Number(id));
const client = (id) => find(db.clientes, id);
const tv = (id) => find(db.tvs, id);
const msg = (text) => {
  $("notice").classList.remove("error");
  $("notice").setAttribute("role", "status");
  $("notice").textContent = text;
};
function notifyError(text, field) {
  const notice = $("notice");
  notice.classList.add("error");
  notice.setAttribute("role", "alert");
  notice.textContent = text;
  if (field) {
    setFieldError(field, text);
    field.focus();
  } else {
    notice.tabIndex = -1;
    notice.focus();
  }
}
function confirmAction(title, text, label = "Confirmar", danger = false) {
  const dialog = $("confirmation");
  if (dialog.open) return Promise.resolve(false);
  $("confirmation-title").textContent = title;
  $("confirmation-message").textContent = text;
  $("confirmation-accept").textContent = label;
  $("confirmation-accept").className = danger ? "btn danger" : "btn";
  dialog.returnValue = "";
  return new Promise((resolve) => {
    dialog.onclose = () => resolve(dialog.returnValue === "confirm");
    dialog.showModal();
  });
}
function setFieldError(field, text) {
  const error = $(field.id + "-error");
  if (error) error.textContent = text;
  if (text) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
}
function fieldError(field) {
  if (field.disabled || field.readOnly || field.type === "hidden") return "";
  const label =
    field.closest("label")?.firstChild.textContent.replace(" *", "").trim() ||
    "Este campo";
  if (field.required && !field.value.trim())
    return `Preencha ${label.toLowerCase()}.`;
  if (field.dataset.mask && field.value.replace(/\D/g, "").length !== 11)
    return field.dataset.mask === "cpf"
      ? "Informe o CPF completo, com 11 dígitos."
      : "Informe o celular com DDD e 11 dígitos.";
  if (field.validity.rangeUnderflow)
    return `Use um valor a partir de ${field.min}.`;
  if (field.validity.stepMismatch)
    return field.name === "preco"
      ? "Use até duas casas decimais no preço."
      : "Use uma quantidade inteira, sem casas decimais.";
  if (field.validity.badInput || !field.validity.valid)
    return "Confira o valor informado neste campo.";
  return "";
}
function validateForm(form) {
  let first;
  for (const field of form.querySelectorAll("input, select, textarea")) {
    const error = fieldError(field);
    setFieldError(field, error);
    if (error && !first) first = field;
  }
  if (first)
    notifyError(
      "Confira os campos indicados antes de salvar. " + fieldError(first),
      first,
    );
  return !first;
}
function enhanceScreen() {
  for (const form of $("content").querySelectorAll("form")) {
    form.noValidate = true;
    if (
      ["client-form", "tv-form", "material-form", "os-form"].includes(form.id)
    ) {
      const note = document.createElement("p");
      note.className = "form-note";
      note.textContent = "Os campos com * são obrigatórios.";
      form.prepend(note);
    }
    for (const field of form.querySelectorAll(
      "input:not([type=hidden]), select, textarea",
    )) {
      if (!field.id) field.id = form.id + "-" + field.name;
      const label = field.closest("label");
      if (label && label.firstChild?.nodeType === Node.TEXT_NODE) {
        const text = document.createElement("span");
        text.id = field.id + "-label";
        text.textContent = label.firstChild.textContent;
        label.firstChild.replaceWith(text);
        field.setAttribute("aria-labelledby", text.id);
      }
      const error = document.createElement("span");
      error.id = field.id + "-error";
      error.className = "field-error";
      field.insertAdjacentElement("afterend", error);
      field.setAttribute("aria-describedby", error.id);
      if (field.dataset.mask) {
        const hint = document.createElement("span");
        hint.id = field.id + "-hint";
        hint.className = "field-hint";
        hint.textContent =
          field.dataset.mask === "cpf"
            ? "11 dígitos. A pontuação é preenchida automaticamente."
            : "DDD + celular. Exemplo: (11) 98765-4321.";
        error.insertAdjacentElement("beforebegin", hint);
        field.setAttribute("aria-describedby", hint.id + " " + error.id);
      }
    }
  }
  for (const table of $("content").querySelectorAll("table")) {
    table.setAttribute("role", "table");
    const labels = [...table.querySelectorAll("thead th")].map((th) => {
      th.scope = "col";
      th.setAttribute("role", "columnheader");
      return th.textContent;
    });
    for (const group of table.querySelectorAll("thead, tbody"))
      group.setAttribute("role", "rowgroup");
    for (const row of table.querySelectorAll("tr"))
      row.setAttribute("role", "row");
    for (const row of table.querySelectorAll("tbody tr"))
      [...row.cells].forEach((cell, i) => {
        cell.dataset.label = labels[i] || "";
        cell.setAttribute("role", "cell");
      });
    table.setAttribute(
      "aria-label",
      table.closest("section, .card")?.querySelector("h2, h3")?.textContent ||
        "Registros",
    );
  }
  for (const button of $("content").querySelectorAll("tbody [data-action]")) {
    const [action, id] = button.dataset.action.split(":");
    if (action === "manage" || action === "detail")
      button.setAttribute("aria-label", `${button.textContent} OS #${id}`);
  }
}
const cpfMask = (v) => {
  const d = String(v).replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
};
const phoneMask = (value) => {
  const digits = String(value).replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length < 3) return "(" + digits;
  return (
    "(" +
    digits.slice(0, 2) +
    ") " +
    digits.slice(2, 7) +
    (digits.length > 7 ? "-" + digits.slice(7) : "")
  );
};
const normalize = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const matchesClient = (customer, search) =>
  normalize(customer.nome).includes(normalize(search)) ||
  (search.replace(/\D/g, "") !== "" &&
    customer.cpf.replace(/\D/g, "").includes(search.replace(/\D/g, "")));
function refreshTVForm() {
  const form = $("tv-form");
  const draft = Object.fromEntries(new FormData(form));
  render();
  for (const name of ["modelo", "marca"])
    $("tv-form").elements[name].value = draft[name];
}
const actionIcons = {
  "Nova ordem de serviço": '<path d="M12 5v14M5 12h14"/>',
  "Consultar ordens":
    '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9h8M8 14h8"/>',
  "Cadastrar cliente":
    '<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M20 8v6M17 11h6"/>',
  "Ver detalhes": '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  Gerenciar: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
  "Gerenciar esta OS":
    '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
  "Fechar detalhes": '<path d="M18 6 6 18M6 6l12 12"/>',
  "Adicionar material": '<path d="M12 5v14M5 12h14"/>',
  Remover: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
  Selecionar: '<path d="m5 12 4 4L19 6"/>',
  Excluir: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  Editar: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
};
const actionIcon = (t) =>
  actionIcons[t]
    ? '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      actionIcons[t] +
      "</svg>"
    : "";
const button = (text, act, cls = "") =>
  `<button type="button" class="btn ${cls}" data-action="${act}">${actionIcon(text)}${text}</button>`;
const input = (name, label, extra = "", type = "text", value = "") =>
  `<label class="field">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const select = (name, label, options, extra = "") =>
  `<label class="field">${label}<select name="${name}" ${extra}>${options}</select></label>`;
const option = (id, text, sel = false) =>
  `<option value="${esc(id)}" ${sel ? "selected" : ""}>${esc(text)}</option>`;
const headings = {
  inicio: ["Início", "Acesso rápido às tarefas da oficina."],
  clientes: [
    "Clientes",
    "Cadastre, pesquise e atualize os dados dos clientes.",
  ],
  televisoes: ["Televisões", "Associe cada televisão ao seu proprietário."],
  materiais: ["Materiais", "Cadastre peças e consulte o estoque."],
  novaos: [
    "Nova ordem de serviço",
    "Registre a televisão e o problema informado pelo cliente.",
  ],
  ordens: [
    "Gerenciar ordens de serviço",
    "Consulte o problema relatado e acompanhe cada serviço.",
  ],
};
function navigate(p) {
  page = p;
  query = "";
  osStatus = "TODOS";
  modoOS = "detalhes";
  selectedClient = null;
  selectedTV = null;
  selectedMaterial = null;
  selectedOS = null;
  tvClientQuery = "";
  render();
  $("page-title").focus({ preventScroll: true });
}
function render(preserveForm = false) {
  const drafts = preserveForm
    ? [...$("content").querySelectorAll("form")].map((form) => [
        form.id,
        Object.fromEntries(new FormData(form)),
      ])
    : [];
  document.querySelectorAll("nav button").forEach((b) => {
    b.classList.toggle("active", b.dataset.page === page);
    if (b.dataset.page === page) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  $("page-title").textContent = headings[page][0];
  $("page-subtitle").textContent = headings[page][1];
  $("notice").textContent = "";
  $("content").innerHTML = {
    inicio: home,
    clientes: clients,
    televisoes: tvs,
    materiais: materials,
    novaos: newOS,
    ordens: orders,
  }[page]();
  enhanceScreen();
  for (const [id, values] of drafts) {
    const form = $(id);
    if (form)
      for (const [name, value] of Object.entries(values))
        if (form.elements[name]) form.elements[name].value = value;
  }
}
function home() {
  const pending = db.ordens.filter((order) => order.status === "PENDENTE");
  return `
    <section class="card hero" aria-labelledby="home-title">
      <div><p class="eyebrow">Do recebimento à entrega</p><h2 id="home-title">Tudo pronto para o próximo atendimento.</h2>
      <p>Abra uma ordem de serviço ou continue o conserto de uma televisão que já está na oficina.</p></div>
      ${button("Nova ordem de serviço", "go:novaos")}
    </section>
    <div class="stats" aria-label="Resumo da oficina">
      <div class="stat pending"><span>OS pendentes</span><strong>${pending.length}</strong></div>
      <div class="stat"><span>OS concluídas</span><strong>${db.ordens.length - pending.length}</strong></div>
      <div class="stat"><span>Clientes</span><strong>${db.clientes.length}</strong></div>
      <div class="stat"><span>Televisões</span><strong>${db.tvs.length}</strong></div>
    </div>
    <div class="grid">
      <section class="card"><div class="card-heading"><h2>Atendimentos pendentes</h2>${button("Consultar ordens", "go:ordens", "secondary")}</div>
        <div class="task-list">${
          pending
            .slice(-3)
            .reverse()
            .map(
              (order) =>
                `<div class="task"><div><strong>OS #${order.id} · ${esc(client(order.clienteId)?.nome)}</strong><span>${esc(tv(order.tvId)?.marca)} · ${esc(tv(order.tvId)?.modelo)}</span></div>${button("Gerenciar", "open-order:" + order.id, "secondary")}</div>`,
            )
            .join("") ||
          '<p class="empty">Nenhuma ordem pendente no momento.</p>'
        }</div>
      </section>
      <section class="card"><h2>Primeiro atendimento?</h2>
        <ol class="workflow"><li>Cadastre os dados do cliente.</li><li>Vincule a televisão ao cliente.</li><li>Abra a OS com o problema relatado.</li></ol>
        <div class="actions">${button("Cadastrar cliente", "go:clientes", "secondary")}${button("Cadastrar televisão", "go:televisoes", "secondary")}</div>
      </section>
    </div>`;
}
function clients() {
  const filtered = db.clientes.filter(
    (x) =>
      matchesClient(x, query) ||
      (query.replace(/\D/g, "") &&
        x.telefone.replace(/\D/g, "").includes(query.replace(/\D/g, ""))),
  );
  const e = selectedClient && client(selectedClient);
  return `<div class="grid"><section class="card"><h2>${e ? "Atualizar cliente" : "Cadastrar cliente"}</h2><form id="client-form"><div class="form-grid">${input("nome", "Nome completo *", 'required maxlength="100" autocomplete="name"', "text", e?.nome)}${input("cpf", "CPF *", (e ? "readonly " : "required ") + 'maxlength="14" inputmode="numeric" autocomplete="off" data-mask="cpf" placeholder="000.000.000-00"', "text", e?.cpf)}${input("telefone", "Celular com DDD *", 'required maxlength="15" inputmode="numeric" autocomplete="tel" data-mask="telefone" placeholder="(00) 00000-0000"', "text", e?.telefone)}${input("endereco", "Endereço *", 'required maxlength="200" autocomplete="street-address"', "text", e?.endereco)}</div><div class="actions"><button class="btn" type="submit">${e ? "Salvar alterações" : "Cadastrar cliente"}</button>${button("Limpar", "reset-client", "secondary")}</div></form></section><section class="card"><h2>Consultar clientes</h2><div class="search"><input id="filter" aria-label="Pesquisar clientes" placeholder="Nome, CPF ou telefone" value="${esc(query)}">${button("Pesquisar", "search")}</div><div class="table-wrap"><table><thead><tr><th>Nome</th><th>Telefone</th><th>Ações</th></tr></thead><tbody>${filtered.map((c) => `<tr><td>${esc(c.nome)}</td><td>${esc(c.telefone)}</td><td><div class="table-actions">${button("Editar", "edit-client:" + c.id, "secondary")}${button("Excluir", "del-client:" + c.id, "danger")}</div></td></tr>`).join("") || '<tr><td colspan="3">Nenhum cliente encontrado.</td></tr>'}</tbody></table></div></section></div>`;
}
function tvs() {
  const e = selectedTV && tv(selectedTV);
  const found = db.clientes.filter((c) => matchesClient(c, tvClientQuery));
  const chosen = client(selectedClient);
  return `<div class="grid"><section class="card"><h2>${e ? "Editar televisão" : "Cadastrar televisão"}</h2><form id="tv-form"><div class="form-grid"><div class="field span2"><label for="tv-client-search">Pesquisar cliente pelo nome ou CPF *</label><div class="search"><input id="tv-client-search" placeholder="Digite o nome do cliente" value="${esc(tvClientQuery)}" autocomplete="off">${button("Pesquisar cliente", "search-tv-client", "secondary")}</div><div class="table-wrap"><table class="client-picker"><thead><tr><th>Cliente</th><th>CPF</th><th>Ação</th></tr></thead><tbody>${found.map((c) => `<tr class="${chosen?.id === c.id ? "selected" : ""}"><td>${esc(c.nome)}</td><td>${esc(c.cpf)}</td><td>${button(chosen?.id === c.id ? "Selecionado" : "Selecionar", "pick-tv-client:" + c.id, chosen?.id === c.id ? "" : "secondary")}</td></tr>`).join("") || '<tr><td colspan="3">Nenhum cliente encontrado.</td></tr>'}</tbody></table></div><input type="hidden" name="clienteId" value="${chosen?.id || ""}"><div class="client-selection"><p>Cliente selecionado: <strong>${esc(chosen?.nome || "Nenhum cliente selecionado")}</strong></p>${chosen ? button("Trocar cliente", "clear-tv-client", "secondary") : ""}</div></div>${input("modelo", "Modelo *", 'required maxlength="80"', "text", e?.modelo)}${input("marca", "Marca *", 'required maxlength="60"', "text", e?.marca)}</div><div class="actions"><button class="btn" type="submit">${e ? "Salvar alterações" : "Cadastrar televisão"}</button>${button("Limpar", "reset-tv", "secondary")}</div></form></section><section class="card"><h2>Televisões cadastradas</h2><div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Modelo</th><th>Marca</th><th>Ações</th></tr></thead><tbody>${db.tvs.map((t) => `<tr><td>${esc(client(t.clienteId)?.nome || "—")}</td><td>${esc(t.modelo)}</td><td>${esc(t.marca)}</td><td>${button("Editar", "edit-tv:" + t.id, "secondary")}</td></tr>`).join("") || '<tr><td colspan="4">Nenhuma televisão.</td></tr>'}</tbody></table></div></section></div>`;
}
function materials() {
  const e = selectedMaterial && find(db.materiais, selectedMaterial);
  const filtered = db.materiais.filter((x) =>
    [x.nome, x.categoria, x.marca]
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(normalize(query)),
  );
  return `<div class="grid"><section class="card"><h2>${e ? "Editar material" : "Cadastrar material"}</h2><form id="material-form"><div class="form-grid">${input("nome", "Nome *", 'required maxlength="100"', "text", e?.nome)}${input("marca", "Marca *", 'required maxlength="60"', "text", e?.marca)}${input("categoria", "Categoria *", 'required maxlength="60"', "text", e?.categoria)}${input("preco", "Preço (R$) *", 'required min="0" step="0.01"', "number", e?.preco ?? "")}${input("estoque", "Quantidade em estoque *", 'required min="0" step="1"', "number", e?.estoque ?? "")}</div><div class="actions"><button class="btn" type="submit">${e ? "Salvar alterações" : "Cadastrar material"}</button>${button("Limpar", "reset-material", "secondary")}</div></form></section><section class="card"><h2>Consultar materiais</h2><div class="search"><input id="filter" placeholder="Nome, marca ou categoria" aria-label="Pesquisar materiais" value="${esc(query)}">${button("Pesquisar", "search")}</div><div class="table-wrap"><table><thead><tr><th>Material</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead><tbody>${filtered.map((m) => `<tr><td>${esc(m.nome)}<div class="subtle">${esc(m.categoria)}</div></td><td>${money(m.preco)}</td><td>${m.estoque}</td><td><div class="table-actions">${button("Editar", "edit-material:" + m.id, "secondary")}${button("Excluir", "del-material:" + m.id, "danger")}</div></td></tr>`).join("") || '<tr><td colspan="4">Nenhum material encontrado.</td></tr>'}</tbody></table></div></section></div>`;
}
function newOS() {
  return `<div class="card"><h2>Abertura de ordem de serviço</h2><form id="os-form"><div class="form-grid">${select("clienteId", "Cliente *", option("", "Selecione o cliente") + db.clientes.map((c) => option(c.id, c.nome)).join(""), 'required id="os-client"')}${select("tvId", "Televisão do cliente *", option("", "Primeiro selecione o cliente"), 'required id="os-tv"')}${input("data", "Data de abertura *", "required", "date", new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10))}<label class="field span2">Problema relatado pelo cliente *<textarea name="problema" required maxlength="2000" placeholder="Ex.: TV liga, mas não aparece imagem."></textarea></label></div><div class="actions"><button class="btn" type="submit">Cadastrar ordem de serviço</button>${button("Limpar", "reset-os", "secondary")}</div></form></div>`;
}
function orders() {
  const filtered = db.ordens.filter(
    (o) =>
      [o.id, client(o.clienteId)?.nome, tv(o.tvId)?.modelo, o.status]
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(normalize(query).replace(/^#/, "")) &&
      (osStatus === "TODOS" || o.status === osStatus),
  );
  return `<div class="card"><h2>Ordens de serviço</h2><p class="helper">Clique em <strong>Ver detalhes</strong> para consultar o problema relatado ou em <strong>Gerenciar</strong> para registrar materiais e finalizar o atendimento.</p><div class="search"><input id="filter" aria-label="Pesquisar OS" placeholder="Cliente, televisão, número ou status" value="${esc(query)}">${button("Pesquisar", "search")}<label class="filter-label">Situação <select id="os-status" aria-label="Filtrar por situação">${option("TODOS", "Todas", osStatus === "TODOS")}${option("PENDENTE", "Pendentes", osStatus === "PENDENTE")}${option("CONCLUIDO", "Concluídas", osStatus === "CONCLUIDO")}</select></label></div><div class="table-wrap"><table><thead><tr><th>OS</th><th>Cliente</th><th>Televisão</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead><tbody>${filtered.map((o) => `<tr class="${selectedOS === o.id ? "selected" : ""}"><td>#${o.id}</td><td>${esc(client(o.clienteId)?.nome || "—")}</td><td>${esc(tv(o.tvId)?.modelo || "—")}</td><td>${esc(o.data.split("-").reverse().join("/"))}</td><td><span class="status ${o.status.toLowerCase()}">${o.status === "PENDENTE" ? "Pendente" : "Concluída"}</span></td><td><div class="table-actions">${button("Ver detalhes", "detail:" + o.id, "secondary")}${o.status === "PENDENTE" ? button("Gerenciar", "manage:" + o.id) : '<span class="subtle">Somente consulta</span>'}</div></td></tr>`).join("") || '<tr><td colspan="6">Nenhuma OS encontrada.</td></tr>'}</tbody></table></div>${selectedOS ? details(find(db.ordens, selectedOS)) : ""}</div>`;
}
function details(o) {
  if (!o) return "";
  const c = client(o.clienteId),
    t = tv(o.tvId),
    total = orderTotal(o);
  const aberto = o.status === "PENDENTE";
  return `<section class="detail" id="detalhes-os" tabindex="-1" aria-label="Detalhes da ordem de serviço"><div class="actions detail-heading"><h2>${modoOS === "gerenciar" && aberto ? "Gerenciar" : "Detalhes da"} OS #${o.id}</h2>${button("Fechar detalhes", "close-detail", "secondary")}</div><div class="detail-summary"><span class="status ${o.status.toLowerCase()}">${aberto ? "Pendente" : "Concluída"}</span><span>Aberta em ${esc(o.data.split("-").reverse().join("/"))}</span></div><div class="grid"><div><h3>Dados do cliente</h3><dl><dt>Nome</dt><dd>${esc(c?.nome)}</dd><dt>Telefone</dt><dd>${esc(c?.telefone)}</dd><dt>CPF</dt><dd>${esc(c?.cpf)}</dd><dt>Endereço</dt><dd>${esc(c?.endereco)}</dd></dl><h3 class="section-heading">Dados da televisão</h3><dl><dt>Marca</dt><dd>${esc(t?.marca)}</dd><dt>Modelo</dt><dd>${esc(t?.modelo)}</dd></dl><h3 class="section-heading">Problema relatado</h3><div class="problem">${esc(o.problema)}</div></div><div><h3>Materiais utilizados</h3><div class="table-wrap"><table><thead><tr><th>Material</th><th>Qtd.</th><th>Subtotal</th></tr></thead><tbody>${o.itens.map((i) => `<tr><td>${esc(i.nome)}</td><td>${i.qtd}</td><td>${money(i.qtd * i.preco)}</td></tr>`).join("") || '<tr><td colspan="3">Nenhum material registrado.</td></tr>'}</tbody></table></div><p class="total">Total dos materiais: <strong>${money(total)}</strong></p><p>Forma de pagamento: <strong>${esc(o.pagamento || "Não informada")}</strong></p></div></div>${aberto && modoOS === "detalhes" ? `<div class="actions footer-actions">${button("Gerenciar esta OS", "manage:" + o.id)}</div>` : ""}${!aberto ? '<p class="hint">Esta ordem já foi concluída e está disponível apenas para consulta.</p>' : ""}${aberto && modoOS === "gerenciar" ? manageForm(o, total) : ""}</section>`;
}
function manageForm(o, total) {
  return `<div class="grid manage-grid"><section class="card"><h3>Adicionar material utilizado</h3><form id="item-form"><div class="form-grid">${select(
    "materialId",
    "Material *",
    option("", "Selecione") +
      db.materiais
        .filter((m) => m.estoque > 0)
        .map((m) => option(m.id, `${m.nome} — estoque: ${m.estoque}`))
        .join(""),
    "required",
  )}${input("qtd", "Quantidade *", 'required min="1" step="1"', "number", 1)}</div><button class="btn" type="submit">Adicionar material</button></form><h3 class="section-heading">Materiais desta OS</h3>${o.itens.map((i, n) => `<div class="item-line"><span>${esc(i.nome)} — ${i.qtd} × ${money(i.preco)}</span>${button("Remover", "remove-item:" + i.id, "danger")}</div>`).join("") || "<p>Nenhum material adicionado.</p>"}</section><section class="card"><h3>Pagamento e finalização</h3><p class="total">Total dos materiais: <strong>${money(total)}</strong></p><form id="finish-form">${select("pagamento", "Forma de pagamento *", option("", "Selecione") + ["PIX", "Dinheiro", "Cartão de crédito", "Cartão de débito"].map((x) => option(x, x)).join(""), "required")}<div class="footer-actions"><button class="btn" type="submit">Confirmar pagamento e finalizar OS</button></div></form><p class="hint">Confira os materiais e a forma de pagamento antes de concluir.</p></section></div>`;
}
function manage(o) {
  selectedOS = o.id;
  modoOS = o.status === "PENDENTE" ? "gerenciar" : "detalhes";
  render();
  document.getElementById("detalhes-os")?.focus();
}
async function submit(e) {
  const f = e.target;
  if (!f.matches("#content form")) return;
  e.preventDefault();
  if (!validateForm(f)) return;
  const d = Object.fromEntries(new FormData(f));
  const trim = (key) => String(d[key] || "").trim();
  if (f.id === "client-form") {
    if (trim("cpf").replace(/\D/g, "").length !== 11 ||
        trim("telefone").replace(/\D/g, "").length !== 11) {
      return notifyError("Informe CPF e celular completos, com 11 dígitos.");
    }
    await api(selectedClient ? "PUT" : "POST",
      selectedClient ? `/api/clientes/${selectedClient}` : "/api/clientes", {
        nome: trim("nome"), cpf: trim("cpf"),
        telefone: trim("telefone"), endereco: trim("endereco"),
      });
    selectedClient = null;
    await reloadData();
    msg("Cliente salvo com sucesso.");
  } else if (f.id === "tv-form") {
    if (!client(d.clienteId)) {
      return notifyError("Pesquise e selecione um cliente antes de cadastrar a televisão.");
    }
    await api(selectedTV ? "PUT" : "POST",
      selectedTV ? `/api/televisoes/${selectedTV}` : "/api/televisoes", {
        clienteId: Number(d.clienteId), modelo: trim("modelo"), marca: trim("marca"),
      });
    selectedTV = null;
    selectedClient = null;
    tvClientQuery = "";
    await reloadData();
    msg("Televisão salva com sucesso.");
  } else if (f.id === "material-form") {
    await api(selectedMaterial ? "PUT" : "POST",
      selectedMaterial ? `/api/materiais/${selectedMaterial}` : "/api/materiais", {
        nome: trim("nome"), marca: trim("marca"), categoria: trim("categoria"),
        preco: Number(d.preco), estoque: Number(d.estoque),
      });
    selectedMaterial = null;
    await reloadData();
    msg("Material salvo com sucesso.");
  } else if (f.id === "os-form") {
    const television = tv(d.tvId);
    if (!television || television.clienteId !== Number(d.clienteId)) {
      return notifyError("Selecione uma televisão que pertença ao cliente informado.");
    }
    await api("POST", "/api/ordens", {
      clienteId: Number(d.clienteId), tvId: Number(d.tvId),
      data: d.data, problema: trim("problema"),
    });
    await reloadData();
    navigate("ordens");
    msg("Ordem de serviço aberta com sucesso.");
  } else if (f.id === "item-form") {
    await api("POST", `/api/ordens/${selectedOS}/itens`, {
      materialId: Number(d.materialId), qtd: Number(d.qtd),
    });
    await reloadData();
    manage(find(db.ordens, selectedOS));
    msg("Material adicionado.");
  } else if (f.id === "finish-form") {
    const ordem = find(db.ordens, selectedOS);
    if (!ordem || ordem.status !== "PENDENTE") return notifyError("OS indisponível para finalização.");
    const confirmar = await confirmAction(
      "Finalizar OS #" + ordem.id + "?",
      "Total dos materiais: " + money(orderTotal(ordem)) + ". Pagamento: " +
      d.pagamento + ". Após concluir, a OS ficará disponível somente para consulta.",
      "Finalizar OS",
    );
    if (!confirmar) return;
    await api("POST", `/api/ordens/${ordem.id}/finalizar`, { pagamento: d.pagamento });
    selectedOS = ordem.id;
    modoOS = "detalhes";
    await reloadData();
    msg("Ordem de serviço concluída.");
  }
}
async function act(action) {
  const [type, id] = action.split(":");
  if (type === "go") return navigate(id);
  if (type === "open-order") {
    navigate("ordens");
    const order = find(db.ordens, id);
    if (order) manage(order);
    return;
  }
  if (type === "search") {
    query = $("filter")?.value || "";
    render(true);
    $("filter").focus();
    return;
  }
  if (type === "reset-client") { selectedClient = null; return render(); }
  if (type === "reset-tv") {
    selectedTV = null; selectedClient = null; tvClientQuery = "";
    return render();
  }
  if (type === "search-tv-client") {
    tvClientQuery = $("tv-client-search")?.value.trim() || "";
    refreshTVForm(); $("tv-client-search").focus(); return;
  }
  if (type === "pick-tv-client") {
    selectedClient = Number(id); refreshTVForm();
    $("tv-form").elements.modelo.focus(); return;
  }
  if (type === "clear-tv-client") {
    selectedClient = null; tvClientQuery = "";
    refreshTVForm(); $("tv-client-search").focus(); return;
  }
  if (type === "reset-material") { selectedMaterial = null; return render(); }
  if (type === "reset-os") return render();
  if (type === "edit-client") {
    selectedClient = Number(id); render(); $("client-form").elements.nome.focus(); return;
  }
  if (type === "edit-tv") {
    selectedTV = Number(id);
    selectedClient = tv(selectedTV)?.clienteId || null;
    tvClientQuery = client(selectedClient)?.nome || "";
    render(); $("tv-form").elements.modelo.focus(); return;
  }
  if (type === "edit-material") {
    selectedMaterial = Number(id); render();
    $("material-form").elements.nome.focus(); return;
  }
  if (type === "del-client") {
    const current = client(id);
    if (!current) return;
    if (await confirmAction("Excluir cliente?",
      `O cadastro de ${current.nome} será excluído. Esta ação não pode ser desfeita.`,
      "Excluir cliente", true)) {
      await api("DELETE", `/api/clientes/${id}`);
      await reloadData(); msg("Cliente excluído.");
    }
    return;
  }
  if (type === "del-material") {
    const current = find(db.materiais, id);
    if (!current) return;
    if (await confirmAction("Excluir material?",
      `O material ${current.nome} será excluído. Esta ação não pode ser desfeita.`,
      "Excluir material", true)) {
      await api("DELETE", `/api/materiais/${id}`);
      await reloadData(); msg("Material excluído.");
    }
    return;
  }
  if (type === "detail") {
    modoOS = "detalhes"; selectedOS = Number(id);
    render(); document.querySelector(".detail")?.focus(); return;
  }
  if (type === "close-detail") {
    modoOS = "detalhes"; selectedOS = null; render(); return;
  }
  if (type === "manage") {
    const ordem = find(db.ordens, id);
    if (ordem) manage(ordem);
    return;
  }
  if (type === "remove-item") {
    const ordem = find(db.ordens, selectedOS);
    const item = ordem?.itens.find(i => i.id === Number(id));
    if (!ordem || ordem.status !== "PENDENTE" || !item) return;
    if (await confirmAction("Remover material?",
      `${item.qtd} unidade(s) de ${item.nome} voltarão ao estoque.`,
      "Remover material", true)) {
      await api("DELETE", `/api/ordens/${ordem.id}/itens/${item.id}`);
      await reloadData(); manage(find(db.ordens, selectedOS));
      msg("Material removido e estoque devolvido.");
    }
  }
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action],[data-page]");
  if (!b) return;
  if (b.dataset.page) navigate(b.dataset.page);
  else if (b.dataset.action) act(b.dataset.action).catch(showApiError);
});
document.addEventListener("submit", e => { submit(e).catch(showApiError); });
document.addEventListener("change", (e) => {
  if (e.target.id === "os-status") {
    osStatus = e.target.value;
    render();
    $("os-status").focus();
    return;
  }
  if (e.target.id === "os-client") {
    const id = Number(e.target.value);
    $("os-tv").innerHTML =
      option("", "Selecione a televisão") +
      db.tvs
        .filter((t) => t.clienteId === id)
        .map((t) => option(t.id, `${t.marca} — ${t.modelo}`))
        .join("");
  }
});
render();
reloadData().catch(showApiError);

function applyMask(field, raw, digitPosition) {
  const format = field.dataset.mask === "cpf" ? cpfMask : phoneMask;
  field.value = format(raw);
  let position = 0,
    seen = 0;
  while (position < field.value.length && seen < digitPosition) {
    if (/\d/.test(field.value[position])) seen++;
    position++;
  }
  field.setSelectionRange(position, position);
}
document.addEventListener("input", (event) => {
  const field = event.target;
  if (!field.dataset.mask) return;
  const position = field.value
    .slice(0, field.selectionStart)
    .replace(/\D/g, "").length;
  applyMask(field, field.value, position);
});
document.addEventListener("paste", (event) => {
  const field = event.target;
  if (!field.dataset.mask || field.readOnly) return;
  event.preventDefault();
  const before = field.value.slice(0, field.selectionStart).replace(/\D/g, "");
  const after = field.value.slice(field.selectionEnd).replace(/\D/g, "");
  const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
  applyMask(
    field,
    before + pasted + after,
    Math.min(11, before.length + pasted.length),
  );
});
document.addEventListener("beforeinput", (event) => {
  const field = event.target;
  if (
    !field.dataset.mask ||
    field.readOnly ||
    field.selectionStart !== field.selectionEnd
  )
    return;
  const backward = event.inputType === "deleteContentBackward";
  const forward = event.inputType === "deleteContentForward";
  const adjacent = field.value[field.selectionStart + (backward ? -1 : 0)];
  if ((!backward && !forward) || !adjacent || /\d/.test(adjacent)) return;
  event.preventDefault();
  const digits = field.value.replace(/\D/g, "");
  const count = field.value
    .slice(0, field.selectionStart)
    .replace(/\D/g, "").length;
  const index = backward ? count - 1 : count;
  applyMask(
    field,
    digits.slice(0, index) + digits.slice(index + 1),
    backward ? index : count,
  );
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  if (event.target.id === "tv-client-search" || event.target.id === "filter") {
    event.preventDefault();
    act(event.target.id === "filter" ? "search" : "search-tv-client").catch(showApiError);
  }
});

document.addEventListener("focusout", (event) => {
  const field = event.target;
  if (event.relatedTarget?.type === "submit") return;
  if (!field.matches("#content input, #content select, #content textarea"))
    return;
  setFieldError(field, fieldError(field));
});
document.addEventListener("input", (event) => {
  const field = event.target;
  if (field.hasAttribute("aria-invalid"))
    setFieldError(field, fieldError(field));
});
