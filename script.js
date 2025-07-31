document.addEventListener('DOMContentLoaded', () => {
  const mInput    = document.getElementById('month-select'),
        vMonth    = document.getElementById('view-month'),
        vAnnual   = document.getElementById('view-annual'),
        sumI      = document.getElementById('sum-income'),
        sumE      = document.getElementById('sum-expenses'),
        sumB      = document.getElementById('sum-balance'),
        tbody     = document.querySelector('#table-all tbody'),
        subtitle  = document.getElementById('dashboard-subtitle'),
        chartEl   = document.getElementById('chart-expenses'),
        btnInc    = document.getElementById('btn-add-income'),
        btnExp    = document.getElementById('btn-add-expense'),
        catInc    = document.getElementById('cat-income'),
        valInc    = document.getElementById('amount-income'),
        selExpCat = document.getElementById('sel-expense-cat'),
        descExp   = document.getElementById('desc-expense'),
        valExp    = document.getElementById('amount-expense'),
        modal     = document.getElementById('edit-modal'),
        editDesc  = document.getElementById('edit-desc'),
        editAmt   = document.getElementById('edit-amount'),
        btnSave   = document.getElementById('btn-save-edit'),
        btnCancel = document.getElementById('btn-cancel-edit');
  let data = JSON.parse(localStorage.getItem('financeData')) || {}, editing = null, chart;

  function nextName(m) {
    const [y, mo] = m.split('-').map(Number),
          nm = mo === 12 ? 1 : mo + 1,
          ny = mo === 12 ? y + 1 : y;
    return new Date(`${ny}-${String(nm).padStart(2,'0')}-01`)
      .toLocaleString('pt-BR',{month:'long'});
  }

  function fmt(v){
    return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2});
  }

  function renderAll(){
    const key = mInput.value, isAn = vAnnual.checked;
    tbody.innerHTML = '';
    let chartData = {}, totExp = 0, totInc = 0;

    const months = Object.keys(data).sort();

    if(isAn){
      months.forEach(mo=>{
        const d = data[mo] || {expenses:[]},
              exp = d.expenses.reduce((a,e)=>a+e.amount,0);
        if(exp>0){
          const label = `${nextName(mo).charAt(0).toUpperCase()+nextName(mo).slice(1)} de ${new Date(`${mo}-01`).getFullYear()}`;
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>Despesa</td><td>${label}</td><td class="expense">${fmt(exp)}</td><td></td>`;
          tbody.appendChild(tr);
          chartData[label] = exp;
          totExp += exp;
        }
      });
      subtitle.textContent = `Dashboard – ${nextName(key).charAt(0).toUpperCase()+nextName(key).slice(1)} de ${new Date(`${key}-01`).getFullYear()}`;
      sumI.style.display = 'none';
      sumB.style.display = 'none';
      sumE.style.display = 'block';
      sumE.textContent = fmt(totExp);
    } else {
      let saldoAnterior = 0;
      months.forEach(mo=>{
        if(mo >= key) return;
        const d = data[mo] || {incomes:[], expenses:[]},
              inc = d.incomes.reduce((a,i)=>a+i.amount,0),
              exp = d.expenses.reduce((a,e)=>a+e.amount,0);
        saldoAnterior += inc - exp;
      });
      totInc = saldoAnterior;
      const trPrev = document.createElement('tr');
      trPrev.innerHTML=`<td>Receita</td><td>Saldo anterior</td><td class="income">${fmt(saldoAnterior)}</td><td></td>`;
      tbody.appendChild(trPrev);

      const d = data[key] || {incomes:[], expenses:[]};
      d.incomes.forEach(it=>{
        totInc += it.amount;
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>Receita</td><td>${it.category}</td><td class="income">${fmt(it.amount)}</td>
          <td class="actions"><button data-type="income" data-id="${it.id}">Editar</button><button data-type="income" data-id="${it.id}">Excluir</button></td>`;
        tbody.appendChild(tr);
      });
      let localExp=0;
      d.expenses.forEach(it=>{
        localExp += it.amount;
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>Despesa</td><td>${it.desc}</td><td class="expense">${fmt(it.amount)}</td>
          <td class="actions"><button data-type="expense" data-id="${it.id}">Editar</button><button data-type="expense" data-id="${it.id}">Excluir</button></td>`;
        tbody.appendChild(tr);
        chartData[it.category] = (chartData[it.category]||0)+it.amount;
      });
      totExp = localExp;

      sumI.style.display='block';
      sumB.style.display='block';
      sumE.style.display='block';
      sumI.textContent = fmt(totInc);
      sumE.textContent = fmt(totExp);
      sumB.textContent = fmt(totInc - totExp);
      subtitle.textContent = `Dashboard – ${nextName(key).charAt(0).toUpperCase()+nextName(key).slice(1)} de ${new Date(`${key}-01`).getFullYear()}`;
    }

    renderChart(chartData);
    localStorage.setItem('financeData', JSON.stringify(data));
  }

  function renderChart(obj){
    const labels = Object.keys(obj), vals = Object.values(obj);
    if(chart) chart.destroy();
    chart = new Chart(chartEl, {
      type:'pie',
      data:{labels,datasets:[{data:vals,backgroundColor:['#6699CC','#99BBCC','#AACCEE']}]},
      options:{responsive:true,plugins:{legend:{position:'bottom'}}}
    });
  }

  mInput.value = new Date().toISOString().slice(0,7);
  mInput.addEventListener('change',()=>{vMonth.checked=true;vAnnual.checked=false; renderAll();});
  vMonth.addEventListener('change',renderAll);
  vAnnual.addEventListener('change',renderAll);

  btnInc.addEventListener('click', ()=>{
    const v = parseFloat(valInc.value);
    if(!catInc.value||isNaN(v)||v<=0) return alert('Selecione categoria e valor positivo');
    const mo = mInput.value;
    if(!data[mo]) data[mo]={incomes:[],expenses:[]};
    data[mo].incomes.push({id:Date.now(),category:catInc.value,amount:v});
    valInc.value = '';
    renderAll();
  });

  btnExp.addEventListener('click', ()=>{
    const v = parseFloat(valExp.value);
    if(!selExpCat.value||!descExp.value||isNaN(v)||v<=0) return alert('Preencha categoria, descrição e valor');
    const mo = mInput.value;
    if(!data[mo]) data[mo]={incomes:[],expenses:[]};
    data[mo].expenses.push({id:Date.now(),category:selExpCat.value,desc:descExp.value,amount:v});
    selExpCat.selectedIndex = 0;
    descExp.value='';
    valExp.value='';
    renderAll();
  });

  tbody.addEventListener('click',e=>{
    if(e.target.tagName!=='BUTTON') return;
    const type=e.target.dataset.type, id=Number(e.target.dataset.id), mo=mInput.value;
    const arr = data[mo][type+'s'], idx = arr.findIndex(it=>it.id===id);
    if(e.target.textContent==='Excluir'){
      if(confirm('Deseja excluir?')){arr.splice(idx,1); renderAll();}
    } else {
      editing={type,id};
      const it = arr[idx];
      editDesc.value = type==='expense'?it.desc:it.category;
      editAmt.value = it.amount;
      editDesc.readOnly = (type==='income');
      modal.style.display = 'block';
    }
  });

  btnSave.addEventListener('click',()=>{
    if(!editing) return;
    const {type,id} = editing, mo = mInput.value;
    const it = data[mo][type+'s'].find(it=>it.id===id);
    const v = parseFloat(editAmt.value);
    if(isNaN(v)||v<=0) return alert('Valor inválido');
    it.amount = v;
    if(type==='expense'){ if(!editDesc.value) return alert('Descrição obrigatória'); it.desc = editDesc.value;}
    editing=null;
    modal.style.display='none';
    renderAll();
  });

  btnCancel.addEventListener('click',()=>{
    editing=null;
    modal.style.display='none';
  });

  window.addEventListener('click',e=>{
    if(e.target===modal){editing=null; modal.style.display='none';}
  });

  renderAll();
});
