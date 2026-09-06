const vendorCapacity = {
  'P Property Maintenance': { weeklyHours: 40, weeklyCost: 2000, label: 'P Property / Kenneth' },
};

const knownPMs = ['Ben', 'Jessica', 'Lexi', 'Melinda', 'Brandon', 'Brad'];
const passRx = /\b(reimbursement|reimbursements|reimbursable|pass[- ]?through)\b/i;
const feeRx = /payment processing fee|instant pay/i;
const changeRx = /change order/i;
const lossRx = /went with another|chose (?:a )?cheaper|another contractor|not moving forward|decided not to|declined (?:the )?(?:bid|work)|lost (?:the )?(?:job|bid)|owner chose|customer chose/i;
const activeRx = /\b(work(?:ing)? today|work underway|in progress|installed|installing|demo(?:ing)?|painting|on site|onsite|crew (?:is|was) there|wrapping up|finishing|started work|starting work)\b/i;
const wholeDoneRx = /\b(job (?:is )?complete|work (?:is )?complete|all work (?:is )?complete|all done|ready to bill|job finished|wrapped up the job)\b/i;
const returnedRx = /returned|reversed|failed|voided|wrong acct.*returned|refunded by the bank/i;
const prepayRx = /paid in advance|before work started|prepayment|paid up front|deposit invoice|mobilization deposit/i;
const misrouteRx = /misrout|routed.*franklin|instead of tenanturn|wrong.*(?:card|account).*deposit/i;
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
  return {
    started: ops.some(x => x.type === 'active') || Number(job?.taskSummary?.started || 0) > 0,
    done: latest?.type === 'done', firstStart: ops.find(x => x.type === 'active')?.at || null, latest,
  };
}

function isVerifiedCashIn(p) {
  const t = `${p?.source || ''} ${p?.description || ''}`;
  if (p?.type !== 'credit' || returnedRx.test(t) || misrouteRx.test(t)) return false;
  return /1294|6268|tenanturn|deposit|edeposit|\bcheck\b|businesspro|meritrust/i.test(t);
}
function isVerifiedCashOut(p) {
  const t = `${p?.source || ''} ${p?.description || ''}`;
  if (p?.type !== 'debit' || returnedRx.test(t) || Number(p?.amountApplied || 0) <= TOL) return false;
  return /1294|6268|tenanturn|businesspro|meritrust|\bach\b|\bcheck\b|pay a person|bank transfer|withheld at source|netted/i.test(t);
}
function findCorrection(payment, payments) {
  const t = `${payment?.source || ''} ${payment?.description || ''}`;
  if (misrouteRx.test(t)) {
    return payments.find(p => p.type === 'credit' && new Date(p.paidAt) > new Date(payment.paidAt) && Math.abs(Number(p.amount || 0) - Number(payment.amount || 0)) <= TOL && /franklin/i.test(`${p.account?.name || ''} ${p.description || ''}`) && isVerifiedCashIn(p));
  }
  if (returnedRx.test(t) && payment.type === 'debit') {
    return payments.find(p => p.type === 'debit' && p.id !== payment.id && new Date(p.paidAt) > new Date(payment.paidAt) && Math.abs(Number(p.amount || 0) - Number(payment.amount || 0)) <= TOL && p.account?.id === payment.account?.id && Number(p.amountApplied || 0) > TOL && !returnedRx.test(`${p.source || ''} ${p.description || ''}`));
  }
  return null;
}
function capacityRead(weeks) { if (weeks == null) return 'Capacity not set'; if (weeks > 2) return 'Heavy backlog'; if (weeks >= 1) return 'Booked'; if (weeks >= .5) return 'Healthy'; return 'Available'; }
function severityRank(s) { return s === 'Critical' ? 0 : s === 'Review' ? 1 : 2; }

