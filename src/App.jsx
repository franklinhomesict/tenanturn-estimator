import {useEffect,useMemo,useState} from 'react';

const logo='https://cdn.jobtread.com/G1QAaByn6Sr5CkWyvKV-3ezPG7pNFSoaG4EmdVj6QgQmcuAeoKXh5-_RKSYUv8M8_bELDZAQGdVpQRG0AMDYvmvJ2nwhUx4BbRjNGQ.9thaKOHAI7-2EsSPFpyFQIFL_VMd0XZq03jRYjrug5M?size=512';
const vendorCapacity={'P Property Maintenance':{weeklyHours:40,weeklyCost:2000,label:'P Property / Kenneth'}};
const knownPMs=['Ben','Jessica','Lexi','Melinda','Brandon'];
const passRx=/\b(reimbursement|reimbursements|reimbursable|pass[- ]?through)\b/i;
const feeRx=/payment processing fee|instant pay/i;
const lossRx=/went with another|chose (a )?cheaper|another contractor|not moving forward|decided not to|declined (the )?(bid|work)|lost (the )?(job|bid)|owner chose|customer chose/i;
const activeRx=/\b(work(?:ing)? today|in progress|progress|installed|installing|demo(?:ing)?|painting|on site|onsite|crew (?:is|was) there|wrapping up|finishing)\b/i;
const doneRx=/\b(job (?:is )?complete|work (?:is )?complete|completed|finished|ready to bill|all done|wrapped up)\b/i;
const returnedRx=/returned|reversed|failed|voided|wrong acct.*returned/i;

const css=`*{box-sizing:border-box}body{margin:0;background:#0b0e13;color:#f3f6fa;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}.app{max-width:1460px;margin:auto;padding:18px}.head{display:flex;justify-content:space-between;gap:18px;align-items:center}.brand{display:flex;gap:14px;align-items:center}.logo{width:72px;height:72px;object-fit:contain;border-radius:12px}.sub,.muted{color:#9ba7b7}.small{font-size:12px}h1{margin:0;font-size:clamp(25px,4vw,38px)}h2{margin:0;font-size:19px}h3{margin:0 0 10px;font-size:15px}.toolbar,.subnav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:14px 0}.toolbar button,.subnav button{border:1px solid #29313d;background:#10151d;color:#f3f6fa;padding:8px 11px;border-radius:10px;font-weight:750;cursor:pointer}.toolbar button.on,.subnav button.on{border-color:#6ab7ff;background:#152235}.toolbar input{border:1px solid #29313d;background:#10151d;color:#f3f6fa;padding:8px;border-radius:9px}.periodlabel{margin-left:auto;color:#9ba7b7;font-size:12px}.ownergrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0 16px}.owner{appearance:none;text-align:left;color:inherit;background:#141922;border:1px solid #29313d;border-radius:16px;padding:16px;cursor:pointer;min-height:175px}.owner.active{border-color:#6ab7ff;background:#152235;box-shadow:0 0 0 1px rgba(106,183,255,.14)}.ownerhead{display:flex;justify-content:space-between;align-items:center}.arrow{color:#6ab7ff;font-size:20px}.hero{font-size:30px;font-weight:850;margin:6px 0}.line,.row{display:flex;justify-content:space-between;gap:10px;border-top:1px solid #29313d;padding:7px 0;font-size:12.5px}.line span,.row span{color:#9ba7b7}.detail{background:#10151d;border:1px solid #29313d;border-radius:16px;padding:16px}.detailhead{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:12px}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.card{background:#141922;border:1px solid #29313d;border-radius:13px;padding:14px;min-width:0}.c12{grid-column:span 12}.c8{grid-column:span 8}.c6{grid-column:span 6}.c4{grid-column:span 4}.c3{grid-column:span 3}.metriclabel{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#9ba7b7;font-weight:850}.metricvalue{font-size:27px;font-weight:850;margin-top:5px}.good{color:#52d28c}.warn{color:#ffd166}.bad{color:#ff6b6b}.blue{color:#6ab7ff}.notice{padding:10px 12px;border:1px solid #5b4b22;background:#18150d;border-radius:10px;color:#ffd166;font-size:12px;margin:10px 0}.notice.ok{border-color:#245b3f;background:#0e1814;color:#52d28c}.badge{display:inline-block;border:1px solid #334155;border-radius:999px;padding:3px 7px;font-size:11px}table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{padding:9px 8px;border-bottom:1px solid #29313d;text-align:left;vertical-align:top}th{color:#9ba7b7;font-size:10.5px;text-transform:uppercase}.foot{margin-top:10px;color:#778394;font-size:11px;line-height:1.45}@media(max-width:950px){.ownergrid{grid-template-columns:repeat(2,1fr)}.c8,.c6,.c4,.c3{grid-column:span 12}}@media(max-width:620px){.app{padding:12px}.head{align-items:flex-start}.logo{width:58px;height:58px}.ownergrid{grid-template-columns:1fr}.owner{min-height:0}.periodlabel{width:100%;margin-left:0}.detailhead{align-items:flex-start;flex-direction:column}table,thead,tbody,tr,th,td{display:block;width:100%}thead{display:none}tr{border:1px solid #29313d;border-radius:10px;margin:0 0 9px;padding:8px;background:#10151d}td{border:0;padding:5px 4px}td:before{content:attr(data-label);display:block;color:#9ba7b7;font-size:10px;font-weight:800;text-transform:uppercase}}`;

