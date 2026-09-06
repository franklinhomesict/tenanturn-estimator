const vendorCapacity = {};

const knownPMs = ['Ben', 'Jessica', 'Lexi', 'Melinda', 'Brandon', 'Brad'];
const passRx = /\b(reimbursement|reimbursements|reimbursable|pass[- ]?through)\b/i;
const feeRx = /payment processing fee|instant pay/i;
const changeRx = /change order/i;
const lossRx = /went with another|chose (?:a )?cheaper|another contractor|not moving forward|decided not to|declined (?:the )?(?:bid|work)|lost (?:the )?(?:job|bid)|owner chose|customer chose/i;
const activeRx = /\b(work(?:ing)? today|work underway|in progress|installed|installing|demo(?:ing)?|painting|on site|onsite|crew (?:is|was) there|wrapping up|finishing|started work|starting work)\b/i;
const wholeDoneRx = /\b(job (?:is )?complete|work (?:is )?complete|all work (?:is )?complete|all done|ready to bill|job finished|wrapped up the job)\b/i;
const returnedRx = /returned|reversed|failed|voided|wrong acct.*returned|refunded by the bank/i;
const prepayRx = /paid in advance|before work started|prepayment|paid up front|deposit invoice|mobilization deposit/i;
const badMisrouteRx = /routed (?:this|it|the payment|funds|payment).*?(?:to|into).*?(?:franklin homes|wrong account|wrong card)|funded.*?(?:franklin homes|wrong account|wrong card)|instead of tenanturn|not tenanturn|to franklin homes.*not tenanturn/i;
const correctiveDepositRx = /reimbursement received from franklin homes|settling the misrouted|franklin repaid|returned the gross|correcting the misrouted/i;
const TOL = 0.02;

export const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n || 0));
export const pct = n => `${Number.isFinite(n) ? n.toFixed(1) : '0.0'}%`;
export const sum = (a, f = x => x) => (a || []).reduce((t, x) => t + (Number(f(x)) || 0), 0);
export const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = s => s ? new Date(`${String(s).slice(0, 10)}T12:00:00`) : null;
export const inRange = (s, a, b) => !!s && !!a && !!b && day(s) >= day(a) && day(s) <= day(b);
export const eventDate = d => d?.closedAt || d?.signedAt || d?.issueDate || d?.createdAt || null;
const validMoneyStatus = s => s === 'pending' || s === 'approved';
const cleanName = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const scopeKey = i => i?.jobCostItem?.id || i?.sourceCostItem?.id || (i?.name ? `NAME:${cleanName(i.name)}` : null);
const lineRevenue = i => Number(i?.priceWithTax ?? i?.price ?? 0) || 0;
const lineCost = i => Number(i?.cost ?? 0) || 0;
const isPassItem = i => passRx.test(`${i?.name || ''} ${i?.description || ''}`);
const isPassDoc = d => passRx.test(`${d?.fullName || ''} ${(d?.costItems?.nodes || []).map(i => `${i.name || ''} ${i.description || ''}`).join(' ')}`);
const isFeeDoc = d => String(d?.account?.name || '').trim() === '316 Payment Processing Fee' || feeRx.test(`${d?.account?.name || ''} ${d?.fullName || ''}`);
const isChange = d => changeRx.test(d?.fullName || '');
export const productionRevenue = d => {
  const items = d?.costItems?.nodes || [];
  return items.length ? sum(items, i => isPassItem(i) ? 0 : lineRevenue(i)) : Number(d?.priceWithTax || 0);
};
export const passRevenue = d => sum(d?.costItems?.nodes || [], i => isPassItem(i) ? lineRevenue(i) : 0);

