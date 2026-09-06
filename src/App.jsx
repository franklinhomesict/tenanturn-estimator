import {useEffect,useMemo,useState} from 'react';

const logo='https://cdn.jobtread.com/G1QAaByn6Sr5CkWyvKV-3ezPG7pNFSoaG4EmdVj6QgQmcuAeoKXh5-_RKSYUv8M8_bELDZAQGdVpQRG0AMDYvmvJ2nwhUx4BbRjNGQ.9thaKOHAI7-2EsSPFpyFQIFL_VMd0XZq03jRYjrug5M?size=512';

const css=`
*{box-sizing:border-box}body{margin:0;background:#0b0e13;color:#f3f6fa;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}.app{max-width:1440px;margin:auto;padding:18px}.head{display:flex;justify-content:space-between;gap:18px;align-items:center}.brand{display:flex;gap:14px;align-items:center}.logo{width:70px;height:70px;object-fit:contain}.sub,.muted{color:#9ba7b7}.small{font-size:12px}.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0}.toolbar button,.toolbar input{border:1px solid #29313d;background:#10151d;color:#f3f6fa;padding:9px 12px;border-radius:10px}.toolbar button{font-weight:750;cursor:pointer}.toolbar button.on{border-color:#6ab7ff;background:#152235}.owner-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}.owner{background:#141922;border:1px solid #29313d;border-radius:16px;padding:16px;cursor:pointer;transition:.15s;min-height:165px}.owner:hover{transform:translateY(-1px);border-color:#41516a}.owner.active{border-color:#6ab7ff;box-shadow:0 0 0 1px #6ab7ff33 inset;background:#111b29}.owner h2{margin:0 0 12px;font-size:20px}.big{font-size:31px;font-weight:850;margin-bottom:8px}.line{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #29313d;padding:7px 0;font-size:12.5px}.line:first-of-type{border-top:0}.line span{color:#9ba7b7}.panel{background:#141922;border:1px solid #29313d;border-radius:16px;padding:16px;margin-top:12px}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.c12{grid-column:span 12}.c8{grid-column:span 8}.c6{grid-column:span 6}.c4{grid-column:span 4}.metric{background:#10151d;border:1px solid #29313d;border-radius:12px;padding:13px}.metric .label{font-size:10.5px;color:#9ba7b7;font-weight:800;text-transform:uppercase}.metric .value{font-size:28px;font-weight:850;margin-top:4px}.good{color:#52d28c}.warn{color:#ffd166}.bad{color:#ff6b6b}.blue{color:#6ab7ff}.notice{padding:11px 13px;border:1px solid #5b4b22;background:#18150d;border-radius:10px;color:#ffd166;font-size:12px;margin:10px 0}.ok{border-color:#245b3f;background:#0e1814;color:#52d28c}.section-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.section-title h2{margin:0;font-size:20px}table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{padding:9px 8px;border-bottom:1px solid #29313d;text-align:left;vertical-align:top}th{color:#9ba7b7;font-size:10.5px;text-transform:uppercase}.right{text-align:right}.empty{padding:22px;text-align:center;color:#9ba7b7}.row{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #29313d;padding:9px 0;font-size:13px}.row:first-child{border-top:0}.row span{color:#9ba7b7}h1{margin:0;font-size:clamp(24px,4vw,38px)}@media(max-width:980px){.owner-grid{grid-template-columns:repeat(2,1fr)}.c8,.c6,.c4{grid-column:span 12}}@media(max-width:620px){.app{padding:12px}.head{align-items:flex-start}.owner-grid{grid-template-columns:1fr}.toolbar button{flex:1 1 28%}table,thead,tbody,tr,th,td{display:block;width:100%}thead{display:none}tr{border:1px solid #29313d;border-radius:10px;margin:0 0 9px;padding:8px;background:#10151d}td{border:0;padding:5px 4px;text-align:left!important}td:before{content:attr(data-label);display:block;color:#9ba7b7;font-size:10px;font-weight:800;text-transform:uppercase}}
`;

