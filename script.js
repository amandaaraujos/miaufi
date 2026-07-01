// --- VARIÁVEIS DE ESTADO DO SISTEMA ---
let user = null;
let selectedCategory = null;
let chatSession = null;
// CONTROLADOR GLOBAL DO FILTRO DE MÊS (Inicializado com o mês atual)
let currentSelectedMonth = currentMonth(); 

// --- DADOS EM MEMÓRIA (MOCK/LOCALSTORAGE) ---
let categoriesData = [
  { id: "c1", name: "Alimentação", limit: 600 },
  { id: "c2", name: "Lazer", limit: 300 },
  { id: "c3", name: "Transporte", limit: 200 },
  { id: "c4", name: "Saúde", limit: 150 },
  { id: "c5", name: "Moradia", limit: 1500 }
];

let transactionsData = [];

// --- ARTIGOS DA CENTRAL DE AJUDA ---
const helpData = [
  {
    category: "Primeiros Passos",
    icon: "🌱",
    articles: [
      { title: "Como cadastrar sua primeira receita", content: "Para cadastrar uma receita, clique em 'Nova movimentação' na tela inicial, selecione o tipo 'Receita (Entrada)', preencha a descrição, valor, data e salve." },
      { title: "Entendendo o saldo disponível", content: "O saldo disponível exibe a soma de todas as suas receitas do mês selecionado menos as despesas daquele mesmo período." }
    ]
  },
  {
    category: "Categorias e Limites",
    icon: "🏷️",
    articles: [
      { title: "Como criar limites mensais", content: "Acesse a aba 'Categorias' pelo menu lateral. No painel direito, insira o nome da nova categoria e defina um teto máximo de gastos. O Miaufi te avisará se você se aproximar do limite." },
      { title: "O que acontece se eu estourar um limite?", content: "A barra de progresso da categoria ficará vermelha. Isso te ajuda a visualizar graficamente onde precisa pisar no freio." }
    ]
  },
  {
    category: "Novelo de Lã (Metas)",
    icon: "🧶",
    articles: [
      { title: "O que é o Novelo de Lã?", content: "É o espaço do Miaufi reservado para suas economias e investimentos de longo prazo. Guardar dinheiro aqui 'isola' esse montante do seu saldo diário da conta." },
      { title: "Como resgatar dinheiro do novelo?", content: "Na aba 'Novelo de Lã', mude a ação para 'Desenrolar (Resgatar dinheiro)', digite o valor e confirme para que ele retorne ao seu fluxo financeiro." }
    ]
  }
];

// --- RESPOSTAS AUTOMÁTICAS DO CHAT DE AJUDA ---
const botResponses = {
  "ola": "Olá! Eu sou o assistente do Miaufi. Como posso te ajudar com suas finanças hoje? Você pode me perguntar sobre 'limites', 'novelo de lã' ou 'saldo'.",
  "oi": "Olá! Eu sou o assistente do Miaufi. Como posso te ajudar com suas finanças hoje? Você pode me perguntar sobre 'limites', 'novelo de lã' ou 'saldo'.",
  "limites": "Você pode gerenciar e criar metas de gastos na aba 'Categorias'. Definir limites ajuda a manter sua saúde financeira em dia!",
  "novelo": "O 'Novelo de Lã' é perfeito para criar reservas! Você pode 'enrolar' dinheiro para guardá-lo ou 'desenrolar' quando precisar resgatá-lo.",
  "saldo": "Seu saldo é calculado de forma mensal com base nas entradas e saídas registradas no período selecionado no topo da tela.",
  "ajuda": "Você pode navegar pelos tópicos da nossa Central de Ajuda ou digitar uma dúvida pontual aqui no chat!"
};

// --- ELEMENTOS DOM PRINCIPAIS ---
const authModal = document.getElementById('authModal');
const appContent = document.getElementById('appContent');
const sidebar = document.getElementById('sidebar');
const transactionModal = document.getElementById('transactionModal');

// --- CARREGAMENTO INICIAL / SISTEMA DE AUTH ---
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa dados salvos se houver
  if(localStorage.getItem('miaufi_categories')) {
    categoriesData = JSON.parse(localStorage.getItem('miaufi_categories'));
  }
  if(localStorage.getItem('miaufi_transactions')) {
    transactionsData = JSON.parse(localStorage.getItem('miaufi_transactions'));
  }
  
  // Tenta recuperar sessão ativa
  const savedUser = localStorage.getItem('miaufi_current_user');
  if(savedUser) {
    user = JSON.parse(savedUser);
    openApp();
  }
});