export function rangeFor(mode, customStart, customEnd) {
  const n = new Date();
  let x = new Date(n);
  if (mode === 'Week') { const wd = (n.getDay() + 6) % 7; x.setDate(n.getDate() - wd); }
  if (mode === 'Month') x = new Date(n.getFullYear(), n.getMonth(), 1);
  if (mode === 'Quarter') x = new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1);
  if (mode === 'Custom') return { start: customStart, end: customEnd };
  return { start: ymd(x), end: ymd(n) };
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
  if (!items.length) return [{ key: `DOC:${doc.id}`, weak: true, item: null, amount: kind === 'revenue' ? Number(doc.priceWithTax || 0) : Number(doc.cost || 0), pass: isPassDoc(doc) }];
  return items.map(i => ({ key: scopeKey(i) || `ITEM:${i.id}`, weak: !i?.jobCostItem?.id && !i?.sourceCostItem?.id, item: i, amount: kind === 'revenue' ? lineRevenue(i) : lineCost(i), pass: isPassItem(i) }));
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
  const pmPinned = (jobComments || []).filter(c => c.isPinned && /\bpm\b/i.test(c.message || '')).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return pmPinned[0] || null;
}
function sourceIdentity(job, jobComments, commentsById) {
  const c = sourceComment(job, jobComments, commentsById);
  const text = c?.message || job?.description || '';
  const pmLine = text.split(/\r?\n/).find(l => /\bpm\b/i.test(l)) || '';
  let pm = 'Unattributed';
  for (const n of knownPMs) if (new RegExp(`\\b${n}\\b`, 'i').test(pmLine)) { pm = n; break; }
  if (pm === 'Unattributed') {
    if (/\bpmi\b/i.test(pmLine)) pm = 'PMI';
    else if (/\bjn\b/i.test(pmLine)) pm = 'JN';
  }
  let source = job?.location?.account?.name || 'Unknown';
  if (/316/i.test(pmLine)) source = '316 Rentals';
  else if (/blu\s*2|\bblu\b/i.test(pmLine) || /blu\s*2/i.test(text)) source = 'Blu / Blu 2';
  else if (/\bpmi\b/i.test(pmLine)) source = 'PMI';
  else if (/\bjn\b/i.test(pmLine)) source = 'JN Investments';
  else if (/\bsb\b|sb investments/i.test(pmLine)) source = 'SB Investments';
  return { pm, source, sourceCommentId: c?.id || null, sourceText: text };
}
function operationalEvidence(job, comments, logs) {
  const ops = [];
  for (const l of logs || []) if (l.date) ops.push({ at: l.date, type: 'active', text: l.notes || '', kind: 'log' });
  for (const c of comments || []) {
    const t = c.message || '';
    if (wholeDoneRx.test(t)) ops.push({ at: c.createdAt, type: 'done', text: t, kind: 'comment' });
    else if (activeRx.test(t)) ops.push({ at: c.createdAt, type: 'active', text: t, kind: 'comment' });
  }
  ops.sort((a, b) => new Date(a.at) - new Date(b.at));
  const latest = ops.at(-1) || null;
  return { started: ops.some(x => x.type === 'active') || Number(job?.taskSummary?.started || 0) > 0, done: latest?.type === 'done', firstStart: ops.find(x => x.type === 'active')?.at || null, latest };
}

function isBadMisroute(p) {
  const t = `${p?.source || ''} ${p?.description || ''}`;
  if (correctiveDepositRx.test(t)) return false;
  return badMisrouteRx.test(t);
}
function isVerifiedCashIn(p) {
  const t = `${p?.source || ''} ${p?.description || ''}`;
  if (p?.type !== 'credit' || returnedRx.test(t) || isBadMisroute(p)) return false;
  return /1294|6268|tenanturn|deposit|edeposit|\bcheck\b|businesspro|meritrust|appfolio/i.test(t);
}
function isVerifiedCashOut(p) {
  const t = `${p?.source || ''} ${p?.description || ''}`;
  if (p?.type !== 'debit' || returnedRx.test(t) || Number(p?.amountApplied || 0) <= TOL) return false;
  return /1294|6268|tenanturn|businesspro|meritrust|\bach\b|\bcheck\b|pay a person|bank transfer|withheld at source|netted/i.test(t);
}
function findCorrection(p, payments) {
  const acct = p.account?.name || '';
  const amt = Number(p.amount || 0);
  return (payments || []).find(q => q.id !== p.id && q.account?.name === acct && Math.abs(Number(q.amount || 0) - amt) <= TOL && new Date(q.paidAt) > new Date(p.paidAt) && ((p.type === 'debit' && q.type === 'debit' && Number(q.amountApplied || 0) > TOL && !returnedRx.test(`${q.source || ''} ${q.description || ''}`)) || (p.type === 'credit' && q.type === 'credit' && isVerifiedCashIn(q))));
}

