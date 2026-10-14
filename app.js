const STORAGE_KEY = 'geap-activities-v1';
const exampleActivities = [
  {
    id: 'sample-1',
    title: 'Ecossistemas brasileiros',
    description: 'Pesquise um bioma brasileiro e apresente suas principais características.',
    subject: 'Ciências',
    className: '8º ano A',
    dueDate: '2026-10-20',
    type: 'Trabalho',
    submissions: [
      { student: 'Alice Ferreira', status: 'submitted' },
      { student: 'Bruno Lima', status: 'pending' },
      { student: 'Camila Souza', status: 'evaluated' },
      { student: 'Diego Martins', status: 'overdue' }
    ]
  },
  {
    id: 'sample-2',
    title: 'Equações do 1º grau',
    description: 'Resolva os exercícios das páginas 42 e 43 do livro didático.',
    subject: 'Matemática',
    className: '9º ano B',
    dueDate: '2026-10-17',
    type: 'Lista de exercícios',
    submissions: [
      { student: 'Felipe Rocha', status: 'submitted' },
      { student: 'Isabela Alves', status: 'pending' },
      { student: 'Lucas Mendes', status: 'evaluated' }
    ]
  },
  {
    id: 'sample-3',
    title: 'Leitura: O pequeno príncipe',
    description: 'Leia os capítulos 8 a 12 e prepare uma reflexão sobre a narrativa.',
    subject: 'Língua Portuguesa',
    className: '7º ano A',
    dueDate: '2026-10-24',
    type: 'Leitura',
    submissions: [
      { student: 'Amanda Costa', status: 'pending' },
      { student: 'Gabriel Santos', status: 'submitted' },
      { student: 'Júlia Ribeiro', status: 'overdue' }
    ]
  }
];

const classRoster = {
  '7º ano a': ['Amanda Costa', 'Gabriel Santos', 'Júlia Ribeiro'],
  '8º ano a': ['Alice Ferreira', 'Bruno Lima', 'Camila Souza', 'Diego Martins'],
  '9º ano b': ['Felipe Rocha', 'Isabela Alves', 'Lucas Mendes']
};
const defaultRoster = ['Ana Silva', 'João Santos', 'Maria Oliveira'];
const deliveryStatuses = {
  pending: 'Pendente',
  submitted: 'Entregue',
  evaluated: 'Avaliada',
  overdue: 'Atrasada'
};

const activityList = document.querySelector('#activity-list');
const activityDialog = document.querySelector('#activity-dialog');
const activityForm = document.querySelector('#activity-form');
const deliveryDialog = document.querySelector('#delivery-dialog');
const deliveryList = document.querySelector('#delivery-list');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search-input');
const typeFilter = document.querySelector('#type-filter');
const toast = document.querySelector('#toast');
let activities = loadActivities();
let toastTimer;
let selectedDeliveryActivity = null;
let selectedDeliveryStatus = 'all';

function loadActivities() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map(ensureSubmissions) : [...exampleActivities];
    }
  } catch {
    return exampleActivities.map((activity) => ({ ...activity, submissions: activity.submissions.map((submission) => ({ ...submission })) }));
  }

  function ensureSubmissions(activity) {
    if (!Array.isArray(activity.submissions)) {
      const roster = classRoster[activity.className.trim().toLocaleLowerCase('pt-BR')] ?? defaultRoster;
      activity.submissions = roster.map((student) => ({ student, status: 'pending' }));
    }
    return activity;
  }
  return [...exampleActivities];
}

function saveActivities() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace('.', '');
}

function getDueLabel(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return 'Prazo encerrado';
  if (days === 0) return 'Entrega hoje';
  if (days === 1) return 'Falta 1 dia';
  return `Faltam ${days} dias`;
}

function getWeekCount() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return activities.filter(({ dueDate }) => {
    const [year, month, day] = dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    return due >= start && due < end;
  }).length;
}

function makeCell(className, content, isHtml = false) {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  if (isHtml) cell.innerHTML = content;
  else cell.textContent = content;
  return cell;
}

function getSubmissionStatus(activity, submission) {
  if (submission.status !== 'pending') return submission.status;
  const [year, month, day] = activity.dueDate.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today ? 'overdue' : 'pending';
}

function renderDeliveryOverview() {
  const counts = Object.fromEntries(Object.keys(deliveryStatuses).map((status) => [status, 0]));
  activities.forEach((activity) => {
    activity.submissions.forEach((submission) => {
      counts[getSubmissionStatus(activity, submission)] += 1;
    });
  });

  const overview = document.querySelector('#delivery-overview');
  overview.innerHTML = `
    <div class="delivery-overview-heading"><strong>Situação das entregas</strong><span>Em todas as turmas</span></div>
    <div class="delivery-overview-items">
      ${Object.entries(deliveryStatuses).map(([status, label]) => `
        <span class="overview-status status-${status}"><i aria-hidden="true"></i>${label}<strong>${counts[status]}</strong></span>
      `).join('')}
    </div>
  `;
}

