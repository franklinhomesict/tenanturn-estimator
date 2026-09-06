import {useEffect,useMemo,useState} from 'react';

const logo='https://cdn.jobtread.com/G1QAaByn6Sr5CkWyvKV-3ezPG7pNFSoaG4EmdVj6QgQmcuAeoKXh5-_RKSYUv8M8_bELDZAQGdVpQRG0AMDYvmvJ2nwhUx4BbRjNGQ.9thaKOHAI7-2EsSPFpyFQIFL_VMd0XZq03jRYjrug5M?size=512';
const tabs=['Overview','Sales','Ops','People','Finance'];
const css=`*{box-sizing:border-box}body{margin:0;background:#0b0e13;color:#f3f6fa;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}.app{max-width:1440px;margin:auto;padding:18px}.head{display:flex;justify-content:space-between;gap:18px;align-items:center}.brand{display:flex;gap:14px;align-items:center}.logo{width:58px;height:58px;object-fit:contain;border-radius:10px}.sub,.muted{color:#9ba7b7}.small{font-size:12px}.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0}.toolbar button,.tabs button{border:1px solid #29313d;background:#10151d;color:#f3f6fa;padding:9px 12px;border-radius:10px;font-weight:750;cursor:pointer}.toolbar button.on,.tabs button.on{border-color:#6ab7ff;background:#152235}.toolbar input{border:1px solid #29313d;background:#10151d;color:#f3f6fa;padding:9px;border-radius:9px}.tabs{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0 16px}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.card{background:#141922;border:1px solid #29313d;border-radius:14px;padding:15px;min-width:0}.dept{grid-column:span 3;min-height:190px}.c12{grid-column:span 12}.c8{grid-column:span 8}.c6{grid-column:span 6}.c4{grid-column:span 4}.c3{grid-column:span 3}.label{font-size:11px;color:#9ba7b7;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.value{font-size:clamp(25px,4vw,38px);font-weight:850;margin:4px 0}.dept h2{font-size:18px;margin:0 0 12px}.dept .big{font-size:31px;font-weight:850}.dept .line{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid #29313d;font-size:12.5px}.dept .line:first-of-type{border-top:0}.dept .line span{color:#9ba7b7}.row{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #29313d;padding:9px 0;font-size:13px}.row:first-child{border-top:0}.row span{color:#9ba7b7}.good{color:#52d28c}.warn{color:#ffd166}.bad{color:#ff6b6b}.blue{color:#6ab7ff}.pill{display:inline-block;border:1px solid #334155;border-radius:999px;padding:4px 8px;font-size:11px;color:#9ba7b7}.status{margin-left:auto}.notice{padding:10px 12px;border:1px solid #5b4b22;background:#18150d;border-radius:10px;color:#ffd166;font-size:12px;margin:10px 0}.ok{border-color:#245b3f;background:#0e1814;color:#52d28c}.four{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.mini{background:#10151d;border:1px solid #29313d;border-radius:10px;padding:10px}.mini b{display:block;font-size:21px;margin-top:3px}.mini span{color:#9ba7b7;font-size:11px}table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{padding:9px 8px;border-bottom:1px solid #29313d;text-align:left;vertical-align:top}th{color:#9ba7b7;font-size:10.5px;text-transform:uppercase}.num{text-align:right}.note{font-size:12px;color:#9ba7b7;line-height:1.5;margin-top:9px}.empty{padding:22px;text-align:center;color:#9ba7b7}h1{margin:0;font-size:clamp(24px,4vw,36px)}h3{margin:0 0 10px;font-size:15px}@media(max-width:980px){.dept{grid-column:span 6}.c8,.c6,.c4,.c3{grid-column:span 12}.four{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.app{padding:12px}.head{align-items:flex-start}.dept{grid-column:span 12}.four{grid-template-columns:1fr 1fr}.toolbar button{flex:1 1 28%}.tabs button{flex:1 1 28%}table,thead,tbody,tr,th,td{display:block;width:100%}thead{display:none}tr{border:1px solid #29313d;border-radius:10px;margin:0 0 9px;padding:8px;background:#10151d}td{border:0;padding:5px 4px;text-align:left!important}td:before{content:attr(data-label);display:block;color:#9ba7b7;font-size:10px;font-weight:800;text-transform:uppercase}}`;