const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));
const pct=n=>`${Number.isFinite(n)?n.toFixed(1):'0.0'}%`;
const sum=(arr,fn=x=>x)=>arr.reduce((a,x)=>a+(Number(fn(x))||0),0);
const ymd=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const dateOnly=s=>s?new Date(`${String(s).slice(0,10)}T12:00:00`):null;
const inRange=(s,a,b)=>{if(!s||!a||!b)return false;const d=dateOnly(s),x=dateOnly(a),y=dateOnly(b);return d>=x&&d<=y};
const perfItem=i=>!/reimburs|reimbursable|at cost/i.test(i?.name||'');
const startRx=/\b(started|starting|working|work today|progress|installed|installing|demo|painting|picked up|on site|onsite|crew|getting started)\b/i;
const doneRx=/\b(done|complete|completed|finished|ready to bill|wrap(?:ped)? up|job is complete)\b/i;

function rangeFor(mode,customStart,customEnd){
  const now=new Date();let start=new Date(now),end=new Date(now);
  if(mode==='Week'){const day=(now.getDay()+6)%7;start.setDate(now.getDate()-day)}
  if(mode==='Month')start=new Date(now.getFullYear(),now.getMonth(),1);
  if(mode==='Quarter')start=new Date(now.getFullYear(),Math.floor(now.getMonth()/3)*3,1);
  if(mode==='Custom')return {start:customStart,end:customEnd};
  return {start:ymd(start),end:ymd(end)};
}

function normalize(api){
  const p=api?.payload?.data||api?.payload||{};
  const org=p.organization||{};
  return {jobs:org.jobs?.nodes||[],docs:org.documents?.nodes||[],comments:org.comments?.nodes||[],logs:org.dailyLogs?.nodes||[],fetchedAt:api?.fetchedAt||null};
}