function renderActivities() {
  const query = searchInput.value.trim().toLocaleLowerCase('pt-BR');
  const selectedType = typeFilter.value;
  const visibleActivities = activities
    .filter((activity) => {
      const searchable = [activity.title, activity.description, activity.subject, activity.className]
        .join(' ')
        .toLocaleLowerCase('pt-BR');
      return searchable.includes(query) && (!selectedType || activity.type === selectedType);
    })
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate));

  activityList.replaceChildren();
  visibleActivities.forEach((activity) => {
    const row = document.createElement('tr');
    row.dataset.id = activity.id;
    row.append(makeCell('activity-name', `<strong>${escapeHtml(activity.title)}</strong><span>${escapeHtml(activity.description)}</span>`, true));
    row.append(makeCell('subject-cell', `<strong>${escapeHtml(activity.subject)}</strong><span>${escapeHtml(activity.className)}</span>`, true));

    const dueCell = document.createElement('td');
    const dueLabel = getDueLabel(activity.dueDate);
    const dueContent = document.createElement('div');
    dueContent.className = `due-cell${dueLabel === 'Entrega hoje' ? ' is-soon' : ''}`;
    const dueDate = document.createElement('strong');
    dueDate.textContent = formatDate(activity.dueDate);
    const dueStatus = document.createElement('span');
    dueStatus.textContent = dueLabel;
    dueContent.append(dueDate, dueStatus);
    dueCell.append(dueContent);
    row.append(dueCell);

    const typeCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `type-badge type-${activity.type.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(' ', '-')}`;
    badge.textContent = activity.type;
    typeCell.append(badge);
    row.append(typeCell);

    const statusCounts = Object.fromEntries(Object.keys(deliveryStatuses).map((status) => [status, 0]));
    activity.submissions.forEach((submission) => {
      statusCounts[getSubmissionStatus(activity, submission)] += 1;
    });
    const submissionCell = document.createElement('td');
    const submissionSummary = document.createElement('div');
    submissionSummary.className = 'submission-summary';
    submissionSummary.innerHTML = `
      <span class="submission-count">${activity.submissions.length} alunos</span>
      <span class="submission-breakdown">${statusCounts.submitted} entregues · ${statusCounts.pending + statusCounts.overdue} pendentes</span>
    `;
    const trackButton = document.createElement('button');
    trackButton.className = 'track-button';
    trackButton.type = 'button';
    trackButton.dataset.action = 'deliveries';
    trackButton.setAttribute('aria-label', `Acompanhar entregas de ${activity.title}`);
    trackButton.textContent = 'Acompanhar';
    submissionSummary.append(trackButton);
    submissionCell.append(submissionSummary);
    row.append(submissionCell);

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'row-actions';
    actions.innerHTML = `<button class="icon-button edit-button" type="button" data-action="edit" aria-label="Editar ${escapeHtml(activity.title)}" title="Editar atividade">✎</button><button class="icon-button delete-button" type="button" data-action="delete" aria-label="Excluir ${escapeHtml(activity.title)}" title="Excluir atividade">⌫</button>`;
    actionsCell.append(actions);
    row.append(actionsCell);
    activityList.append(row);
  });

  const classTotal = new Set(activities.map(({ className }) => className.trim().toLocaleLowerCase('pt-BR'))).size;
  document.querySelector('#total-count').textContent = activities.length;
  document.querySelector('#week-count').textContent = getWeekCount();
  document.querySelector('#class-count').textContent = classTotal;
  document.querySelector('#result-count').textContent = `${visibleActivities.length} ${visibleActivities.length === 1 ? 'atividade' : 'atividades'}`;
  emptyState.hidden = visibleActivities.length > 0;
  document.querySelector('#empty-title').textContent = activities.length === 0 ? 'Nenhuma atividade por aqui' : 'Nenhum resultado encontrado';
  document.querySelector('#empty-description').textContent = activities.length === 0
    ? 'Crie sua primeira atividade para começar a organizar as entregas da turma.'
    : 'Tente ajustar sua busca ou o filtro de tipo.';
  document.querySelector('#empty-create-button').hidden = activities.length > 0;
  renderDeliveryOverview();
}

