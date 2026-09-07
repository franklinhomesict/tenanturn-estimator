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

fs.writeFileSync(modelPath,model);

const forensicTestPath='scripts/forensic-self-test.mjs';
let tests=fs.readFileSync(forensicTestPath,'utf8');
const oldPendingWo="// 23. Bare scope verbs such as Demo/Painting are not proof work started.\n{ const d=empty(),j=job('23','Heritage 111');d.jobs=[j];const p=item('p23','Make Ready',1481,925),v={...p,price:0,priceWithTax:0,cost:925};d.docs=[doc('o23','customerOrder','approved',j,1481,{closedAt:'2026-08-20T12:00:00Z',costItems:{nodes:[p]}}),doc('wo23','vendorOrder','pending',j,925,{costItems:{nodes:[v]}})];d.comments=[{id:'c23',createdAt:'2026-08-06T12:00:00Z',message:'Scope:\\n- Demo loose lay $51\\n- Painting walls $272\\n- Install one blind $10',job:{id:j.id}}];const m=run(d);assert.equal(m.jobs[0].stage,'Assigned / Not Started'); }";
const newPendingWo="// 23. Bare scope verbs are not proof work started, and a pending vendor WO is still Backlog.\n{ const d=empty(),j=job('23','Heritage 111');d.jobs=[j];const p=item('p23','Make Ready',1481,925),v={...p,price:0,priceWithTax:0,cost:925};d.docs=[doc('o23','customerOrder','approved',j,1481,{closedAt:'2026-08-20T12:00:00Z',costItems:{nodes:[p]}}),doc('wo23','vendorOrder','pending',j,925,{costItems:{nodes:[v]}})];d.comments=[{id:'c23',createdAt:'2026-08-06T12:00:00Z',message:'Scope:\\n- Demo loose lay $51\\n- Painting walls $272\\n- Install one blind $10',job:{id:j.id}}];const m=run(d);assert.equal(m.jobs[0].stage,'Backlog'); }";
if(tests.includes(oldPendingWo)) tests=tests.replace(oldPendingWo,newPendingWo);
else if(!tests.includes(newPendingWo)) throw new Error('Pending-WO regression changed; refusing unsafe workflow patch.');
fs.writeFileSync(forensicTestPath,tests);

console.log('Workflow truth applied: approved vendor WO required for assignment; explicit Blu-not-Blu2 source wins.');
