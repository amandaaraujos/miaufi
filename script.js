let users =
  JSON.parse(localStorage.getItem('users')) || {};

let currentUserEmail =
  localStorage.getItem('currentUserEmail') || null;

let user =
  currentUserEmail && users[currentUserEmail]
    ? users[currentUserEmail]
    : null;

let transactions =
  user?.transactions || [];

let woolBallMovements =
  user?.woolBallMovements || [];

let carryOver =
  user?.carryOver || false;

let fixedTaxes =
  user?.fixedTaxes || {
    inss: { enabled: false, type: 'percent', value: 0 },
    irpf: { enabled: false, type: 'percent', value: 0 }
  };

let featuredCategory =
  null;

let selectedCategory =
  null;

let selectedHelpCategory =
  null;

const helpCategories = {
  'primeiros-passos': {
    title: 'Primeiros passos',
    description: 'Aprenda a configurar sua conta e começar a usar o Miaufi.',
    articles: [
      {
        title: 'Artigo 1',
        description: 'Como criar sua conta no Miaufi.'
      },
      {
        title: 'Artigo 2',
        description: 'Como informar seu salário.'
      },
      {
        title: 'Artigo 3',
        description: 'Como entender seu saldo disponível.'
      }
    ]
  },

  movimentacoes: {
    title: 'Movimentações e categorias',
    description: 'Entenda como registrar gastos, entradas, parcelas e categorias.',
    articles: [
      {
        title: 'Artigo 1',
        description: 'Como adicionar uma entrada ou gasto.'
      },
      {
        title: 'Artigo 2',
        description: 'Como dividir uma compra em parcelas.'
      },
      {
        title: 'Artigo 3',
        description: 'Como usar categorias para organizar seus registros.'
      }
    ]
  },

  'conta-seguranca': {
    title: 'Conta, segurança e histórico',
    description: 'Veja como cuidar da sua conta, senha, histórico e dados salvos.',
    articles: [
      {
        title: 'Artigo 1',
        description: 'Como recuperar sua senha.'
      },
      {
        title: 'Artigo 2',
        description: 'Como consultar o extrato mensal.'
      },
      {
        title: 'Artigo 3',
        description: 'Como apagar registros do histórico.'
      }
    ]
  }
};

const appContent = document.getElementById('appContent');
const authModal = document.getElementById('authModal');
const authChoice = document.getElementById('authChoice');
const loginForm = document.getElementById('loginForm');
const passwordRecoveryForm = document.getElementById('passwordRecoveryForm');
const createAccountForm = document.getElementById('createAccountForm');
const transactionModal = document.getElementById('transactionModal');

const anotherMonth = document.getElementById('anotherMonth');
const amountInput = document.getElementById('amount');
const hasInstallments = document.getElementById('hasInstallments');
const installmentsBox = document.getElementById('installmentsBox');

if(Notification.permission !== 'granted'){
  Notification.requestPermission();
}

setInterval(() => {
  const now = new Date();

  if(now.getHours() === 21 && now.getMinutes() === 0){
    if(Notification.permission === 'granted'){
      new Notification('💰 Registre os gastos de hoje!');
    }
  }
}, 60000);

amountInput.addEventListener('input', formatDecimalInput);

anotherMonth.addEventListener('change', () => {
  document.getElementById('month').style.display =
    anotherMonth.checked ? 'block' : 'none';
});

hasInstallments.addEventListener('change', () => {
  installmentsBox.style.display =
    hasInstallments.checked ? 'block' : 'none';

  if(!hasInstallments.checked){
    document.getElementById('installments').value = 1;
  }
});

function parseBrazilianNumber(value){
  let cleanValue =
    String(value)
      .replace('R$', '')
      .replace(/\s/g, '')
      .trim();

  if(cleanValue.includes(',') && cleanValue.includes('.')){
    cleanValue =
      cleanValue
        .replace(/\./g, '')
        .replace(',', '.');
  } else if(cleanValue.includes(',')){
    cleanValue =
      cleanValue.replace(',', '.');
  }

  return Number(cleanValue);
}

function formatDecimalInput(e){
  e.target.value =
    e.target.value
      .replace(/[^\d,\.]/g, '')
      .replace(/\.(?=.*\.)/g, '')
      .replace(/,(?=.*,)/g, '');
}