function renderDeliveryDialog() {
  if (!selectedDeliveryActivity) return;
  const activity = selectedDeliveryActivity;
  document.querySelector('#delivery-title').textContent = activity.title;
  document.querySelector('#delivery-description').textContent = `${activity.subject} · ${activity.className} · Prazo: ${formatDate(activity.dueDate)}`;

  const counts = Object.fromEntries(Object.keys(deliveryStatuses).map((status) => [status, 0]));
  activity.submissions.forEach((submission) => {
    counts[getSubmissionStatus(activity, submission)] += 1;
  });
  document.querySelector('#delivery-summary').innerHTML = Object.entries(deliveryStatuses).map(([status, label]) => `
    <div class="delivery-stat status-${status}"><span>${label}</span><strong>${counts[status]}</strong></div>
  `).join('');

  document.querySelectorAll('[data-status-filter]').forEach((button) => {
    const selected = button.dataset.statusFilter === selectedDeliveryStatus;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });

  const visibleSubmissions = activity.submissions
    .map((submission, index) => ({ ...submission, index, effectiveStatus: getSubmissionStatus(activity, submission) }))
    .filter(({ effectiveStatus }) => selectedDeliveryStatus === 'all' || effectiveStatus === selectedDeliveryStatus);
  deliveryList.innerHTML = visibleSubmissions.length
    ? visibleSubmissions.map(({ student, index, effectiveStatus }) => `
      <div class="delivery-row">
        <span class="student-avatar" aria-hidden="true">${escapeHtml(student.split(' ').map((part) => part[0]).slice(0, 2).join(''))}</span>
        <span class="student-name">${escapeHtml(student)}</span>
        <span class="status-badge status-${effectiveStatus}">${deliveryStatuses[effectiveStatus]}</span>
        <label class="visually-hidden" for="delivery-status-${index}">Situação de ${escapeHtml(student)}</label>
        <select class="delivery-status-select" id="delivery-status-${index}" data-submission-index="${index}" aria-label="Situação de ${escapeHtml(student)}">
          ${Object.entries(deliveryStatuses).map(([status, label]) => `<option value="${status}" ${status === effectiveStatus ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
    `).join('')
    : '<p class="delivery-empty">Nenhum aluno nesta situação.</p>';
}

function openDeliveryDialog(activity) {
  selectedDeliveryActivity = activity;
  selectedDeliveryStatus = 'all';
  renderDeliveryDialog();
  deliveryDialog.showModal();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function openForm(activity) {
  activityForm.reset();
  document.querySelector('#activity-id').value = activity?.id ?? '';
  document.querySelector('#dialog-title').textContent = activity ? 'Editar atividade' : 'Nova atividade';
  document.querySelector('#save-button').textContent = activity ? 'Salvar alterações' : 'Salvar atividade';
  if (activity) {
    document.querySelector('#activity-title').value = activity.title;
    document.querySelector('#activity-description').value = activity.description;
    document.querySelector('#activity-subject').value = activity.subject;
    document.querySelector('#activity-class').value = activity.className;
    document.querySelector('#activity-due-date').value = activity.dueDate;
    document.querySelector('#activity-type').value = activity.type;
  }
  activityDialog.showModal();
  document.querySelector('#activity-title').focus();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

document.querySelector('#new-activity-button').addEventListener('click', () => openForm());
document.querySelector('#empty-create-button').addEventListener('click', () => openForm());
document.querySelector('#close-dialog-button').addEventListener('click', () => activityDialog.close());
document.querySelector('#cancel-dialog-button').addEventListener('click', () => activityDialog.close());
searchInput.addEventListener('input', renderActivities);
typeFilter.addEventListener('change', renderActivities);

activityForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!activityForm.reportValidity()) return;
  const formData = new FormData(activityForm);
  const id = formData.get('id');
  const activity = {
    id: id || `activity-${crypto.randomUUID()}`,
    title: formData.get('title').trim(),
    description: formData.get('description').trim(),
    subject: formData.get('subject').trim(),
    className: formData.get('className').trim(),
    dueDate: formData.get('dueDate'),
    type: formData.get('type')
  };
  const existingIndex = activities.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    activity.submissions = activities[existingIndex].submissions;
    activities[existingIndex] = activity;
    showToast('Atividade atualizada.');
  } else {
    const roster = classRoster[activity.className.trim().toLocaleLowerCase('pt-BR')] ?? defaultRoster;
    activity.submissions = roster.map((student) => ({ student, status: 'pending' }));
    activities.push(activity);
    showToast('Atividade criada.');
  }
  saveActivities();
  renderActivities();
  activityDialog.close();
});

activityList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const row = button.closest('tr');
  const activity = activities.find((item) => item.id === row.dataset.id);
  if (button.dataset.action === 'deliveries') {
    openDeliveryDialog(activity);
    return;
  }
  if (button.dataset.action === 'edit') {
    openForm(activity);
    return;
  }
  if (window.confirm(`Excluir a atividade "${activity.title}"? Essa ação não pode ser desfeita.`)) {
    activities = activities.filter((item) => item.id !== activity.id);
    saveActivities();
    renderActivities();
    showToast('Atividade excluída.');
  }
});

document.querySelector('#close-delivery-dialog').addEventListener('click', () => deliveryDialog.close());
document.querySelector('.delivery-filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-status-filter]');
  if (!button) return;
  selectedDeliveryStatus = button.dataset.statusFilter;
  renderDeliveryDialog();
});

deliveryList.addEventListener('change', (event) => {
  const select = event.target.closest('[data-submission-index]');
  if (!select || !selectedDeliveryActivity) return;
  const submission = selectedDeliveryActivity.submissions[Number(select.dataset.submissionIndex)];
  if (!submission) return;
  submission.status = select.value;
  saveActivities();
  renderActivities();
  renderDeliveryDialog();
  showToast(`Situação de ${submission.student} atualizada.`);
});

document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
}).format(new Date()).replace('.', '');
renderActivities();