function buildModel(data,start,end){
  const docs=data.docs||[];
  const orders=docs.filter(d=>d.type==='customerOrder');
  const approved=orders.filter(d=>d.status==='approved');
  const pending=orders.filter(d=>d.status==='pending');
  const denied=orders.filter(d=>d.status==='denied');
  const invoices=docs.filter(d=>d.type==='customerInvoice'&&d.status!=='draft');
  const vendorOrders=docs.filter(d=>d.type==='vendorOrder'&&['pending','approved'].includes(d.status));
  const vendorBills=docs.filter(d=>d.type==='vendorBill'&&d.status!=='draft');

  const approvedJobsAll=new Set(approved.map(d=>d.job?.id).filter(Boolean));
  const salesWon=approved.filter(d=>inRange(d.closedAt||d.issueDate,start,end));
  const wonJobs=new Set(salesWon.map(d=>d.job?.id).filter(Boolean));
  const lostJobs=[...new Map(denied.filter(d=>!approvedJobsAll.has(d.job?.id)&&inRange(d.closedAt||d.issueDate,start,end)).map(d=>[d.job?.id,d])).values()];
  const winRate=(wonJobs.size+lostJobs.length)?wonJobs.size/(wonJobs.size+lostJobs.length)*100:0;

  const periodInvoices=invoices.filter(d=>inRange(d.issueDate,start,end));
  let revenue=0,cost=0,reimbursements=0;
  for(const inv of periodInvoices){
    const items=inv.costItems?.nodes||[];
    if(items.length){for(const i of items){if(perfItem(i)){revenue+=Number(i.price||0);cost+=Number(i.cost||0)}else reimbursements+=Number(i.price||0)}}
    else {revenue+=Number(inv.priceWithTax||0);cost+=Number(inv.cost||0)}
  }
  const feeBills=vendorBills.filter(d=>inRange(d.issueDate,start,end)&&/payment processing fee|instant pay/i.test(`${d.account?.name||''} ${d.fullName||''}`));
  const fees=sum(feeBills,d=>d.cost);
  const profit=revenue-cost-fees;
  const margin=revenue?profit/revenue*100:0;
  const ar=invoices.filter(d=>Number(d.balance||0)>0);
  const ap=vendorBills.filter(d=>Number(d.balance||0)>0);

  const byJob={};
  for(const j of data.jobs)byJob[j.id]={job:j,approved:[],vendors:[],invoices:[],comments:[],logs:[]};
  for(const d of approved)if(byJob[d.job?.id])byJob[d.job.id].approved.push(d);
  for(const d of vendorOrders)if(byJob[d.job?.id])byJob[d.job.id].vendors.push(d);
  for(const d of invoices)if(byJob[d.job?.id])byJob[d.job.id].invoices.push(d);
  for(const c of data.comments||[])if(byJob[c.job?.id])byJob[c.job.id].comments.push(c);
  for(const l of data.logs||[])if(byJob[l.job?.id])byJob[l.job.id].logs.push(l);

  const current=[];
  for(const x of Object.values(byJob)){
    if(x.job.closedOn||!x.approved.length)continue;
    const value=sum(x.approved,d=>d.priceWithTax);
    const invoiced=sum(x.invoices,d=>d.priceWithTax);
    const text=[...x.comments.map(c=>c.message||''),...x.logs.map(l=>l.notes||'')].join(' ');
    const started=startRx.test(text)||x.logs.length>0;
    const done=doneRx.test(text);
    let stage='Backlog';
    if(x.vendors.length&&!started)stage='Assigned / Not Started';
    if(x.vendors.length&&started)stage='WIP';
    if(done&&invoiced<value)stage='Ready to Bill';
    if(!x.vendors.length&&started)stage='Review';
    if(done&&invoiced>=value)stage='Billed / Open';
    current.push({id:x.job.id,job:x.job.name,value,invoiced,remaining:Math.max(0,value-invoiced),stage,vendors:x.vendors.map(v=>v.account?.name).filter(Boolean).join(', ')||'—'});
  }

  const backlog=current.filter(x=>x.stage==='Backlog');
  const assigned=current.filter(x=>x.stage==='Assigned / Not Started');
  const wip=current.filter(x=>x.stage==='WIP');
  const ready=current.filter(x=>x.stage==='Ready to Bill');
  const review=current.filter(x=>x.stage==='Review');

  const peopleMap={};
  for(const v of vendorOrders){const name=v.account?.name||'Unassigned';peopleMap[name]??={name,active:0,assignedValue:0,totalAssignments:0};peopleMap[name].totalAssignments++;const j=current.find(x=>x.id===v.job?.id);if(j&&['Assigned / Not Started','WIP','Ready to Bill'].includes(j.stage)){peopleMap[name].active++;peopleMap[name].assignedValue+=j.remaining||j.value}}
  const people=Object.values(peopleMap).sort((a,b)=>b.active-a.active||b.assignedValue-a.assignedValue);

  return {salesWon,salesWonValue:sum(salesWon,d=>d.priceWithTax),lostJobs,winRate,pending,revenue,cost,reimbursements,fees,profit,margin,ar,ap,backlog,assigned,wip,ready,review,people,periodInvoices};
}

function Metric({label,value,tone=''}){return <div className="metric"><div className="label">{label}</div><div className={`value ${tone}`}>{value}</div></div>}
function Line({a,b,tone=''}){return <div className="line"><span>{a}</span><b className={tone}>{b}</b></div>}
function Row({a,b,tone=''}){return <div className="row"><span>{a}</span><b className={tone}>{b}</b></div>}
function Table({headers,rows}){if(!rows.length)return <div className="empty">Nothing to show.</div>;return <table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} data-label={headers[j]}>{v}</td>)}</tr>)}</tbody></table>}

