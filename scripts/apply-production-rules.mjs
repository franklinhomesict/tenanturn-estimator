import fs from 'node:fs';

const dashboardPath='src/ForensicDashboard.jsx';
const modelPath='src/forensicModel.js';

let dashboard=fs.readFileSync(dashboardPath,'utf8');
const importNeedle="import {buildForensicModel,eventBusinessDate,money,normalize,pct,productionRevenue,rangeFor,sum,ymd} from './forensicModel';";
const importReplacement=`${importNeedle}\nimport {classifyBusinessLine,classifyDocumentBusinessLine,isPassThroughItem,isFeeItem} from './businessLineRules';`;
if(!dashboard.includes("from './businessLineRules'")){
  if(!dashboard.includes(importNeedle))throw new Error('Dashboard forensicModel import changed; refusing unsafe production patch.');
  dashboard=dashboard.replace(importNeedle,importReplacement);
}

const oldRules=`const passRx=/reimburse|pass[- ]?through/i,feeRx=/instant pay|processing fee/i;\nconst hardCsJobRx=/\\b(?:roof|roofing|siding|tree work|tree removal|sewer|septic|contractor services|\\bcs\\b)\\b/i;\nconst csScopeRx=/\\b(?:tree|roof|roofing|siding|sewer|septic|foundation|gutter|concrete|exterior paint|water heater|plumbing repair|plumbing replacement|hvac|furnace|air conditioner|electrical service|service panel|panel upgrade)\\b/i;\nconst isPassItem=i=>passRx.test(\`${'${i?.name||\'\'} ${i?.description||\'\'}'}\`);\nconst itemLine=(i,jobName='')=>{const n=\`${'${i?.jobCostItem?.name||\'\'} ${i?.name||\'\'}'}\`,t=\`${'${n} ${i?.description||\'\'}'}\`;if(/make ready labor|turnover labor/i.test(n))return 'MR';if(hardCsJobRx.test(jobName))return 'CS';if(csScopeRx.test(t))return 'CS';return 'MR'};`;
const newRules=`const passRx=/reimburse|pass[- ]?through/i,feeRx=/instant pay|processing fee/i;\nconst isPassItem=i=>isPassThroughItem(i);\nconst itemLine=(i,jobName='')=>classifyBusinessLine(i,jobName);`;
if(dashboard.includes(oldRules)) dashboard=dashboard.replace(oldRules,newRules);
else if(!dashboard.includes("const itemLine=(i,jobName='')=>classifyBusinessLine(i,jobName);")) throw new Error('Dashboard business-line rules changed; refusing unsafe production patch.');

const oldNoItems="const inferred=hardCsJobRx.test(`${d?.job?.name||''} ${d?.fullName||''}`)?'CS':'MR';if(inferred!==line||passRx.test(d?.fullName||''))return 0;";
const newNoItems="const inferred=classifyDocumentBusinessLine(d);if(inferred!==line||inferred==='PASS'||inferred==='REVIEW')return 0;";
if(dashboard.includes(oldNoItems)) dashboard=dashboard.replace(oldNoItems,newNoItems);
else if(!dashboard.includes(newNoItems)) throw new Error('Dashboard no-line classifier changed; refusing unsafe production patch.');

const oldSource=` const effectiveSource=j=>{const b=String(j.src.billingCustomer||''),t=\`${'${j.src.sourceText||\'\'} ${assignmentText(j)}'}\`;if(/^blu 2$/i.test(b))return 'Blu 2';if(/^blu$/i.test(b))return 'Blu';if(/sb investments/i.test(b))return 'SB Investments';if(/\\bBLU\\s*2\\b/i.test(t))return 'Blu 2';if(/\\bPM\\s*:?\\s*Brandon\\s+BLU\\b(?!\\s*2)/i.test(t))return 'Blu';if(j.src.workSource==='Unknown'&&b&&b!=='Unknown')return 'Direct Customer';return j.src.workSource};\n const effectivePM=j=>j.src.pm==='Unattributed'&&effectiveSource(j)==='Direct Customer'?j.src.billingCustomer:j.src.pm;`;
const newSource=` const effectiveSource=j=>j.src.workSource;\n const effectivePM=j=>j.src.pm;`;
if(dashboard.includes(oldSource)) dashboard=dashboard.replace(oldSource,newSource);
else if(!dashboard.includes(newSource)) throw new Error('Dashboard source override changed; refusing unsafe production patch.');

