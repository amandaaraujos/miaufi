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

let carryOver =
  user?.carryOver || false;

let fixedTaxes =
  user?.fixedTaxes || {
    inss: {
      enabled: false,
      type: 'percent',
      value: 0
    },
    irpf: {
      enabled: false,
      type: 'percent',
      value: 0
    }
  };

const appContent =
  document.getElementById('appContent');

const authModal =
  document.getElementById('authModal');

const authChoice =
  document.getElementById('authChoice');

const loginForm =
  document.getElementById('loginForm');

const createAccountForm =
  document.getElementById('createAccountForm');

const anotherMonth =
  document.getElementById('anotherMonth');

const amountInput =
  document.getElementById('amount');

const hasInstallments =
  document.getElementById('hasInstallments');

const installmentsBox =
  document.getElementById('installmentsBox');

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

amountInput.addEventListener('input', formatMoney);

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
  const cleanValue =
    String(value)
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

  return Number(cleanValue);
}

function formatSalaryInput(e){
  e.target.value =
    e.target.value
      .replace(/[^\d,\.]/g, '')
      .replace('.', ',');
}

function showLoginForm(){
  authChoice.classList.add('hidden');
  createAccountForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
}

function showCreateAccountForm(){
  authChoice.classList.add('hidden');
  loginForm.classList.add('hidden');
  createAccountForm.classList.remove('hidden');
}

function backToAuthChoice(){
  loginForm.classList.add('hidden');
  createAccountForm.classList.add('hidden');
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
    carryOver: false,
    fixedTaxes: {
      inss: {
        enabled: false,
        type: 'percent',
        value: 0
      },
      irpf: {
        enabled: false,
        type: 'percent',
        value: 0
      }
    }
  };

  currentUserEmail = email;
  user = users[email];
  transactions = user.transactions;
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

  if(!email || !password){
    alert('Preencha e-mail e senha');
    return;
  }

  if(!users[email]){
    alert('Conta não encontrada');
    return;
  }

  if(users[email].password !== password){
    alert('Senha incorreta');
    return;
  }

  currentUserEmail = email;
  user = users[email];
  transactions = user.transactions || [];
  carryOver = user.carryOver || false;

  fixedTaxes =
    user.fixedTaxes || {
      inss: {
        enabled: false,
        type: 'percent',
        value: 0
      },
      irpf: {
        enabled: false,
        type: 'percent',
        value: 0
      }
    };

  localStorage.setItem(
    'currentUserEmail',
    currentUserEmail
  );

  openApp();
}

function logoutUser(){
  localStorage.removeItem('currentUserEmail');

  currentUserEmail = null;
  user = null;
  transactions = [];
  carryOver = false;

  fixedTaxes = {
    inss: {
      enabled: false,
      type: 'percent',
      value: 0
    },
    irpf: {
      enabled: false,
      type: 'percent',
      value: 0
    }
  };

  appContent.style.display = 'none';
  authModal.style.display = 'flex';

  authChoice.classList.remove('hidden');
  loginForm.classList.add('hidden');
  createAccountForm.classList.add('hidden');
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
  user.carryOver = carryOver;
  user.fixedTaxes = fixedTaxes;

  users[currentUserEmail] = user;

  saveUsers();
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

  if(page === 'history'){
    renderHistory();
  }

  if(page === 'categories'){
    renderCategories();
  }

  if(page === 'settings'){
    renderAccountSettings();
  }
}

function formatMoney(e){
  let value = e.target.value;

  value = value.replace(/\D/g, '');

  value = (Number(value) / 100)
    .toFixed(2)
    .replace('.', ',');

  value = value.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.'
  );

  e.target.value = `R$ ${value}`;
}

function parseMoney(value){
  return Number(
    String(value)
      .replace(/[R$.\s]/g, '')
      .replace(',', '.')
  ) / 100;
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
    return parseMoney(value);
  }

  return parsePercent(value);
}

function currentMonth(){
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
}

