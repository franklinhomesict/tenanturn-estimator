import assert from 'node:assert/strict';
import {classifyBusinessLine,classifyDocumentBusinessLine,isPassThroughItem} from '../src/businessLineRules.js';

const item=(name,description='',jobCostName='')=>({name,description,jobCostItem:jobCostName?{name:jobCostName}:null});
const doc=(jobName,items=[],fullName='')=>({job:{name:jobName},fullName,costItems:{nodes:items}});

// 1. LVP/flooring used for a turnover remains Make Ready.
assert.equal(classifyBusinessLine(item('LVP flooring'),'8464 Granite Belaire - LVP'),'MR');

// 2. Explicit make-ready labor always remains MR.
assert.equal(classifyBusinessLine(item('Labor','','Make Ready Labor'),'113 W 10th - Make Ready'),'MR');

// 3. Added standalone plumbing inside a make-ready job is CS.
assert.equal(classifyBusinessLine(item('Plumbing replacement','Replace failed drain assembly'),'113 W 10th - Make Ready'),'CS');

// 4. Standalone water-heater project is CS.
assert.equal(classifyBusinessLine(item('Water Heater','Replace unit'),'221 E 5th - Water Heater'),'CS');

// 5. Hard-CS whole jobs remain CS even with generic labor lines.
assert.equal(classifyBusinessLine(item('Labor'),'302 Briarwood - Roof'),'CS');
assert.equal(classifyBusinessLine(item('Labor'),'3434 E 9th - Siding'),'CS');
assert.equal(classifyBusinessLine(item('Labor'),'6421 S Sunnyside - Tree Work'),'CS');
assert.equal(classifyBusinessLine(item('Labor'),'1847 S Gold St - CS'),'CS');

// 6. Normal turnover scopes inside a make-ready stay MR.
assert.equal(classifyBusinessLine(item('Paint walls'),'208 N Ash - Make Ready'),'MR');
assert.equal(classifyBusinessLine(item('Replace LVP'),'208 N Ash - Make Ready'),'MR');
assert.equal(classifyBusinessLine(item('Misc labor'),'Skelly Apts 300 S Main #1 - MR'),'MR');

// 7. Pass-throughs never become MR or CS production.
const reimb=item('Reimbursement - paint receipt','At cost, no markup');
assert.equal(isPassThroughItem(reimb),true);
assert.equal(classifyBusinessLine(reimb,'420 S Kessler - Make Ready'),'PASS');

// 8. Unknown generic standalone work cannot silently default to MR.
assert.equal(classifyBusinessLine(item('Misc labor'),'123 Unknown Project'),'REVIEW');

// 9. Mixed jobs report MIXED rather than forcing the whole job into one line.
assert.equal(classifyDocumentBusinessLine(doc('113 W 10th - Make Ready',[item('Make Ready Labor'),item('Plumbing replacement')])),'MIXED');

// 10. No-line document inference follows explicit job purpose only.
assert.equal(classifyDocumentBusinessLine(doc('302 Briarwood - Roof',[],'Customer Proposal')),'CS');
assert.equal(classifyDocumentBusinessLine(doc('8464 Granite Belaire - LVP',[],'Customer Proposal')),'MR');
assert.equal(classifyDocumentBusinessLine(doc('Mystery Job',[],'Customer Proposal')),'REVIEW');

// 11. Real JobTread naming conventions are authoritative for generic lines.
assert.equal(classifyBusinessLine(item('Labor'),'5267 N Toben - Make Ready'),'MR');
assert.equal(classifyBusinessLine(item('Labor'),'1607 N Minneapolis - MR'),'MR');
assert.equal(classifyDocumentBusinessLine(doc('1847 S Gold St - CS',[],'Customer Proposal')),'CS');

// 12. Explicit Make Ready scope labels can coexist with CS add-ons in the same job.
assert.equal(classifyDocumentBusinessLine(doc('420 S Kessler - Make Ready',[item('Labor','','Make Ready Labor'),item('Water Heater','Standalone replacement')])),'MIXED');

console.log('Business-line self-test: 12 scenarios passed.');
