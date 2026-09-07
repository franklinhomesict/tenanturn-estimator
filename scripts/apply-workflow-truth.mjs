import fs from 'node:fs';

const modelPath='src/forensicModel.js';
let model=fs.readFileSync(modelPath,'utf8');

const oldVendorOrders="  const vendorOrders = docs.filter(d => d.type === 'vendorOrder' && validMoneyStatus(d.status));";
const newVendorOrders="  const vendorOrders = docs.filter(d => d.type === 'vendorOrder' && d.status === 'approved');";
if(model.includes(oldVendorOrders)) model=model.replace(oldVendorOrders,newVendorOrders);
else if(!model.includes(newVendorOrders)) throw new Error('Vendor-order status rule changed; refusing unsafe workflow patch.');

const scheduledBacklog="      if (!activeVendorNames.length && !ev.started) { const ownerManaged = ['Blu', 'Blu 2', 'SB Investments', 'Brandon-owned'].includes(src.workSource); stage = scheduledAssignment && !ownerManaged ? 'Assigned / Not Started' : 'Backlog'; }";
const strictBacklog="      if (!activeVendorNames.length && !ev.started) stage = 'Backlog';";
if(model.includes(scheduledBacklog)) model=model.replace(scheduledBacklog,strictBacklog);
else if(!model.includes(strictBacklog)) throw new Error('Backlog assignment rule changed; refusing unsafe workflow patch.');

fs.writeFileSync(modelPath,model);
console.log('Workflow truth applied: approved vendor WO required for assignment.');
