const initialSubmissions = [
  { id: 1, title: "Lista de exercícios: funções", subject: "Matemática", teacher: "Prof.ª Ana Paula", dueDate: "2026-10-12", status: "overdue", icon: "∑", subjectClass: "math", student: "Marina Costa" },
  { id: 2, title: "Análise do conto 'A terceira margem'", subject: "Português", teacher: "Prof. João Mendes", dueDate: "2026-10-16", status: "pending", icon: "✎", subjectClass: "portuguese", student: "Marina Costa" },
  { id: 3, title: "Relatório: ecossistemas locais", subject: "Ciências", teacher: "Prof.ª Carla Souza", dueDate: "2026-10-10", status: "submitted", icon: "⌬", subjectClass: "science", student: "Marina Costa" },
  { id: 4, title: "Mapa mental: Brasil Colônia", subject: "História", teacher: "Prof. Ricardo Lima", dueDate: "2026-10-08", status: "evaluated", icon: "◷", subjectClass: "history", student: "Marina Costa" },
  { id: 5, title: "Unit 5 — writing practice", subject: "Inglês", teacher: "Prof.ª Laura Nunes", dueDate: "2026-10-20", status: "pending", icon: "A", subjectClass: "english", student: "Marina Costa" },
  { id: 6, title: "Desafio: geometria espacial", subject: "Matemática", teacher: "Prof.ª Ana Paula", dueDate: "2026-10-06", status: "submitted", icon: "∑", subjectClass: "math", student: "Marina Costa" },
  { id: 7, title: "Pesquisa: fontes de energia", subject: "Ciências", teacher: "Prof.ª Carla Souza", dueDate: "2026-10-17", status: "pending", icon: "⌬", subjectClass: "science", student: "Marina Costa" },
  { id: 8, title: "Interpretação de poemas", subject: "Português", teacher: "Prof. João Mendes", dueDate: "2026-10-05", status: "evaluated", icon: "✎", subjectClass: "portuguese", student: "Marina Costa" },
  { id: 9, title: "Linha do tempo: República", subject: "História", teacher: "Prof. Ricardo Lima", dueDate: "2026-10-22", status: "pending", icon: "◷", subjectClass: "history", student: "Marina Costa" },
  { id: 10, title: "Vocabulary review — Unit 4", subject: "Inglês", teacher: "Prof.ª Laura Nunes", dueDate: "2026-10-09", status: "evaluated", icon: "A", subjectClass: "english", student: "Marina Costa" },
  { id: 11, title: "Exercícios: equações do 2º grau", subject: "Matemática", teacher: "Prof.ª Ana Paula", dueDate: "2026-10-11", status: "overdue", icon: "∑", subjectClass: "math", student: "Pedro Henrique" },
  { id: 12, title: "Leitura e interpretação", subject: "Português", teacher: "Prof. João Mendes", dueDate: "2026-10-15", status: "submitted", icon: "✎", subjectClass: "portuguese", student: "Pedro Henrique" },
  { id: 13, title: "Cadeias alimentares", subject: "Ciências", teacher: "Prof.ª Carla Souza", dueDate: "2026-10-10", status: "evaluated", icon: "⌬", subjectClass: "science", student: "Pedro Henrique" },
  { id: 14, title: "Brasil Colônia: atividade 2", subject: "História", teacher: "Prof. Ricardo Lima", dueDate: "2026-10-13", status: "overdue", icon: "◷", subjectClass: "history", student: "Pedro Henrique" },
  { id: 15, title: "Past tense — workbook", subject: "Inglês", teacher: "Prof.ª Laura Nunes", dueDate: "2026-10-18", status: "pending", icon: "A", subjectClass: "english", student: "Pedro Henrique" },
  { id: 16, title: "Funções: revisão", subject: "Matemática", teacher: "Prof.ª Ana Paula", dueDate: "2026-10-17", status: "submitted", icon: "∑", subjectClass: "math", student: "Beatriz Oliveira" },
  { id: 17, title: "Crônica: produção textual", subject: "Português", teacher: "Prof. João Mendes", dueDate: "2026-10-12", status: "overdue", icon: "✎", subjectClass: "portuguese", student: "Beatriz Oliveira" },
  { id: 18, title: "Experimento de fotossíntese", subject: "Ciências", teacher: "Prof.ª Carla Souza", dueDate: "2026-10-21", status: "pending", icon: "⌬", subjectClass: "science", student: "Beatriz Oliveira" },
  { id: 19, title: "Movimentos sociais no Brasil", subject: "História", teacher: "Prof. Ricardo Lima", dueDate: "2026-10-09", status: "evaluated", icon: "◷", subjectClass: "history", student: "Beatriz Oliveira" },
  { id: 20, title: "Email writing — Unit 5", subject: "Inglês", teacher: "Prof.ª Laura Nunes", dueDate: "2026-10-19", status: "submitted", icon: "A", subjectClass: "english", student: "Beatriz Oliveira" }
];