const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));
const pct=n=>`${Number.isFinite(n)?n.toFixed(1):'0.0'}%`;
const sum=(a,f=x=>x)=>a.reduce((t,x)=>t+(Number(f(x))||0),0);
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const day=s=>s?new Date(`${String(s).slice(0,10)}T12:00:00`):null;
const inRange=(s,a,b)=>!!s&&!!a&&!!b&&day(s)>=day(a)&&day(s)<=day(b);
const eventDate=d=>d?.closedAt||d?.signedAt||d?.issueDate||d?.createdAt||null;
const lineAmount=i=>Number(i?.priceWithTax??i?.price??0)||0;
const isPassItem=i=>passRx.test(`${i?.name||''} ${i?.description||''}`);
const isPassDoc=d=>passRx.test(`${d?.fullName||''} ${(d?.costItems?.nodes||[]).map(i=>`${i.name||''} ${i.description||''}`).join(' ')}`);
const isFee=d=>feeRx.test(`${d?.account?.name||''} ${d?.fullName||''}`);
const productionAmount=d=>{const items=d?.costItems?.nodes||[];return items.length?sum(items,i=>isPassItem(i)?0:lineAmount(i)):Number(d?.priceWithTax||0)};
const passAmount=d=>sum(d?.costItems?.nodes||[],i=>isPassItem(i)?lineAmount(i):0);
const sortAsc=(a,b)=>new Date(eventDate(a)||0)-new Date(eventDate(b)||0);
const sortNewest=(a,b)=>new Date(b.at||0)-new Date(a.at||0);
function rangeFor(mode,s,e){const n=new Date();let x=new Date(n);if(mode==='Week'){const wd=(n.getDay()+6)%7;x.setDate(n.getDate()-wd)}if(mode==='Month')x=new Date(n.getFullYear(),n.getMonth(),1);if(mode==='Quarter')x=new Date(n.getFullYear(),Math.floor(n.getMonth()/3)*3,1);if(mode==='Custom')return{start:s,end:e};return{start:ymd(x),end:ymd(n)}}
function normalize(api){const p=api?.payload?.data||api?.payload||{},o=p.organization||{};return{jobs:o.jobs?.nodes||[],docs:o.documents?.nodes||[],comments:o.comments?.nodes||[],logs:o.dailyLogs?.nodes||[],tasks:o.tasks?.nodes||[],payments:o.payments?.nodes||[],documentPayments:o.documentPayments?.nodes||[],fetchedAt:api?.fetchedAt||null}}
function pinnedPM(comments){const pinned=(comments||[]).filter(c=>c.isPinned).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));const text=pinned.map(c=>c.message||'').join(' ');for(const pm of knownPMs)if(new RegExp(`\\b${pm}\\b`,'i').test(text))return pm;return 'Unattributed'}
function evidenceState(job,comments,logs){const ev=[...(comments||[]).map(c=>({at:c.createdAt,text:c.message||'',kind:'comment'})),...(logs||[]).map(l=>({at:l.date,text:l.notes||'',kind:'log'}))].filter(x=>x.at).sort(sortNewest);const latest=ev[0]||null;const latestText=latest?.text||'';const taskStarted=Number(job?.taskSummary?.started||0)>0;const started=(logs||[]).length>0||taskStarted||activeRx.test(latestText);const done=!!latest&&doneRx.test(latestText)&&!activeRx.test(latestText);return{started,done,latest}};
function capacityRead(weeks){if(weeks==null)return'Capacity not set';if(weeks>2)return'Heavy backlog';if(weeks>=1)return'Booked';if(weeks>=0.5)return'Healthy';return'Available'}