function showLoginForm() {
  document.getElementById('authChoice').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

function showCreateAccountForm() {
  document.getElementById('authChoice').style.display = 'none';
  document.getElementById('createAccountForm').style.display = 'block';
}

function showPasswordRecoveryForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('recoveryForm').style.display = 'block';
}

function backToAuthChoice() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('createAccountForm').style.display = 'none';
  document.getElementById('recoveryForm').style.display = 'none';
  document.getElementById('authChoice').style.display = 'block';
}

function loginUser() {
  const email = document.getElementById('loginEmail').value.trim();
  if(!email) return alert("Por favor, insira seu e-mail.");
  
  user = {
    name: "Amanda",
    email: email,
    salary: 5000,
    carryOver: true,
    taxes: { inss: { enabled: false, type: 'percent', value: 0 }, irpf: { enabled: false, type: 'percent', value: 0 } }
  };
  
  localStorage.setItem('miaufi_current_user', JSON.stringify(user));
  openApp();
}

function createUserAccount() {
  const name = document.getElementById('createName').value.trim();
  const email = document.getElementById('createEmail').value.trim();
  if(!name || !email) return alert("Preencha os campos para o cadastro.");
  
  user = {
    name: name,
    email: email,
    salary: 0,
    carryOver: false,
    taxes: { inss: { enabled: false, type: 'percent', value: 0 }, irpf: { enabled: false, type: 'percent', value: 0 } }
  };
  
  localStorage.setItem('miaufi_current_user', JSON.stringify(user));
  openApp();
}

function resetPassword() {
  alert("Se o e-mail estiver cadastrado, as instruções de redefinição foram enviadas!");
  backToAuthChoice();
}

function openApp(){
  authModal.style.display = 'none';
  appContent.style.display = 'block';

  // Sincroniza e define o mês inicial como o atual
  currentSelectedMonth = currentMonth();
  updateFilterInputs();

  showPage('home');
  render();
}

function logoutUser() {
  localStorage.removeItem('miaufi_current_user');
  user = null;
  appContent.style.display = 'none';
  authModal.style.display = 'flex';
  backToAuthChoice();
}

// --- FUNÇÕES DE DATA E FORMATÇÃO ---
function currentMonth() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- CONTROLE DE SINCRONIZAÇÃO DO FILTRO DE MÊS ---
function updateFilterInputs() {
  const homeInput = document.getElementById('homeMonthFilter');
  const categoriesInput = document.getElementById('categoriesMonthFilter');
  
  if (homeInput) homeInput.value = currentSelectedMonth;
  if (categoriesInput) categoriesInput.value = currentSelectedMonth;
}

function changeGlobalMonth(newMonth) {
  if (!newMonth) {
    currentSelectedMonth = currentMonth();
  } else {
    currentSelectedMonth = newMonth;
  }
  
  updateFilterInputs();
  
  // Renderiza as telas dependendo de qual estiver ativa
  render(); 
  if (document.getElementById('categories').classList.contains('active')) {
    renderCategories();
  }
}
window.changeGlobalMonth = changeGlobalMonth;

// --- ROTEAMENTO DE PÁGINAS ---
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-links a').forEach(a => a.classList.remove('active'));
  
  const targetPage = document.getElementById(pageId);
  if(targetPage) targetPage.classList.add('active');
  
  const navLink = document.getElementById(`nav-${pageId}`);
  if(navLink) navLink.classList.add('active');
  
  sidebar.classList.remove('open');

  // Gatilhos específicos de renderização por página
  if(pageId === 'home') render();
  if(pageId === 'categories') renderCategories();
  if(pageId === 'wool-ball') renderWoolBall();
  if(pageId === 'settings') loadSettingsForm();
  if(pageId === 'support') initSupportPage();
}

function toggleMenu() {
  sidebar.classList.toggle('open');
}

// --- LOGICA DE RENDERIZAÇÃO DA HOME ---
function render(){
  const month = currentSelectedMonth; // Utiliza o mês ativo no seletor global
  
  document.getElementById('welcome').innerText = `Olá, ${user.name}`;

  const balance = calculateMonthlyBalance(month);
  const saldo = document.getElementById('saldo');
  saldo.innerText = formatCurrency(balance);
  saldo.className = balance >= 0 ? 'saldo positive' : 'saldo negative';

  renderTransactions(month);
  renderInsights(month);
}

