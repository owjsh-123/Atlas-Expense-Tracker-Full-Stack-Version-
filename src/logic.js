export const CATEGORIES = ['Food & Drinks','Shopping','Transport','Housing','Utilities','Subscriptions','Health','Entertainment','Education','Other'];
export const formatMoney = (amount, currency='CAD') => new Intl.NumberFormat('en-CA',{style:'currency',currency}).format(Number(amount)||0);
export function summarize(transactions, month) {
 const current=transactions.filter(t=>t.date.slice(0,7)===month);
 const income=current.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
 const expenses=current.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
 const byCategory={}; for(const t of current.filter(t=>t.type==='expense')) byCategory[t.category]=(byCategory[t.category]||0)+t.amount;
 return {income,expenses,balance:income-expenses,byCategory,count:current.length};
}
export function validateTransaction(t) {
 if(!['expense','income'].includes(t.type)) throw new Error('Select income or expense.');
 if(!t.title || !String(t.title).trim())throw new Error('Add a description.');
 if(!Number.isFinite(Number(t.amount)) || Number(t.amount)<=0)throw new Error('Amount must be greater than zero.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||Number.isNaN(Date.parse(t.date+'T12:00:00')))throw new Error('Choose a valid date.');
 return {...t,title:String(t.title).trim().slice(0,120),amount:Math.round(Number(t.amount)*100)/100};
}
export function parseCsvRows(text){
 const rows=[]; let row=[],cell='',inQuotes=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(inQuotes&&text[i+1]==='"'){cell+='"';i++;}else inQuotes=!inQuotes;}else if(ch===','&&!inQuotes){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!inQuotes){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=ch;}
 row.push(cell);if(row.some(Boolean))rows.push(row);return rows;
}
export function toCsv(transactions){const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';return [['date','type','title','category','amount'],...transactions.map(t=>[t.date,t.type,t.title,t.category,t.amount])].map(r=>r.map(q).join(',')).join('\r\n');}
