const knownPMs = ['Ben', 'Jessica', 'Lexi', 'Melinda', 'Brandon', 'Brad'];
const passRx = /\b(reimbursement|reimbursements|reimbursable|pass[- ]?through)\b/i;
const feeRx = /payment processing fee|instant pay/i;
const changeRx = /change order/i;
const lossRx = /went with another|chose (?:a )?cheaper|another contractor|not moving forward|decided not to|declined (?:the )?(?:bid|work)|lost (?:the )?(?:job|bid)|owner chose|customer chose/i;
const activeRx = /\b(work(?:ing)? today|work underway|in progress|installed|installing|demo(?:ing)?|painting|on site|onsite|crew (?:is|was) there|wrapping up|finishing|started work|starting work|materials delivered|delivered today)\b/i;
const wholeDoneRx = /\b(job (?:is )?complete|work (?:is )?complete|all work (?:is )?complete|all done|ready to bill|job finished|wrapped up the job|complete and has been paid)\b/i;
const returnedRx = /returned|reversed|failed|voided|wrong acct.*returned|refunded by the bank/i;
const prepayRx = /paid in advance|before work started|prepayment|paid up front|deposit invoice|mobilization deposit/i;
const badMisrouteRx = /routed (?:this|it|the payment|funds|payment).*?(?:to|into).*?(?:franklin homes|wrong account|wrong card)|funded.*?(?:franklin homes|wrong account|wrong card)|instead of tenanturn|not tenanturn|to franklin homes.*not tenanturn/i;
const correctiveDepositRx = /reimbursement received from franklin homes|settling the misrouted|franklin repaid|returned the gross|correcting the misrouted/i;
const TOL = 0.02;
const TZ = 'America/Chicago';

export const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n || 0));
export const pct = n => `${Number.isFinite(n) ? n.toFixed(1) : '0.0'}%`;
export const sum = (a, f = x => x) => (a || []).reduce((t, x) => t + (Number(f(x)) || 0), 0);
export const ymd = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit' }).format(d);
const localDate = s => {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return String(s);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : ymd(d);
};
const day = s => s ? new Date(`${String(s).slice(0,10)}T12:00:00`) : null;
export const inRange = (s, a, b) => { const d=localDate(s); return !!d && !!a && !!b && day(d) >= day(a) && day(d) <= day(b); };
export const eventDate = d => d?.closedAt || d?.signedAt || d?.issueDate || d?.createdAt || null;
export const eventBusinessDate = d => localDate(eventDate(d));
const validMoneyStatus = s => s === 'pending' || s === 'approved';
const cleanName = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const strongScopeKey = i => i?.jobCostItem?.id || i?.sourceCostItem?.id || null;
const weakScopeKey = i => i?.name ? `NAME:${cleanName(i.name)}` : null;
const lineRevenue = i => Number(i?.priceWithTax ?? i?.price ?? 0) || 0;
const lineCost = i => Number(i?.cost ?? 0) || 0;
const isPassItem = i => passRx.test(`${i?.name || ''} ${i?.description || ''}`);
const isPassDoc = d => passRx.test(`${d?.fullName || ''} ${(d?.costItems?.nodes || []).map(i => `${i.name || ''} ${i.description || ''}`).join(' ')}`);
const isFeeDoc = d => String(d?.account?.name || '').trim() === '316 Payment Processing Fee' || feeRx.test(`${d?.account?.name || ''} ${d?.fullName || ''}`);
const isChange = d => changeRx.test(d?.fullName || '');
export const productionRevenue = d => {
  const items = d?.costItems?.nodes || [];
  if (!items.length) return isPassDoc(d) ? 0 : Number(d?.priceWithTax || 0);
  return sum(items, i => isPassItem(i) ? 0 : lineRevenue(i));
};
export const passRevenue = d => {
  const items = d?.costItems?.nodes || [];
  if (!items.length) return isPassDoc(d) ? Number(d?.priceWithTax || 0) : 0;
  return sum(items, i => isPassItem(i) ? lineRevenue(i) : 0);
};

