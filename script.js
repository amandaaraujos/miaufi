let user = JSON.parse(localStorage.getItem('user')) || null;
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let carryOver = JSON.parse(localStorage.getItem('carryOver')) || false;

if(!user){

  const name = prompt('Qual seu nome?');
  const salary = Number(prompt('Qual seu salário?'));
  const type = prompt('Seu salário é bruto ou líquido?');

  user = {
    name,
    salary,
    type
  };

  localStorage.setItem('user', JSON.stringify(user));
}

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

function saveData(){

  localStorage.setItem(
    'transactions',
    JSON.stringify(transactions)
  );

  localStorage.setItem(
    'carryOver',
    JSON.stringify(carryOver)
  );
}

function toggleMenu(){

  const menu = document.getElementById('menu');

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

const anotherMonth =
  document.getElementById('anotherMonth');

anotherMonth.addEventListener('change', () => {

  document.getElementById('month').style.display =
    anotherMonth.checked
      ? 'block'
      : 'none';
});

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
    document.getElementById('name').value;

  const amount = Number(
    document.getElementById('amount').value
  );

  const category =
    document.getElementById('category').value;

  const installments = Number(
    document.getElementById('installments').value
  );

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

  const installmentValue =
    amount / installments;

  const recurringMonths =
    fixed ? 60 : installments;

  for(let i = 0; i < recurringMonths; i++){

    const date = new Date(month + '-01');

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
        ? amount
        : installmentValue,

      category,

      month: finalMonth,

      fixed,

      installment: fixed
        ? null
        : `${i + 1}/${installments}`
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

  document.getElementById('anotherMonth').checked = false;

  document.getElementById('month').style.display = 'none';
}

function formatCurrency(value){

  const signal = value >= 0
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
    transactions.filter(t => t.month === month);

  let total = Number(user.salary);

  if(carryOver){

    const previousMonths =
      [...new Set(transactions.map(t => t.month))]
        .filter(m => m < month)
        .sort();

    previousMonths.forEach(m => {

      const monthTransactions =
        transactions.filter(t => t.month === m);

      let subtotal = Number(user.salary);

      monthTransactions.forEach(t => {

        subtotal +=
          t.type === 'income'
            ? t.amount
            : -t.amount;
      });

      total += subtotal;
    });
  }

  monthly.forEach(t => {

    total +=
      t.type === 'income'
        ? t.amount
        : -t.amount;
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
    transactions.filter(t => t.month === month);

  const list =
    document.getElementById('transactions');

  list.innerHTML = '';

  currentTransactions
    .sort((a,b) => a.type.localeCompare(b.type))
    .forEach(t => {

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

          </div>

          <div class="${
            t.type === 'income'
              ? 'positive'
              : 'negative'
          }">

            ${
              t.type === 'income'
                ? formatCurrency(t.amount)
                : formatCurrency(-t.amount)
            }

          </div>

        </div>
      `;
    });
}

function renderInsights(month){

  const currentTransactions =
    transactions.filter(t => t.month === month);

  const biggest =
    currentTransactions
      .filter(t => t.type === 'expense')
      .sort((a,b) => b.amount - a.amount)[0];

  document.getElementById('biggestExpense')
    .innerText = biggest
      ? `${biggest.name} ${formatCurrency(-biggest.amount)}`
      : 'Nenhuma';

  const categoryTotals = {};

  currentTransactions.forEach(t => {

    if(!categoryTotals[t.category]){
      categoryTotals[t.category] = 0;
    }

    categoryTotals[t.category] +=
      t.type === 'income'
        ? t.amount
        : -t.amount;
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

  Object.keys(grouped)
    .sort()
    .reverse()
    .forEach(month => {

      const details =
        document.createElement('details');

      details.className = 'card';

      const summary =
        document.createElement('summary');

      summary.innerText = month;

      details.appendChild(summary);

      grouped[month].forEach(t => {

        const item =
          document.createElement('div');

        item.className = 'transaction';

        item.innerHTML = `

          <div>

            <strong>${t.name}</strong>

            <p>${t.category || 'Sem categoria'}</p>

          </div>

          <div class="${
            t.type === 'income'
              ? 'positive'
              : 'negative'
          }">

            ${
              t.type === 'income'
                ? formatCurrency(t.amount)
                : formatCurrency(-t.amount)
            }

          </div>
        `;

        details.appendChild(item);
      });

      const deleteBtn =
        document.createElement('button');

      deleteBtn.innerText =
        'Excluir histórico';

      deleteBtn.style.marginTop = '15px';

      deleteBtn.onclick = () => {

        if(confirm(
          'Deseja excluir esse histórico?'
        )){

          transactions =
            transactions.filter(
              t => t.month !== month
            );

          saveData();

          render();

          renderHistory();
        }
      };

      details.appendChild(deleteBtn);

      container.appendChild(details);
    });

  const clearAll =
    document.createElement('button');

  clearAll.innerText =
    'Apagar histórico completo';

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

      if(t.type === 'income'){
        income += t.amount;
      } else {
        expense += t.amount;
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
        .filter(t => t.category === category)
        .reduce((acc,t) => {

          return acc + (
            t.type === 'income'
              ? t.amount
              : -t.amount
          );

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

render();