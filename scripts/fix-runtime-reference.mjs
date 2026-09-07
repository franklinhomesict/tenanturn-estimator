import fs from 'node:fs';
const path='src/ForensicDashboard.jsx';
let s=fs.readFileSync(path,'utf8');
const bad='m.exceptions.length+operationalReviews.length';
if(s.includes(bad)) s=s.replaceAll(bad,'m.exceptions.length');
if(s.includes('operationalReviews.length')) throw new Error('Stale operationalReviews reference remains; refusing deploy.');
fs.writeFileSync(path,s);
console.log('Runtime reference check passed.');