const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));
const pct=n=>`${Number.isFinite(n)?n.toFixed(1):'0.0'}%`;
const ymd=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const dateOnly=s=>s?new Date(`${String(s).slice(0,10)}T12:00:00`):null;
const inRange=(s,a,b)=>{if(!s)return false;const d=dateOnly(s),x=dateOnly(a),y=dateOnly(b);return d>=x&&d<=y};
const sum=(arr,fn=x=>x)=>arr.reduce((a,x)=>a+(Number(fn(x))||0),0);
const perfItem=i=>!/reimburs|reimbursable|at cost/i.test(i?.name||'');
const textEvidence=s=>(s||'').toLowerCase();
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
  return {jobs:org.jobs?.nodes||[],jobWith:org.jobs?.withValues||[],docs:org.documents?.nodes||[],comments:org.comments?.nodes||[],logs:org.dailyLogs?.nodes||[],fetchedAt:api?.fetchedAt||null};
}

function model(data,start,end){
  const docs=data.docs||[];
  const orders=docs.filter(d=>d.type==='customerOrder');
  const approved=orders.filter(d=>d.status==='approved');
  const pending=orders.filter(d=>d.status==='pending');
  const denied=orders.filter(d=>d.status==='denied');
  const invoices=docs.filter(d=>d.type==='customerInvoice'&&d.status!=='draft');
  const vendorOrders=docs.filter(d=>d.type==='vendorOrder'&&['pending','approved'].includes(d.status));
  const vendorBills=docs.filter(d=>d.type==='vendorBill'&&d.status!=='draft');

  const salesWon=approved.filter(d=>inRange(d.closedAt||d.issueDate,start,end));
  const salesWonValue=sum(salesWon,d=>d.priceWithTax);
  const approvedJobsAll=new Set(approved.map(d=>d.job?.id).filter(Boolean));
  const lostJobs=[...new Map(denied.filter(d=>!approvedJobsAll.has(d.job?.id)&&inRange(d.closedAt||d.issueDate,start,end)).map(d=>[d.job?.id,d])).values()];
  const winJobs=new Set(salesWon.map(d=>d.job?.id).filter(Boolean));
  const winRate=(winJobs.size+lostJobs.length)?(winJobs.size/(winJobs.size+lostJobs.length))*100:0;
  const pendingCurrent=pending;

  const periodInvoices=invoices.filter(d=>inRange(d.issueDate,start,end));
  let revenue=0,cost=0,reimbursements=0;
  for(const inv of periodInvoices){
    const items=inv.costItems?.nodes||[];
    if(items.length){
      for(const i of items){
        if(perfItem(i)){revenue+=Number(i.price||0);cost+=Number(i.cost||0)}
        else reimbursements+=Number(i.price||0);
      }
    }else{revenue+=Number(inv.priceWithTax||0);cost+=Number(inv.cost||0)}
  }
  const feeBills=vendorBills.filter(d=>inRange(d.issueDate,start,end)&&/payment processing fee|instant pay/i.test(d.account?.name||''));
  const fees=sum(feeBills,d=>d.cost);
  const jobProfit=revenue-cost-fees;
  const margin=revenue?jobProfit/revenue*100:0;
  const arDocs=invoices.filter(d=>Number(d.balance||0)>0);
  const apDocs=vendorBills.filter(d=>Number(d.balance||0)>0);

  const byJob={};
  for(const j of data.jobs)byJob[j.id]={job:j,approved:[],vendors:[],invoices:[],comments:[],logs:[]};
  for(const d of approved)if(d.job?.id&&byJob[d.job.id])byJob[d.job.id].approved.push(d);
  for(const d of vendorOrders)if(d.job?.id&&byJob[d.job.id])byJob[d.job.id].vendors.push(d);
  for(const d of invoices)if(d.job?.id&&byJob[d.job.id])byJob[d.job.id].invoices.push(d);
  for(const c of data.comments||[])if(c.job?.id&&byJob[c.job.id])byJob[c.job.id].comments.push(c);
  for(const l of data.logs||[])if(l.job?.id&&byJob[l.job.id])byJob[l.job.id].logs.push(l);

  const current=[];const exceptions=[];
  for(const x of Object.values(byJob)){
    if(x.job.closedOn||!x.approved.length)continue;
    const value=sum(x.approved,d=>d.priceWithTax);
    const invoiced=sum(x.invoices,d=>d.priceWithTax);
    const texts=[...x.comments.map(c=>c.message),...x.logs.map(l=>l.notes)].filter(Boolean);
    const hasStart=texts.some(t=>startRx.test(textEvidence(t)))||x.logs.length>0;
    const hasDone=texts.some(t=>doneRx.test(textEvidence(t)));
    let stage='Backlog';
    if(x.vendors.length&&!hasStart)stage='Assigned';
    if(x.vendors.length&&hasStart)stage='WIP';
    if(hasDone&&invoiced<value)stage='Ready to Bill';
    if(!x.vendors.length&&hasStart){stage='Review';exceptions.push({job:x.job.name,reason:'Production evidence exists but no active vendor work order was found.'})}
    if(invoiced>=value&&hasDone)stage='Billed / Open';
    current.push({job:x.job.name,id:x.job.id,value,invoiced,remaining:Math.max(0,value-invoiced),stage,vendors:x.vendors.map(v=>v.account?.name).filter(Boolean).join(', ')||'—'});
  }

  const backlog=current.filter(x=>x.stage==='Backlog');
  const assigned=current.filter(x=>x.stage==='Assigned');
  const wip=current.filter(x=>x.stage==='WIP');
  const ready=current.filter(x=>x.stage==='Ready to Bill');
  const review=current.filter(x=>x.stage==='Review');

  const vendorMap={};
  for(const v of vendorOrders){
    const name=v.account?.name||'Unassigned';
    vendorMap[name]??={name,assignments:0,value:0,active:0};
    vendorMap[name].assignments++;
    const cj=current.find(x=>x.id===v.job?.id);
    if(cj){vendorMap[name].value+=cj.remaining||cj.value;if(['Assigned','WIP','Ready to Bill'].includes(cj.stage))vendorMap[name].active++}
  }
  const people=Object.values(vendorMap).sort((a,b)=>b.active-a.active||b.value-a.value);

  return {salesWon,salesWonValue,lostJobs,winRate,pendingCurrent,revenue,cost,fees,reimbursements,jobProfit,margin,arDocs,apDocs,current,backlog,assigned,wip,ready,review,exceptions,people,periodInvoices};
}