function calculateMonthlyBalance(month) {
  let total = Number(user.salary || 0);
  
  // Aplica descontos automáticos se houver receita base configurada nas configurações
  if (total > 0 && user.taxes) {
    if (user.taxes.inss?.enabled) {
      total -= user.taxes.inss.type === 'percent' ? (user.salary * (user.taxes.inss.value / 100)) : user.taxes.inss.value;
    }
    if (user.taxes.irpf?.enabled) {
      total -= user.taxes.irpf.type === 'percent' ? (user.salary * (user.taxes.irpf.value / 100)) : user.taxes.irpf.value;
    }
  }

  // Soma transações do mês corrente
  transactionsData.forEach(t => {
    if(t.date.startsWith(month) && t.category !== 'Metas (Novelo)') {
      if(t.type === 'receita') total += Number(t.value);
      if(t.type === 'despesa') total -= Number(t.value);
    }
  });

  return total;
}

function renderTransactions(month) {
  const container = document.getElementById('transactionsList');
  container.innerHTML = '';

  const filtered = transactionsData.filter(t => t.date.startsWith(month));

  if(filtered.length === 0) {
    container.innerHTML = `<p class="text-secondary">Nenhuma movimentação registrada em ${month}.</p>`;
    return;
  }

  filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    div.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-name">${t.description}</div>
        <div class="transaction-details">${t.category} • ${t.date.split('-').reverse().join('/')}</div>
      </div>
      <div class="transaction-value ${t.type === 'receita' ? 'positive' : 'negative'}">
        ${t.type === 'receita' ? '+' : '-'} ${formatCurrency(t.value)}
        <span class="edit-icon" onclick="openTransactionModal('${t.id}')" style="margin-left:12px; cursor:pointer; font-size:14px;">✏️</span>
        <span class="delete-icon" onclick="deleteTransaction('${t.id}')" style="margin-left:8px; cursor:pointer; font-size:14px;">🗑️</span>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderInsights(month) {
  const expenses = transactionsData.filter(t => t.date.startsWith(month) && t.type === 'despesa');
  
  // Calcula maior gasto individual
  if(expenses.length > 0) {
    const highest = expenses.reduce((max, t) => Number(t.value) > Number(max.value) ? t : max, expenses[0]);
    document.getElementById('highestExpenseName').innerText = highest.description;
    document.getElementById('highestExpenseValue').innerText = formatCurrency(highest.value);
  } else {
    document.getElementById('highestExpenseName').innerText = "Nenhum";
    document.getElementById('highestExpenseValue').innerText = "R$ 0,00";
  }

  // Agrupa e calcula categoria em destaque
  const catTotals = {};
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.value);
  });

  let featuredCat = "Nenhuma";
  let maxCatValue = 0;
  for(const cat in catTotals) {
    if(catTotals[cat] > maxCatValue) {
      maxCatValue = catTotals[cat];
      featuredCat = cat;
    }
  }

  document.getElementById('featuredCategoryName').innerText = featuredCat;
  document.getElementById('featuredCategoryTotal').innerText = `${formatCurrency(maxCatValue)} gastos este mês`;
}

// --- MODAL DE TRANSAÇÕES (INSERIR / EDITAR / DELETAR) ---
function openTransactionModal(id = null) {
  const catSelect = document.getElementById('tCategory');
  catSelect.innerHTML = '';
  categoriesData.forEach(c => {
    catSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
  });
  catSelect.innerHTML += `<option value="Geral">Geral</option>`;
  catSelect.innerHTML += `<option value="Metas (Novelo)">Metas (Novelo)</option>`;

  if(id) {
    document.getElementById('transactionModalTitle').innerText = "Editar Movimentação";
    const t = transactionsData.find(item => item.id === id);
    document.getElementById('editTransactionId').value = t.id;
    document.getElementById('tType').value = t.type;
    document.getElementById('tDescription').value = t.description;
    document.getElementById('tValue').value = t.value;
    document.getElementById('tDate').value = t.date;
    document.getElementById('tCategory').value = t.category;
  } else {
    document.getElementById('transactionModalTitle').innerText = "Nova Movimentação";
    document.getElementById('editTransactionId').value = '';
    document.getElementById('tDescription').value = '';
    document.getElementById('tValue').value = '';
    document.getElementById('tDate').value = new Date().toISOString().split('T')[0];
  }
  transactionModal.style.display = 'flex';
}