export function rangeFor(mode, customStart, customEnd) {
  const n = new Date();
  const today = ymd(n);
  const base = new Date(`${today}T12:00:00`);
  let x = new Date(base);
  if (mode === 'Week') { const wd = (base.getDay() + 6) % 7; x.setDate(base.getDate() - wd); }
  if (mode === 'Month') x = new Date(base.getFullYear(), base.getMonth(), 1, 12);
  if (mode === 'Quarter') x = new Date(base.getFullYear(), Math.floor(base.getMonth() / 3) * 3, 1, 12);
  if (mode === 'Custom') return { start: customStart, end: customEnd };
  return { start: ymd(x), end: today };
}

export function normalize(api) {
  const p = api?.payload?.data || api?.payload || {};
  const o = p.organization || {};
  return {
    jobs: o.jobs?.nodes || [], docs: o.documents?.nodes || [], comments: o.comments?.nodes || [],
    logs: o.dailyLogs?.nodes || [], tasks: o.tasks?.nodes || [], payments: o.payments?.nodes || [],
    documentPayments: o.documentPayments?.nodes || [], fetchedAt: api?.fetchedAt || null,
  };
}

function add(map, key, val) { if (key) map[key] = (map[key] || 0) + (Number(val) || 0); }
function entries(doc, kind) {
  const items = doc?.costItems?.nodes || [];
  if (!items.length) return [{ key: `DOC:${doc.id}`, strong:false, weak:true, item:null, amount: kind === 'revenue' ? Number(doc.priceWithTax || 0) : Number(doc.cost || 0), pass:isPassDoc(doc) }];
  return items.map(i => ({ key: strongScopeKey(i) || weakScopeKey(i) || `ITEM:${i.id}`, strong:!!strongScopeKey(i), weak:!strongScopeKey(i), item:i, amount: kind === 'revenue' ? lineRevenue(i) : lineCost(i), pass:isPassItem(i) }));
}
function documentLineTotal(doc) {
  const items = doc?.costItems?.nodes || [];
  if (!items.length) return null;
  return doc.type?.startsWith('customer') ? sum(items, lineRevenue) : sum(items, lineCost);
}
function documentTotal(doc) { return doc.type?.startsWith('customer') ? Number(doc.priceWithTax || 0) : Number(doc.cost || 0); }