function buildModel(data,start,end){
 const docs=data.docs||[];
 const orders=docs.filter(d=>d.type==='customerOrder'&&d.status!=='draft');
 const invoices=docs.filter(d=>d.type==='customerInvoice'&&d.status!=='draft');
 const vendorOrders=docs.filter(d=>d.type==='vendorOrder'&&['approved','pending'].includes(d.status));
 const vendorBills=docs.filter(d=>d.type==='vendorBill'&&d.status!=='draft');
 const by={};
 for(const j of data.jobs)by[j.id]={job:j,orders:[],invoices:[],vendorOrders:[],vendorBills:[],comments:[],logs:[]};
 for(const d of orders)if(by[d.job?.id])by[d.job.id].orders.push(d);
 for(const d of invoices)if(by[d.job?.id])by[d.job.id].invoices.push(d);
 for(const d of vendorOrders)if(by[d.job?.id])by[d.job.id].vendorOrders.push(d);
 for(const d of vendorBills)if(by[d.job?.id])by[d.job.id].vendorBills.push(d);
 for(const c of data.comments||[])if(by[c.job?.id])by[c.job.id].comments.push(c);
 for(const l of data.logs||[])if(by[l.job?.id])by[l.job.id].logs.push(l);

 const jobModels=[];
 for(const x of Object.values(by)){
  const approved=x.orders.filter(d=>d.status==='approved').sort(sortAsc);
  const denied=x.orders.filter(d=>d.status==='denied').sort(sortAsc);
  const pending=x.orders.filter(d=>d.status==='pending').sort(sortAsc);
  const baseApproval=approved[0]||null;
  const changeApprovals=approved.slice(1);
  const latestOrder=[...x.orders].sort((a,b)=>new Date(b.createdAt||eventDate(b)||0)-new Date(a.createdAt||eventDate(a)||0))[0]||null;
  const allCommentText=x.comments.map(c=>c.message||'').join(' ');
  const trueLoss=!baseApproval&&latestOrder?.status==='denied'&&lossRx.test(allCommentText);
  const pendingNew=!baseApproval&&latestOrder?.status==='pending'?latestOrder:null;
  const outcomeReview=!baseApproval&&latestOrder?.status==='denied'&&!trueLoss;
  const approvedValue=sum(approved,d=>Number(d.priceWithTax||0));
  const billedProduction=sum(x.invoices,productionAmount);
  const billedPassThrough=sum(x.invoices,passAmount);
  const actualProductionBills=x.vendorBills.filter(d=>!isFee(d)&&!isPassDoc(d));
  const actualProductionCost=sum(actualProductionBills,d=>Number(d.cost||0));
  const feeCost=sum(x.vendorBills.filter(isFee),d=>Number(d.cost||0));
  const cashAP=sum(x.vendorBills.filter(d=>Number(d.balance||0)>0),d=>Number(d.balance||0));
  const performanceAP=sum(x.vendorBills.filter(d=>Number(d.balance||0)>0&&!isFee(d)&&!isPassDoc(d)),d=>Number(d.balance||0));
  const ev=evidenceState(x.job,x.comments,x.logs);
  const activeVendorOrders=x.vendorOrders.filter(v=>['approved','pending'].includes(v.status));
  const unbilled=Math.max(0,approvedValue-billedProduction);
  let stage='No Approved Work';
  if(baseApproval&&!x.job.closedOn){
   if(!activeVendorOrders.length&&!ev.started)stage='Backlog';
   else if(activeVendorOrders.length&&!ev.started)stage='Assigned / Not Started';
   else if(ev.started&&!ev.done)stage='WIP';
   else if(ev.done&&unbilled>0)stage='Ready to Bill';
   else if(ev.done&&unbilled<=0)stage='Billed / Open';
   else stage='Review';
  }
  const actualByVendor={};for(const b of actualProductionBills){const n=b.account?.name||'Unknown';actualByVendor[n]=(actualByVendor[n]||0)+Number(b.cost||0)}
  const committedByVendor={};for(const v of activeVendorOrders){const n=v.account?.name||'Unknown';committedByVendor[n]=(committedByVendor[n]||0)+Number(v.cost||0)}
  const currentRemainingByVendor={};for(const [n,c] of Object.entries(committedByVendor)){currentRemainingByVendor[n]=Math.max(0,c-(actualByVendor[n]||0))}
  const gp=billedProduction-actualProductionCost-feeCost;
  const margin=billedProduction?100*gp/billedProduction:0;
  const vendorCostCoverage=sum(Object.values(actualByVendor));
  const economicsStatus=(stage==='WIP'||stage==='Assigned / Not Started'||stage==='Backlog'||stage==='Ready to Bill')?'Open / provisional':(vendorCostCoverage+1<sum(Object.values(committedByVendor))?'Cost incomplete':'Reconciled');
  jobModels.push({...x,approved,baseApproval,changeApprovals,denied,pending,pendingNew,trueLoss,outcomeReview,approvedValue,billedProduction,billedPassThrough,actualProductionCost,feeCost,cashAP,performanceAP,stage,unbilled,ev,actualByVendor,committedByVendor,currentRemainingByVendor,gp,margin,economicsStatus,pm:pinnedPM(x.comments),billingClient:x.job?.location?.account?.name||'Unknown'});
 }

 const wins=jobModels.filter(j=>j.baseApproval&&inRange(eventDate(j.baseApproval),start,end));
 const losses=jobModels.filter(j=>j.trueLoss&&inRange(eventDate(j.latestOrder),start,end));
 const outcomeReviews=jobModels.filter(j=>j.outcomeReview&&inRange(eventDate(j.latestOrder),start,end));
 const pendingNew=jobModels.filter(j=>j.pendingNew);
 const approvedChanges=jobModels.flatMap(j=>j.changeApprovals.map(d=>({job:j.job,pm:j.pm,doc:d}))).filter(x=>inRange(eventDate(x.doc),start,end));
 const winRate=(wins.length+losses.length)?100*wins.length/(wins.length+losses.length):0;
 const salesWon=sum(wins,j=>Number(j.baseApproval.priceWithTax||0));
 const changeWon=sum(approvedChanges,x=>Number(x.doc.priceWithTax||0));

 const periodInvoices=invoices.filter(d=>inRange(d.issueDate,start,end));
 const billedPeriod=sum(periodInvoices,productionAmount);
 const reimbursementsPeriod=sum(periodInvoices,passAmount);
 const seenDP=new Set();
 const linkedPayments=(data.documentPayments||[]).filter(dp=>{if(seenDP.has(dp.id))return false;seenDP.add(dp.id);return dp.document?.type==='customerInvoice'&&dp.payment?.type==='credit'&&!returnedRx.test(dp.payment?.description||'')&&inRange(dp.payment?.paidAt,start,end)});
 const cashCollected=sum(linkedPayments,dp=>Number(dp.amount||0));
 const ar=invoices.filter(d=>Number(d.balance||0)>0);
 const cashAPDocs=vendorBills.filter(d=>Number(d.balance||0)>0);
 const performanceAPDocs=cashAPDocs.filter(d=>!isFee(d)&&!isPassDoc(d));

 const current=jobModels.filter(j=>j.baseApproval&&!j.job.closedOn&&j.stage!=='No Approved Work');
 const backlog=current.filter(j=>j.stage==='Backlog'),assigned=current.filter(j=>j.stage==='Assigned / Not Started'),wip=current.filter(j=>j.stage==='WIP'),ready=current.filter(j=>j.stage==='Ready to Bill'),review=current.filter(j=>j.stage==='Review');

 const vendorMap={};
 for(const j of jobModels){
  const totalActual=sum(Object.values(j.actualByVendor));
  for(const [n,c] of Object.entries(j.actualByVendor)){
   vendorMap[n]??={name:n,actualCost:0,attributedRevenue:0,jobs:new Set(),openJobs:new Set(),remainingCost:0,provisional:false};
   const v=vendorMap[n];v.actualCost+=c;v.jobs.add(j.job.id);if(totalActual>0)v.attributedRevenue+=j.billedProduction*(c/totalActual);if(j.economicsStatus!=='Reconciled')v.provisional=true;
  }
  if(['Assigned / Not Started','WIP','Ready to Bill'].includes(j.stage))for(const [n,c] of Object.entries(j.currentRemainingByVendor)){
   vendorMap[n]??={name:n,actualCost:0,attributedRevenue:0,jobs:new Set(),openJobs:new Set(),remainingCost:0,provisional:false};
   vendorMap[n].openJobs.add(j.job.id);vendorMap[n].remainingCost+=c;vendorMap[n].jobs.add(j.job.id);
  }
 }
 const vendors=Object.values(vendorMap).map(v=>{const cap=vendorCapacity[v.name]||null;const planningRate=cap?cap.weeklyCost/cap.weeklyHours:null;const backlogHours=planningRate?v.remainingCost/planningRate:null;const backlogWeeks=cap?backlogHours/cap.weeklyHours:null;const gp=v.attributedRevenue-v.actualCost;const margin=v.attributedRevenue?100*gp/v.attributedRevenue:0;return{...v,jobs:v.jobs.size,openJobs:v.openJobs.size,cap,planningRate,backlogHours,backlogWeeks,gp,margin,read:capacityRead(backlogWeeks)}}).sort((a,b)=>b.openJobs-a.openJobs||b.attributedRevenue-a.attributedRevenue);

 const pmMap={};
 for(const j of jobModels){
  if(j.pm==='Unattributed'&&j.billingClient!=='316 Rentals'&&!knownPMs.some(p=>new RegExp(`\\b${p}\\b`,'i').test(j.comments.filter(c=>c.isPinned).map(c=>c.message).join(' '))))continue;
  const p=pmMap[j.pm]??={name:j.pm,newDecisions:0,wins:0,losses:0,approved:0,changes:0,pending:0,billed:0};
  if(j.baseApproval&&inRange(eventDate(j.baseApproval),start,end)){p.newDecisions++;p.wins++;p.approved+=Number(j.baseApproval.priceWithTax||0)}
  if(j.trueLoss&&inRange(eventDate(j.latestOrder),start,end)){p.newDecisions++;p.losses++}
  if(j.pendingNew&&inRange(j.pendingNew.issueDate||j.pendingNew.createdAt,start,end))p.pending+=Number(j.pendingNew.priceWithTax||0);
  for(const d of j.changeApprovals)if(inRange(eventDate(d),start,end))p.changes+=Number(d.priceWithTax||0);
  p.billed+=sum(j.invoices.filter(d=>inRange(d.issueDate,start,end)),productionAmount);
  pmMap[j.pm]=p;
 }
 const pms=Object.values(pmMap).map(p=>({...p,winRate:p.newDecisions?100*p.wins/p.newDecisions:0})).sort((a,b)=>(b.approved+b.changes)- (a.approved+a.changes));

 const clientMap={};for(const j of jobModels){const n=j.billingClient;clientMap[n]??={name:n,approved:0,billed:0,cash:0};if(j.baseApproval&&inRange(eventDate(j.baseApproval),start,end))clientMap[n].approved+=Number(j.baseApproval.priceWithTax||0);for(const d of j.changeApprovals)if(inRange(eventDate(d),start,end))clientMap[n].approved+=Number(d.priceWithTax||0);clientMap[n].billed+=sum(j.invoices.filter(d=>inRange(d.issueDate,start,end)),productionAmount)}for(const dp of linkedPayments){const j=jobModels.find(x=>x.job.id===dp.document?.job?.id);const n=j?.billingClient||dp.payment?.account?.name||'Unknown';clientMap[n]??={name:n,approved:0,billed:0,cash:0};clientMap[n].cash+=Number(dp.amount||0)}const clients=Object.values(clientMap).filter(c=>c.approved||c.billed||c.cash).sort((a,b)=>b.approved-a.approved||b.billed-a.billed);

 const reconciled=jobModels.filter(j=>j.economicsStatus==='Reconciled'&&j.billedProduction>0);
 const reconciledGP=sum(reconciled,j=>j.gp);
 const reconciledRevenue=sum(reconciled,j=>j.billedProduction);
 const reconciledMargin=reconciledRevenue?100*reconciledGP/reconciledRevenue:0;
 const questionablePass=docs.flatMap(d=>(d.costItems?.nodes||[]).filter(i=>!isPassItem(i)&&Number(i.price||0)>0&&Math.abs(Number(i.price||0)-Number(i.cost||0))<0.01).map(i=>({job:d.job?.name||'—',doc:d.fullName||'—',item:i.name||'Unnamed',amount:Number(i.price||0)})));
 const missingPinned=jobModels.filter(j=>j.billingClient==='316 Rentals'&&j.pm==='Unattributed');
 const integrity=[...outcomeReviews.map(j=>`${j.job.name}: denied/revised but no verified final loss outcome`),...missingPinned.map(j=>`${j.job.name}: 316 job missing recognizable PM in pinned scope`),...questionablePass.map(x=>`${x.job}: ${x.item} is cost=price but not explicitly tagged reimbursement`),...review.map(j=>`${j.job.name}: operational stage needs review`)];
 const scheduledJobIds=new Set((data.tasks||[]).filter(t=>t.job?.id&&t.startDate).map(t=>t.job.id));
 const scheduleCoverage=current.length?100*current.filter(j=>scheduledJobIds.has(j.job.id)).length/current.length:0;
 return{jobModels,wins,losses,outcomeReviews,pendingNew,approvedChanges,winRate,salesWon,changeWon,billedPeriod,reimbursementsPeriod,cashCollected,ar,cashAPDocs,performanceAPDocs,current,backlog,assigned,wip,ready,review,vendors,pms,clients,reconciledGP,reconciledRevenue,reconciledMargin,integrity,questionablePass,missingPinned,scheduleCoverage};
}

