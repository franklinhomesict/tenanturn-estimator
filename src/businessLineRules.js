const passRx=/\b(?:reimbursement|reimbursements|reimbursable|reimburse|pass[- ]?through)\b/i;
const feeRx=/instant pay|processing fee/i;
const mrJobRx=/\b(?:make ready|make-ready|\bmr\b|turnover|unit turn)\b/i;
const hardCsJobRx=/\b(?:roof|roofing|siding|tree work|tree removal|sewer|septic|contractor services|\bcs\b|foundation|gutter|concrete)\b/i;
const turnoverScopeRx=/\b(?:make ready|make-ready|turnover|unit turn|lvp|flooring|paint|painting|drywall|trim|baseboard|door|doors|blind|blinds|clean|cleaning|trash|haul|lock|lockset|hardware|caulk|patch|touch ?up)\b/i;
const specialtyScopeRx=/\b(?:tree|roof|roofing|siding|sewer|septic|foundation|gutter|concrete|exterior paint|water heater|plumbing repair|plumbing replacement|hvac|furnace|air conditioner|electrical service|service panel|panel upgrade)\b/i;

export const isPassThroughItem=i=>passRx.test(`${i?.jobCostItem?.name||''} ${i?.name||''} ${i?.description||''}`);
export const isFeeItem=i=>feeRx.test(`${i?.name||''} ${i?.description||''}`);

export function classifyBusinessLine(item,jobName=''){
  const n=`${item?.jobCostItem?.name||''} ${item?.name||''}`;
  const t=`${n} ${item?.description||''}`;
  if(isPassThroughItem(item)||isFeeItem(item))return 'PASS';
  if(/\b(?:make ready labor|turnover labor)\b/i.test(n))return 'MR';
  if(hardCsJobRx.test(jobName))return 'CS';
  if(specialtyScopeRx.test(t))return 'CS';
  if(mrJobRx.test(jobName))return 'MR';
  if(turnoverScopeRx.test(t))return 'MR';
  if(/\b(?:lvp|flooring)\b/i.test(jobName))return 'MR';
  return 'REVIEW';
}

export function classifyDocumentBusinessLine(doc){
  const items=doc?.costItems?.nodes||[];
  if(items.length){
    const lines=new Set(items.map(i=>classifyBusinessLine(i,doc?.job?.name||'')).filter(x=>x!=='PASS'));
    if(lines.size===1)return [...lines][0];
    if(lines.size>1)return 'MIXED';
  }
  const probe=`${doc?.job?.name||''} ${doc?.fullName||''}`;
  if(passRx.test(probe))return 'PASS';
  if(hardCsJobRx.test(probe))return 'CS';
  if(mrJobRx.test(probe)||/\b(?:lvp|flooring)\b/i.test(probe))return 'MR';
  return 'REVIEW';
}
