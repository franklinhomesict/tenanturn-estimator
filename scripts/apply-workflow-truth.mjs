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

const pmiAnchor="  if (pm === 'Unattributed' && /(?:Ally feedback|confirmed with Ally|Ally viewed|sent .* Ally)/i.test(allNarrative)) pm = 'Ally';";
const pmiRule=`${pmiAnchor}\n  if (pm === 'Unattributed' && workSource === 'PMI') { const named=allNarrative.match(/\\b(?:approved by|approval (?:from|by)|sent to|texted)\\s+(Brad|Randy|Ben|Jessica|Lexi|Ally)\\b/i); if(named) pm=titleCase(named[1]); }`;
if(!model.includes("workSource === 'PMI') { const named=")){
  if(!model.includes(pmiAnchor)) throw new Error('PMI named approval insertion point changed; refusing unsafe workflow patch.');
  model=model.replace(pmiAnchor,pmiRule);
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

const manualAuditAnchor="    const src = sourceIdentity(x.job, x.comments, commentsById), ev = operationalEvidence(x.job, x.comments, x.logs), scheduledAssignment";
if(!model.includes("'MANUAL_OPERATIONAL_OVERRIDE'")){
  const pos=model.indexOf(manualAuditAnchor);
  if(pos<0) throw new Error('Manual override audit insertion point changed; refusing unsafe workflow patch.');
  const end=model.indexOf('\n',pos);
  const insert=`\n    for (const c of x.comments.filter(c => c.evidenceSource === 'manual-override' && c.manualOverride)) {\n      const o=c.manualOverride, ageDays=Math.max(0,(Date.now()-new Date(o.confirmedAt).getTime())/86400000), stale=ageDays>Number(o.reviewAfterDays||7);\n      push(x.job, stale?'Review':'Info', stale?'MANUAL_OVERRIDE_STALE':'MANUAL_OPERATIONAL_OVERRIDE', stale?\`Manual override from \${o.confirmedBy} on \${String(o.confirmedAt).slice(0,10)} is now \${Math.floor(ageDays)} days old and needs fresh JobTread evidence.\`:\`Manual override from \${o.confirmedBy} on \${String(o.confirmedAt).slice(0,10)}: \${o.fact} Auto-review after \${o.reviewAfterDays||7} days if JobTread does not supersede it.\`);\n    }`;
  model=model.slice(0,end)+insert+model.slice(end);
}

fs.writeFileSync(modelPath,model);

const apiPath='api/dashboard.js';
let api=fs.readFileSync(apiPath,'utf8');
const apiImport="import { buildForensicModel, normalize } from '../src/forensicModel.js';";
const apiImportNew=`${apiImport}\nimport { manualOperationalOverrides, manualOverrideComment } from '../src/manualOverrides.js';`;
if(!api.includes("from '../src/manualOverrides.js'")){
  if(!api.includes(apiImport)) throw new Error('API import anchor changed; refusing unsafe override patch.');
  api=api.replace(apiImport,apiImportNew);
}
const ownerStart=api.indexOf('  const ownerConfirmed = [');
const ownerEndNeedle='\n\n  return { nodes, nextPage: null };';
if(ownerStart>=0){
  const ownerEnd=api.indexOf(ownerEndNeedle,ownerStart);
  if(ownerEnd<0) throw new Error('Owner override block end changed; refusing unsafe override patch.');
  const replacement=`  for (const override of manualOperationalOverrides) {\n    const job=jobById[override.jobId];\n    if (!job || job.closedOn) continue;\n    const newerRaw=(raw||[]).filter(c=>c.job?.id===override.jobId&&new Date(c.createdAt)>new Date(override.confirmedAt));\n    const superseded=newerRaw.some(c=>highConfidenceFieldUpdate.test(String(c.message||''))||/\\b(?:job|project|all work|work) (?:is )?(?:complete|completed|finished)\\b|\\bready to bill\\b/i.test(String(c.message||'')));\n    if (!superseded) nodes.push(manualOverrideComment(override,job));\n  }`;
  api=api.slice(0,ownerStart)+replacement+api.slice(ownerEnd);
}else if(api.includes("id: 'owner-pm-1847-s-gold'")) throw new Error('Legacy 1847 owner override still present; refusing build.');
if(api.includes("id: 'owner-pm-1847-s-gold'")) throw new Error('Legacy 1847 owner override still present after patch.');
fs.writeFileSync(apiPath,api);

const forensicTestPath='scripts/forensic-self-test.mjs';
let tests=fs.readFileSync(forensicTestPath,'utf8');
const oldPendingWo="// 23. Bare scope verbs such as Demo/Painting are not proof work started.\n{ const d=empty(),j=job('23','Heritage 111');d.jobs=[j];const p=item('p23','Make Ready',1481,925),v={...p,price:0,priceWithTax:0,cost:925};d.docs=[doc('o23','customerOrder','approved',j,1481,{closedAt:'2026-08-20T12:00:00Z',costItems:{nodes:[p]}}),doc('wo23','vendorOrder','pending',j,925,{costItems:{nodes:[v]}})];d.comments=[{id:'c23',createdAt:'2026-08-06T12:00:00Z',message:'Scope:\\n- Demo loose lay $51\\n- Painting walls $272\\n- Install one blind $10',job:{id:j.id}}];const m=run(d);assert.equal(m.jobs[0].stage,'Assigned / Not Started'); }";
const newPendingWo="// 23. Bare scope verbs are not proof work started, and a pending vendor WO is still Backlog.\n{ const d=empty(),j=job('23','Heritage 111');d.jobs=[j];const p=item('p23','Make Ready',1481,925),v={...p,price:0,priceWithTax:0,cost:925};d.docs=[doc('o23','customerOrder','approved',j,1481,{closedAt:'2026-08-20T12:00:00Z',costItems:{nodes:[p]}}),doc('wo23','vendorOrder','pending',j,925,{costItems:{nodes:[v]}})];d.comments=[{id:'c23',createdAt:'2026-08-06T12:00:00Z',message:'Scope:\\n- Demo loose lay $51\\n- Painting walls $272\\n- Install one blind $10',job:{id:j.id}}];const m=run(d);assert.equal(m.jobs[0].stage,'Backlog'); }";
if(tests.includes(oldPendingWo)) tests=tests.replace(oldPendingWo,newPendingWo);
else if(!tests.includes(newPendingWo)) throw new Error('Pending-WO regression changed; refusing unsafe workflow patch.');
fs.writeFileSync(forensicTestPath,tests);

console.log('Workflow truth applied: approved vendor WO required for assignment; explicit Blu-not-Blu2 source wins; PMI named approvals enrich PM; vendor revenue attributed by reconciled scope; manual overrides transparent and expiring.');