const oldReview=` const operationalReviews=currentOps.filter(j=>effectiveStage(j)==='Review').map(j=>({job:j.job.name,detail:'Operational status needs supporting evidence.'}));\n const reviewItems=[...m.review.map(e=>({job:e.job,detail:e.detail})),...operationalReviews];\n const uniqueReviewItems=[...new Map(reviewItems.map(x=>[\`${'${x.job}|${x.detail}'}\`,x])).values()];\n const displayReviewCount=m.review.length+operationalReviews.length,displayTrust=m.critical.length?'BLOCKED':displayReviewCount?'REVIEW':'RECONCILED',trustTone=displayTrust==='BLOCKED'?'bad':displayTrust==='REVIEW'?'warn':'good';`;
const newReview=` const reviewItems=m.review.map(e=>({job:e.job,detail:e.detail}));\n const uniqueReviewItems=[...new Map(reviewItems.map(x=>[\`${'${x.job}|${x.detail}'}\`,x])).values()];\n const displayReviewCount=m.review.length,displayTrust=m.trust,trustTone=displayTrust==='BLOCKED'?'bad':displayTrust==='REVIEW'?'warn':'good';`;
if(dashboard.includes(oldReview)) dashboard=dashboard.replace(oldReview,newReview);
else if(!dashboard.includes(newReview)) throw new Error('Dashboard review override changed; refusing unsafe production patch.');

const oldLossUi=` const extraLossRx=/went forward with another bid|went with another bid|selected another bid|selected a different bid|chose another bid/i;\n const derivedLosses=m.jobs.filter(j=>{const d=eventBusinessDate(j.latestBase);return !j.baseApproval&&j.latestBase?.status==='denied'&&d&&d>=range.start&&d<=range.end&&extraLossRx.test(assignmentText(j))});\n const allLosses=[...new Map([...m.losses,...derivedLosses].map(j=>[j.job.id,j])).values()];`;
const newLossUi=` const allLosses=m.losses;`;
if(dashboard.includes(oldLossUi)) dashboard=dashboard.replace(oldLossUi,newLossUi);
else if(!dashboard.includes(newLossUi)) throw new Error('Dashboard loss override changed; refusing unsafe production patch.');

const oldStage=" const effectiveStage=j=>j.stage==='Backlog'&&explicitScheduling(j)?'Assigned / Not Started':j.stage;";
const newStage=" const effectiveStage=j=>j.stage;";
if(dashboard.includes(oldStage)) dashboard=dashboard.replace(oldStage,newStage);
else if(!dashboard.includes(newStage)) throw new Error('Dashboard stage override changed; refusing unsafe production patch.');

const vendorStart=" const vendorStats=useMemo(()=>{";
const vendorEnd=" const pmStats={};";
if(dashboard.includes(vendorStart)){
  const a=dashboard.indexOf(vendorStart),b=dashboard.indexOf(vendorEnd,a);
  if(b<0)throw new Error('Vendor stats end anchor changed; refusing unsafe production patch.');
  const newVendorStats=` const vendorStats=useMemo(()=>{\n  if(businessLine==='Overall')return (m.people?.vendors||[]).map(v=>({name:v.name,openJobs:v.openJobs,remaining:Number(v.remainingCost||0),rolling:Number(v.rolling8WeeklyCost||0),lifetime:Number(v.lifetimeWeeklyCost||0),confidence:v.capacityConfidence||'Learning',reconciledRevenue:Number(v.attributedRevenue||0),reconciledCost:Number(v.finalActualCost||0),gp:Number(v.gp||0),margin:Number(v.margin||0)})).sort((a,b)=>b.remaining-a.remaining);\n  const map={},get=n=>map[n]||(map[n]={name:n,openJobs:new Set(),commit:0,actual:0,reconciledRevenue:0,reconciledCost:0});\n  const keyOf=i=>i?.jobCostItem?.id||i?.sourceCostItem?.id||(i?.name?\`NAME:\${String(i.name).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}\`:null);\n  for(const d of data.docs||[]){if(!['vendorOrder','vendorBill'].includes(d.type)||d.status!=='approved'||feeRx.test(\`\${d.fullName||''} \${d.account?.name||''}\`))continue;const name=d.account?.name||'Unknown Vendor',amt=docLine(d,businessLine,'cost');if(amt<=.02)continue;const v=get(name);if(d.type==='vendorOrder'){v.commit+=amt;const job=m.jobs.find(j=>j.job.id===d.job?.id);if(job&&!job.job.closedOn)v.openJobs.add(job.job.id)}else v.actual+=amt;}\n  for(const j of m.jobs.filter(j=>j.economicsStatus==='Reconciled')){const bills=jobDocs(j).filter(d=>d.type==='vendorBill'&&d.status==='approved'&&!feeRx.test(\`\${d.fullName||''} \${d.account?.name||''}\`));for(const name of new Set(bills.map(d=>d.account?.name||'Unknown Vendor'))){const v=get(name),keys=new Set();for(const d of bills.filter(d=>(d.account?.name||'Unknown Vendor')===name))for(const i of d.costItems?.nodes||[]){if(isPassItem(i)||feeRx.test(i?.name||'')||itemLine(i,j.job.name)!==businessLine)continue;const k=keyOf(i);if(k)keys.add(k)}for(const k of keys){const vendorCost=Number(j.vendorActualByKey?.[name]?.[k]||0),scopeActual=Number(j.actualByKey?.[k]||0),scopeBilled=Number(j.billedByKey?.[k]||0);if(vendorCost<=.02||scopeActual<=.02)continue;v.reconciledCost+=vendorCost;v.reconciledRevenue+=scopeBilled*Math.min(Math.max(vendorCost/scopeActual,0),1)}}}\n  return Object.values(map).map(v=>{const cap=m.people?.vendorCapacityModel?.[v.name]||null,gp=v.reconciledRevenue-v.reconciledCost,rolling=Number(cap?.rolling8WeeklyCost||0),lifetime=Number(cap?.lifetimeWeeklyCost||0);return {...v,openJobs:v.openJobs.size,remaining:Math.max(v.commit-v.actual,0),rolling,lifetime,confidence:cap?.confidence||'Learning',gp,margin:v.reconciledRevenue?100*gp/v.reconciledRevenue:0}}).sort((a,b)=>b.remaining-a.remaining)\n },[data.docs,businessLine,m.jobs,m.people]);\n`;
  dashboard=dashboard.slice(0,a)+newVendorStats+dashboard.slice(b);
}else if(!dashboard.includes("if(businessLine==='Overall')return (m.people?.vendors||[])")) throw new Error('Vendor stats block changed; refusing unsafe production patch.');