function closeTransactionModal() {
  transactionModal.style.display = 'none';
}

function saveEditedTransaction() {
  const id = document.getElementById('editTransactionId').value;
  const type = document.getElementById('tType').value;
  const description = document.getElementById('tDescription').value.trim();
  const valueInput = document.getElementById('tValue').value.replace(',', '.');
  const date = document.getElementById('tDate').value;
  const category = document.getElementById('tCategory').value;

  if(!description || !valueInput) return alert("Preencha todos os campos.");
  const value = parseFloat(valueInput);

  if(id) {
    const idx = transactionsData.findIndex(t => t.id === id);
    transactionsData[idx] = { id, type, description, value, date, category };
  } else {
    const newT = { id: 't_' + Date.now(), type, description, value, date, category };
    transactionsData.push(newT);
  }

  localStorage.setItem('miaufi_transactions', JSON.stringify(transactionsData));
  closeTransactionModal();
  render();
  if (document.getElementById('categories').classList.contains('active')) renderCategories();
}

function deleteTransaction(id) {
  if(confirm("Deseja realmente excluir esta movimentação?")) {
    transactionsData = transactionsData.filter(t => t.id !== id);
    localStorage.setItem('miaufi_transactions', JSON.stringify(transactionsData));
    render();
    if (document.getElementById('categories').classList.contains('active')) renderCategories();
  }
}

// --- LÓGICA DA TELA DE CATEGORIAS ---
function renderCategories() {
  updateFilterInputs();
  const month = currentSelectedMonth; // Garante o alinhamento com o filtro dinâmico
  
  const grid = document.getElementById('categoriesGrid');
  grid.innerHTML = '';

  categoriesData.forEach(c => {
    // Soma gastos apenas dessa categoria no mês corrente
    const spent = transactionsData
      .filter(t => t.category === c.name && t.type === 'despesa' && t.date.startsWith(month))
      .reduce((sum, t) => sum + Number(t.value), 0);

    const pct = c.limit ? Math.min((spent / c.limit) * 100, 100) : 0;
    const isOver = c.limit && spent > c.limit;

    const card = document.createElement('div');
    card.className = `category-card card ${isOver ? 'danger-border' : ''}`;
    card.onclick = () => openCategoryDetail(c.id);
    card.innerHTML = `
      <div class="category-card-header">
        <h3 class="category-card-title">${c.name}</h3>
        <span class="category-card-value">${formatCurrency(spent)} ${c.limit ? '/ ' + formatCurrency(c.limit) : ''}</span>
      </div>
      ${c.limit ? `
        <div class="progress-bar-container" style="margin-top: 12px;">
          <div class="progress-bar ${isOver ? 'danger' : ''}" style="width: ${pct}%"></div>
        </div>
      ` : ''}
    `;
    grid.appendChild(card);
  });
}

function addCategory() {
  const name = document.getElementById('newCategoryName').value.trim();
  const limitInput = document.getElementById('newCategoryLimit').value.replace(',', '.');
  
  if(!name) return alert("Por favor, digite um nome para a categoria.");
  const limit = limitInput ? parseFloat(limitInput) : null;

  categoriesData.push({ id: 'c_' + Date.now(), name, limit });
  localStorage.setItem('miaufi_categories', JSON.stringify(categoriesData));
  
  document.getElementById('newCategoryName').value = '';
  document.getElementById('newCategoryLimit').value = '';
  renderCategories();
}

