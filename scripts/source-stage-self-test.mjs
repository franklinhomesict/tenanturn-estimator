import assert from 'node:assert/strict';
import {buildForensicModel} from '../src/forensicModel.js';

const baseData=()=>({jobs:[],docs:[],comments:[],logs:[],tasks:[],payments:[],documentPayments:[]});
const job=(id,name,billing='316 Rentals',description='')=>({id,number:id,name,description,closedOn:null,taskSummary:{started:0},location:{account:{id:`acct-${id}`,name:billing,type:'customer'}}});
const item=(id,name,price,cost)=>({id,name,price,priceWithTax:price,cost,quantity:1,jobCostItem:{id:`scope-${id}`,name}});
const order=(id,j,amount=1000)=>({id,type:'customerOrder',status:'approved',createdAt:'2026-09-01T12:00:00Z',issueDate:'2026-09-01',closedAt:'2026-09-01T12:00:00Z',signedAt:null,priceWithTax:amount,cost:600,amountPaid:0,balance:amount,fullName:`Proposal ${id}`,job:{id:j.id,number:j.number,name:j.name},account:j.location.account,costItems:{nodes:[item(`i-${id}`,'Make Ready Labor',amount,600)]}});
const wo=(id,j,amount=600,status='approved')=>({id,type:'vendorOrder',status,createdAt:'2026-09-01T12:00:00Z',issueDate:'2026-09-01',closedAt:null,signedAt:null,priceWithTax:0,cost:amount,amountPaid:0,balance:amount,fullName:`Work Order ${id}`,job:{id:j.id,number:j.number,name:j.name},account:{id:`vendor-${id}`,name:'Vendor A',type:'vendor'},costItems:{nodes:[item(`i-${id}`,'Make Ready Labor',0,amount)]}});
const run=d=>buildForensicModel(d,'2026-09-01','2026-09-30');

{
  const d=baseData(),j=job('blu2','711 Old Main - Make Ready','Blu 2');d.jobs=[j];d.docs=[order('o1',j)];
  const m=run(d),x=m.jobs[0];assert.equal(x.src.workSource,'Blu 2');assert.equal(x.src.pm,'Brandon');assert.equal(x.stage,'Backlog');
}
{
  const d=baseData(),j=job('blu','2006 S Topeka - Make Ready','Blu');d.jobs=[j];d.docs=[order('o2',j)];
  const m=run(d),x=m.jobs[0];assert.equal(x.src.workSource,'Blu');assert.equal(x.src.pm,'Brandon');assert.equal(x.stage,'Backlog');
}
{
  const d=baseData(),j=job('direct','302 Briarwood - Roof','Lucas Schroeder');d.jobs=[j];d.docs=[order('o3',j)];
  const m=run(d),x=m.jobs[0];assert.equal(x.src.workSource,'Direct Customer');assert.equal(x.src.pm,'Lucas Schroeder');
}
{
  const d=baseData(),j=job('pinned','1301 N Dellrose - Make Ready','316 Rentals');d.jobs=[j];d.docs=[order('o4',j)];d.comments=[{id:'c4',createdAt:'2026-09-01T10:00:00Z',isPinned:true,message:'PM: Brandon BLU 2\nScope approved',job:{id:j.id,number:j.number,name:j.name}}];
  const m=run(d),x=m.jobs[0];assert.equal(x.src.workSource,'Blu 2');assert.equal(x.src.pm,'Brandon');assert.equal(x.stage,'Backlog');
}
{
  const d=baseData(),j=job('sched','302 Briarwood - Siding','Lucas Schroeder');d.jobs=[j];d.docs=[order('o5',j)];d.comments=[{id:'c5',createdAt:'2026-09-02T10:00:00Z',isPinned:false,message:'Spoke to Jorge. Whole week blocked off for you and can start the week of Sep 21.',job:{id:j.id,number:j.number,name:j.name}}];
  const m=run(d),x=m.jobs[0];assert.equal(x.scheduledAssignment,true);assert.equal(x.stage,'Backlog');
}
{
  const d=baseData(),j=job('pendingWO','302 Briarwood - Roof','Lucas Schroeder');d.jobs=[j];d.docs=[order('o6',j),wo('wo6',j,600,'pending')];
  const m=run(d),x=m.jobs[0];assert.equal(x.stage,'Backlog');
}
{
  const d=baseData(),j=job('bluWO','1055 S Roosevelt - Make Ready','Blu 2');d.jobs=[j];d.docs=[order('o7',j),wo('wo7',j)];
  const m=run(d),x=m.jobs[0];assert.equal(x.stage,'Assigned / Not Started');
}
{
  const d=baseData(),j=job('directWO','302 Briarwood - Siding','Lucas Schroeder');d.jobs=[j];d.docs=[order('o8',j),wo('wo8',j)];
  const m=run(d),x=m.jobs[0];assert.equal(x.stage,'Assigned / Not Started');
}
{
  const d=baseData(),j=job('pmiBrad','1847 S Gold St - CS','1439 Homes');d.jobs=[j];d.docs=[order('o9',j,4375),wo('wo9',j,3500)];d.comments=[{id:'c9a',createdAt:'2026-09-01T10:00:00Z',isPinned:true,message:'PM: PMI\nContractor Services',job:{id:j.id,number:j.number,name:j.name}},{id:'c9b',createdAt:'2026-09-01T16:00:00Z',isPinned:true,message:'Approved by Brad Simmons via document click-approve.',job:{id:j.id,number:j.number,name:j.name}}];
  const m=run(d),x=m.jobs[0];assert.equal(x.src.workSource,'PMI');assert.equal(x.src.pm,'Brad');assert.equal(x.stage,'Assigned / Not Started');
}

console.log('Source/stage self-test: 9 scenarios passed.');