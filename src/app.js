import {CATEGORIES, formatMoney, summarize, validateTransaction, parseCsvRows, toCsv} from './logic.js';
const KEY='atlas-expenses-v1'; const BUDGET_KEY='atlas-budget-v1';
const $=s=>document.querySelector(s);
let transactions=[];let monthlyBudget=2000;
const month=new Date().toLocaleDateString('en-CA',{year:'numeric',month:'2-digit'}).slice(0,7);
$('#month').value=month;$('#date').value=new Date().toLocaleDateString('en-CA');
$('#category').innerHTML=CATEGORIES.map(x=>`<option>${x}</option>`).join('');
async function api(path,method='GET',body){const response=await fetch(path,{method,headers:body?{'Content-Type':'application/json'}:{},credentials:'same-origin',body:body?JSON.stringify(body):undefined});const result=await response.json();if(!response.ok)throw Error(result.error||'Request failed');return result}
async function sync(){const [a,b]=await Promise.all([api('/api/transactions'),api('/api/budget?month='+$('#month').value)]);transactions=a.transactions;monthlyBudget=b.amount;render()}
function showAuth(){ $('#auth-screen').hidden=false;$('.app').hidden=true }
function showApp(user){$('#auth-screen').hidden=true;$('.app').hidden=false;$('#account-name').textContent=user.name;$('#account-email').textContent=user.email;$('#account-initials').textContent=user.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}
$('#auth-form').addEventListener('submit',async e=>{e.preventDefault();$('#auth-error').textContent='';try{const register=$('#auth-mode').value==='register',data={email:$('#auth-email').value,password:$('#auth-password').value,name:$('#auth-name').value};const r=await api(register?'/api/register':'/api/login','POST',data);showApp(r.user);await sync()}catch(err){$('#auth-error').textContent=err.message}});
$('#auth-toggle').addEventListener('click',()=>{const register=$('#auth-mode').value!=='register';$('#auth-mode').value=register?'register':'login';$('#auth-name-wrap').hidden=!register;$('#auth-title').textContent=register?'Create your account':'Welcome back';$('#auth-submit').textContent=register?'Create account':'Sign in';$('#auth-toggle').textContent=register?'Already have an account? Sign in':'New here? Create an account';$('#auth-error').textContent=''});
$('#logout-btn').addEventListener('click',async()=>{await api('/api/logout','POST');transactions=[];showAuth()});
$('#migrate-btn').addEventListener('click',async()=>{try{const old=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(old)||!old.length)return toast('No older local transactions found');if(!confirm(`Import ${old.length} transactions from your old local version?`))return;const result=await api('/api/import','POST',{transactions:old});await sync();toast(`${result.count} old transactions imported`)}catch(e){toast(e.message)}});
const colors=['#7469ef','#38b9a0','#f3b463','#f07895','#6295ed','#a48ff0','#7ccfc4','#d49b6b','#6aafeb','#a4aab8'];
const escapeHtml = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let toastTimeout;function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2800);}
function render(){
 const report=summarize(transactions,$('#month').value);
 $('#balance').textContent=formatMoney(report.balance);$('#income').textContent=formatMoney(report.income);$('#expenses').textContent=formatMoney(report.expenses);
 $('#savings').textContent=report.income>0?`${Math.round((report.balance/report.income)*100)}%`:'—';
 $('#donut-total').textContent=formatMoney(report.expenses);
 const cats=Object.entries(report.byCategory).sort((a,b)=>b[1]-a[1]);
 let offset=0;const segments=cats.map(([name,amount],i)=>{const pct=amount/report.expenses*100;const str=`${colors[i%colors.length]} ${offset}% ${offset+pct}%`;offset+=pct;return str;});
 $('#donut').style.background=segments.length?`conic-gradient(${segments.join(',')})`:'#edf0f7';
 $('#legend').innerHTML=cats.length?cats.slice(0,7).map(([cat,amount],i)=>`<div class="legend-row"><span class="legend-label"><i style="background:${colors[i%colors.length]}"></i>${escapeHtml(cat)}</span><strong>${Math.round(amount/report.expenses*100)}%</strong></div>`).join(''):'<p class="muted">Add expenses to see your spending breakdown.</p>';
 $('#budget-spent').textContent=formatMoney(report.expenses);$('#budget-total').textContent=formatMoney(monthlyBudget);
 const used=report.expenses/monthlyBudget*100;$('#budget-progress').style.width=`${Math.min(100,used)}%`;$('#budget-progress').classList.toggle('over',used>100);
 $('#budget-status').textContent=used<=100?`${formatMoney(monthlyBudget-report.expenses)} remaining · ${Math.round(used)}% used`:`Over budget by ${formatMoney(report.expenses-monthlyBudget)}`;
 const query=$('#search').value.trim().toLowerCase(),type=$('#filter-type').value;
 const visible=transactions.filter(t=>t.date.startsWith($('#month').value)&&(type==='all'||t.type===type)&&(`${t.title} ${t.category}`.toLowerCase().includes(query))).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
 $('#transaction-rows').innerHTML=visible.map(t=>`<tr><td><div class="transaction-name"><span class="transaction-symbol ${t.type}">${t.type==='income'?'↗':'↘'}</span><div><strong>${escapeHtml(t.title)}</strong><small>${t.type==='income'?'Income':'Expense'}</small></div></div></td><td><span class="category-pill">${escapeHtml(t.category)}</span></td><td class="muted">${escapeHtml(t.date)}</td><td class="amount ${t.type}">${t.type==='income'?'+':'−'}${formatMoney(t.amount)}</td><td><button class="delete-item" data-id="${escapeHtml(t.id)}" aria-label="Delete ${escapeHtml(t.title)}" title="Delete transaction">×</button></td></tr>`).join('');
 $('#empty-state').hidden=visible.length>0;
}
function openTransaction(){ $('#transaction-form').reset();$('#date').value=new Date().toLocaleDateString('en-CA');$('#form-error').textContent='';$('#transaction-dialog').showModal();$('#title').focus();}
$('#add-btn').addEventListener('click',openTransaction);$('#empty-add').addEventListener('click',openTransaction);
document.querySelectorAll('.close-dialog').forEach(el=>el.addEventListener('click',()=>el.closest('dialog').close()));
$('#transaction-form').addEventListener('submit',async e=>{e.preventDefault();try{const t=validateTransaction({type:$('#type').value,title:$('#title').value,amount:$('#amount').value,date:$('#date').value,category:$('#category').value});await api('/api/transactions','POST',t);await sync();$('#transaction-dialog').close();toast('Transaction added successfully');}catch(err){$('#form-error').textContent=err.message;}});
$('#transaction-rows').addEventListener('click',async e=>{const btn=e.target.closest('[data-id]');if(!btn)return;if(!confirm('Delete this transaction?'))return;try{await api('/api/transactions/'+encodeURIComponent(btn.dataset.id),'DELETE');await sync();toast('Transaction deleted')}catch(err){toast(err.message)}});
$('#month').addEventListener('change',()=>sync().catch(e=>toast(e.message)));$('#search').addEventListener('input',render);$('#filter-type').addEventListener('change',render);
$('#edit-budget').addEventListener('click',()=>{$('#budget-input').value=monthlyBudget;$('#budget-dialog').showModal();});
$('#budget-form').addEventListener('submit',async e=>{e.preventDefault();const next=Number($('#budget-input').value);if(!(next>0&&Number.isFinite(next)))return;try{await api('/api/budget','PUT',{month:$('#month').value,amount:next});monthlyBudget=next}catch(err){return toast(err.message)}$('#budget-dialog').close();render();toast('Budget updated');});
$('#export-btn').addEventListener('click',()=>{const blob=new Blob([toCsv(transactions)],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='atlas-transactions.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('CSV exported');});
$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const rows=parseCsvRows(await file.text());const expected=['date','type','title','category','amount'];if(!rows.length||expected.some((v,i)=>rows[0][i]?.trim().toLowerCase()!==v))throw new Error('CSV must start with date,type,title,category,amount.');if(rows.length>5001)throw new Error('Import up to 5,000 rows at a time.');const imported=rows.slice(1).map(r=>({...validateTransaction({date:r[0],type:r[1],title:r[2],category:r[3]||'Other',amount:r[4]}),id:crypto.randomUUID()}));if(!confirm(`Import ${imported.length} transactions? They will be added to existing data.`))return;await api('/api/import','POST',{transactions:imported});await sync();toast(`${imported.length} transactions imported`);}catch(err){alert('Import failed: '+err.message);}finally{e.target.value='';}});
$('#clear-data').addEventListener('click',async()=>{if(!confirm('Delete ALL transactions from this browser? Export a backup first.'))return;if(!confirm('This cannot be undone. Delete all transactions?'))return;try{await api('/api/transactions','DELETE');await sync();toast('All transactions deleted')}catch(e){toast(e.message)}});
const navItems=document.querySelectorAll('.nav-item');navItems.forEach(n=>n.addEventListener('click',()=>{navItems.forEach(x=>x.classList.remove('active'));n.classList.add('active');}));
api('/api/me').then(r=>{showApp(r.user);return sync()}).catch(()=>showAuth());