function openCategoryDetail(id) {
  selectedCategory = categoriesData.find(c => c.id === id);
  showPage('category-detail');
  
  document.getElementById('categoryDetailTitle').innerText = selectedCategory.name;
  const month = currentSelectedMonth;

  const spent = transactionsData
    .filter(t => t.category === selectedCategory.name && t.type === 'despesa' && t.date.startsWith(month))
    .reduce((sum, t) => sum + Number(t.value), 0);

  document.getElementById('categoryDetailSpent').innerText = `Gasto total: ${formatCurrency(spent)}`;
  
  const progressBar = document.getElementById('categoryDetailProgressBar');
  const statusText = document.getElementById('categoryDetailStatusText');

  if(selectedCategory.limit) {
    document.getElementById('categoryDetailLimit').innerText = `Limite estipulado: ${formatCurrency(selectedCategory.limit)}`;
    const pct = Math.min((spent / selectedCategory.limit) * 100, 100);
    progressBar.style.width = `${pct}%`;
    
    if(spent > selectedCategory.limit) {
      progressBar.className = "progress-bar danger";
      statusText.innerText = "Atenção: O teto planejado para esta categoria foi ultrapassado!";
      statusText.className = "progress-status-text danger";
    } else {
      progressBar.className = "progress-bar";
      statusText.innerText = `Você utilizou ${pct.toFixed(1)}% do seu orçamento limite disponível.`;
      statusText.className = "progress-status-text";
    }
  } else {
    document.getElementById('categoryDetailLimit').innerText = "Sem teto configurado";
    progressBar.style.width = `0%`;
    statusText.innerText = "Esta categoria não possui um teto de limite configurado.";
  }

  // Lista registros específicos na tela de detalhe
  const listContainer = document.getElementById('categoryDetailTransactions');
  listContainer.innerHTML = '';
  const filtered = transactionsData.filter(t => t.category === selectedCategory.name && t.date.startsWith(month));
  
  if(filtered.length === 0) {
    listContainer.innerHTML = "<p class='text-secondary'>Nenhum lançamento associado neste mês.</p>";
    return;
  }

  filtered.forEach(t => {
    listContainer.innerHTML += `
      <div class="transaction-item">
        <div>
          <div class="transaction-name">${t.description}</div>
          <div class="transaction-details">${t.date.split('-').reverse().join('/')}</div>
        </div>
        <div class="transaction-value ${t.type === 'receita' ? 'positive' : 'negative'}">
          ${t.type === 'receita' ? '+' : '-'} ${formatCurrency(t.value)}
        </div>
      </div>
    `;
  });
}

function openFeaturedCategoryDetail() {
  const name = document.getElementById('featuredCategoryName').innerText;
  if(name === "Nenhuma") return;
  const cat = categoriesData.find(c => c.name === name);
  if(cat) openCategoryDetail(cat.id);
}

// --- LÓGICA DO NOVELO DE LÃ (METAS) ---
function renderWoolBall() {
  const total = transactionsData
    .filter(t => t.category === 'Metas (Novelo)')
    .reduce((sum, t) => t.type === 'receita' ? sum + Number(t.value) : sum - Number(t.value), 0);

  document.getElementById('woolBallTotal').innerText = formatCurrency(Math.max(0, total));

  const history = document.getElementById('woolBallHistory');
  history.innerHTML = '';

  const movements = transactionsData.filter(t => t.category === 'Metas (Novelo)');
  if(movements.length === 0) {
    history.innerHTML = "<p class='text-secondary'>Nenhuma movimentação no seu novelo ainda.</p>";
    return;
  }

  movements.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(m => {
    history.innerHTML += `
      <div class="transaction-item">
        <div>
          <div class="transaction-name">${m.description}</div>
          <div class="transaction-details">${m.type === 'receita' ? 'Enrolado (Guardado)' : 'Desenrolado (Resgatado)'} • ${m.date.split('-').reverse().join('/')}</div>
        </div>
        <div class="transaction-value ${m.type === 'receita' ? 'positive' : 'negative'}">
          ${formatCurrency(m.value)}
        </div>
      </div>
    `;
  });
}

function saveWoolBallMovement() {
  const action = document.getElementById('woolBallAction').value;
  const valueInput = document.getElementById('woolBallValue').value.replace(',', '.');
  const description = document.getElementById('woolBallDescription').value.trim();

  if(!valueInput || !description) return alert("Preencha o valor e a justificativa/objetivo.");
  const value = parseFloat(valueInput);

  // 'enrolar' funciona como entrada no novelo (receita), 'desenrolar' como retirada (despesa)
  const newMovement = {
    id: 'w_' + Date.now(),
    type: action === 'enrolar' ? 'receita' : 'despesa',
    description: description,
    value: value,
    date: new Date().toISOString().split('T')[0],
    category: 'Metas (Novelo)'
  };

  transactionsData.push(newMovement);
  localStorage.setItem('miaufi_transactions', JSON.stringify(transactionsData));

  document.getElementById('woolBallValue').value = '';
  document.getElementById('woolBallDescription').value = '';
  renderWoolBall();
}