function sourceComment(job, jobComments, commentsById) {
  const ref = String(job?.description || '').match(/org comment\s+([A-Za-z0-9]+)/i)?.[1];
  if (ref && commentsById[ref]?.isPinned) return commentsById[ref];
  const scopePinned = (jobComments || []).filter(c => c.isPinned && /\bpm\b/i.test(c.message || '') && /lockbox|utilities|scope|notes/i.test(c.message || '')).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  return scopePinned[0] || null;
}
function sourceIdentity(job, jobComments, commentsById) {
  const c = sourceComment(job, jobComments, commentsById);
  const text = c?.message || job?.description || '';
  const pmLine = text.split(/\r?\n/).find(l => /\bpm\b/i.test(l)) || '';
  let pm = 'Unattributed';
  for (const n of knownPMs) if (new RegExp(`\\b${n}\\b`, 'i').test(pmLine)) { pm = n; break; }
  let workSource = 'Unknown';
  if (/\b316\b/i.test(pmLine)) workSource = '316 Rentals';
  else if (/blu\s*2|\bblu\b/i.test(pmLine)) workSource = 'Blu / Blu 2';
  else if (/\bsb\b|sb investments/i.test(pmLine)) workSource = 'SB Investments';
  else if (/\bpmi\b/i.test(pmLine)) workSource = 'PMI';
  else if (/\bjn\b/i.test(pmLine)) workSource = 'JN Investments';
  const billingCustomer = job?.location?.account?.name || 'Unknown';
  const operationallyAuthorized = !!c && (/\b316\b|blu\s*2|\bblu\b|\bsb\b|sb investments/i.test(pmLine));
  return { pm, workSource, billingCustomer, sourceCommentId:c?.id || null, sourceText:text, operationallyAuthorized };
}
function operationalEvidence(job, comments, logs) {
  const ops = [];
  for (const l of logs || []) if (l.date && String(l.notes || '').trim()) {
    const t = l.notes || '';
    if (wholeDoneRx.test(t)) ops.push({at:l.date,type:'done',text:t,kind:'log'});
    else if (activeRx.test(t)) ops.push({at:l.date,type:'active',text:t,kind:'log'});
  }
  for (const c of comments || []) {
    const t = c.message || '';
    if (wholeDoneRx.test(t)) ops.push({ at: c.createdAt, type: 'done', text: t, kind: 'comment' });
    else if (activeRx.test(t)) ops.push({ at: c.createdAt, type: 'active', text: t, kind: 'comment' });
  }
  ops.sort((a,b)=>new Date(a.at)-new Date(b.at));
  const latest=ops.at(-1)||null;
  return { started:ops.some(x=>x.type==='active')||Number(job?.taskSummary?.started||0)>0, done:latest?.type==='done', firstStart:ops.find(x=>x.type==='active')?.at||null, latest };
}
function isBadMisroute(p) { const t=`${p?.source||''} ${p?.description||''}`; if (correctiveDepositRx.test(t)) return false; return badMisrouteRx.test(t); }
function isVerifiedCashIn(p) { const t=`${p?.source||''} ${p?.description||''}`; if(p?.type!=='credit'||returnedRx.test(t)||isBadMisroute(p)) return false; return /1294|6268|tenanturn|deposit|edeposit|\bcheck\b|businesspro|meritrust|appfolio/i.test(t); }
function isVerifiedCashOut(p) { const t=`${p?.source||''} ${p?.description||''}`; if(p?.type!=='debit'||returnedRx.test(t)||Number(p?.amountApplied||0)<=TOL) return false; return /1294|6268|tenanturn|businesspro|meritrust|\bach\b|\bcheck\b|pay a person|bank transfer|withheld at source|netted/i.test(t); }
function findCorrection(p,payments) { const acct=p.account?.name||''; const amt=Number(p.amount||0); return (payments||[]).find(q=>q.id!==p.id&&q.account?.name===acct&&Math.abs(Number(q.amount||0)-amt)<=TOL&&new Date(q.paidAt)>new Date(p.paidAt)&&((p.type==='debit'&&q.type==='debit'&&Number(q.amountApplied||0)>TOL&&!returnedRx.test(`${q.source||''} ${q.description||''}`))||(p.type==='credit'&&q.type==='credit'&&isVerifiedCashIn(q)))); }
function completionDateForJob(j) { if(j.job?.closedOn) return j.job.closedOn; if(j.ev?.done&&j.ev?.latest?.at) return j.ev.latest.at; return null; }
function weeksBetween(a,b){ return Math.max(1,Math.ceil((day(b)-day(a))/(7*86400000))+1); }
function buildVendorCapacity(jobs,asOf){
  const out={}; const completed=jobs.filter(j=>completionDateForJob(j));
  for(const j of completed){ const completedAt=completionDateForJob(j); for(const [vendor,keyed] of Object.entries(j.vendorActualByKey||{})){ const cost=sum(Object.values(keyed)); if(!cost) continue; out[vendor]||={vendor,completed:[]}; out[vendor].completed.push({completedAt,cost,jobId:j.job.id,jobName:j.job.name}); }}
  const asOfDate=asOf||ymd(new Date()); const cutoff=new Date(day(asOfDate)); cutoff.setDate(cutoff.getDate()-55);
  for(const v of Object.values(out)){ const recent=v.completed.filter(x=>day(localDate(x.completedAt))>=cutoff&&day(localDate(x.completedAt))<=day(asOfDate)); const recentTotal=sum(recent,x=>x.cost); const lifetimeTotal=sum(v.completed,x=>x.cost); const firstRecent=recent.length?recent.map(x=>day(localDate(x.completedAt))).sort((a,b)=>a-b)[0]:null; const recentWeeks=firstRecent?Math.min(8,weeksBetween(ymd(firstRecent),asOfDate)):0; const lifetimeDates=v.completed.map(x=>day(localDate(x.completedAt))).sort((a,b)=>a-b); const lifetimeWeeks=lifetimeDates.length?weeksBetween(ymd(lifetimeDates[0]),asOfDate):0; v.rolling8WeeklyCost=recentWeeks?recentTotal/recentWeeks:0; v.lifetimeWeeklyCost=lifetimeWeeks?lifetimeTotal/lifetimeWeeks:0; v.sampleJobs8=recent.length; v.sampleJobsLifetime=v.completed.length; v.confidence=recent.length>=6?'High':recent.length>=3?'Medium':'Low'; }
  return out;
}

