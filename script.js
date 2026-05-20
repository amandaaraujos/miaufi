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
    Number(document.getElementById('userSalary').value);

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
    carryOver: false
  };

  currentUserEmail = email;
  user = users[email];
  transactions = user.transactions;
  carryOver = user.carryOver;

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

if(Notification.permission !== 'granted'){
  Notification.requestPermission();
}

setInterval(() => {
  const now = new Date();

  if(
    now.getHours() === 21 &&
    now.getMinutes() === 0
  ){
    if(Notification.permission === 'granted'){
      new Notification(
        '💰 Registre os gastos de hoje!'
      );
    }
  }
}, 60000);

amountInput.addEventListener(
  'input',
  formatMoney
);

anotherMonth.addEventListener(
  'change',
  () => {
    document.getElementById('month')
      .style.display =
        anotherMonth.checked
          ? 'block'
          : 'none';
  }
);

hasInstallments.addEventListener(
  'change',
  () => {
    installmentsBox.style.display =
      hasInstallments.checked
        ? 'block'
        : 'none';

    if(!hasInstallments.checked){
      document.getElementById('installments').value = 1;
    }
  }
);

function saveData(){
  if(!user || !currentUserEmail){
    return;
  }

  user.transactions = transactions;
  user.carryOver = carryOver;

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

  const amount = Number(
    document.getElementById('amount')
      .value
      .replace(/[R$.\s]/g, '')
      .replace(',', '.')
  ) / 100;

  const signedAmount =
    type === 'expense'
      ? -Math.abs(amount)
      : Math.abs(amount);

  const category =
    document.getElementById('category').value.trim();

  const installments = hasInstallments.checked
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
    value >= 0
      ? '+'
      : '-';

  return `${signal}R$${Math.abs(value)
    .toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
}

function calculateMonthlyBalance(month){
  const monthly =
    transactions.filter(
      t => t.month === month
    );

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
        transactions.filter(
          t => t.month === m
        );

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
  const month = currentMonth();

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
    transactions
      .filter(t => t.month === month)
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

          <p>
            ${t.category || 'Sem categoria'}
          </p>

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
        </div>

        <div class="${
          t.amount >= 0
            ? 'positive'
            : 'negative'
        }">
          ${formatCurrency(t.amount)}
        </div>
      </div>
    `;
  });
}

function renderInsights(month){
  const currentTransactions =
    transactions.filter(
      t => t.month === month
    );

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
    [...new Set(
      transactions.map(t => t.month)
    )].sort();

  if(months.length >= 2){
    const current =
      calculateMonthlyBalance(
        months[months.length - 1]
      );

    const previous =
      calculateMonthlyBalance(
        months[months.length - 2]
      );

    const diff = current - previous;

    const comparison =
      document.getElementById('comparison');

    comparison.innerText =
      diff >= 0
        ? `Economia de ${formatCurrency(diff)}`
        : `Gasto de ${formatCurrency(diff)}`;

    comparison.className =
      diff >= 0
        ? 'positive'
        : 'negative';
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

  container.id = 'historyDetails';

  const currentDate = new Date();

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

    details.className = 'card';

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

    summary.innerText = monthName;

    details.appendChild(summary);

    const monthTransactions =
      grouped[monthKey] || [];

    if(monthTransactions.length === 0){
      const empty =
        document.createElement('p');

      empty.style.marginTop = '15px';

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

          item.className = 'transaction';

          item.innerHTML = `
            <div>
              <strong>${t.name}</strong>

              <p>
                ${t.category || 'Sem categoria'}
              </p>

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
            </div>

            <div class="${
              t.amount >= 0
                ? 'positive'
                : 'negative'
            }">
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
        if(confirm(
          'Deseja excluir esse histórico?'
        )){
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
    if(confirm(
      'Deseja apagar todo histórico?'
    )){
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

  const incomes = [];
  const expenses = [];

  labels.forEach(month => {
    let income = 0;
    let expense = 0;

    grouped[month].forEach(t => {
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

  window.chartInstance = new Chart(ctx, {
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
      transactions
        .map(t => t.category)
        .filter(Boolean)
    )].sort();

  const list =
    document.getElementById('categoriesList');

  list.innerHTML = '';

  categories.forEach(category => {
    const total =
      transactions
        .filter(
          t => t.category === category
        )
        .reduce((acc,t) => {
          return acc + t.amount;
        },0);

    list.innerHTML += `
      <div class="transaction">
        <div>
          <strong>${category}</strong>

          <p class="${
            total >= 0
              ? 'positive'
              : 'negative'
          }">
            ${formatCurrency(total)}
          </p>
        </div>

        <button
          onclick="removeCategory('${category}')"
        >
          Excluir
        </button>
      </div>
    `;
  });
}

function removeCategory(category){
  if(confirm(
    'Deseja excluir esta categoria?'
  )){
    transactions =
      transactions.filter(
        t => t.category !== category
      );

    saveData();
    renderCategories();
    render();
  }
}

if(user && currentUserEmail){
  openApp();
} else {
  authModal.style.display = 'flex';
  appContent.style.display = 'none';

  authChoice.classList.remove('hidden');
  loginForm.classList.add('hidden');
  createAccountForm.classList.add('hidden');
}