// --- LÓGICA DE CONFIGURAÇÕES ---
function loadSettingsForm() {
  document.getElementById('settingsName').value = user.name;
  document.getElementById('settingsSalary').value = user.salary || '';
  document.getElementById('settingsCarryOver').checked = user.carryOver || false;
  
  if(user.taxes) {
    document.getElementById('inssEnabled').checked = user.taxes.inss?.enabled || false;
    document.getElementById('inssType').value = user.taxes.inss?.type || 'percent';
    document.getElementById('inssValue').value = user.taxes.inss?.value || '';

    document.getElementById('irpfEnabled').checked = user.taxes.irpf?.enabled || false;
    document.getElementById('irpfType').value = user.taxes.irpf?.type || 'percent';
    document.getElementById('irpfValue').value = user.taxes.irpf?.value || '';
  }
}

function saveAccountSettings() {
  const name = document.getElementById('settingsName').value.trim();
  const salaryInput = document.getElementById('settingsSalary').value.replace(',', '.');
  
  if(!name) return alert("O nome não pode ficar em branco.");

  user.name = name;
  user.salary = salaryInput ? parseFloat(salaryInput) : 0;
  user.carryOver = document.getElementById('settingsCarryOver').checked;

  user.taxes = {
    inss: {
      enabled: document.getElementById('inssEnabled').checked,
      type: document.getElementById('inssType').value,
      value: parseFloat(document.getElementById('inssValue').value.replace(',', '.')) || 0
    },
    irpf: {
      enabled: document.getElementById('irpfEnabled').checked,
      type: document.getElementById('irpfType').value,
      value: parseFloat(document.getElementById('irpfValue').value.replace(',', '.')) || 0
    }
  };

  localStorage.setItem('miaufi_current_user', JSON.stringify(user));
  alert("Configurações atualizadas com sucesso!");
  render();
}

// --- CENTRAL DE AJUDA E CHAT ---
function initSupportPage() {
  backToSupportHome();
}

function openHelpCenter() {
  document.getElementById('supportHome').style.display = 'none';
  document.getElementById('helpCenter').style.display = 'block';

  const grid = document.getElementById('helpCategoriesGrid');
  grid.innerHTML = '';

  helpData.forEach((h, index) => {
    grid.innerHTML += `
      <div class="support-card" style="cursor:pointer;" onclick="openHelpCategory(${index})">
        <div style="font-size:32px; margin-bottom:12px;">${h.icon}</div>
        <h3>${h.category}</h3>
        <p>Possui ${h.articles.length} tópicos explicativos.</p>
      </div>
    `;
  });
}

function openHelpCategory(index) {
  document.getElementById('helpCenter').style.display = 'none';
  document.getElementById('helpCategoryDetail').style.display = 'block';

  const cat = helpData[index];
  document.getElementById('helpCategoryTitle').innerText = cat.category;

  const container = document.getElementById('articlesList');
  container.innerHTML = '';
  cat.articles.forEach(art => {
    container.innerHTML += `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:8px; color:var(--primary);">${art.title}</h3>
        <p style="font-size:15px; line-height:1.5;">${art.content}</p>
      </div>
    `;
  });
}

function startHelpChat() {
  document.getElementById('supportHome').style.display = 'none';
  document.getElementById('supportChat').style.display = 'block';
  
  const messages = document.getElementById('chatMessages');
  messages.innerHTML = `
    <div class="chat-message bot">
      Olá! Sou o assistente virtual da Miaufi. Como posso te auxiliar a gerenciar seu dinheiro hoje?
    </div>
  `;
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const txt = input.value.trim();
  if(!txt) return;

  const container = document.getElementById('chatMessages');
  
  // Mensagem Usuário
  container.innerHTML += `<div class="chat-message user">${txt}</div>`;
  input.value = '';

  // Processa Resposta do Bot
  setTimeout(() => {
    const cleanTxt = txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let response = "Desculpe, ainda estou aprendendo e não entendi. Você pode tentar usar palavras-chave como 'limites', 'novelo' ou verificar nossa Central de Ajuda!";
    
    for(const key in botResponses) {
      if(cleanTxt.includes(key)) {
        response = botResponses[key];
        break;
      }
    }
    
    container.innerHTML += `<div class="chat-message bot">${response}</div>`;
    container.scrollTop = container.scrollHeight;
  }, 600);
}

function backToSupportHome() {
  document.getElementById('helpCenter').style.display = 'none';
  document.getElementById('helpCategoryDetail').style.display = 'none';
  document.getElementById('supportChat').style.display = 'none';
  document.getElementById('supportHome').style.display = 'block';
}

function backToHelpCenter() {
  document.getElementById('helpCategoryDetail').style.display = 'none';
  document.getElementById('helpCenter').style.display = 'block';
}