function App(){
  const [section,setSection]=useState('Sales');
  const [mode,setMode]=useState('Month');
  const [customStart,setCustomStart]=useState('2026-09-01');
  const [customEnd,setCustomEnd]=useState('2026-09-06');
  const [api,setApi]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  const load=()=>{setLoading(true);setError('');fetch('/api/dashboard').then(async r=>({r,j:await r.json()})).then(({r,j})=>{if(!r.ok||!j.ok)throw new Error(j.error||'Live JobTread feed unavailable');setApi(j)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))};
  useEffect(load,[]);

  const data=useMemo(()=>normalize(api),[api]);
  const range=useMemo(()=>rangeFor(mode,customStart,customEnd),[mode,customStart,customEnd]);
  const m=useMemo(()=>buildModel(data,range.start,range.end),[data,range.start,range.end]);
  const totalPipeline=sum(m.pending,d=>d.priceWithTax);
  const totalBacklog=sum(m.backlog,d=>d.remaining||d.value);
  const totalAssigned=sum(m.assigned,d=>d.remaining||d.value);
  const totalWip=sum(m.wip,d=>d.remaining||d.value);
  const totalReady=sum(m.ready,d=>d.remaining||d.value);
  const activePeople=m.people.filter(p=>p.active>0).length;

  const ownerCards=[
    {name:'Sales',big:money(m.salesWonValue),lines:[['Won',`${m.salesWon.length} approvals`],['Pending',money(totalPipeline)],['Win rate',pct(m.winRate)]]},
    {name:'Ops',big:money(totalWip),lines:[['Backlog',money(totalBacklog)],['Assigned',money(totalAssigned)],['Ready to bill',money(totalReady)]]},
    {name:'People',big:String(activePeople),lines:[['Active vendors','with live work'],['Assignments',String(sum(m.people,p=>p.active))],['Needs review',String(m.review.length)]]},
    {name:'Finance',big:money(m.profit),lines:[['Earned revenue',money(m.revenue)],['Margin',pct(m.margin)],['A/R',money(sum(m.ar,d=>d.balance))]]}
  ];

  const renderSales=()=> <div className="panel"><div className="section-title"><h2>Sales</h2><span className="muted small">{range.start} → {range.end}</span></div><div className="grid"><div className="c4"><Metric label="Sales Won" value={money(m.salesWonValue)} tone="good"/></div><div className="c4"><Metric label="Pending Bids" value={money(totalPipeline)} tone="blue"/></div><div className="c4"><Metric label="Win Rate" value={pct(m.winRate)}/></div><div className="c6"><h3>Won in Period</h3><Table headers={['Job','Approved','Value']} rows={m.salesWon.map(d=>[d.job?.name||'—',String(d.closedAt||d.issueDate||'').slice(0,10),money(d.priceWithTax)])}/></div><div className="c6"><h3>Pending Now</h3><Table headers={['Job','Sent','Value']} rows={m.pending.map(d=>[d.job?.name||'—',String(d.issueDate||'').slice(0,10),money(d.priceWithTax)])}/></div><div className="c12"><h3>Lost in Period</h3><Table headers={['Job','Decision','Value']} rows={m.lostJobs.map(d=>[d.job?.name||'—',String(d.closedAt||d.issueDate||'').slice(0,10),money(d.priceWithTax)])}/></div></div></div>;

  const renderOps=()=> <div className="panel"><div className="section-title"><h2>Ops</h2><span className="muted small">Current state · as of now</span></div><div className="grid"><div className="c4"><Metric label="Backlog" value={money(totalBacklog)}/></div><div className="c4"><Metric label="Assigned / Not Started" value={money(totalAssigned)}/></div><div className="c4"><Metric label="WIP" value={money(totalWip)} tone="blue"/></div><div className="c4"><Metric label="Ready to Bill" value={money(totalReady)} tone="good"/></div><div className="c4"><Metric label="Needs Review" value={String(m.review.length)} tone={m.review.length?'warn':''}/></div><div className="c4"><Metric label="Open Ops Jobs" value={String(m.backlog.length+m.assigned.length+m.wip.length+m.ready.length+m.review.length)}/></div><div className="c12"><Table headers={['Job','Stage','Remaining','Vendor']} rows={[...m.backlog,...m.assigned,...m.wip,...m.ready,...m.review].map(x=>[x.job,x.stage,money(x.remaining||x.value),x.vendors])}/></div></div></div>;

  const renderPeople=()=> <div className="panel"><div className="section-title"><h2>People</h2><span className="muted small">Current workload</span></div><div className="grid"><div className="c4"><Metric label="Active Vendors" value={String(activePeople)}/></div><div className="c4"><Metric label="Active Assignments" value={String(sum(m.people,p=>p.active))}/></div><div className="c4"><Metric label="Assigned Work" value={money(sum(m.people,p=>p.assignedValue))}/></div><div className="c12"><Table headers={['Vendor','Active Jobs','Assigned Work','All WOs']} rows={m.people.map(p=>[p.name,String(p.active),money(p.assignedValue),String(p.totalAssignments)])}/></div></div></div>;

  const renderFinance=()=> <div className="panel"><div className="section-title"><h2>Finance</h2><span className="muted small">{range.start} → {range.end}</span></div><div className="grid"><div className="c4"><Metric label="Earned Revenue" value={money(m.revenue)} tone="good"/></div><div className="c4"><Metric label="Job Profit" value={money(m.profit)}/></div><div className="c4"><Metric label="Adjusted Margin" value={pct(m.margin)}/></div><div className="c4"><Metric label="Reimbursements Excluded" value={money(m.reimbursements)}/></div><div className="c4"><Metric label="Historical Payment Fees" value={money(m.fees)} tone={m.fees?'warn':''}/></div><div className="c4"><Metric label="A/R Now" value={money(sum(m.ar,d=>d.balance))} tone={m.ar.length?'warn':''}/></div><div className="c6"><h3>Period Profit Bridge</h3><Row a="Earned production revenue" b={money(m.revenue)}/><Row a="True recorded job cost" b={`-${money(m.cost)}`}/><Row a="Payment / Instant Pay fees" b={`-${money(m.fees)}`}/><Row a="Job profit" b={money(m.profit)} tone="good"/></div><div className="c6"><h3>Current Balances</h3><Row a="A/R" b={money(sum(m.ar,d=>d.balance))}/><Row a="A/P" b={money(sum(m.ap,d=>d.balance))}/><Row a="Open customer invoices" b={String(m.ar.length)}/><Row a="Open vendor bills" b={String(m.ap.length)}/></div></div></div>;

  return <><style>{css}</style><div className="app"><div className="head"><div className="brand"><img className="logo" src={logo}/><div><h1>TenanTurn</h1><div className="sub">Owner Dashboard</div></div></div><div className="small muted">{data.fetchedAt?`Live JobTread · ${new Date(data.fetchedAt).toLocaleString()}`:'Live JobTread'}</div></div>

  <div className="toolbar">{['Week','Month','Quarter','Custom'].map(x=><button key={x} className={mode===x?'on':''} onClick={()=>setMode(x)}>{x}</button>)}{mode==='Custom'&&<><input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)}/><input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/></>}<button onClick={load}>Refresh</button></div>

  {loading&&<div className="notice">Loading live JobTread data…</div>}
  {error&&<div className="notice">{error}</div>}
  {!error&&!loading&&<div className="notice ok">Live data loaded. Period metrics use {range.start} through {range.end}; Ops and People show current state.</div>}

  <div className="owner-grid">{ownerCards.map(card=><div key={card.name} className={`owner ${section===card.name?'active':''}`} onClick={()=>setSection(card.name)} role="button" tabIndex="0"><h2>{card.name}</h2><div className="big">{card.big}</div>{card.lines.map(([a,b],i)=><Line key={i} a={a} b={b}/>)}</div>)}</div>

  {section==='Sales'&&renderSales()}{section==='Ops'&&renderOps()}{section==='People'&&renderPeople()}{section==='Finance'&&renderFinance()}
  </div></>;
}

export default App;