fs.writeFileSync(dashboardPath,dashboard);

let model=fs.readFileSync(modelPath,'utf8');
const oldKnown="const knownPMs = ['Ben', 'Jessica', 'Lexi', 'Melinda', 'Brandon', 'Brad', 'Ally'];";
const newKnown="const knownPMs = ['Ben', 'Jessica', 'Lexi', 'Melinda', 'Brandon', 'Brad', 'Ally', 'Randy'];";
if(model.includes(oldKnown)) model=model.replace(oldKnown,newKnown);
else if(!model.includes(newKnown)) throw new Error('Known PM rule changed; refusing unsafe production patch.');

const oldLoss="const lossRx = /went with another|chose (?:a )?cheaper|another contractor|not moving forward|decided not to|declined (?:the )?(?:bid|work)|lost (?:the )?(?:job|bid)|owner chose|customer chose/i;";
const newLoss="const lossRx = /went with another|went forward with another bid|selected another bid|selected a different bid|chose another bid|chose (?:a )?cheaper|another contractor|not moving forward|decided not to|declined (?:the )?(?:bid|work)|lost (?:the )?(?:job|bid)|owner chose|customer chose/i;";
if(model.includes(oldLoss)) model=model.replace(oldLoss,newLoss);
else if(!model.includes(newLoss)) throw new Error('Forensic loss rule changed; refusing unsafe production patch.');

const oldBluSource="  else if (/blu\\s*2|\\bblu\\b/i.test(sourceProbe)) workSource = 'Blu / Blu 2';";
const newBluSource="  else if (/blu\\s*2|\\bblu2\\b/i.test(sourceProbe)) workSource = 'Blu 2';\n  else if (/\\bblu\\b/i.test(sourceProbe)) workSource = 'Blu';";
if(model.includes(oldBluSource)) model=model.replace(oldBluSource,newBluSource);
else if(!model.includes(newBluSource)) throw new Error('Source probe rule changed; refusing unsafe production patch.');

const oldBillingBlu="    else if (/^blu\\s*2?$|\\bblu\\s*2?\\b/i.test(billingCustomer)) workSource = 'Blu / Blu 2';";
const newBillingBlu="    else if (/^blu\\s*2$|^blu2$/i.test(billingCustomer.trim())) workSource = 'Blu 2';\n    else if (/^blu$/i.test(billingCustomer.trim())) workSource = 'Blu';";
if(model.includes(oldBillingBlu)) model=model.replace(oldBillingBlu,newBillingBlu);
else if(!model.includes(newBillingBlu)) throw new Error('Billing source rule changed; refusing unsafe production patch.');

