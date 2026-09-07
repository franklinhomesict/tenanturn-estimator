import fs from 'node:fs';

const modelPath='src/forensicModel.js';
let model=fs.readFileSync(modelPath,'utf8');

const oldVendorOrders="  const vendorOrders = docs.filter(d => d.type === 'vendorOrder' && validMoneyStatus(d.status));";
const newVendorOrders="  const vendorOrders = docs.filter(d => d.type === 'vendorOrder' && d.status === 'approved');";
if(model.includes(oldVendorOrders)) model=model.replace(oldVendorOrders,newVendorOrders);
else if(!model.includes(newVendorOrders)) throw new Error('Vendor-order status rule changed; refusing unsafe workflow patch.');

const sourceAnchor="  if (!job?.closedOn && (pm === 'Melinda' || /taken over for Melinda|Melinda (?:has )?(?:left|quit)|replaced Melinda/i.test(allNarrative))) pm = 'Ben';";
const sourceOverride="  if (/\\bblu\\b[^.\\n]{0,50}\\bnot\\s+blu\\s*2\\b/i.test(allNarrative)) workSource = 'Blu';\n"+sourceAnchor;
if(!model.includes("not\\s+blu\\s*2")){
  if(!model.includes(sourceAnchor)) throw new Error('Source override insertion point changed; refusing unsafe workflow patch.');
  model=model.replace(sourceAnchor,sourceOverride);
}

const scheduledBacklog="      if (!activeVendorNames.length && !ev.started) { const ownerManaged = ['Blu', 'Blu 2', 'SB Investments', 'Brandon-owned'].includes(src.workSource); stage = scheduledAssignment && !ownerManaged ? 'Assigned / Not Started' : 'Backlog'; }";
const strictBacklog="      if (!activeVendorNames.length && !ev.started) stage = 'Backlog';";
if(model.includes(scheduledBacklog)) model=model.replace(scheduledBacklog,strictBacklog);
else if(!model.includes(strictBacklog)) throw new Error('Backlog assignment rule changed; refusing unsafe workflow patch.');

const oldVendorAttribution="    const jobActualTotal = j.actualProductionCost || 0; if (jobActualTotal > 0) r.revenue += j.billedProduction * (sum(Object.values(j.vendorActualByKey?.[vn] || {})) / jobActualTotal);";
const newVendorAttribution="    if (j.economicsStatus === 'Reconciled') { for (const [k, vendorCost] of Object.entries(j.vendorActualByKey?.[vn] || {})) { const scopeActual = Number(j.actualByKey?.[k] || 0), scopeBilled = Number(j.billedByKey?.[k] || 0); if (scopeActual > TOL && scopeBilled) r.revenue += scopeBilled * Math.min(Math.max(Number(vendorCost || 0) / scopeActual, 0), 1); } }";
if(model.includes(oldVendorAttribution)) model=model.replace(oldVendorAttribution,newVendorAttribution);
else if(!model.includes(newVendorAttribution)) throw new Error('Vendor revenue attribution rule changed; refusing unsafe workflow patch.');