function Dept({title,children,tone=''}){return <div className="card dept"><h2>{title}</h2><div className={tone}>{children}</div></div>}
function Line({a,b,tone=''}){return <div className="line"><span>{a}</span><b className={tone}>{b}</b></div>}
function Row({a,b,tone=''}){return <div className="row"><span>{a}</span><b className={tone}>{b}</b></div>}
function Table({headers,rows}){return <table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} data-label={headers[j]} className={j>0&&typeof v==='number'?'num':''}>{v}</td>)}</tr>)}</tbody></table>}

function App(){
  const [tab,setTab]=useState('Overview');
  const [mode,setMode]=useState('Month');
  const [customStart,setCustomStart]=useState('2026-09-01');
  const [customEnd,setCustomEnd]=useState('2026-09-06');
  const [api,setApi]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);

  const load=()=>{setLoading(true);setError('');fetch('/api/dashboard').then(r=>r.json().then(j=>({r,j}))).then(({r,j})=>{if(!r.ok||!j.ok)throw new Error(j.error||'Live JobTread feed unavailable');setApi(j)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))};
  useEffect(load,[]);

  const data=useMemo(()=>normalize(api),[api]);
  const range=useMemo(()=>rangeFor(mode,customStart,customEnd),[mode,customStart,customEnd]);
  const m=useMemo(()=>model(data,range.start,range.end),[data,range.start,range.end]);
  const label=`${range.start||'—'} to ${range.end||'—'}`;

  const opsRows=[...m.backlog,...m.assigned,...m.wip,...m.ready,...m.review].map(x=>[x.job,x.stage,money(x.remaining||x.value),x.vendors]);

  return <><style>{css}</style><div className="app">
    <div className="head"><div className="brand"><img className="logo" src={logo}/><div><h1>TenanTurn</h1><div className="sub">Owner Dashboard · Sales, Ops, People, Finance</div></div></div><div className="small muted">{data.fetchedAt?`Live JobTread · ${new Date(data.fetchedAt).toLocaleString()}`:'Live feed not connected'}</div></div>

    {error&&<div className="notice">Preview is built for live JobTread data, but the Vercel server connection is not configured yet: {error}</div>}
    {!error&&!loading&&<div className="notice ok">Live JobTread feed connected. Draft invoices are excluded from A/R; reimbursement lines are excluded from performance revenue and cost.</div>}

    <div className="toolbar"><span className="pill">Reporting period</span>{['Week','Month','Quarter','Custom'].map(x=><button key={x} className={mode===x?'on':''} onClick={()=>setMode(x)}>{x}</button>)}{mode==='Custom'&&<><input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)}/><input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/></>}<button onClick={load}>Refresh</button><span className="muted small">{label}</span></div>

    <div className="grid">
      <Dept title="Sales"><div className="big">{money(m.salesWonValue)}</div><div className="muted small">approved in selected period</div><Line a="Pending now" b={`${m.pendingCurrent.length} · ${money(sum(m.pendingCurrent,d=>d.priceWithTax))}`}/><Line a="Win rate" b={pct(m.winRate)} tone="good"/></Dept>
      <Dept title="Ops"><div className="four"><div className="mini"><span>Backlog</span><b>{m.backlog.length}</b></div><div className="mini"><span>Assigned</span><b>{m.assigned.length}</b></div><div className="mini"><span>WIP</span><b>{m.wip.length}</b></div><div className="mini"><span>Ready</span><b>{m.ready.length}</b></div></div><div className="note">Current-state funnel · not filtered by reporting period</div></Dept>
      <Dept title="People"><div className="big">{m.people.filter(p=>p.active>0).length}</div><div className="muted small">vendors with active assigned work</div><Line a="Active assignments" b={sum(m.people,p=>p.active)}/><Line a="Needs review" b={m.review.length} tone={m.review.length?'warn':''}/></Dept>
      <Dept title="Finance"><div className="big good">{money(m.jobProfit)}</div><div className="muted small">job profit · selected period</div><Line a="Earned revenue" b={money(m.revenue)}/><Line a="Margin" b={pct(m.margin)} tone={m.margin>=30?'good':'warn'}/><Line a="A/R now" b={money(sum(m.arDocs,d=>d.balance))}/></Dept>
    </div>

    <div className="tabs">{tabs.map(x=><button key={x} className={tab===x?'on':''} onClick={()=>setTab(x)}>{x}</button>)}</div>

    {loading?<div className="card empty">Loading JobTread…</div>:<>
      {tab==='Overview'&&<div className="grid"><div className="card c8"><h3>What TenanTurn did in this period</h3><div className="four"><div className="mini"><span>Sales won</span><b>{money(m.salesWonValue)}</b></div><div className="mini"><span>Earned revenue</span><b>{money(m.revenue)}</b></div><div className="mini"><span>Job profit</span><b>{money(m.jobProfit)}</b></div><div className="mini"><span>Margin</span><b>{pct(m.margin)}</b></div></div><Row a="Customer jobs won" b={new Set(m.salesWon.map(d=>d.job?.id)).size}/><Row a="True losses by final document state" b={m.lostJobs.length}/><Row a="Performance reimbursements excluded" b={money(m.reimbursements)}/><Row a="Historical payment/Instant Pay fees" b={money(m.fees)}/></div><div className="card c4"><h3>Right now</h3><Row a="Pending bids" b={`${m.pendingCurrent.length} · ${money(sum(m.pendingCurrent,d=>d.priceWithTax))}`}/><Row a="Backlog" b={`${m.backlog.length} · ${money(sum(m.backlog,x=>x.remaining||x.value))}`}/><Row a="Assigned / not started" b={`${m.assigned.length} · ${money(sum(m.assigned,x=>x.remaining||x.value))}`}/><Row a="WIP" b={`${m.wip.length} · ${money(sum(m.wip,x=>x.remaining||x.value))}`}/><Row a="Ready to bill" b={`${m.ready.length} · ${money(sum(m.ready,x=>x.remaining||x.value))}`} tone={m.ready.length?'warn':''}/></div>{m.exceptions.length>0&&<div className="card c12"><h3>Data exceptions — do not force these into a false stage</h3>{m.exceptions.map((x,i)=><Row key={i} a={x.job} b={x.reason} tone="warn"/>)}</div>}</div>}

      {tab==='Sales'&&<div className="grid"><div className="card c4"><h3>Sales performance</h3><Row a="Won" b={money(m.salesWonValue)} tone="good"/><Row a="Approved orders / changes" b={m.salesWon.length}/><Row a="Win rate" b={pct(m.winRate)}/><Row a="Losses" b={m.lostJobs.length}/></div><div className="card c8"><h3>Pending bids — current</h3>{m.pendingCurrent.length?<Table headers={['Job','Sent','Value']} rows={m.pendingCurrent.map(d=>[d.job?.name,d.issueDate,money(d.priceWithTax)])}/>:<div className="empty">No pending bids.</div>}</div></div>}

      {tab==='Ops'&&<div className="grid"><div className="card c12"><h3>Current production funnel</h3><div className="four"><div className="mini"><span>Backlog</span><b>{m.backlog.length}</b></div><div className="mini"><span>Assigned / not started</span><b>{m.assigned.length}</b></div><div className="mini"><span>WIP</span><b>{m.wip.length}</b></div><div className="mini"><span>Ready to bill</span><b>{m.ready.length}</b></div></div></div><div className="card c12">{opsRows.length?<Table headers={['Job','Stage','Remaining value','Vendor']} rows={opsRows}/>:<div className="empty">No current approved production records.</div>}</div></div>}

      {tab==='People'&&<div className="grid"><div className="card c12"><h3>Vendor workload — current</h3>{m.people.length?<Table headers={['Vendor','Assignments','Active','Current value']} rows={m.people.map(p=>[p.name,p.assignments,p.active,money(p.value)])}/>:<div className="empty">No vendor assignments found.</div>}<div className="note">Capacity is based on JobTread vendor work orders. It does not invent actual days worked from missing logs.</div></div></div>}

      {tab==='Finance'&&<div className="grid"><div className="card c6"><h3>Performance — selected period</h3><Row a="Earned revenue" b={money(m.revenue)}/><Row a="True job cost basis" b={money(m.cost)}/><Row a="Payment / Instant Pay fees" b={money(m.fees)}/><Row a="Job profit" b={money(m.jobProfit)} tone="good"/><Row a="Job margin" b={pct(m.margin)}/><Row a="Pass-through reimbursements excluded" b={money(m.reimbursements)}/></div><div className="card c6"><h3>Balance sheet pulse — current</h3><Row a="A/R sent & unpaid" b={money(sum(m.arDocs,d=>d.balance))}/><Row a="A/P recorded & unpaid" b={money(sum(m.apDocs,d=>d.balance))}/><Row a="A/R invoices" b={m.arDocs.length}/><Row a="A/P bills" b={m.apDocs.length}/><div className="note">Draft invoices and draft bills are setup placeholders and are not counted as A/R or A/P.</div></div><div className="card c12"><h3>Issued invoices in selected period</h3>{m.periodInvoices.length?<Table headers={['Job','Date','Invoice','Billed','Paid','Balance']} rows={m.periodInvoices.map(d=>[d.job?.name,d.issueDate,d.fullName,money(d.priceWithTax),money(d.amountPaid),money(d.balance)])}/>:<div className="empty">No issued invoices in this period.</div>}</div></div>}
    </>}
  </div></>;
}

export default App;