function completionDateForJob(j) {
  if (j.job?.closedOn) return j.job.closedOn;
  if (j.ev?.done && j.ev?.latest?.at) return j.ev.latest.at;
  return null;
}
function weeksBetween(a, b) { return Math.max(1, Math.ceil((day(b) - day(a)) / (7 * 86400000)) + 1); }
function buildVendorCapacity(jobs, asOf) {
  const out = {};
  const completed = jobs.filter(j => completionDateForJob(j));
  for (const j of completed) {
    const completedAt = completionDateForJob(j);
    for (const [vendor, keyed] of Object.entries(j.vendorActualByKey || {})) {
      const cost = sum(Object.values(keyed));
      if (!cost) continue;
      out[vendor] ||= { vendor, completed: [] };
      out[vendor].completed.push({ completedAt, cost, jobId: j.job.id, jobName: j.job.name });
    }
  }
  const cutoff = new Date(day(asOf || ymd(new Date()))); cutoff.setDate(cutoff.getDate() - 55);
  for (const v of Object.values(out)) {
    const recent = v.completed.filter(x => day(x.completedAt) >= cutoff && day(x.completedAt) <= day(asOf || ymd(new Date())));
    const recentTotal = sum(recent, x => x.cost);
    const lifetimeTotal = sum(v.completed, x => x.cost);
    const firstRecent = recent.length ? recent.map(x => day(x.completedAt)).sort((a,b)=>a-b)[0] : null;
    const recentWeeks = firstRecent ? Math.min(8, weeksBetween(ymd(firstRecent), asOf || ymd(new Date()))) : 0;
    const lifetimeDates = v.completed.map(x => day(x.completedAt)).sort((a,b)=>a-b);
    const lifetimeWeeks = lifetimeDates.length ? weeksBetween(ymd(lifetimeDates[0]), asOf || ymd(new Date())) : 0;
    v.rolling8WeeklyCost = recentWeeks ? recentTotal / recentWeeks : 0;
    v.lifetimeWeeklyCost = lifetimeWeeks ? lifetimeTotal / lifetimeWeeks : 0;
    v.sampleJobs8 = recent.length;
    v.sampleJobsLifetime = v.completed.length;
    v.confidence = recent.length >= 6 ? 'High' : recent.length >= 3 ? 'Medium' : 'Low';
  }
  return out;
}