const statusNames = {
  pending: "Pendente",
  submitted: "Entregue",
  evaluated: "Avaliada",
  overdue: "Atrasada"
};
const statusFilters = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "submitted", label: "Entregues" },
  { key: "evaluated", label: "Avaliadas" },
  { key: "overdue", label: "Atrasadas" }
];

const savedSubmissions = localStorage.getItem("geap-submissions");
let submissions = savedSubmissions ? JSON.parse(savedSubmissions) : initialSubmissions;
let currentFilter = "all";
let isTeacherView = false;
let toastTimeout;

const summaryGrid = document.querySelector("#summary-grid");
const filterRow = document.querySelector("#filter-row");
const activityList = document.querySelector("#activity-list");
const searchInput = document.querySelector("#search-input");
const resultsLabel = document.querySelector("#results-label");
const roleSwitch = document.querySelector("#role-switch");
const roleSwitchLabel = document.querySelector("#role-switch-label");

function getVisibleSubmissions() {
  const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  return submissions.filter((submission) => {
    const matchesFilter = currentFilter === "all" || submission.status === currentFilter;
    const matchesQuery = `${submission.title} ${submission.subject} ${submission.student}`
      .toLocaleLowerCase("pt-BR")
      .includes(query);
    const matchesRole = isTeacherView || submission.student === "Marina Costa";
    return matchesFilter && matchesQuery && matchesRole;
  });
}

function renderSummary() {
  const visible = getVisibleSubmissions();
  const counts = Object.fromEntries(
    Object.keys(statusNames).map((status) => [
      status,
      visible.filter((submission) => submission.status === status).length
    ])
  );
  const cards = [
    { status: "pending", label: "Pendentes", icon: "◷", helper: "Aguardando entrega" },
    { status: "submitted", label: "Entregues", icon: "↗", helper: "Aguardando avaliação" },
    { status: "evaluated", label: "Avaliadas", icon: "✓", helper: "Com nota registrada" },
    { status: "overdue", label: "Atrasadas", icon: "!", helper: "Prazo já encerrado" }
  ];
  summaryGrid.innerHTML = cards.map((card) => `
    <article class="summary-card ${card.status}">
      <div class="summary-top"><span class="summary-label">${card.label}</span><span class="summary-icon" aria-hidden="true">${card.icon}</span></div>
      <div class="summary-value"><strong>${counts[card.status]}</strong><span>${card.helper}</span></div>
    </article>
  `).join("");

  const pendingCount = submissions.filter((submission) =>
    submission.student === "Marina Costa" && submission.status === "pending"
  ).length;
  document.querySelector("#sidebar-count").textContent = pendingCount;
}

function renderFilters() {
  const visible = getVisibleSubmissions();
  filterRow.innerHTML = statusFilters.map((filter) => {
    const count = filter.key === "all"
      ? visible.length
      : visible.filter((submission) => submission.status === filter.key).length;
    return `<button class="filter-button ${currentFilter === filter.key ? "active" : ""}" type="button" data-filter="${filter.key}" aria-pressed="${currentFilter === filter.key}">${filter.label}<span class="filter-count">${count}</span></button>`;
  }).join("");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(`${date}T12:00:00`))
    .replace(".", "");
}