export function buildForensicModel(data, start, end) {
  const commentsById = Object.fromEntries((data.comments || []).map(c => [c.id, c]));
  const docs = data.docs || [];
  const orders = docs.filter(d => d.type === 'customerOrder' && d.status !== 'draft');
  const invoices = docs.filter(d => d.type === 'customerInvoice' && validMoneyStatus(d.status));
  const vendorOrders = docs.filter(d => d.type === 'vendorOrder' && validMoneyStatus(d.status));
  const vendorBills = docs.filter(d => d.type === 'vendorBill' && validMoneyStatus(d.status));
  const deniedFinancials = docs.filter(d => (d.type === 'customerInvoice' || d.type === 'vendorBill') && d.status === 'denied');
  const by = {};
  for (const j of data.jobs) by[j.id] = { job: j, orders: [], invoices: [], vendorOrders: [], vendorBills: [], comments: [], logs: [] };
  for (const d of orders) if (by[d.job?.id]) by[d.job.id].orders.push(d);
  for (const d of invoices) if (by[d.job?.id]) by[d.job.id].invoices.push(d);
  for (const d of vendorOrders) if (by[d.job?.id]) by[d.job.id].vendorOrders.push(d);
  for (const d of vendorBills) if (by[d.job?.id]) by[d.job.id].vendorBills.push(d);
  for (const c of data.comments || []) if (by[c.job?.id]) by[c.job.id].comments.push(c);
  for (const l of data.logs || []) if (by[l.job?.id]) by[l.job.id].logs.push(l);

  const dpByDoc = {};
  for (const dp of data.documentPayments || []) {
    if (returnedRx.test(`${dp.payment?.source || ''} ${dp.payment?.description || ''}`)) continue;
    add(dpByDoc, dp.document?.id, dp.amount);
  }

  const exceptions = [];
  const push = (job, severity, code, detail) => exceptions.push({ job: job?.name || 'System', severity, code, detail });

  // Potential duplicate economically-valid financial documents are never silently accepted.
  const duplicateBuckets = {};
  for (const d of [...invoices, ...vendorBills]) {
    const amount = documentTotal(d);
    const k = [d.job?.id, d.type, d.account?.id, Number(amount).toFixed(2), d.issueDate || 'NO_DATE'].join('|');
    (duplicateBuckets[k] ||= []).push(d);
  }
  for (const group of Object.values(duplicateBuckets)) if (group.length > 1) {
    const names = group.map(d => d.fullName).join(', ');
    push(group[0].job, 'Critical', 'POSSIBLE_DUPLICATE_FINANCIAL', `${group.length} valid financial documents share job, account, amount, and issue date: ${names}.`);
  }

  const jobs = [];
  for (const x of Object.values(by)) {
    const approved = x.orders.filter(d => d.status === 'approved');
    const denied = x.orders.filter(d => d.status === 'denied');
    const pending = x.orders.filter(d => d.status === 'pending');
    const approvedBase = approved.filter(d => !isChange(d)).sort((a, b) => new Date(eventDate(a) || 0) - new Date(eventDate(b) || 0));
    const approvedChanges = approved.filter(isChange);
    const pendingChanges = pending.filter(isChange);
    const baseApproval = approvedBase[0] || null;
    const baseOrders = x.orders.filter(d => !isChange(d));
    const latestBase = [...baseOrders].sort((a, b) => new Date(b.createdAt || eventDate(b) || 0) - new Date(a.createdAt || eventDate(a) || 0))[0] || null;
    const narrative = `${x.job.description || ''} ${x.comments.map(c => c.message || '').join(' ')}`;
    const lossEvidence = x.comments.filter(c => lossRx.test(c.message || '') && (!latestBase?.issueDate || new Date(c.createdAt) >= new Date(latestBase.issueDate))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
    const trueLoss = !baseApproval && latestBase?.status === 'denied' && !!lossEvidence;
    const pendingNew = !baseApproval && latestBase?.status === 'pending' ? latestBase : null;
    const outcomeReview = !baseApproval && latestBase?.status === 'denied' && !trueLoss;
    if (approvedBase.length > 1) push(x.job, 'Critical', 'MULTIPLE_BASE_APPROVALS', `${approvedBase.length} approved non-change-order proposals make the base contract ambiguous.`);

    const src = sourceIdentity(x.job, x.comments, commentsById);
    if (src.source === '316 Rentals' && src.pm === 'Unattributed') push(x.job, 'Review', 'PM_ATTRIBUTION', '316 work source found, but the original pinned scope did not resolve to a PM.');
    const ev = operationalEvidence(x.job, x.comments, x.logs);

    const contractByKey = {}, billedByKey = {}, commitByKey = {}, actualByKey = {};
    const vendorActualByKey = {}, vendorCommitByKey = {};
    let billedPass = 0, passCost = 0, feeCost = 0, customerRefundCost = 0;

    for (const d of approved) {
      const lineTotal = documentLineTotal(d);
      if (lineTotal != null && Math.abs(lineTotal - documentTotal(d)) > TOL) push(x.job, 'Critical', 'ORDER_TOTAL_MISMATCH', `${d.fullName}: lines ${money(lineTotal)} do not tie to ${money(documentTotal(d))}.`);
      for (const e of entries(d, 'revenue')) {
        if (!e.pass) add(contractByKey, e.key, e.amount);
        if (e.weak) push(x.job, 'Review', 'WEAK_SCOPE_KEY', `${d.fullName}: "${e.item?.name || 'unitemized'}" lacks a JobTread scope link; fallback matching is in use.`);
      }
    }
    for (const d of x.invoices) {
      const lineTotal = documentLineTotal(d);
      if (lineTotal != null && Math.abs(lineTotal - documentTotal(d)) > TOL) push(x.job, 'Critical', 'INVOICE_TOTAL_MISMATCH', `${d.fullName}: lines ${money(lineTotal)} do not tie to ${money(documentTotal(d))}.`);
      for (const e of entries(d, 'revenue')) {
        if (e.pass) billedPass += e.amount; else add(billedByKey, e.key, e.amount);
        if (e.weak) push(x.job, 'Review', 'WEAK_BILLING_KEY', `${d.fullName}: "${e.item?.name || 'unitemized'}" lacks a strong scope link.`);
      }
      const applied = dpByDoc[d.id] || 0;
      if (Math.abs(applied - Number(d.amountPaid || 0)) > TOL) push(x.job, 'Critical', 'INVOICE_PAYMENT_MISMATCH', `${d.fullName}: amountPaid ${money(d.amountPaid)} vs linked payments ${money(applied)}.`);
      const expectedBalance = Number(d.priceWithTax || 0) - Number(d.amountPaid || 0);
      if (Math.abs(expectedBalance - Number(d.balance || 0)) > TOL) push(x.job, 'Critical', 'INVOICE_BALANCE_MISMATCH', `${d.fullName}: expected balance ${money(expectedBalance)}, stored ${money(d.balance)}.`);
    }
    for (const d of x.vendorOrders) {
      const lineTotal = documentLineTotal(d);
      if (lineTotal != null && Math.abs(lineTotal - documentTotal(d)) > TOL) push(x.job, 'Critical', 'WORK_ORDER_TOTAL_MISMATCH', `${d.fullName}: lines ${money(lineTotal)} do not tie to ${money(documentTotal(d))}.`);
      for (const e of entries(d, 'cost')) {
        if (e.pass) continue;
        add(commitByKey, e.key, e.amount);
        const vn = d.account?.name || 'Unknown';
        vendorCommitByKey[vn] ||= {};
        add(vendorCommitByKey[vn], e.key, e.amount);
      }
    }
    for (const d of x.vendorBills) {
      const lineTotal = documentLineTotal(d);
      if (lineTotal != null && Math.abs(lineTotal - documentTotal(d)) > TOL) push(x.job, 'Critical', 'VENDOR_BILL_TOTAL_MISMATCH', `${d.fullName}: lines ${money(lineTotal)} do not tie to ${money(documentTotal(d))}.`);
      const applied = dpByDoc[d.id] || 0;
      if (Math.abs(applied - Number(d.amountPaid || 0)) > TOL) push(x.job, 'Critical', 'BILL_PAYMENT_MISMATCH', `${d.fullName}: amountPaid ${money(d.amountPaid)} vs linked payments ${money(applied)}.`);
      const expectedBalance = Number(d.cost || 0) - Number(d.amountPaid || 0);
      if (Math.abs(expectedBalance - Number(d.balance || 0)) > TOL) push(x.job, 'Critical', 'BILL_BALANCE_MISMATCH', `${d.fullName}: expected balance ${money(expectedBalance)}, stored ${money(d.balance)}.`);
      if (isFeeDoc(d)) { feeCost += Number(d.cost || 0); continue; }
      const customerRefund = d.account?.type === 'customer';
      for (const e of entries(d, 'cost')) {
        if (e.pass) { passCost += e.amount; continue; }
        if (customerRefund) { customerRefundCost += e.amount; continue; }
        add(actualByKey, e.key, e.amount);
        const vn = d.account?.name || 'Unknown';
        vendorActualByKey[vn] ||= {};
        add(vendorActualByKey[vn], e.key, e.amount);
      }
    }

    for (const [k, billed] of Object.entries(billedByKey)) {
      const contracted = contractByKey[k] || 0;
      if (billed > contracted + TOL) push(x.job, 'Critical', 'BILLED_UNCONTRACTED_SCOPE', `${k}: billed ${money(billed)} vs approved ${money(contracted)}.`);
    }
    for (const [k, actual] of Object.entries(actualByKey)) {
      const committed = commitByKey[k] || 0;
      if (actual > committed + TOL) push(x.job, 'Review', 'COST_OVER_COMMITMENT', `${k}: incurred ${money(actual)} vs work-order commitment ${money(committed)}.`);
      if (committed <= TOL) push(x.job, 'Review', 'UNCOMMITTED_COST', `${k}: incurred ${money(actual)} without a matching valid vendor work order.`);
    }

    const contractedProduction = sum(Object.values(contractByKey));
    const billedProduction = sum(Object.values(billedByKey));
    const actualProductionCost = sum(Object.values(actualByKey));
    let unbilledContracted = 0;
    for (const [k, contracted] of Object.entries(contractByKey)) unbilledContracted += Math.max(0, contracted - (billedByKey[k] || 0));

    const remainingCommitByVendor = {};
    for (const [vn, keyed] of Object.entries(vendorCommitByKey)) {
      for (const [k, committed] of Object.entries(keyed)) add(remainingCommitByVendor, vn, Math.max(0, committed - (vendorActualByKey[vn]?.[k] || 0)));
    }

    const activeVendorNames = Object.keys(vendorCommitByKey);
    let stage = 'No Approved Work';
    if (baseApproval && !x.job.closedOn) {
      if (!activeVendorNames.length && !ev.started) stage = 'Backlog';
      else if (activeVendorNames.length && !ev.started) stage = 'Assigned / Not Started';
      else if (!activeVendorNames.length && ev.started) stage = 'Review';
      else if (ev.started && !ev.done) stage = 'WIP';
      else if (ev.done && unbilledContracted > TOL) stage = 'Ready to Bill';
      else if (ev.done) stage = 'Complete / Billed';
      else stage = 'Review';
    } else if (x.job.closedOn) stage = 'Closed';

    const ar = sum(x.invoices, d => Number(d.balance || 0));
    const cashAP = sum(x.vendorBills, d => Number(d.balance || 0));
    if (x.job.closedOn && unbilledContracted > TOL) push(x.job, 'Critical', 'CLOSED_WITH_UNBILLED_SCOPE', `Closed with ${money(unbilledContracted)} approved production still unbilled.`);
    if (x.job.closedOn && ar > TOL) push(x.job, 'Review', 'CLOSED_WITH_AR', `Closed with ${money(ar)} receivable.`);
    if (x.job.closedOn && cashAP > TOL) push(x.job, 'Review', 'CLOSED_WITH_AP', `Closed with ${money(cashAP)} payable.`);
    if (Math.abs(billedPass - passCost) > TOL && (stage === 'Closed' || stage === 'Complete / Billed')) push(x.job, 'Review', 'PASSTHROUGH_NOT_RECONCILED', `Pass-through billed ${money(billedPass)} vs cost ${money(passCost)}.`);

    const customerPaymentDates = (data.documentPayments || []).filter(dp => dp.document?.job?.id === x.job.id && dp.document?.type === 'customerInvoice' && dp.payment?.type === 'credit').map(dp => dp.payment?.paidAt).filter(Boolean);
    if (prepayRx.test(narrative) || x.invoices.some(d => /deposit/i.test(d.fullName || '')) || customerPaymentDates.some(p => ev.firstStart && new Date(p) < new Date(ev.firstStart))) push(x.job, 'Info', 'PREPAYMENT_OR_DEPOSIT', 'Customer funds preceded production; kept as billing/cash activity, never period profit.');

    const classifiedActual = actualProductionCost + passCost + feeCost + customerRefundCost;
    if (x.job.closedOn && x.job.actualCost != null && Math.abs(Number(x.job.actualCost) - classifiedActual) > TOL) push(x.job, 'Critical', 'JOB_ACTUAL_COST_MISMATCH', `JobTread actualCost ${money(x.job.actualCost)} vs classified valid bills ${money(classifiedActual)}.`);

    const profit = billedProduction - actualProductionCost - feeCost - customerRefundCost;
    const margin = billedProduction ? 100 * profit / billedProduction : 0;
    const open = ['Backlog', 'Assigned / Not Started', 'WIP', 'Ready to Bill', 'Review'].includes(stage);
    const hasCritical = exceptions.some(e => e.job === x.job.name && e.severity === 'Critical');
    const commitmentGap = Math.max(0, sum(Object.values(commitByKey)) - actualProductionCost);
    const economicsStatus = open ? 'Provisional' : hasCritical ? 'Exception' : commitmentGap > TOL ? 'Cost incomplete' : 'Reconciled';

    jobs.push({ ...x, src, ev, baseApproval, latestBase, lossEvidence, approvedChanges, pendingChanges, pendingNew, trueLoss, outcomeReview, contractedProduction, billedProduction, billedPass, passCost, actualProductionCost, feeCost, customerRefundCost, unbilledContracted, remainingCommitByVendor, vendorActualByKey, billedByKey, stage, ar, cashAP, profit, margin, economicsStatus, contractByKey, actualByKey });
  }

  for (const d of deniedFinancials) push(d.job, 'Info', 'DENIED_FINANCIAL_EXCLUDED', `${d.fullName} is denied audit history and excluded from all totals.`);

  const payments = data.payments || [];
  for (const p of payments) {
    const arithmeticGap = Number(p.amount || 0) - Number(p.amountApplied || 0) - Number(p.amountUnapplied || 0);
    if (Math.abs(arithmeticGap) > TOL) push({ name: p.account?.name || 'Cash ledger' }, 'Critical', 'PAYMENT_ARITHMETIC', `${p.paidAt?.slice(0, 10) || '—'} ${money(p.amount)} does not equal applied + unapplied.`);
    const text = `${p.source || ''} ${p.description || ''}`;
    const correction = findCorrection(p, payments);
    if (misrouteRx.test(text)) push({ name: p.account?.name || 'Cash ledger' }, correction ? 'Info' : 'Critical', correction ? 'RESOLVED_CASH_MISROUTE' : 'CASH_MISROUTE', `${p.paidAt?.slice(0, 10) || '—'} ${money(p.amount)} was routed away from TenanTurn${correction ? ` and corrected on ${correction.paidAt?.slice(0,10)}` : ''}.`);
    else if (returnedRx.test(text)) push({ name: p.account?.name || 'Cash ledger' }, correction ? 'Info' : 'Review', correction ? 'RESOLVED_RETURNED_PAYMENT' : 'RETURNED_PAYMENT', `${p.paidAt?.slice(0, 10) || '—'} ${money(p.amount)} returned/reversed${correction ? ` and was successfully replaced on ${correction.paidAt?.slice(0,10)}` : ''}.`);
    else if (p.type === 'credit' && !isVerifiedCashIn(p)) push({ name: p.account?.name || 'Cash ledger' }, 'Review', 'CASH_DESTINATION_UNVERIFIED', `${p.paidAt?.slice(0, 10) || '—'} credit ${money(p.amount)} has no sufficient evidence it reached a TenanTurn cash destination.`);
    if (Number(p.amountUnapplied || 0) > TOL && !correction && !/settling the misrouted/i.test(p.description || '')) push({ name: p.account?.name || 'Cash ledger' }, 'Review', 'UNAPPLIED_CASH', `${p.paidAt?.slice(0, 10) || '—'} ${money(p.amountUnapplied)} remains unapplied.`);
  }

  const wins = jobs.filter(j => j.baseApproval && inRange(eventDate(j.baseApproval), start, end));
  const losses = jobs.filter(j => j.trueLoss && inRange(eventDate(j.latestBase), start, end));
  const outcomeReviews = jobs.filter(j => j.outcomeReview && inRange(eventDate(j.latestBase), start, end));
  const pendingNew = jobs.filter(j => j.pendingNew);
  const approvedChanges = jobs.flatMap(j => j.approvedChanges.map(doc => ({ job: j.job, pm: j.src.pm, source: j.src.source, doc }))).filter(x => inRange(eventDate(x.doc), start, end));
  const pendingChanges = jobs.flatMap(j => j.pendingChanges.map(doc => ({ job: j.job, pm: j.src.pm, source: j.src.source, doc }));
  const winRate = wins.length + losses.length ? 100 * wins.length / (wins.length + losses.length) : 0;
  const salesWon = sum(wins, j => productionRevenue(j.baseApproval));

  const periodInvoices = invoices.filter(d => inRange(d.issueDate, start, end));
  const periodBilled = sum(periodInvoices, productionRevenue);
  const periodPass = sum(periodInvoices, passRevenue);
  const appliedCustomerPayments = (data.documentPayments || []).filter(dp => dp.document?.type === 'customerInvoice' && validMoneyStatus(dp.document?.status) && dp.payment?.type === 'credit' && !returnedRx.test(`${dp.payment?.source || ''} ${dp.payment?.description || ''}`) && inRange(dp.payment?.paidAt, start, end));
  const customerPaymentsApplied = sum(appliedCustomerPayments, dp => dp.amount);
  const periodPayments = payments.filter(p => inRange(p.paidAt, start, end));
  const verifiedCashIn = sum(periodPayments.filter(isVerifiedCashIn), p => p.amount);
  const verifiedCashOut = sum(periodPayments.filter(isVerifiedCashOut), p => p.amount);

  const arDocs = invoices.filter(d => Number(d.balance || 0) > TOL);
  const apDocs = vendorBills.filter(d => Number(d.balance || 0) > TOL);
  const current = jobs.filter(j => ['Backlog', 'Assigned / Not Started', 'WIP', 'Ready to Bill', 'Review'].includes(j.stage));

  const vendorMap = {};
  for (const j of jobs) {
    const currentJob = current.some(c => c.job.id === j.job.id);
    for (const [vn, keyed] of Object.entries(j.vendorActualByKey)) {
      vendorMap[vn] ||= { name: vn, actualCost: 0, attributedRevenue: 0, openJobs: new Set(), remainingCost: 0 };
      for (const [k, cost] of Object.entries(keyed)) {
        vendorMap[vn].actualCost += cost;
        const totalCostForKey = sum(Object.values(j.vendorActualByKey), x => x[k] || 0);
        const revenue = j.billedByKey[k] || 0;
        if (totalCostForKey > TOL) vendorMap[vn].attributedRevenue += revenue * (cost / totalCostForKey);
      }
      if (currentJob && (j.remainingCommitByVendor[vn] || 0) > TOL) { vendorMap[vn].openJobs.add(j.job.id); vendorMap[vn].remainingCost += j.remainingCommitByVendor[vn]; }
    }
    for (const [vn, rem] of Object.entries(j.remainingCommitByVendor)) {
      vendorMap[vn] ||= { name: vn, actualCost: 0, attributedRevenue: 0, openJobs: new Set(), remainingCost: 0 };
      if (currentJob && rem > TOL) { vendorMap[vn].openJobs.add(j.job.id); vendorMap[vn].remainingCost += rem; }
    }
  }
  const vendors = Object.values(vendorMap).map(v => {
    const cap = vendorCapacity[v.name] || null;
    const weeks = cap ? v.remainingCost / cap.weeklyCost : null;
    const gp = v.attributedRevenue - v.actualCost;
    return { ...v, openJobs: v.openJobs.size, cap, weeks, gp, margin: v.attributedRevenue ? 100 * gp / v.attributedRevenue : 0, read: capacityRead(weeks) };
  }).sort((a, b) => b.remainingCost - a.remainingCost || b.attributedRevenue - a.attributedRevenue);

  const pmMap = {};
  for (const j of jobs.filter(j => j.src.source === '316 Rentals')) {
    const n = j.src.pm;
    pmMap[n] ||= { name: n, approvals: 0, approved: 0, pending: 0, lifetimeBilled: 0, reconciledGP: 0, reconciledRevenue: 0 };
    if (j.baseApproval && inRange(eventDate(j.baseApproval), start, end)) { pmMap[n].approvals++; pmMap[n].approved += productionRevenue(j.baseApproval); }
    if (j.pendingNew) pmMap[n].pending++;
    pmMap[n].lifetimeBilled += j.billedProduction;
    if (j.economicsStatus === 'Reconciled') { pmMap[n].reconciledGP += j.profit; pmMap[n].reconciledRevenue += j.billedProduction; }
  }
  const pms = Object.values(pmMap).map(p => ({ ...p, margin: p.reconciledRevenue ? 100 * p.reconciledGP / p.reconciledRevenue : 0 })).sort((a, b) => b.approved - a.approved || b.lifetimeBilled - a.lifetimeBilled);

  const reconciledJobs = jobs.filter(j => j.economicsStatus === 'Reconciled');
  const reconciledGP = sum(reconciledJobs, j => j.profit);
  const provisionalGP = sum(jobs.filter(j => j.economicsStatus === 'Provisional'), j => j.profit);
  exceptions.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.job.localeCompare(b.job));
  const critical = exceptions.filter(e => e.severity === 'Critical');
  const review = exceptions.filter(e => e.severity === 'Review');
  const trust = critical.length ? 'BLOCKED' : review.length ? 'REVIEW' : 'RECONCILED';

  return {
    jobs, wins, losses, outcomeReviews, pendingNew, approvedChanges, pendingChanges, winRate, salesWon,
    periodBilled, periodPass, customerPaymentsApplied, verifiedCashIn, verifiedCashOut, netVerifiedCash: verifiedCashIn - verifiedCashOut,
    arDocs, apDocs, current, vendors, pms, reconciledJobs, reconciledGP, provisionalGP,
    exceptions, critical, review, trust,
  };
}
