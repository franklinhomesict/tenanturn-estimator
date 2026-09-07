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

fs.writeFileSync(dashboardPath,dashboard);

let model=fs.readFileSync(modelPath,'utf8');
const oldLoss="const lossRx = /went with another|chose (?:a )?cheaper|another contractor|not moving forward|decided not to|declined (?:the )?(?:bid|work)|lost (?:the )?(?:job|bid)|owner chose|customer chose/i;";
const newLoss="const lossRx = /went with another|went forward with another bid|selected another bid|selected a different bid|chose another bid|chose (?:a )?cheaper|another contractor|not moving forward|decided not to|declined (?:the )?(?:bid|work)|lost (?:the )?(?:job|bid)|owner chose|customer chose/i;";
if(model.includes(oldLoss)) model=model.replace(oldLoss,newLoss);
else if(!model.includes(newLoss)) throw new Error('Forensic loss rule changed; refusing unsafe production patch.');
fs.writeFileSync(modelPath,model);

console.log('Production rules applied safely.');