function addTransaction(){
  const type =
    document.getElementById('type').value;

  const name =
    document.getElementById('name').value.trim();

  const amount =
    parseMoney(document.getElementById('amount').value);

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

  let month =
    document.getElementById('month').value;

  if(!name || !amount){
    alert('Preencha nome e valor');
    return;
  }

  if(!month){
    month = currentMonth();
  }

  const recurringMonths =
    fixed ? 60 : installments;

  const createdAt =
    new Date().toISOString();

  for(let i = 0; i < recurringMonths; i++){
    const date =
      new Date(month + '-01');

    date.setMonth(date.getMonth() + i);

    const finalMonth =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

    transactions.push({
      id: crypto.randomUUID(),
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

function formatCurrency(value){
  const signal =
    value >= 0 ? '+' : '-';

  return `${signal}R$${Math.abs(value)
    .toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
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
      [...new Set(
        transactions.map(t => t.month)
      )]
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
      '<p>Sem movimentações neste mês</p>';
    return;
  }

  currentTransactions.forEach(t => {
    list.innerHTML += `
      <div class="transaction">
        <div>
          <strong>${t.name}</strong>

          <p>${t.category || 'Sem categoria'}</p>

          ${
            t.installment
              ? `<small>Parcela ${t.installment}</small>`
              : ''
          }

          ${
            t.fixed
              ? `<small> • Fixo</small>`
              : ''
          }

          ${
            t.automatic
              ? `<small> • Automático</small>`
              : ''
          }
        </div>

        <div class="${t.amount >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(t.amount)}
        </div>
      </div>
    `;
  });
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
    .innerText = biggest
      ? `${biggest.name} ${formatCurrency(biggest.amount)}`
      : 'Nenhuma';

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

  document.getElementById('bestCategory')
    .innerText = best
      ? `${best[0]} ${formatCurrency(best[1])}`
      : 'Nenhuma';

  const months =
    [...new Set(transactions.map(t => t.month))]
      .sort();

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

function renderHistory(){
  const grouped = {};

  transactions.forEach(t => {
    if(!grouped[t.month]){
      grouped[t.month] = [];
    }

    grouped[t.month].push(t);
  });

  renderChart(grouped);

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

  const currentDate =
    new Date();

  const currentYear =
    currentDate.getFullYear();

  const currentMonthIndex =
    currentDate.getMonth() + 1;

  for(
    let month = 1;
    month <= currentMonthIndex;
    month++
  ){
    const monthKey =
      `${currentYear}-${String(month)
        .padStart(2, '0')}`;

    const details =
      document.createElement('details');

    details.className =
      'card';

    const summary =
      document.createElement('summary');

    const monthName =
      new Date(
        currentYear,
        month - 1
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
        'Sem registros';

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
            'transaction';

          item.innerHTML = `
            <div>
              <strong>${t.name}</strong>

              <p>${t.category || 'Sem categoria'}</p>

              ${
                t.installment
                  ? `<small>Parcela ${t.installment}</small>`
                  : ''
              }

              ${
                t.fixed
                  ? `<small> • Fixo</small>`
                  : ''
              }

              ${
                t.automatic
                  ? `<small> • Automático</small>`
                  : ''
              }
            </div>

            <div class="${t.amount >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(t.amount)}
            </div>
          `;

          details.appendChild(item);
        });

      const deleteBtn =
        document.createElement('button');

      deleteBtn.innerText =
        'Excluir histórico';

      deleteBtn.style.marginTop =
        '15px';

      deleteBtn.onclick = () => {
        if(confirm('Deseja excluir esse histórico?')){
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
  }

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

function renderChart(grouped){
  const labels =
    Object.keys(grouped).sort();

  const current =
    currentMonth();

  if(fixedTaxes?.inss?.enabled || fixedTaxes?.irpf?.enabled){
    if(!labels.includes(current)){
      labels.push(current);
    }
  }

  labels.sort();

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
            label: 'Receitas',
            data: incomes,
            borderColor: 'green',
            tension: 0.3
          },
          {
            label: 'Despesas',
            data: expenses,
            borderColor: 'red',
            tension: 0.3
          }
        ]
      }
    });
}

function renderCategories(){
  const categories =
    [...new Set(
      [
        ...transactions.map(t => t.category),
        fixedTaxes?.inss?.enabled ? 'Impostos' : null,
        fixedTaxes?.irpf?.enabled ? 'Impostos' : null
      ].filter(Boolean)
    )].sort();

  const list =
    document.getElementById('categoriesList');

  list.innerHTML = '';

  categories.forEach(category => {
    let total =
      transactions
        .filter(t => t.category === category)
        .reduce((acc,t) => {
          return acc + t.amount;
        },0);

    if(category === 'Impostos'){
      total += getFixedTaxAmount('inss');
      total += getFixedTaxAmount('irpf');
    }

    list.innerHTML += `
      <div class="transaction">
        <div>
          <strong>${category}</strong>

          <p class="${total >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(total)}
          </p>
        </div>

        <button onclick="removeCategory('${category}')">
          Excluir
        </button>
      </div>
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

  document.getElementById('inssEnabled').checked =
    fixedTaxes.inss.enabled;

  document.getElementById('inssType').value =
    fixedTaxes.inss.type;

  document.getElementById('inssValue').value =
    fixedTaxes.inss.type === 'value' && fixedTaxes.inss.value
      ? `R$ ${Number(fixedTaxes.inss.value)
          .toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`
      : fixedTaxes.inss.value || '';

  document.getElementById('irpfEnabled').checked =
    fixedTaxes.irpf.enabled;

  document.getElementById('irpfType').value =
    fixedTaxes.irpf.type;

  document.getElementById('irpfValue').value =
    fixedTaxes.irpf.type === 'value' && fixedTaxes.irpf.value
      ? `R$ ${Number(fixedTaxes.irpf.value)
          .toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`
      : fixedTaxes.irpf.value || '';

  setupSettingsInputs();
}

function setupSettingsInputs(){
  const settingsSalaryInput =
    document.getElementById('settingsSalary');

  const userSalaryInput =
    document.getElementById('userSalary');

  const inssType =
    document.getElementById('inssType');

  const irpfType =
    document.getElementById('irpfType');

  const inssValue =
    document.getElementById('inssValue');

  const irpfValue =
    document.getElementById('irpfValue');

  if(settingsSalaryInput){
    settingsSalaryInput.oninput = function(e){
      formatSalaryInput(e);
    };
  }

  if(userSalaryInput){
    userSalaryInput.oninput = function(e){
      formatSalaryInput(e);
    };
  }

  if(inssType && inssValue){
    inssType.onchange = function(){
      inssValue.value = '';

      inssValue.placeholder =
        inssType.value === 'value'
          ? 'R$ 0,00'
          : 'Ex: 8,5';
    };

    inssValue.oninput = function(){
      if(inssType.value === 'value'){
        formatMoney({ target: inssValue });
      } else {
        inssValue.value =
          inssValue.value
            .replace(/[^\d,\.]/g, '')
            .replace('.', ',');
      }
    };
  }

  if(irpfType && irpfValue){
    irpfType.onchange = function(){
      irpfValue.value = '';

      irpfValue.placeholder =
        irpfType.value === 'value'
          ? 'R$ 0,00'
          : 'Ex: 15';
    };

    irpfValue.oninput = function(){
      if(irpfType.value === 'value'){
        formatMoney({ target: irpfValue });
      } else {
        irpfValue.value =
          irpfValue.value
            .replace(/[^\d,\.]/g, '')
            .replace('.', ',');
      }
    };
  }
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

  if(!name || !salary){
    alert('Preencha nome e salário');
    return;
  }

  user.name = name;
  user.salary = salary;
  user.type = type;

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
window.createUserAccount = createUserAccount;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.toggleMenu = toggleMenu;
window.showPage = showPage;
window.addTransaction = addTransaction;
window.removeCategory = removeCategory;
window.saveAccountSettings = saveAccountSettings;

setupSettingsInputs();

if(user && currentUserEmail){
  openApp();
} else {
  authModal.style.display = 'flex';
  appContent.style.display = 'none';

  authChoice.classList.remove('hidden');
  loginForm.classList.add('hidden');
  createAccountForm.classList.add('hidden');
}