const oldVendorResult="  const vendors = Object.values(vendorRows).map(r => { const cap = vendorCapacityModel[r.vendor] || null, weekly = cap?.rolling8WeeklyCost || 0, gp = r.revenue - r.actualCost; return { name: r.vendor, openJobs: [...r.jobs].filter(id => current.some(j => j.job.id === id)).length, remainingCost: r.remainingCommit, attributedRevenue: r.revenue, actualCost: r.actualCost, gp, margin: r.revenue ? 100 * gp / r.revenue : 0, rolling8WeeklyCost: weekly, lifetimeWeeklyCost: cap?.lifetimeWeeklyCost || 0, capacityConfidence: cap?.confidence || 'Low', capacitySampleJobs: cap?.sampleJobs8 || 0, weeks: weekly > 0 ? r.remainingCommit / weekly : null, read: weekly > 0 ? `${cap.confidence} confidence` : 'Learning' }; }).sort((a, b) => b.actualCost - a.actualCost);";
const newVendorResult="  const vendors = Object.values(vendorRows).map(r => { const cap = vendorCapacityModel[r.vendor] || null, weekly = cap?.rolling8WeeklyCost || 0; let finalActualCost = 0; for (const j of reconciledJobsForVendor || []) finalActualCost += sum(Object.values(j.vendorActualByKey?.[r.vendor] || {})); const gp = r.revenue - finalActualCost; return { name: r.vendor, openJobs: [...r.jobs].filter(id => current.some(j => j.job.id === id)).length, remainingCost: r.remainingCommit, attributedRevenue: r.revenue, actualCost: r.actualCost, finalActualCost, gp, margin: r.revenue ? 100 * gp / r.revenue : 0, rolling8WeeklyCost: weekly, lifetimeWeeklyCost: cap?.lifetimeWeeklyCost || 0, capacityConfidence: cap?.confidence || 'Low', capacitySampleJobs: cap?.sampleJobs8 || 0, weeks: weekly > 0 ? r.remainingCommit / weekly : null, read: weekly > 0 ? `${cap.confidence} confidence` : 'Learning' }; }).sort((a, b) => b.actualCost - a.actualCost);";
const vendorAnchor="  const vendorCapacityModel = buildVendorCapacity(jobs, end || ymd(new Date())), vendorRows = {};";
const vendorAnchorReplacement="  const reconciledJobsForVendor = jobs.filter(j => j.economicsStatus === 'Reconciled');\n  const vendorCapacityModel = buildVendorCapacity(jobs, end || ymd(new Date())), vendorRows = {};";
if(!model.includes('const reconciledJobsForVendor =')){
  if(!model.includes(vendorAnchor)) throw new Error('Vendor reconciliation anchor changed; refusing unsafe workflow patch.');
  model=model.replace(vendorAnchor,vendorAnchorReplacement);
}
if(model.includes(oldVendorResult)) model=model.replace(oldVendorResult,newVendorResult);
else if(!model.includes(newVendorResult)) throw new Error('Vendor final economics output changed; refusing unsafe workflow patch.');

fs.writeFileSync(modelPath,model);

const forensicTestPath='scripts/forensic-self-test.mjs';
let tests=fs.readFileSync(forensicTestPath,'utf8');
const oldPendingWo="// 23. Bare scope verbs such as Demo/Painting are not proof work started.\n{ const d=empty(),j=job('23','Heritage 111');d.jobs=[j];const p=item('p23','Make Ready',1481,925),v={...p,price:0,priceWithTax:0,cost:925};d.docs=[doc('o23','customerOrder','approved',j,1481,{closedAt:'2026-08-20T12:00:00Z',costItems:{nodes:[p]}}),doc('wo23','vendorOrder','pending',j,925,{costItems:{nodes:[v]}})];d.comments=[{id:'c23',createdAt:'2026-08-06T12:00:00Z',message:'Scope:\\n- Demo loose lay $51\\n- Painting walls $272\\n- Install one blind $10',job:{id:j.id}}];const m=run(d);assert.equal(m.jobs[0].stage,'Assigned / Not Started'); }";
const newPendingWo="// 23. Bare scope verbs are not proof work started, and a pending vendor WO is still Backlog.\n{ const d=empty(),j=job('23','Heritage 111');d.jobs=[j];const p=item('p23','Make Ready',1481,925),v={...p,price:0,priceWithTax:0,cost:925};d.docs=[doc('o23','customerOrder','approved',j,1481,{closedAt:'2026-08-20T12:00:00Z',costItems:{nodes:[p]}}),doc('wo23','vendorOrder','pending',j,925,{costItems:{nodes:[v]}})];d.comments=[{id:'c23',createdAt:'2026-08-06T12:00:00Z',message:'Scope:\\n- Demo loose lay $51\\n- Painting walls $272\\n- Install one blind $10',job:{id:j.id}}];const m=run(d);assert.equal(m.jobs[0].stage,'Backlog'); }";
if(tests.includes(oldPendingWo)) tests=tests.replace(oldPendingWo,newPendingWo);
else if(!tests.includes(newPendingWo)) throw new Error('Pending-WO regression changed; refusing unsafe workflow patch.');
fs.writeFileSync(forensicTestPath,tests);

console.log('Workflow truth applied: approved vendor WO required for assignment; explicit Blu-not-Blu2 source wins; vendor revenue attributed by reconciled scope.');