export function buildModel(data, start, end) {
  const commentsById = Object.fromEntries((data.comments || []).map(c => [c.id, c]));
  const docs = data.docs || [];
  const orders = docs.filter(d => d.type === 'customerOrder' && d.status !== 'draft');
  const invoices = docs.filter(d => d.type === 'customerInvoice' && validMoneyStatus(d.status));
  const vendorOrders = docs.filter(d => d.type === 'vendorOrder' && validMoneyStatus(d.status));
  const vendorBills = docs.filter(d => d.type === 'vendorBill' && validMoneyStatus(d.status));
  const deniedFinancials = docs.filter(d => (d.type === 'customerInvoice' || d.type === 'vendorBill') && d.status === 'denied');
  const by = {}; for (const j of data.jobs || []) by[j.id] = { job: j, orders: [], invoices: [], vendorOrders: [], vendorBills: [], comments: [], logs: [] };
  for (const d of orders) if (by[d.job?.id]) by[d.job.id].orders.push(d);
  for (const d of invoices) if (by[d.job?.id]) by[d.job.id].invoices.push(d);
  for (const d of vendorOrders) if (by[d.job?.id]) by[d.job.id].vendorOrders.push(d);
  for (const d of vendorBills) if (by[d.job?.id]) by[d.job.id].vendorBills.push(d);
  for (const c of data.comments || []) if (by[c.job?.id]) by[c.job.id].comments.push(c);
  for (const l of data.logs || []) if (by[l.job?.id]) by[l.job.id].logs.push(l);
  const dpByDoc = {}; for (const dp of data.documentPayments || []) { if (returnedRx.test(`${dp.payment?.source || ''} ${dp.payment?.description || ''}`)) continue; add(dpByDoc, dp.document?.id, dp.amount); }
  const jobs = [], exceptions = [];
  const push = (job, severity, code, detail) => exceptions.push({ job: job?.name || 'System', severity, code, detail });

  for (const x of Object.values(by)) {
    const approved = x.orders.filter(d => d.status === 'approved');
    const pending = x.orders.filter(d => d.status === 'pending');
    const approvedBase = approved.filter(d => !isChange(d));
    const approvedChanges = approved.filter(isChange);
    const pendingChanges = pending.filter(isChange);
    const pendingNew = pending.filter(d => !isChange(d)).sort((a,b)=>new Date(eventDate(a))-new Date(eventDate(b))).at(-1) || null;
    const baseApproval = approvedBase.sort((a,b)=>new Date(eventDate(a))-new Date(eventDate(b)))[0] || null;
    const baseDocs = x.orders.filter(d => !isChange(d)).sort((a,b)=>new Date(eventDate(a))-new Date(eventDate(b)));
    const latestBase = baseDocs.at(-1) || null;
    const narrative = `${x.job.description || ''} ${x.comments.map(c=>c.message||'').join(' ')} ${x.logs.map(l=>l.notes||'').join(' ')}`;
    const lossEvidence = lossRx.test(narrative);
    const trueLoss = !baseApproval && latestBase?.status === 'denied' && lossEvidence;
    const outcomeReview = !baseApproval && latestBase?.status === 'denied' && !lossEvidence;
    const src = sourceIdentity(x.job, x.comments, commentsById);
    const ev = operationalEvidence(x.job, x.comments, x.logs);
    if (/316/i.test(x.job.location?.account?.name || '') && src.pm === 'Unattributed') push(x.job, 'Review', 'PM_UNATTRIBUTED', '316 job has no resolvable pinned PM source.');

    const contractByKey = {}, billedByKey = {}, actualByKey = {}, commitByKey = {}, vendorCommitByKey = {}, vendorActualByKey = {};
    let billedPass = 0, passCost = 0, feeCost = 0, customerRefundCost = 0;
    for (const d of approved) for (const e of entries(d, 'revenue')) if (!e.pass) add(contractByKey, e.key, e.amount);
    for (const d of x.invoices) {
      const lineTotal = documentLineTotal(d); if (lineTotal != null && Math.abs(lineTotal - documentTotal(d)) > TOL) push(x.job,'Critical','INVOICE_TOTAL_MISMATCH',`${d.fullName}: lines ${money(lineTotal)} do not tie to ${money(documentTotal(d))}.`);
      const applied = dpByDoc[d.id] || 0; if (Math.abs(applied - Number(d.amountPaid || 0)) > TOL) push(x.job,'Critical','INVOICE_PAYMENT_MISMATCH',`${d.fullName}: amountPaid ${money(d.amountPaid)} vs linked payments ${money(applied)}.`);
      const expectedBalance = Number(d.priceWithTax || 0) - Number(d.amountPaid || 0); if (Math.abs(expectedBalance - Number(d.balance || 0)) > TOL) push(x.job,'Critical','INVOICE_BALANCE_MISMATCH',`${d.fullName}: expected balance ${money(expectedBalance)}, stored ${money(d.balance)}.`);
      for (const e of entries(d,'revenue')) { if (e.pass) billedPass += e.amount; else add(billedByKey,e.key,e.amount); }
    }
    for (const d of x.vendorOrders) for (const e of entries(d,'cost')) { if (e.pass) continue; add(commitByKey,e.key,e.amount); const vn=d.account?.name||'Unknown'; vendorCommitByKey[vn] ||= {}; add(vendorCommitByKey[vn],e.key,e.amount); }
    for (const d of x.vendorBills) {
      const applied=dpByDoc[d.id]||0; if (Math.abs(applied-Number(d.amountPaid||0))>TOL) push(x.job,'Critical','BILL_PAYMENT_MISMATCH',`${d.fullName}: amountPaid ${money(d.amountPaid)} vs linked payments ${money(applied)}.`);
      if (isFeeDoc(d)) { feeCost += Number(d.cost||0); continue; }
      const customerRefund = d.account?.type === 'customer';
      for (const e of entries(d,'cost')) { if (e.pass) { passCost += e.amount; continue; } if (customerRefund) { customerRefundCost += e.amount; continue; } add(actualByKey,e.key,e.amount); const vn=d.account?.name||'Unknown'; vendorActualByKey[vn] ||= {}; add(vendorActualByKey[vn],e.key,e.amount); }
    }
    for (const [k,billed] of Object.entries(billedByKey)) if (billed > (contractByKey[k]||0)+TOL) push(x.job,'Critical','BILLED_UNCONTRACTED_SCOPE',`${k}: billed ${money(billed)} vs approved ${money(contractByKey[k]||0)}.`);
    for (const [k,actual] of Object.entries(actualByKey)) { const committed=commitByKey[k]||0; if (actual>committed+TOL) push(x.job,'Review','COST_OVER_COMMITMENT',`${k}: incurred ${money(actual)} vs work-order commitment ${money(committed)}.`); if (committed<=TOL) push(x.job,'Review','UNCOMMITTED_COST',`${k}: incurred ${money(actual)} without a matching valid vendor work order.`); }
    const contractedProduction=sum(Object.values(contractByKey)); const billedProduction=sum(Object.values(billedByKey)); const actualProductionCost=sum(Object.values(actualByKey));
    let unbilledContracted=0; for (const [k,c] of Object.entries(contractByKey)) unbilledContracted += Math.max(0,c-(billedByKey[k]||0));
    const remainingCommitByVendor={}; for (const [vn,keyed] of Object.entries(vendorCommitByKey)) for (const [k,c] of Object.entries(keyed)) add(remainingCommitByVendor,vn,Math.max(0,c-(vendorActualByKey[vn]?.[k]||0)));
    const activeVendorNames=Object.keys(vendorCommitByKey);
    let stage='No Approved Work'; if (baseApproval&&!x.job.closedOn) { if (!activeVendorNames.length&&!ev.started) stage='Backlog'; else if (activeVendorNames.length&&!ev.started) stage='Assigned / Not Started'; else if (!activeVendorNames.length&&ev.started) stage='Review'; else if (ev.started&&!ev.done) stage='WIP'; else if (ev.done&&unbilledContracted>TOL) stage='Ready to Bill'; else if (ev.done) stage='Complete / Billed'; else stage='Review'; } else if (x.job.closedOn) stage='Closed';
    const ar=sum(x.invoices,d=>Number(d.balance||0)); const cashAP=sum(x.vendorBills,d=>Number(d.balance||0));
    const customerPaymentDates=(data.documentPayments||[]).filter(dp=>dp.document?.job?.id===x.job.id&&dp.document?.type==='customerInvoice'&&dp.payment?.type==='credit').map(dp=>dp.payment?.paidAt).filter(Boolean);
    if (prepayRx.test(narrative)||x.invoices.some(d=>/deposit/i.test(d.fullName||''))||customerPaymentDates.some(p=>ev.firstStart&&new Date(p)<new Date(ev.firstStart))) push(x.job,'Info','PREPAYMENT_OR_DEPOSIT','Customer funds preceded production; kept as billing/cash activity, never period profit.');
    const profit=billedProduction-actualProductionCost-feeCost-customerRefundCost; const margin=billedProduction?100*profit/billedProduction:0; const open=['Backlog','Assigned / Not Started','WIP','Ready to Bill','Review'].includes(stage); const hasCritical=exceptions.some(e=>e.job===x.job.name&&e.severity==='Critical'); const commitmentGap=Math.max(0,sum(Object.values(commitByKey))-actualProductionCost); const economicsStatus=open?'Provisional':hasCritical?'Exception':commitmentGap>TOL?'Cost incomplete':'Reconciled';
    jobs.push({...x,src,ev,baseApproval,latestBase,lossEvidence,approvedChanges,pendingChanges,pendingNew,trueLoss,outcomeReview,contractedProduction,billedProduction,billedPass,passCost,actualProductionCost,feeCost,customerRefundCost,unbilledContracted,remainingCommitByVendor,vendorActualByKey,billedByKey,stage,ar,cashAP,profit,margin,economicsStatus,contractByKey,actualByKey});
  }

  for (const d of deniedFinancials) push(d.job,'Info','DENIED_FINANCIAL_EXCLUDED',`${d.fullName} is denied audit history and excluded from all totals.`);
  const payments=data.payments||[];
  for (const p of payments) {
    const arithmeticGap=Number(p.amount||0)-Number(p.amountApplied||0)-Number(p.amountUnapplied||0); if (Math.abs(arithmeticGap)>TOL) push({name:p.account?.name||'Cash ledger'},'Critical','PAYMENT_ARITHMETIC',`${p.paidAt?.slice(0,10)||'—'} ${money(p.amount)} does not equal applied + unapplied.`);
    const text=`${p.source||''} ${p.description||''}`; const correction=findCorrection(p,payments);
    if (isBadMisroute(p)) push({name:p.account?.name||'Cash ledger'},correction?'Info':'Critical',correction?'RESOLVED_CASH_MISROUTE':'CASH_MISROUTE',`${p.paidAt?.slice(0,10)||'—'} ${money(p.amount)} was routed away from TenanTurn${correction?` and corrected on ${correction.paidAt?.slice(0,10)}`:''}.`);
    else if (returnedRx.test(text)) push({name:p.account?.name||'Cash ledger'},correction?'Info':'Review',correction?'RESOLVED_RETURNED_PAYMENT':'RETURNED_PAYMENT',`${p.paidAt?.slice(0,10)||'—'} ${money(p.amount)} returned/reversed${correction?` and was successfully replaced on ${correction.paidAt?.slice(0,10)}`:''}.`);
    else if (p.type==='credit'&&!isVerifiedCashIn(p)) push({name:p.account?.name||'Cash ledger'},'Review','CASH_DESTINATION_UNVERIFIED',`${p.paidAt?.slice(0,10)||'—'} credit ${money(p.amount)} has no sufficient evidence it reached or is headed to TenanTurn.`);
  }

  const wins=jobs.filter(j=>j.baseApproval&&inRange(eventDate(j.baseApproval),start,end));
  const losses=jobs.filter(j=>j.trueLoss&&inRange(eventDate(j.latestBase),start,end));
  const pendingNew=jobs.filter(j=>j.pendingNew);
  const approvedChanges=jobs.flatMap(j=>j.approvedChanges.map(doc=>({job:j.job,pm:j.src.pm,source:j.src.source,doc}))).filter(x=>inRange(eventDate(x.doc),start,end));
  const pendingChanges=jobs.flatMap(j=>j.pendingChanges.map(doc=>({job:j.job,pm:j.src.pm,source:j.src.source,doc})));
  const winRate=wins.length+losses.length?100*wins.length/(wins.length+losses.length):0; const salesWon=sum(wins,j=>productionRevenue(j.baseApproval));
  const periodInvoices=invoices.filter(d=>inRange(d.issueDate,start,end)); const periodBilled=sum(periodInvoices,productionRevenue); const periodPass=sum(periodInvoices,passRevenue);
  const periodPayments=payments.filter(p=>inRange(p.paidAt,start,end)); const verifiedCashIn=sum(periodPayments.filter(isVerifiedCashIn),p=>p.amount); const verifiedCashOut=sum(periodPayments.filter(isVerifiedCashOut),p=>p.amount);
  const arDocs=invoices.filter(d=>Number(d.balance||0)>TOL); const apDocs=vendorBills.filter(d=>Number(d.balance||0)>TOL); const current=jobs.filter(j=>['Backlog','Assigned / Not Started','WIP','Ready to Bill','Review'].includes(j.stage));
  const vendorCapacityModel=buildVendorCapacity(jobs,end||ymd(new Date()));
  const vendorRows={};
  for (const j of jobs) for (const vn of new Set([...Object.keys(j.vendorActualByKey||{}),...Object.keys(j.remainingCommitByVendor||{})])) {
    vendorRows[vn] ||= {vendor:vn,actualCost:0,remainingCommit:0,jobs:new Set(),revenue:0}; const r=vendorRows[vn]; r.actualCost += sum(Object.values(j.vendorActualByKey?.[vn]||{})); r.remainingCommit += Number(j.remainingCommitByVendor?.[vn]||0); if (r.actualCost||r.remainingCommit) r.jobs.add(j.job.id); const jobActualTotal=j.actualProductionCost||0; if (jobActualTotal>0) r.revenue += j.billedProduction * (sum(Object.values(j.vendorActualByKey?.[vn]||{}))/jobActualTotal);
  }
  const vendors=Object.values(vendorRows).map(r=>{const cap=vendorCapacityModel[r.vendor]||null; const weekly=cap?.rolling8WeeklyCost||0; return {...r,jobs:r.jobs.size,rolling8WeeklyCost:weekly,lifetimeWeeklyCost:cap?.lifetimeWeeklyCost||0,capacityConfidence:cap?.confidence||'Low',capacitySampleJobs:cap?.sampleJobs8||0,estimatedBacklogWeeks:weekly>0?r.remainingCommit/weekly:null};}).sort((a,b)=>b.actualCost-a.actualCost);
  const critical=exceptions.filter(e=>e.severity==='Critical');
  const review=exceptions.filter(e=>e.severity==='Review');
  const info=exceptions.filter(e=>e.severity==='Info');
  return {jobs,exceptions:exceptions.sort((a,b)=>a.severity===b.severity?0:a.severity==='Critical'?-1:b.severity==='Critical'?1:a.severity==='Review'?-1:1),trust:critical.length?'BLOCKED':review.length?'REVIEW':'RECONCILED',criticalCount:critical.length,reviewCount:review.length,infoCount:info.length,sales:{wins,losses,pendingNew,approvedChanges,pendingChanges,winRate,salesWon},finance:{periodBilled,periodPass,verifiedCashIn,verifiedCashOut,ar:sum(arDocs,d=>d.balance),ap:sum(apDocs,d=>d.balance)},ops:{current},people:{vendors,vendorCapacityModel}};
}

export const buildForensicModel = buildModel;