function formatCurrency(value){
  const signal =
    value >= 0 ? '+' : '-';

  return `${signal}R$${Math.abs(value)
    .toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
}

function parsePercent(value){
  return Number(
    String(value)
      .replace('%', '')
      .replace(',', '.')
      .trim()
  );
}

function parseDiscountValue(taxKey){
  const type =
    document.getElementById(`${taxKey}Type`).value;

  const value =
    document.getElementById(`${taxKey}Value`).value;

  if(type === 'value'){
    return parseBrazilianNumber(value);
  }

  return parsePercent(value);
}

function hideAllAuthForms(){
  authChoice.classList.add('hidden');
  loginForm.classList.add('hidden');
  passwordRecoveryForm.classList.add('hidden');
  createAccountForm.classList.add('hidden');
}

function showLoginForm(){
  hideAllAuthForms();

  const loginError =
    document.getElementById('loginError');

  if(loginError){
    loginError.innerText = '';
    loginError.className = 'negative';
  }

  loginForm.classList.remove('hidden');
}

function showPasswordRecoveryForm(){
  hideAllAuthForms();

  const loginEmail =
    document.getElementById('loginEmail').value.trim().toLowerCase();

  document.getElementById('recoveryEmail').value =
    loginEmail || '';

  document.getElementById('recoveryPassword').value =
    '';

  passwordRecoveryForm.classList.remove('hidden');
}

function showCreateAccountForm(){
  hideAllAuthForms();
  createAccountForm.classList.remove('hidden');
}

function backToAuthChoice(){
  hideAllAuthForms();
  authChoice.classList.remove('hidden');
}

function saveUsers(){
  localStorage.setItem(
    'users',
    JSON.stringify(users)
  );
}

function createUserAccount(){
  const name =
    document.getElementById('userName').value.trim();

  const email =
    document.getElementById('userEmail').value.trim().toLowerCase();

  const password =
    document.getElementById('userPassword').value;

  const salary =
    parseBrazilianNumber(
      document.getElementById('userSalary').value
    );

  const type =
    document.getElementById('salaryType').value;

  if(!name || !email || !password || !salary){
    alert('Preencha todos os campos');
    return;
  }

  if(users[email]){
    alert('Já existe uma conta com este e-mail');
    return;
  }

  users[email] = {
    name,
    email,
    password,
    salary,
    type,
    transactions: [],
    woolBallMovements: [],
    carryOver: false,
    fixedTaxes: {
      inss: { enabled: false, type: 'percent', value: 0 },
      irpf: { enabled: false, type: 'percent', value: 0 }
    }
  };

  currentUserEmail = email;
  user = users[email];
  transactions = user.transactions;
  woolBallMovements = user.woolBallMovements;
  carryOver = user.carryOver;
  fixedTaxes = user.fixedTaxes;

  localStorage.setItem(
    'currentUserEmail',
    currentUserEmail
  );

  saveUsers();
  openApp();
}

function loginUser(){
  const email =
    document.getElementById('loginEmail').value.trim().toLowerCase();

  const password =
    document.getElementById('loginPassword').value;

  const loginError =
    document.getElementById('loginError');

  if(loginError){
    loginError.innerText = '';
    loginError.className = 'negative';
  }

  if(!email || !password){
    if(loginError){
      loginError.innerText = 'Preencha e-mail e senha.';
    } else {
      alert('Preencha e-mail e senha');
    }

    return;
  }

  if(!users[email]){
    if(loginError){
      loginError.innerText = 'Conta não encontrada.';
    } else {
      alert('Conta não encontrada');
    }

    return;
  }

  if(users[email].password !== password){
    if(loginError){
      loginError.innerText = 'A senha não confere. Tente novamente.';
    } else {
      alert('Senha incorreta');
    }

    return;
  }

  currentUserEmail = email;
  user = users[email];
  transactions = user.transactions || [];
  woolBallMovements = user.woolBallMovements || [];
  carryOver = user.carryOver || false;

  fixedTaxes =
    user.fixedTaxes || {
      inss: { enabled: false, type: 'percent', value: 0 },
      irpf: { enabled: false, type: 'percent', value: 0 }
    };

  localStorage.setItem(
    'currentUserEmail',
    currentUserEmail
  );

  openApp();
}

function resetPassword(){
  const email =
    document.getElementById('recoveryEmail').value.trim().toLowerCase();

  const newPassword =
    document.getElementById('recoveryPassword').value;

  if(!email || !newPassword){
    alert('Preencha e-mail e nova senha');
    return;
  }

  if(!users[email]){
    alert('Conta não encontrada');
    return;
  }

  users[email].password =
    newPassword;

  saveUsers();

  document.getElementById('loginEmail').value =
    email;

  document.getElementById('loginPassword').value =
    '';

  showLoginForm();

  const loginError =
    document.getElementById('loginError');

  if(loginError){
    loginError.innerText =
      'Senha alterada com sucesso. Faça login com a nova senha.';

    loginError.className =
      'positive';
  }
}

function logoutUser(){
  localStorage.removeItem('currentUserEmail');

  currentUserEmail = null;
  user = null;
  transactions = [];
  woolBallMovements = [];
  carryOver = false;
  selectedCategory = null;
  featuredCategory = null;
  selectedHelpCategory = null;

  fixedTaxes = {
    inss: { enabled: false, type: 'percent', value: 0 },
    irpf: { enabled: false, type: 'percent', value: 0 }
  };

  appContent.style.display = 'none';
  authModal.style.display = 'flex';

  hideAllAuthForms();
  authChoice.classList.remove('hidden');
}

function openApp(){
  authModal.style.display = 'none';
  appContent.style.display = 'block';

  showPage('home');
  render();
}

function saveData(){
  if(!user || !currentUserEmail){
    return;
  }

  user.transactions = transactions;
  user.woolBallMovements = woolBallMovements;
  user.carryOver = carryOver;
  user.fixedTaxes = fixedTaxes;

  users[currentUserEmail] = user;

  saveUsers();
}

function closeMenu(){
  const menu =
    document.getElementById('menu');

  if(menu){
    menu.style.display = 'none';
  }
}

function toggleMenu(){
  const menu =
    document.getElementById('menu');

  menu.style.display =
    menu.style.display === 'flex'
      ? 'none'
      : 'flex';
}

function showPage(page){
  document.querySelectorAll('.page')
    .forEach(p => {
      p.classList.remove('active');
    });

  document.getElementById(page)
    .classList.add('active');

  closeMenu();

  if(page === 'history'){
    renderHistory();
  }

  if(page === 'categories'){
    renderCategories();
  }

  if(page === 'settings'){
    renderAccountSettings();
  }

  if(page === 'categoryDetail'){
    renderCategoryDetail();
  }

  if(page === 'woolBall'){
    renderWoolBall();
  }

  if(page === 'helpCategoryDetail'){
    renderHelpCategoryDetail();
  }
}

function currentMonth(){
  const now =
    new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
}

function getMonthByOffset(baseMonth, offset){
  const date =
    new Date(baseMonth + '-01T00:00:00');

  date.setMonth(date.getMonth() + offset);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

function addTransaction(){
  const type =
    document.getElementById('type').value;

  const name =
    document.getElementById('name').value.trim();

  const amount =
    parseBrazilianNumber(
      document.getElementById('amount').value
    );

  const signedAmount =
    type === 'expense'
      ? -Math.abs(amount)
      : Math.abs(amount);

  const category =
    document.getElementById('category').value.trim();

  const installments =
    hasInstallments.checked
      ? Number(document.getElementById('installments').value)
      : 1;

  const fixed =
    document.getElementById('fixed').checked;

  const selectedMonth =
    document.getElementById('month').value;

  const startMonth =
    hasInstallments.checked
      ? currentMonth()
      : selectedMonth || currentMonth();

  if(!name || !amount){
    alert('Preencha nome e valor');
    return;
  }

  if(!installments || installments < 1){
    alert('Informe uma quantidade válida de parcelas');
    return;
  }

  const createdAt =
    new Date().toISOString();

  const parentId =
    crypto.randomUUID();

  const totalMonths =
    fixed ? 60 : installments;

  for(let i = 0; i < totalMonths; i++){
    const finalMonth =
      getMonthByOffset(startMonth, i);

    transactions.push({
      id: crypto.randomUUID(),
      parentId,
      type,
      name,
      amount: fixed
        ? signedAmount
        : signedAmount / installments,
      category,
      month: finalMonth,
      fixed,
      installment: fixed || installments === 1
        ? null
        : `${i + 1}/${installments}`,
      createdAt
    });
  }

  saveData();
  clearForm();
  render();

  if(document.getElementById('history').classList.contains('active')){
    renderHistory();
  }

  if(document.getElementById('categories').classList.contains('active')){
    renderCategories();
  }

  if(document.getElementById('categoryDetail').classList.contains('active')){
    renderCategoryDetail();
  }
}

function clearForm(){
  document.getElementById('name').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('category').value = '';
  document.getElementById('installments').value = 1;

  document.getElementById('fixed').checked = false;
  document.getElementById('hasInstallments').checked = false;
  document.getElementById('anotherMonth').checked = false;

  document.getElementById('month').style.display = 'none';

  installmentsBox.style.display = 'none';
}

function getFixedTaxAmount(taxKey){
  const tax =
    fixedTaxes?.[taxKey];

  if(!tax || !tax.enabled){
    return 0;
  }

  const grossSalary =
    Number(user.salary) || 0;

  if(tax.type === 'percent'){
    return -Math.abs(
      grossSalary * (Number(tax.value) / 100)
    );
  }

  return -Math.abs(Number(tax.value));
}

function getAutomaticMonthlyTransactions(month){
  const automatic = [];

  const inssAmount =
    getFixedTaxAmount('inss');

  const irpfAmount =
    getFixedTaxAmount('irpf');

  if(inssAmount){
    automatic.push({
      id: `auto-inss-${month}`,
      type: 'expense',
      name: 'INSS',
      amount: inssAmount,
      category: 'Impostos',
      month,
      fixed: true,
      automatic: true,
      createdAt: `${month}-01T00:00:00.000Z`
    });
  }

  if(irpfAmount){
    automatic.push({
      id: `auto-irpf-${month}`,
      type: 'expense',
      name: 'IRPF',
      amount: irpfAmount,
      category: 'Impostos',
      month,
      fixed: true,
      automatic: true,
      createdAt: `${month}-01T00:00:00.000Z`
    });
  }

  return automatic;
}

function getTransactionsForMonth(month){
  return [
    ...transactions.filter(t => t.month === month),
    ...getAutomaticMonthlyTransactions(month)
  ];
}

function calculateMonthlyBalance(month){
  const monthly =
    getTransactionsForMonth(month);

  let total =
    Number(user.salary);

  if(carryOver){
    const previousMonths =
      getAllVisibleMonths()
        .filter(m => m < month)
        .sort();

    previousMonths.forEach(m => {
      const monthTransactions =
        getTransactionsForMonth(m);

      let subtotal =
        Number(user.salary);

      monthTransactions.forEach(t => {
        subtotal += t.amount;
      });

      total += subtotal;
    });
  }

  monthly.forEach(t => {
    total += t.amount;
  });

  return total;
}

function getAllVisibleMonths(){
  const months =
    new Set();

  const now =
    new Date();

  const currentYear =
    now.getFullYear();

  for(let month = 1; month <= 12; month++){
    months.add(
      `${currentYear}-${String(month).padStart(2, '0')}`
    );
  }

  transactions.forEach(t => {
    const transactionYear =
      Number(t.month.split('-')[0]);

    if(transactionYear === currentYear){
      months.add(t.month);
    }
  });

  return [...months].sort();
}

function render(){
  const month =
    currentMonth();

  document.getElementById('welcome')
    .innerText = `Olá, ${user.name}`;

  const balance =
    calculateMonthlyBalance(month);

  const saldo =
    document.getElementById('saldo');

  saldo.innerText =
    formatCurrency(balance);

  saldo.className =
    balance >= 0
      ? 'saldo positive'
      : 'saldo negative';

  renderTransactions(month);
  renderInsights(month);
}

function renderTransactions(month){
  const currentTransactions =
    getTransactionsForMonth(month)
      .sort((a,b) => {
        const dateA =
          new Date(a.createdAt || 0);

        const dateB =
          new Date(b.createdAt || 0);

        return dateB - dateA;
      });

  const list =
    document.getElementById('transactions');

  list.innerHTML = '';

  if(currentTransactions.length === 0){
    list.innerHTML =
      '<p>Nenhuma movimentação registrada neste mês</p>';
    return;
  }

  currentTransactions.forEach(t => {
    const clickableClass =
      t.automatic ? '' : 'clickable';

    const clickAction =
      t.automatic
        ? ''
        : `onclick="openTransactionModal('${t.id}')"`;

    list.innerHTML += `
      <div class="transaction ${clickableClass}" ${clickAction}>
        <div>
          <strong>${t.name}</strong>
          <p>${t.category || 'Sem categoria'}</p>
          ${t.installment ? `<small>Parcela ${t.installment}</small>` : ''}
          ${t.fixed ? `<small> • Fixo</small>` : ''}
          ${t.automatic ? `<small> • Automático</small>` : ''}
        </div>

        <div class="${t.amount >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(t.amount)}
        </div>
      </div>
    `;
  });
}

function openTransactionModal(transactionId){
  const transaction =
    transactions.find(t => t.id === transactionId);

  if(!transaction){
    return;
  }

  document.getElementById('editTransactionId').value =
    transaction.id;

  document.getElementById('editType').value =
    transaction.type;

  document.getElementById('editName').value =
    transaction.name;

  document.getElementById('editCategory').value =
    transaction.category || '';

  document.getElementById('editAmount').value =
    Math.abs(transaction.amount)
      .toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

  transactionModal.classList.remove('hidden');
}

function closeTransactionModal(){
  transactionModal.classList.add('hidden');
}

function saveEditedTransaction(){
  const transactionId =
    document.getElementById('editTransactionId').value;

  const transaction =
    transactions.find(t => t.id === transactionId);

  if(!transaction){
    return;
  }

  const type =
    document.getElementById('editType').value;

  const name =
    document.getElementById('editName').value.trim();

  const category =
    document.getElementById('editCategory').value.trim();

  const amount =
    parseBrazilianNumber(
      document.getElementById('editAmount').value
    );

  if(!name || !amount){
    alert('Preencha nome e valor');
    return;
  }

  transaction.type =
    type;

  transaction.name =
    name;

  transaction.category =
    category;

  transaction.amount =
    type === 'expense'
      ? -Math.abs(amount)
      : Math.abs(amount);

  transaction.updatedAt =
    new Date().toISOString();

  saveData();
  closeTransactionModal();
  render();

  if(document.getElementById('history').classList.contains('active')){
    renderHistory();
  }

  if(document.getElementById('categories').classList.contains('active')){
    renderCategories();
  }

  if(document.getElementById('categoryDetail').classList.contains('active')){
    renderCategoryDetail();
  }
}

function deleteTransaction(){
  const transactionId =
    document.getElementById('editTransactionId').value;

  const transaction =
    transactions.find(t => t.id === transactionId);

  if(!transaction){
    return;
  }

  const shouldDelete =
    confirm('Deseja apagar esta movimentação?');

  if(!shouldDelete){
    return;
  }

  transactions =
    transactions.filter(t => t.id !== transactionId);

  saveData();
  closeTransactionModal();
  render();

  if(document.getElementById('history').classList.contains('active')){
    renderHistory();
  }

  if(document.getElementById('categories').classList.contains('active')){
    renderCategories();
  }

  if(document.getElementById('categoryDetail').classList.contains('active')){
    renderCategoryDetail();
  }
}

function renderInsights(month){
  const currentTransactions =
    getTransactionsForMonth(month);

  const biggest =
    currentTransactions
      .filter(t => t.type === 'expense')
      .sort((a,b) =>
        Math.abs(b.amount) - Math.abs(a.amount)
      )[0];

  document.getElementById('biggestExpense')
    .innerText =
      biggest
        ? `${biggest.name} ${formatCurrency(biggest.amount)}`
        : 'Nenhuma movimentação';

  const categoryTotals = {};

  currentTransactions.forEach(t => {
    const categoryName =
      t.category || 'Sem categoria';

    if(!categoryTotals[categoryName]){
      categoryTotals[categoryName] = 0;
    }

    categoryTotals[categoryName] += t.amount;
  });

  const best =
    Object.entries(categoryTotals)
      .sort((a,b) => b[1] - a[1])[0];

  featuredCategory =
    best ? best[0] : null;

  document.getElementById('bestCategory')
    .innerText =
      best
        ? `${best[0]} ${formatCurrency(best[1])}`
        : 'Nenhuma categoria';

  const months =
    getAllVisibleMonths();

  const comparison =
    document.getElementById('comparison');

  if(months.length >= 2){
    const current =
      calculateMonthlyBalance(
        months[months.length - 1]
      );

    const previous =
      calculateMonthlyBalance(
        months[months.length - 2]
      );

    const diff =
      current - previous;

    comparison.innerText =
      diff >= 0
        ? `Economia de ${formatCurrency(diff)}`
        : `Gasto de ${formatCurrency(diff)}`;

    comparison.className =
      diff >= 0 ? 'positive' : 'negative';

  } else {
    comparison.innerText = 'Sem comparação';
    comparison.className = '';
  }
}

function openFeaturedCategoryDetail(){
  if(!featuredCategory){
    alert('Ainda não há categoria em destaque neste mês.');
    return;
  }

  openCategoryDetail(featuredCategory);
}

function openCategoryDetail(category){
  selectedCategory =
    category || 'Sem categoria';

  showPage('categoryDetail');
}

function renderCategoryDetail(){
  if(!selectedCategory){
    showPage('categories');
    return;
  }

  const month =
    currentMonth();

  const monthlyTransactions =
    getTransactionsForMonth(month)
      .filter(t => {
        const category =
          t.category || 'Sem categoria';

        return category === selectedCategory;
      })
      .sort((a,b) => {
        const dateA =
          new Date(a.createdAt || 0);

        const dateB =
          new Date(b.createdAt || 0);

        return dateB - dateA;
      });

  const title =
    document.getElementById('categoryDetailTitle');

  const subtitle =
    document.getElementById('categoryDetailSubtitle');

  const totalBox =
    document.getElementById('categoryDetailTotal');

  const list =
    document.getElementById('categoryDetailList');

  title.innerText =
    selectedCategory;

  subtitle.innerText =
    'Registros do mês atual';

  const total =
    monthlyTransactions.reduce((acc, item) => {
      return acc + item.amount;
    }, 0);

  totalBox.innerText =
    formatCurrency(total);

  totalBox.className =
    total >= 0
      ? 'category-total-box positive'
      : 'category-total-box negative';

  list.innerHTML = '';

  if(monthlyTransactions.length === 0){
    list.innerHTML =
      '<p>Nenhuma movimentação encontrada nesta categoria.</p>';
    return;
  }

  monthlyTransactions.forEach(t => {
    const clickableClass =
      t.automatic ? '' : 'clickable';

    const clickAction =
      t.automatic
        ? ''
        : `onclick="openTransactionModal('${t.id}')"`;

    list.innerHTML += `
      <div class="transaction ${clickableClass}" ${clickAction}>
        <div>
          <strong>${t.name}</strong>
          <p>${t.category || 'Sem categoria'}</p>
          ${t.installment ? `<small>Parcela ${t.installment}</small>` : ''}
          ${t.fixed ? `<small> • Fixo</small>` : ''}
          ${t.automatic ? `<small> • Automático</small>` : ''}
        </div>

        <div class="${t.amount >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(t.amount)}
        </div>
      </div>
    `;
  });
}

function renderHistory(){
  renderChart();

  const historyPage =
    document.getElementById('history');

  const existing =
    document.getElementById('historyDetails');

  if(existing){
    existing.remove();
  }

  const container =
    document.createElement('div');

  container.id =
    'historyDetails';

  const months =
    getAllVisibleMonths();

  months.forEach(monthKey => {
    const details =
      document.createElement('details');

    details.className =
      'card';

    const summary =
      document.createElement('summary');

    const [year, month] =
      monthKey.split('-');

    const monthName =
      new Date(
        Number(year),
        Number(month) - 1
      ).toLocaleString('pt-BR', {
        month: 'long',
        year: 'numeric'
      });

    summary.innerText =
      monthName;

    details.appendChild(summary);

    const monthTransactions =
      getTransactionsForMonth(monthKey);

    if(monthTransactions.length === 0){
      const empty =
        document.createElement('p');

      empty.style.marginTop =
        '15px';

      empty.innerText =
        'Nenhuma movimentação registrada neste mês';

      details.appendChild(empty);

    } else {
      monthTransactions
        .sort((a,b) => {
          const dateA =
            new Date(a.createdAt || 0);

          const dateB =
            new Date(b.createdAt || 0);

          return dateB - dateA;
        })
        .forEach(t => {
          const item =
            document.createElement('div');

          item.className =
            t.automatic
              ? 'transaction'
              : 'transaction clickable';

          item.innerHTML = `
            <div>
              <strong>${t.name}</strong>
              <p>${t.category || 'Sem categoria'}</p>
              ${t.installment ? `<small>Parcela ${t.installment}</small>` : ''}
              ${t.fixed ? `<small> • Fixo</small>` : ''}
              ${t.automatic ? `<small> • Automático</small>` : ''}
            </div>

            <div class="${t.amount >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(t.amount)}
            </div>
          `;

          if(!t.automatic){
            item.onclick = () => {
              openTransactionModal(t.id);
            };
          }

          details.appendChild(item);
        });

      const deleteBtn =
        document.createElement('button');

      deleteBtn.innerText =
        'Excluir registros deste mês';

      deleteBtn.style.marginTop =
        '15px';

      deleteBtn.onclick = () => {
        if(confirm('Deseja excluir os registros deste mês?')){
          transactions =
            transactions.filter(
              t => t.month !== monthKey
            );

          saveData();
          render();
          renderHistory();
        }
      };

      details.appendChild(deleteBtn);
    }

    container.appendChild(details);
  });

  const clearAll =
    document.createElement('button');

  clearAll.innerText =
    'Apagar histórico completo';

  clearAll.style.marginTop =
    '20px';

  clearAll.onclick = () => {
    if(confirm('Deseja apagar todo histórico?')){
      transactions = [];

      saveData();
      render();
      renderHistory();
    }
  };

  container.appendChild(clearAll);
  historyPage.appendChild(container);
}

function renderChart(){
  const labels =
    getAllVisibleMonths();

  const incomes = [];
  const expenses = [];

  labels.forEach(month => {
    let income = 0;
    let expense = 0;

    getTransactionsForMonth(month).forEach(t => {
      if(t.amount >= 0){
        income += t.amount;
      } else {
        expense += Math.abs(t.amount);
      }
    });

    incomes.push(income);
    expenses.push(expense);
  });

  const ctx =
    document.getElementById('chart');

  if(window.chartInstance){
    window.chartInstance.destroy();
  }

  window.chartInstance =
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Entradas',
            data: incomes,
            borderColor: 'green',
            tension: 0.3
          },
          {
            label: 'Gastos',
            data: expenses,
            borderColor: 'red',
            tension: 0.3
          }
        ]
      }
    });
}

function renderCategories(){
  const monthlyTransactions =
    getTransactionsForMonth(currentMonth());

  const categories =
    [...new Set(
      monthlyTransactions
        .map(t => t.category || 'Sem categoria')
        .filter(Boolean)
    )].sort();

  const list =
    document.getElementById('categoriesList');

  list.innerHTML = '';

  if(categories.length === 0){
    list.innerHTML =
      '<p>Nenhuma categoria registrada neste mês.</p>';
    return;
  }

  categories.forEach(category => {
    const total =
      monthlyTransactions
        .filter(t => (t.category || 'Sem categoria') === category)
        .reduce((acc,t) => acc + t.amount, 0);

    list.innerHTML += `
      <button
        class="transaction clickable category-row"
        onclick="openCategoryDetail('${category.replace(/'/g, "\\'")}')"
      >
        <div>
          <strong>${category}</strong>
          <p>Ver registros do mês</p>
        </div>

        <div class="${total >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(total)}
        </div>
      </button>
    `;
  });
}

function removeCategory(category){
  if(confirm('Deseja excluir esta categoria?')){
    transactions =
      transactions.filter(
        t => t.category !== category
      );

    if(category === 'Impostos'){
      fixedTaxes.inss.enabled = false;
      fixedTaxes.irpf.enabled = false;
    }

    saveData();
    renderCategories();
    render();
  }
}

function getWoolBallTotal(){
  return woolBallMovements.reduce((acc, movement) => {
    return acc + movement.amount;
  }, 0);
}

function saveWoolBallMovement(){
  const action =
    document.getElementById('woolBallAction').value;

  const value =
    parseBrazilianNumber(
      document.getElementById('woolBallAmount').value
    );

  const note =
    document.getElementById('woolBallNote').value.trim();

  if(!value){
    alert('Informe um valor válido.');
    return;
  }

  const currentTotal =
    getWoolBallTotal();

  let amount = 0;
  let label = '';

  if(action === 'deposit'){
    amount = Math.abs(value);
    label = 'Valor guardado';
  }

  if(action === 'withdraw'){
    amount = -Math.abs(value);
    label = 'Valor retirado';
  }

  if(action === 'set'){
    amount = value - currentTotal;
    label = 'Valor total corrigido';
  }

  woolBallMovements.push({
    id: crypto.randomUUID(),
    action,
    label,
    note,
    amount,
    totalAfter: currentTotal + amount,
    createdAt: new Date().toISOString()
  });

  saveData();

  document.getElementById('woolBallAmount').value = '';
  document.getElementById('woolBallNote').value = '';

  renderWoolBall();
}

function renderWoolBall(){
  const total =
    getWoolBallTotal();

  const totalElement =
    document.getElementById('woolBallTotal');

  const history =
    document.getElementById('woolBallHistory');

  totalElement.innerText =
    formatCurrency(total);

  totalElement.className =
    total >= 0
      ? 'saldo positive'
      : 'saldo negative';

  history.innerHTML = '';

  if(woolBallMovements.length === 0){
    history.innerHTML =
      '<p>Nenhuma movimentação no Novelo de lã ainda.</p>';
    return;
  }

  [...woolBallMovements]
    .sort((a,b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .forEach(movement => {
      const date =
        new Date(movement.createdAt)
          .toLocaleDateString('pt-BR');

      history.innerHTML += `
        <div class="transaction">
          <div>
            <strong>${movement.label}</strong>
            <p>${movement.note || 'Sem descrição'} • ${date}</p>
            <small>Total após movimento: ${formatCurrency(movement.totalAfter)}</small>
          </div>

          <div class="${movement.amount >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(movement.amount)}
          </div>
        </div>
      `;
    });
}

function openHelpCategory(categoryId){
  selectedHelpCategory =
    categoryId;

  showPage('helpCategoryDetail');
}

function renderHelpCategoryDetail(){
  if(!selectedHelpCategory || !helpCategories[selectedHelpCategory]){
    showPage('help');
    return;
  }

  const category =
    helpCategories[selectedHelpCategory];

  const title =
    document.getElementById('helpCategoryTitle');

  const description =
    document.getElementById('helpCategoryDescription');

  const list =
    document.getElementById('helpArticlesList');

  title.innerText =
    category.title;

  description.innerText =
    category.description;

  list.innerHTML = '';

  category.articles.forEach(article => {
    list.innerHTML += `
      <button class="article-row">
        <div>
          <strong>${article.title}</strong>
          <p>${article.description}</p>
        </div>

        <span>
          Abrir
        </span>
      </button>
    `;
  });
}

function startHelpChat(){
  alert('Chat do Miaufi em breve. Por enquanto, use o telefone ou os artigos de ajuda.');
}

function renderAccountSettings(){
  document.getElementById('settingsName').value =
    user.name || '';

  document.getElementById('settingsSalary').value =
    Number(user.salary || 0)
      .toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

  document.getElementById('settingsSalaryType').value =
    user.type || 'liquido';

  document.getElementById('carryOverEnabled').checked =
    carryOver;

  document.getElementById('inssEnabled').checked =
    fixedTaxes.inss.enabled;

  document.getElementById('inssType').value =
    fixedTaxes.inss.type;

  document.getElementById('inssValue').value =
    fixedTaxes.inss.type === 'value' && fixedTaxes.inss.value
      ? Number(fixedTaxes.inss.value)
          .toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
      : fixedTaxes.inss.value || '';

  document.getElementById('irpfEnabled').checked =
    fixedTaxes.irpf.enabled;

  document.getElementById('irpfType').value =
    fixedTaxes.irpf.type;

  document.getElementById('irpfValue').value =
    fixedTaxes.irpf.type === 'value' && fixedTaxes.irpf.value
      ? Number(fixedTaxes.irpf.value)
          .toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
      : fixedTaxes.irpf.value || '';

  setupInputs();
}

function setupInputs(){
  const inputs =
    [
      amountInput,
      document.getElementById('userSalary'),
      document.getElementById('settingsSalary'),
      document.getElementById('inssValue'),
      document.getElementById('irpfValue'),
      document.getElementById('editAmount'),
      document.getElementById('woolBallAmount')
    ];

  inputs.forEach(input => {
    if(input){
      input.oninput = formatDecimalInput;
    }
  });
}

function saveAccountSettings(){
  const name =
    document.getElementById('settingsName').value.trim();

  const salary =
    parseBrazilianNumber(
      document.getElementById('settingsSalary').value
    );

  const type =
    document.getElementById('settingsSalaryType').value;

  const inssEnabled =
    document.getElementById('inssEnabled').checked;

  const inssType =
    document.getElementById('inssType').value;

  const inssValue =
    parseDiscountValue('inss');

  const irpfEnabled =
    document.getElementById('irpfEnabled').checked;

  const irpfType =
    document.getElementById('irpfType').value;

  const irpfValue =
    parseDiscountValue('irpf');

  const carryOverEnabled =
    document.getElementById('carryOverEnabled').checked;

  if(!name || !salary){
    alert('Preencha nome e salário');
    return;
  }

  user.name =
    name;

  user.salary =
    salary;

  user.type =
    type;

  carryOver =
    carryOverEnabled;

  fixedTaxes = {
    inss: {
      enabled: inssEnabled,
      type: inssType,
      value: inssValue || 0
    },
    irpf: {
      enabled: irpfEnabled,
      type: irpfType,
      value: irpfValue || 0
    }
  };

  saveData();
  render();

  alert('Configurações salvas com sucesso!');
}

window.showLoginForm = showLoginForm;
window.showCreateAccountForm = showCreateAccountForm;
window.backToAuthChoice = backToAuthChoice;
window.showPasswordRecoveryForm = showPasswordRecoveryForm;
window.resetPassword = resetPassword;
window.createUserAccount = createUserAccount;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.toggleMenu = toggleMenu;
window.showPage = showPage;
window.addTransaction = addTransaction;
window.removeCategory = removeCategory;
window.saveAccountSettings = saveAccountSettings;
window.openTransactionModal = openTransactionModal;
window.closeTransactionModal = closeTransactionModal;
window.saveEditedTransaction = saveEditedTransaction;
window.deleteTransaction = deleteTransaction;
window.openFeaturedCategoryDetail = openFeaturedCategoryDetail;
window.openCategoryDetail = openCategoryDetail;
window.saveWoolBallMovement = saveWoolBallMovement;
window.startHelpChat = startHelpChat;
window.openHelpCategory = openHelpCategory;

setupInputs();

if(user && currentUserEmail){
  openApp();
} else {
  authModal.style.display =
    'flex';

  appContent.style.display =
    'none';

  hideAllAuthForms();
  authChoice.classList.remove('hidden');
}