const oldOwner=`  if (/since you own this one/i.test(allNarrative)) { pm = 'Brandon'; if (workSource === '316 Rentals') workSource = 'Brandon-owned'; }\n  if (!job?.closedOn && (pm === 'Melinda' || /taken over for Melinda|Melinda (?:has )?(?:left|quit)|replaced Melinda/i.test(allNarrative))) pm = 'Ben';\n  if (pm === 'Unattributed' && (workSource === 'Blu / Blu 2' || workSource === 'SB Investments')) pm = 'Brandon';\n  const operationallyAuthorized = !!c && pm === 'Brandon' && (workSource === 'Blu / Blu 2' || workSource === 'SB Investments');`;
const newOwner=`  if (/since you own this one/i.test(allNarrative)) {\n    pm = 'Brandon';\n    if (/\\bblu\\s*2\\b|\\bblu2\\b/i.test(allNarrative)) workSource = 'Blu 2';\n    else if (/\\bsb(?: investments)?\\b/i.test(allNarrative)) workSource = 'SB Investments';\n    else if (/\\bblu\\b/i.test(allNarrative)) workSource = 'Blu';\n    else if (workSource === '316 Rentals') workSource = 'Brandon-owned';\n  }\n  if (!job?.closedOn && (pm === 'Melinda' || /taken over for Melinda|Melinda (?:has )?(?:left|quit)|replaced Melinda/i.test(allNarrative))) pm = 'Ben';\n  if (workSource === 'Unknown' && billingCustomer && billingCustomer !== 'Unknown') workSource = 'Direct Customer';\n  if (pm === 'Unattributed' && ['Blu', 'Blu 2', 'SB Investments'].includes(workSource)) pm = 'Brandon';\n  if (pm === 'Unattributed' && workSource === 'Direct Customer') pm = billingCustomer;\n  const operationallyAuthorized = !!c && pm === 'Brandon' && ['Blu', 'Blu 2', 'SB Investments'].includes(workSource);`;
if(model.includes(oldOwner)) model=model.replace(oldOwner,newOwner);
else if(!model.includes(newOwner)) throw new Error('Owner/source rule changed; refusing unsafe production patch.');

const oldSrcEv="    const src = sourceIdentity(x.job, x.comments, commentsById), ev = operationalEvidence(x.job, x.comments, x.logs);";
const newSrcEv="    const src = sourceIdentity(x.job, x.comments, commentsById), ev = operationalEvidence(x.job, x.comments, x.logs), scheduledAssignment = /(?:called|spoke to)\\s+[A-Z][a-z]+[\\s\\S]{0,220}(?:approved|schedul|start)|\\bwhole week blocked off for you\\b|\\bcan start (?:the )?week of\\b/i.test(narrative);";
if(model.includes(oldSrcEv)) model=model.replace(oldSrcEv,newSrcEv);
else if(!model.includes(newSrcEv)) throw new Error('Operational scheduling insertion point changed; refusing unsafe production patch.');

const oldBacklog="      if (!activeVendorNames.length && !ev.started) stage = 'Backlog';";
const newBacklog="      if (!activeVendorNames.length && !ev.started) { const ownerManaged = ['Blu', 'Blu 2', 'SB Investments', 'Brandon-owned'].includes(src.workSource); stage = scheduledAssignment && !ownerManaged ? 'Assigned / Not Started' : 'Backlog'; }";
if(model.includes(oldBacklog)) model=model.replace(oldBacklog,newBacklog);
else if(!model.includes(newBacklog)) throw new Error('Backlog stage rule changed; refusing unsafe production patch.');

const oldJobPush="jobs.push({ ...x, src, ev, baseApproval";
const newJobPush="jobs.push({ ...x, src, ev, scheduledAssignment, baseApproval";
if(model.includes(oldJobPush)) model=model.replace(oldJobPush,newJobPush);
else if(!model.includes(newJobPush)) throw new Error('Job model output changed; refusing unsafe production patch.');

const trustNeedle="  for (const d of deniedFinancials) push(d.job, 'Info', 'DENIED_FINANCIAL_EXCLUDED', `${d.fullName} is denied audit history and excluded from all totals.`);";
const trustInsert="  for (const j of jobs) if (j.stage === 'Review' && !exceptions.some(e => e.job === j.job.name && (e.severity === 'Critical' || e.severity === 'Review'))) push(j.job, 'Review', 'OPERATIONAL_STAGE_REVIEW', 'Operational evidence is insufficient to place this active job confidently; review assignment, completion, or vendor evidence.');\n\n"+trustNeedle;
if(!model.includes("'OPERATIONAL_STAGE_REVIEW'")){
  if(!model.includes(trustNeedle)) throw new Error('Forensic trust insertion point changed; refusing unsafe production patch.');
  model=model.replace(trustNeedle,trustInsert);
}

fs.writeFileSync(modelPath,model);

console.log('Production rules applied safely.');