function Line({a,b,tone=''}){return <div className='line'><span>{a}</span><b className={tone}>{b}</b></div>}
function Metric({label,value,tone=''}){return <div className='card c3'><div className='metriclabel'>{label}</div><div className={`metricvalue ${tone}`}>{value}</div></div>}
function Table({headers,rows}){return <table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} data-label={headers[j]}>{v}</td>)}</tr>)}</tbody></table>}

export default function App(){
 const [active,setActive]=useState('Ops'),[peopleView,setPeopleView]=useState('Vendors'),[mode,setMode]=useState('Month'),[customStart,setCustomStart]=useState('2026-09-01'),[customEnd,setCustomEnd]=useState('2026-09-06'),[api,setApi]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=()=>{setLoading(true);setError('');fetch('/api/dashboard').then(async r=>({r,j:await r.json()})).then(({r,j})=>{if(!r.ok||!j.ok)throw new Error(j.error||'Live JobTread feed unavailable');setApi(j)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))};
 useEffect(load,[]);
 const data=useMemo(()=>normalize(api),[api]),range=useMemo(()=>rangeFor(mode,customStart,customEnd),[mode,customStart,customEnd]),m=useMemo(()=>buildModel(data,range.start,range.end),[data,range.start,range.end]),period=`${range.start} → ${range.end}`;
 const department={Sales:{hero:money(m.salesWon),lines:[['New wins',m.wins.length],['Pending new bids',`${m.pendingNew.length} · ${money(sum(m.pendingNew,j=>j.pendingNew?.priceWithTax))}`],['Win rate',pct(m.winRate)]]},Ops:{hero:`${m.wip.length} WIP`,lines:[['Backlog',m.backlog.length],['Assigned',m.assigned.length],['Ready to bill',m.ready.length]]},People:{hero:`${m.vendors.filter(v=>v.openJobs>0).length} active`,lines:[['Vendor backlog',money(sum(m.vendors,v=>v.remainingCost))],['316 PMs measured',m.pms.filter(p=>p.name!=='Unattributed').length],['Data alerts',m.missingPinned.length]]},Finance:{hero:money(m.billedPeriod),lines:[['Cash collected',money(m.cashCollected)],['Current A/R',money(sum(m.ar,d=>d.balance))],['Reconciled GP',money(m.reconciledGP)]]}};
 const Card=({name})=>{const d=department[name];return <button className={`owner ${active===name?'active':''}`} onClick={()=>setActive(name)}><div className='ownerhead'><h2>{name}</h2><span className='arrow'>›</span></div><div className='hero'>{d.hero}</div>{d.lines.map(([a,b])=><Line key={a} a={a} b={b}/>)}</button>};
 const salesWinRows=m.wins.map(j=>[j.job.name,eventDate(j.baseApproval)?.slice(0,10)||'—',money(j.baseApproval.priceWithTax),j.pm]);
 const pendingRows=m.pendingNew.map(j=>[j.job.name,j.pendingNew?.issueDate||'—',money(j.pendingNew?.priceWithTax),j.pm]);
 const changeRows=m.approvedChanges.map(x=>[x.job.name,eventDate(x.doc)?.slice(0,10)||'—',money(x.doc.priceWithTax),x.pm]);
 const lostRows=m.losses.map(j=>[j.job.name,eventDate(j.latestOrder)?.slice(0,10)||'—',j.pm]);
 const opsRows=m.current.map(j=>[j.job.name,j.stage,money(j.unbilled),Object.keys(j.committedByVendor).join(', ')||'—',j.ev.latest?.text?.slice(0,90)||'—']);
 const vendorRows=m.vendors.map(v=>[v.cap?.label||v.name,v.openJobs,money(v.attributedRevenue),money(v.actualCost),money(v.gp),pct(v.margin),v.cap?`${(v.backlogHours||0).toFixed(1)}h / ${(v.backlogWeeks||0).toFixed(1)} wk`:'Not set',v.read,v.provisional?'Provisional':'Reconciled']);
 const pmRows=m.pms.map(p=>[p.name,p.wins,p.losses,money(p.approved),money(p.changes),money(p.pending),pct(p.winRate),money(p.billed)]);
 const clientRows=m.clients.map(c=>[c.name,money(c.approved),money(c.billed),money(c.cash)]);
 const econRows=m.jobModels.filter(j=>j.billedProduction>0).sort((a,b)=>b.billedProduction-a.billedProduction).map(j=>[j.job.name,money(j.billedProduction),money(j.actualProductionCost),money(j.feeCost),money(j.gp),pct(j.margin),j.economicsStatus]);
 const arRows=m.ar.map(d=>[d.job?.name||'—',d.issueDate||'—',money(d.balance)]),apRows=m.cashAPDocs.map(d=>[d.account?.name||'—',d.job?.name||'—',money(d.balance),isPassDoc(d)?'Pass-through payable':isFee(d)?'Fee':'Production']);
 return <><style>{css}</style><div className='app'>
  <div className='head'><div className='brand'><img src={logo} className='logo'/><div><h1>TenanTurn</h1><div className='sub'>Owner Dashboard</div></div></div><div className='small muted'>{data.fetchedAt?`Live JobTread · ${new Date(data.fetchedAt).toLocaleString()}`:'Live connection pending'}</div></div>
  <div className='toolbar'>{['Week','Month','Quarter','Custom'].map(x=><button key={x} className={mode===x?'on':''} onClick={()=>setMode(x)}>{x}</button>)}{mode==='Custom'&&<><input type='date' value={customStart} onChange={e=>setCustomStart(e.target.value)}/><input type='date' value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/></>}<span className='periodlabel'>{period}</span></div>
  {loading&&<div className='notice'>Loading live JobTread data…</div>}{error&&<div className='notice'>{error}</div>}
  <div className='ownergrid'>{['Sales','Ops','People','Finance'].map(name=><Card key={name} name={name}/>)}</div>
  <section className='detail'><div className='detailhead'><div><div className='metriclabel'>{active}</div><h2>{active==='Sales'?'Are we getting enough work?':active==='Ops'?'Can we handle the work we have?':active==='People'?'Who creates value and where are the weak spots?':'Are we making enough money?'}</h2></div><span className='small muted'>{active==='Ops'||active==='People'?'Current state + lifetime economics':period}</span></div>
  {active==='Sales'&&<div className='grid'><Metric label='New Sales Won' value={money(m.salesWon)} tone='good'/><Metric label='Approved Change Orders' value={money(m.changeWon)}/><Metric label='Pending New Bids' value={money(sum(m.pendingNew,j=>j.pendingNew?.priceWithTax))}/><Metric label='True Win Rate' value={pct(m.winRate)}/><div className='card c6'><h3>New Wins — approval date</h3><Table headers={['Job','Approved','Value','PM']} rows={salesWinRows}/></div><div className='card c6'><h3>Pending New Jobs — current</h3><Table headers={['Job','Sent','Value','PM']} rows={pendingRows}/></div><div className='card c6'><h3>Approved Change Orders — approval date</h3><Table headers={['Job','Approved','Value','PM']} rows={changeRows}/></div><div className='card c6'><h3>Verified Lost Jobs — final decision date</h3><Table headers={['Job','Decision','PM']} rows={lostRows}/></div>{m.outcomeReviews.length>0&&<div className='card c12'><h3>Sales Outcome Review</h3><div className='notice'>{m.outcomeReviews.length} denied/revised job(s) are intentionally excluded from win rate because no final lost-job communication was found.</div></div>}</div>}
  {active==='Ops'&&<div className='grid'><Metric label='Backlog' value={m.backlog.length}/><Metric label='Assigned / Not Started' value={m.assigned.length}/><Metric label='WIP' value={m.wip.length} tone='blue'/><Metric label='Ready to Bill' value={m.ready.length} tone={m.ready.length?'warn':''}/><div className='card c12'><h3>Current Work — no period filter</h3><Table headers={['Job','Stage','Unbilled Approved','Vendor','Latest Evidence']} rows={opsRows}/><div className='foot'>Current stage uses the latest operational evidence, not any historical “done” phrase. A phased job remains WIP when newer evidence shows active work.</div></div></div>}
  {active==='People'&&<><div className='subnav'><button className={peopleView==='Vendors'?'on':''} onClick={()=>setPeopleView('Vendors')}>Vendors</button><button className={peopleView==='Clients / PMs'?'on':''} onClick={()=>setPeopleView('Clients / PMs')}>Clients / 316 PMs</button></div>{peopleView==='Vendors'?<div className='grid'><Metric label='Active Vendors' value={m.vendors.filter(v=>v.openJobs>0).length}/><Metric label='Remaining Assigned Cost' value={money(sum(m.vendors,v=>v.remainingCost))}/><Metric label='Capacity Baselines' value={`${m.vendors.filter(v=>v.cap).length}/${m.vendors.length}`}/><Metric label='Schedule Coverage' value={pct(m.scheduleCoverage)} tone='warn'/><div className='card c12'><h3>Vendor Economics & Capacity</h3><Table headers={['Vendor','Open Jobs','Lifetime Billed Attributed','Actual Cost','GP','Margin','Estimated Backlog','Capacity Read','Economics']} rows={vendorRows}/><div className='foot'>Financial columns are lifetime job economics so month boundaries cannot separate revenue from its vendor cost. Capacity uses only unfinished assigned work. P Property planning baseline is $2,000/week ÷ 40 hours = $50/hour. This estimates backlog hours/weeks, not fake scheduled utilization.</div></div><div className='card c12'><h3>Scheduling</h3><div className='notice'>Scheduling remains future-ready only. It does not drive capacity or stage KPIs until you and Brandon begin using JobTread scheduling consistently.</div></div></div>:<div className='grid'><Metric label='316 PMs Measured' value={m.pms.filter(p=>p.name!=='Unattributed').length}/><Metric label='Missing Pinned PM' value={m.missingPinned.length} tone={m.missingPinned.length?'warn':''}/><div className='card c12'><h3>316 PM Scorecard</h3><Table headers={['PM','New Wins','True Losses','New Approved $','Change Orders $','Pending $','Win Rate','Billed $']} rows={pmRows}/><div className='foot'>PM attribution comes only from the original pinned scope message. Revised proposals do not create extra losses; change orders are separated from new wins.</div></div><div className='card c12'><h3>Billing Clients</h3><Table headers={['Client','Approved $','Billed Production $','Cash Collected $']} rows={clientRows}/><div className='foot'>Billing customer and 316 PM/work source are intentionally separate.</div></div></div>}</>}
  {active==='Finance'&&<div className='grid'><Metric label='Billed Production' value={money(m.billedPeriod)} tone='good'/><Metric label='Cash Collected' value={money(m.cashCollected)} tone='good'/><Metric label='Current A/R' value={money(sum(m.ar,d=>d.balance))}/><Metric label='Reconciled Lifetime GP' value={money(m.reconciledGP)}/><div className='card c12'><h3>What the period means</h3><Line a='Billed Production' b='Invoice issue date'/><Line a='Cash Collected' b='Applied payment paidAt date'/><Line a='A/R and A/P' b='Current balances, no date filter'/><Line a='Job GP / Margin' b='Lifetime job economics, never split by month'/></div><div className='card c12'><h3>Lifetime Job Economics</h3><Table headers={['Job','Billed Production','Actual Vendor Cost','Fees','GP','Margin','Status']} rows={econRows}/><div className='foot'>Open jobs are labeled provisional. Reconciled GP is only aggregated from jobs whose billed production and recorded production costs reconcile cleanly.</div></div><div className='card c6'><h3>Receivables — Current</h3><Table headers={['Job','Invoice','Balance']} rows={arRows}/></div><div className='card c6'><h3>Payables — Current Cash Owed</h3><Table headers={['Vendor','Job','Balance','Type']} rows={apRows}/><div className='foot'>Cash A/P includes legitimate reimbursements because they still must be paid. Performance A/P excludes pass-throughs and fees: {money(sum(m.performanceAPDocs,d=>d.balance))}.</div></div><div className='card c12'><h3>Guardrails</h3><Line a='Period reimbursements excluded from billed production' b={money(m.reimbursementsPeriod)}/><Line a='Draft invoices/bills excluded from A/R and A/P' b='Yes'/><Line a='Cash uses invoice-linked payments and rejects obvious returned/reversed records' b='Yes'/><Line a='Equal cost/price alone does NOT automatically mean reimbursement' b='Yes'/></div></div>}
  </section>
  {m.integrity.length>0&&<div className='card c12' style={{marginTop:12}}><h3>Data Integrity — needs attention, not guessed</h3>{m.integrity.slice(0,12).map((x,i)=><div className='row' key={i}><span>{x}</span><b className='warn'>Review</b></div>)}{m.integrity.length>12&&<div className='foot'>+ {m.integrity.length-12} more flagged records.</div>}</div>}
  <div className='foot'>Period filters only event metrics that truly have a period: approvals, verified losses, invoices, and payments. Ops is current state. Vendor/job profitability is lifetime economics.</div>
 </div></>;
}