export function buildModel(data,start,end){
  const commentsById=Object.fromEntries((data.comments||[]).map(c=>[c.id,c]));
  const docs=data.docs||[];
  const orders=docs.filter(d=>d.type==='customerOrder'&&d.status!=='draft');
  const invoices=docs.filter(d=>d.type==='customerInvoice'&&validMoneyStatus(d.status));
  const vendorOrders=docs.filter(d=>d.type==='vendorOrder'&&validMoneyStatus(d.status));
  const vendorBills=docs.filter(d=>d.type==='vendorBill'&&validMoneyStatus(d.status));
  const deniedFinancials=docs.filter(d=>(d.type==='customerInvoice'||d.type==='vendorBill')&&d.status==='denied');
  const by={}; for(const j of data.jobs||[]) by[j.id]={job:j,orders:[],invoices:[],vendorOrders:[],vendorBills:[],comments:[],logs:[]};
  for(const d of orders) if(by[d.job?.id]) by[d.job.id].orders.push(d); for(const d of invoices) if(by[d.job?.id]) by[d.job.id].invoices.push(d); for(const d of vendorOrders) if(by[d.job?.id]) by[d.job.id].vendorOrders.push(d); for(const d of vendorBills) if(by[d.job?.id]) by[d.job.id].vendorBills.push(d); for(const c of data.comments||[]) if(by[c.job?.id]) by[c.job.id].comments.push(c); for(const l of data.logs||[]) if(by[l.job?.id]) by[l.job.id].logs.push(l);
  const dpByDoc={}; for(const dp of data.documentPayments||[]){ if(returnedRx.test(`${dp.payment?.source||''} ${dp.payment?.description||''}`)) continue; add(dpByDoc,dp.document?.id,dp.amount); }
  const jobs=[],exceptions=[]; const push=(job,severity,code,detail)=>exceptions.push({job:job?.name||'System',severity,code,detail});

  for(const x of Object.values(by)){
    const approved=x.orders.filter(d=>d.status==='approved'); const pending=x.orders.filter(d=>d.status==='pending');
    const approvedBase=approved.filter(d=>!isChange(d)); const approvedChanges=approved.filter(isChange); const pendingChanges=pending.filter(isChange); const pendingNew=pending.filter(d=>!isChange(d)).sort((a,b)=>new Date(eventDate(a))-new Date(eventDate(b))).at(-1)||null;
    if(approvedBase.length>1) push(x.job,'Review','MULTIPLE_APPROVED_BASE_ORDERS',`${approvedBase.length} approved non-change-order proposals exist; verify which revisions comprise the contract.`);
    const baseApproval=approvedBase.sort((a,b)=>new Date(eventDate(a))-new Date(eventDate(b)))[0]||null; const baseDocs=x.orders.filter(d=>!isChange(d)).sort((a,b)=>new Date(eventDate(a))-new Date(eventDate(b))); const latestBase=baseDocs.at(-1)||null;
    const narrative=`${x.job.description||''} ${x.comments.map(c=>c.message||'').join(' ')} ${x.logs.map(l=>l.notes||'').join(' ')}`; const lossEvidence=lossRx.test(narrative); const trueLoss=!baseApproval&&latestBase?.status==='denied'&&lossEvidence; const outcomeReview=!baseApproval&&latestBase?.status==='denied'&&!lossEvidence;
    const src=sourceIdentity(x.job,x.comments,commentsById); const ev=operationalEvidence(x.job,x.comments,x.logs);
    if(/316/i.test(x.job.location?.account?.name||'')&&src.pm==='Unattributed') push(x.job,'Review','PM_UNATTRIBUTED','316 job has no resolvable original pinned PM scope.');
    if(x.job.closedOn&&ev.latest&&new Date(ev.latest.at)>new Date(x.job.closedOn)&&ev.latest.type==='active') push(x.job,'Critical','ACTIVE_AFTER_JOB_CLOSED','Production evidence exists after the JobTread close date.');

    const contractByKey={},billedByKey={},actualByKey={},commitByKey={},vendorCommitByKey={},vendorActualByKey={}; let billedPass=0,passCost=0,feeCost=0,customerRefundCost=0;
    const weakContract=new Map(),weakBilled=new Map(),weakActual=new Map(),weakCommit=new Map();
    const recordWeak=(map,e,doc)=>{if(!e.weak) return; const arr=map.get(e.key)||[]; arr.push({docId:doc.id,docName:doc.fullName,amount:e.amount}); map.set(e.key,arr);};
    for(const d of approved) for(const e of entries(d,'revenue')){ if(!e.pass){add(contractByKey,e.key,e.amount);recordWeak(weakContract,e,d);} }
    for(const d of x.invoices){
      const lineTotal=documentLineTotal(d); if(lineTotal!=null&&Math.abs(lineTotal-documentTotal(d))>TOL) push(x.job,'Critical','INVOICE_TOTAL_MISMATCH',`${d.fullName}: lines ${money(lineTotal)} do not tie to ${money(documentTotal(d))}.`);
      const applied=dpByDoc[d.id]||0; if(Math.abs(applied-Number(d.amountPaid||0))>TOL) push(x.job,'Critical','INVOICE_PAYMENT_MISMATCH',`${d.fullName}: amountPaid ${money(d.amountPaid)} vs linked payments ${money(applied)}.`);
      const expectedBalance=Number(d.priceWithTax||0)-Number(d.amountPaid||0); if(Math.abs(expectedBalance-Number(d.balance||0))>TOL) push(x.job,'Critical','INVOICE_BALANCE_MISMATCH',`${d.fullName}: expected balance ${money(expectedBalance)}, stored ${money(d.balance)}.`);
      for(const e of entries(d,'revenue')){ if(e.pass)billedPass+=e.amount; else{add(billedByKey,e.key,e.amount);recordWeak(weakBilled,e,d);} }
    }
    for(const d of x.vendorOrders) for(const e of entries(d,'cost')){ if(e.pass) continue; add(commitByKey,e.key,e.amount); recordWeak(weakCommit,e,d); const vn=d.account?.name||'Unknown'; vendorCommitByKey[vn]||={}; add(vendorCommitByKey[vn],e.key,e.amount); }
    for(const d of x.vendorBills){ const applied=dpByDoc[d.id]||0; if(Math.abs(applied-Number(d.amountPaid||0))>TOL) push(x.job,'Critical','BILL_PAYMENT_MISMATCH',`${d.fullName}: amountPaid ${money(d.amountPaid)} vs linked payments ${money(applied)}.`); if(isFeeDoc(d)){feeCost+=Number(d.cost||0);continue;} const customerRefund=d.account?.type==='customer'; for(const e of entries(d,'cost')){ if(e.pass){passCost+=e.amount;continue;} if(customerRefund){customerRefundCost+=e.amount;continue;} add(actualByKey,e.key,e.amount); recordWeak(weakActual,e,d); const vn=d.account?.name||'Unknown'; vendorActualByKey[vn]||={}; add(vendorActualByKey[vn],e.key,e.amount);} }

    const allWeakKeys=new Set([...weakContract.keys(),...weakBilled.keys(),...weakActual.keys(),...weakCommit.keys()]);
    for(const k of allWeakKeys){ const groups=[weakContract.get(k)||[],weakBilled.get(k)||[],weakActual.get(k)||[],weakCommit.get(k)||[]]; const distinctDocs=new Set(groups.flat().map(x=>x.docId)); if(distinctDocs.size>1) push(x.job,'Review','WEAK_SCOPE_MATCH',`${k} is being reconciled by name rather than a shared JobTread cost-item ID across ${distinctDocs.size} documents.`); }
    for(const [k,billed] of Object.entries(billedByKey)) if(billed>(contractByKey[k]||0)+TOL) push(x.job,'Critical','BILLED_UNCONTRACTED_SCOPE',`${k}: billed ${money(billed)} vs approved ${money(contractByKey[k]||0)}.`);
    for(const [k,actual] of Object.entries(actualByKey)){ const committed=commitByKey[k]||0; if(actual>committed+TOL) push(x.job,'Review','COST_OVER_COMMITMENT',`${k}: incurred ${money(actual)} vs work-order commitment ${money(committed)}.`); if(committed<=TOL) push(x.job,'Review','UNCOMMITTED_COST',`${k}: incurred ${money(actual)} without a matching valid vendor work order.`); }
    if(approvedChanges.some(d=>Number(d.priceWithTax||0)<-TOL)) push(x.job,'Info','NEGATIVE_CHANGE_ORDER','Approved negative change order/credit reduces contract value and is retained in the audit trail.');

    const contractedProduction=sum(Object.values(contractByKey)),billedProduction=sum(Object.values(billedByKey)),actualProductionCost=sum(Object.values(actualByKey)); let unbilledContracted=0; for(const [k,c] of Object.entries(contractByKey)) unbilledContracted+=Math.max(0,c-(billedByKey[k]||0));
    const remainingCommitByVendor={}; for(const [vn,keyed] of Object.entries(vendorCommitByKey)) for(const [k,c] of Object.entries(keyed)) add(remainingCommitByVendor,vn,Math.max(0,c-(vendorActualByKey[vn]?.[k]||0)));
    const activeVendorNames=Object.keys(vendorCommitByKey); const hasOperationalApproval=!!baseApproval||src.operationallyAuthorized;
    let stage='No Approved Work'; if(hasOperationalApproval&&!x.job.closedOn){ if(!activeVendorNames.length&&!ev.started) stage='Backlog'; else if(activeVendorNames.length&&!ev.started) stage='Assigned / Not Started'; else if(!activeVendorNames.length&&ev.started) stage='Review'; else if(ev.started&&!ev.done) stage='WIP'; else if(ev.done&&unbilledContracted>TOL) stage='Ready to Bill'; else if(ev.done) stage='Complete / Billed'; else stage='Review'; } else if(x.job.closedOn) stage='Closed';
    const ar=sum(x.invoices,d=>Number(d.balance||0)),cashAP=sum(x.vendorBills,d=>Number(d.balance||0)); const customerPaymentDates=(data.documentPayments||[]).filter(dp=>dp.document?.job?.id===x.job.id&&dp.document?.type==='customerInvoice'&&dp.payment?.type==='credit').map(dp=>dp.payment?.paidAt).filter(Boolean); if(prepayRx.test(narrative)||x.invoices.some(d=>/deposit/i.test(d.fullName||''))||customerPaymentDates.some(p=>ev.firstStart&&new Date(p)<new Date(ev.firstStart))) push(x.job,'Info','PREPAYMENT_OR_DEPOSIT','Customer funds preceded production; retained as billing/cash activity, never treated as period profit.');
    const profit=billedProduction-actualProductionCost-feeCost-customerRefundCost,margin=billedProduction?100*profit/billedProduction:0,open=['Backlog','Assigned / Not Started','WIP','Ready to Bill','Review'].includes(stage),hasCritical=exceptions.some(e=>e.job===x.job.name&&e.severity==='Critical'),commitmentGap=Math.max(0,sum(Object.values(commitByKey))-actualProductionCost),economicsStatus=open?'Provisional':hasCritical?'Exception':commitmentGap>TOL?'Cost incomplete':'Reconciled';
    jobs.push({...x,src,ev,baseApproval,latestBase,lossEvidence,approvedChanges,pendingChanges,pendingNew,trueLoss,outcomeReview,contractedProduction,billedProduction,billedPass,passCost,actualProductionCost,feeCost,customerRefundCost,unbilledContracted,remainingCommitByVendor,vendorActualByKey,billedByKey,stage,ar,cashAP,profit,margin,economicsStatus,contractByKey,actualByKey});
  }

  for(const d of deniedFinancials) push(d.job,'Info','DENIED_FINANCIAL_EXCLUDED',`${d.fullName} is denied audit history and excluded from all totals.`);
  const payments=data.payments||[]; for(const p of payments){ const arithmeticGap=Number(p.amount||0)-Number(p.amountApplied||0)-Number(p.amountUnapplied||0); if(Math.abs(arithmeticGap)>TOL) push({name:p.account?.name||'Cash ledger'},'Critical','PAYMENT_ARITHMETIC',`${localDate(p.paidAt)||'—'} ${money(p.amount)} does not equal applied + unapplied.`); const text=`${p.source||''} ${p.description||''}`,correction=findCorrection(p,payments); if(isBadMisroute(p)) push({name:p.account?.name||'Cash ledger'},correction?'Info':'Critical',correction?'RESOLVED_CASH_MISROUTE':'CASH_MISROUTE',`${localDate(p.paidAt)||'—'} ${money(p.amount)} was routed away from TenanTurn${correction?` and corrected on ${localDate(correction.paidAt)}`:''}.`); else if(returnedRx.test(text)) push({name:p.account?.name||'Cash ledger'},correction?'Info':'Review',correction?'RESOLVED_RETURNED_PAYMENT':'RETURNED_PAYMENT',`${localDate(p.paidAt)||'—'} ${money(p.amount)} returned/reversed${correction?` and was successfully replaced on ${localDate(correction.paidAt)}`:''}.`); else if(p.type==='credit'&&!isVerifiedCashIn(p)) push({name:p.account?.name||'Cash ledger'},'Review','CASH_DESTINATION_UNVERIFIED',`${localDate(p.paidAt)||'—'} credit ${money(p.amount)} has no sufficient evidence it reached or is headed to TenanTurn.`); if(Number(p.amountUnapplied||0)>TOL&&!correctiveDepositRx.test(text)) push({name:p.account?.name||'Cash ledger'},'Review','UNAPPLIED_CASH',`${localDate(p.paidAt)||'—'} ${money(p.amountUnapplied)} remains unapplied.`); }

  const fingerprint=new Map(); for(const d of [...invoices,...vendorBills]){ const key=[d.type,d.job?.id||'',d.account?.id||'',localDate(d.issueDate||d.createdAt)||'',Number(documentTotal(d)||0).toFixed(2)].join('|'); const arr=fingerprint.get(key)||[]; arr.push(d); fingerprint.set(key,arr); } for(const arr of fingerprint.values()) if(arr.length>1) push(arr[0].job,'Critical','POSSIBLE_DUPLICATE_FINANCIAL',`${arr.length} valid financial documents share type/job/account/date/amount: ${arr.map(d=>d.fullName).join(', ')}.`);

  const wins=jobs.filter(j=>j.baseApproval&&inRange(eventDate(j.baseApproval),start,end)); const losses=jobs.filter(j=>j.trueLoss&&inRange(eventDate(j.latestBase),start,end)); const pendingNew=jobs.filter(j=>j.pendingNew); const approvedChanges=jobs.flatMap(j=>j.approvedChanges.map(doc=>({job:j.job,pm:j.src.pm,source:j.src.workSource,doc}))).filter(x=>inRange(eventDate(x.doc),start,end)); const pendingChanges=jobs.flatMap(j=>j.pendingChanges.map(doc=>({job:j.job,pm:j.src.pm,source:j.src.workSource,doc}))); const winRate=wins.length+losses.length?100*wins.length/(wins.length+losses.length):0,salesWon=sum(wins,j=>productionRevenue(j.baseApproval));
  const periodInvoices=invoices.filter(d=>inRange(d.issueDate,start,end)),periodBilled=sum(periodInvoices,productionRevenue),periodPass=sum(periodInvoices,passRevenue); const periodPayments=payments.filter(p=>inRange(p.paidAt,start,end)),verifiedCashIn=sum(periodPayments.filter(isVerifiedCashIn),p=>p.amount),verifiedCashOut=sum(periodPayments.filter(isVerifiedCashOut),p=>p.amount); const arDocs=invoices.filter(d=>Number(d.balance||0)>TOL),apDocs=vendorBills.filter(d=>Number(d.balance||0)>TOL),current=jobs.filter(j=>['Backlog','Assigned / Not Started','WIP','Ready to Bill','Review'].includes(j.stage));
  const vendorCapacityModel=buildVendorCapacity(jobs,end||ymd(new Date())); const vendorRows={}; for(const j of jobs) for(const vn of new Set([...Object.keys(j.vendorActualByKey||{}),...Object.keys(j.remainingCommitByVendor||{})])){ vendorRows[vn]||={vendor:vn,actualCost:0,remainingCommit:0,jobs:new Set(),revenue:0}; const r=vendorRows[vn]; r.actualCost+=sum(Object.values(j.vendorActualByKey?.[vn]||{})); r.remainingCommit+=Number(j.remainingCommitByVendor?.[vn]||0); if(r.actualCost||r.remainingCommit) r.jobs.add(j.job.id); const jobActualTotal=j.actualProductionCost||0; if(jobActualTotal>0) r.revenue+=j.billedProduction*(sum(Object.values(j.vendorActualByKey?.[vn]||{}))/jobActualTotal); }
  const vendors=Object.values(vendorRows).map(r=>{const cap=vendorCapacityModel[r.vendor]||null,weekly=cap?.rolling8WeeklyCost||0,gp=r.revenue-r.actualCost; return {name:r.vendor,openJobs:[...r.jobs].filter(id=>current.some(j=>j.job.id===id)).length,remainingCost:r.remainingCommit,attributedRevenue:r.revenue,actualCost:r.actualCost,gp,margin:r.revenue?100*gp/r.revenue:0,rolling8WeeklyCost:weekly,lifetimeWeeklyCost:cap?.lifetimeWeeklyCost||0,capacityConfidence:cap?.confidence||'Low',capacitySampleJobs:cap?.sampleJobs8||0,weeks:weekly>0?r.remainingCommit/weekly:null,read:weekly>0?`${cap.confidence} confidence`:'Learning'};}).sort((a,b)=>b.actualCost-a.actualCost);
  const pmap={}; for(const j of jobs){ const name=j.src.pm||'Unattributed'; pmap[name]||={name,approvals:0,approved:0,pending:0,lifetimeBilled:0,reconciledGP:0}; if(j.baseApproval&&inRange(eventDate(j.baseApproval),start,end)){pmap[name].approvals++;pmap[name].approved+=productionRevenue(j.baseApproval);} if(j.pendingNew)pmap[name].pending++; pmap[name].lifetimeBilled+=j.billedProduction; if(j.economicsStatus==='Reconciled')pmap[name].reconciledGP+=j.profit; } const pms=Object.values(pmap).map(p=>({...p,margin:p.lifetimeBilled?100*p.reconciledGP/p.lifetimeBilled:0})).sort((a,b)=>b.approved-a.approved);
  const critical=exceptions.filter(e=>e.severity==='Critical'),review=exceptions.filter(e=>e.severity==='Review'),info=exceptions.filter(e=>e.severity==='Info'); const reconciledJobs=jobs.filter(j=>j.economicsStatus==='Reconciled'),reconciledGP=sum(reconciledJobs,j=>j.profit),provisionalGP=sum(jobs.filter(j=>j.economicsStatus==='Provisional'),j=>j.profit),customerPaymentsApplied=sum((data.documentPayments||[]).filter(dp=>dp.document?.type==='customerInvoice'&&dp.payment?.type==='credit'&&inRange(dp.payment?.paidAt,start,end)&&!returnedRx.test(`${dp.payment?.source||''} ${dp.payment?.description||''}`)),dp=>dp.amount);
  const result={jobs,exceptions:exceptions.sort((a,b)=>a.severity===b.severity?0:a.severity==='Critical'?-1:b.severity==='Critical'?1:a.severity==='Review'?-1:1),trust:critical.length?'BLOCKED':review.length?'REVIEW':'RECONCILED',critical,review,info,criticalCount:critical.length,reviewCount:review.length,infoCount:info.length,sales:{wins,losses,pendingNew,approvedChanges,pendingChanges,winRate,salesWon},finance:{periodBilled,periodPass,verifiedCashIn,verifiedCashOut,ar:sum(arDocs,d=>d.balance),ap:sum(apDocs,d=>d.balance)},ops:{current},people:{vendors,vendorCapacityModel,pms},wins,losses,pendingNew,approvedChanges,pendingChanges,winRate,salesWon,periodBilled,periodPass,verifiedCashIn,verifiedCashOut,customerPaymentsApplied,netVerifiedCash:verifiedCashIn-verifiedCashOut,arDocs,apDocs,current,vendors,pms,reconciledJobs,reconciledGP,provisionalGP,outcomeReviews:jobs.filter(j=>j.outcomeReview)};
  result.audit={critical:critical.length,review:review.length,info:info.length}; result.cash={in:verifiedCashIn,out:verifiedCashOut}; return result;
}
export const buildForensicModel = buildModel;