function renderActivities() {
  const visible = getVisibleSubmissions();
  resultsLabel.textContent = isTeacherView
    ? `${visible.length} entrega${visible.length === 1 ? "" : "s"} dos alunos.`
    : "Confira o que precisa da sua atenção.";

  if (visible.length === 0) {
    activityList.innerHTML = `<div class="empty-state"><strong>Nenhuma atividade encontrada</strong>Tente ajustar os filtros ou a busca.</div>`;
    return;
  }

  activityList.innerHTML = visible.map((submission) => `
    <article class="activity-card ${isTeacherView ? "teacher-view" : ""}">
      <div class="activity-title">
        <span class="subject-icon ${submission.subjectClass}" aria-hidden="true">${submission.icon}</span>
        <span class="title-copy"><strong>${submission.title}</strong><small>${submission.subject} <span aria-hidden="true">·</span> ${submission.teacher}</small></span>
      </div>
      <div class="activity-meta ${isTeacherView ? "student-name-cell" : ""}"><span class="column-label">${isTeacherView ? "Aluno" : "Prazo"}</span>${isTeacherView ? submission.student : formatDate(submission.dueDate)}</div>
      <div class="activity-meta status-cell"><span class="column-label">Situação</span><span class="status-badge status-${submission.status}">${statusNames[submission.status]}</span></div>
      ${isTeacherView ? `<div class="activity-meta teacher-deadline-cell"><span class="column-label">Prazo</span>${formatDate(submission.dueDate)}</div>` : ""}
      <div class="action-cell">${renderAction(submission)}</div>
    </article>
  `).join("");
}

function renderAction(submission) {
  if (isTeacherView && submission.status === "submitted") {
    return `<button class="action-button teacher-action" type="button" data-action="evaluate" data-id="${submission.id}">Avaliar entrega</button>`;
  }
  if (!isTeacherView && (submission.status === "pending" || submission.status === "overdue")) {
    return `<button class="action-button" type="button" data-action="submit" data-id="${submission.id}">Enviar atividade</button>`;
  }
  if (submission.status === "evaluated") {
    return `<button class="action-button" type="button" disabled>Avaliada ✓</button>`;
  }
  return `<button class="action-button" type="button" disabled>Aguardando</button>`;
}

function render() {
  renderSummary();
  renderFilters();
  renderActivities();
}

function saveSubmissions() {
  localStorage.setItem("geap-submissions", JSON.stringify(submissions));
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

filterRow.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  currentFilter = button.dataset.filter;
  render();
});

activityList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const submission = submissions.find((item) => item.id === Number(button.dataset.id));
  if (!submission) return;

  if (button.dataset.action === "submit") {
    submission.status = "submitted";
    showToast("Atividade enviada para avaliação!");
  } else if (button.dataset.action === "evaluate") {
    submission.status = "evaluated";
    showToast(`Entrega de ${submission.student} avaliada.`);
  }
  saveSubmissions();
  render();
});

searchInput.addEventListener("input", render);
roleSwitch.addEventListener("click", () => {
  isTeacherView = !isTeacherView;
  roleSwitch.setAttribute("aria-pressed", String(isTeacherView));
  roleSwitchLabel.textContent = isTeacherView ? "Visualizar como aluno" : "Visualizar como professor";
  document.querySelector("#section-title").textContent = isTeacherView ? "Entregas dos alunos" : "Todas as atividades";
  document.querySelector("#new-activity").hidden = !isTeacherView;
  render();
});

document.querySelector("#new-activity").addEventListener("click", () => {
  showToast("A criação de atividades estará disponível em breve.");
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
    render();
    searchInput.blur();
  }
});

document.querySelector("#current-date").textContent = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long"
}).format(new Date()).toLocaleUpperCase("pt-BR");

render();
