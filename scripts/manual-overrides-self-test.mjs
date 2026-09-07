import assert from 'node:assert/strict';
import {manualOperationalOverrides,manualOverrideComment,manualOverrideIsStale} from '../src/manualOverrides.js';

const o=manualOperationalOverrides[0];
assert.equal(manualOverrideIsStale(o,new Date('2026-09-07T12:00:00Z')),false,'Fresh owner-confirmed fact should remain usable');
assert.equal(manualOverrideIsStale(o,new Date('2026-09-15T12:00:00Z')),true,'Owner-confirmed fact must require review after seven days');
const c=manualOverrideComment(o,{id:o.jobId,number:'1',name:'2006 S Topeka - Make Ready'});
assert.equal(c.evidenceSource,'manual-override');
assert.equal(c.manualOverride.confirmedBy,'Ian');
assert.match(c.message,/Manual override/);
console.log('Manual override self-test: 2 scenarios passed.');