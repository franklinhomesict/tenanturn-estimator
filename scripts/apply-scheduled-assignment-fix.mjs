import fs from 'node:fs';

const modelPath='src/forensicModel.js';
let model=fs.readFileSync(modelPath,'utf8');

const strict="      if (!activeVendorNames.length && !ev.started) stage = 'Backlog';";
const scheduled="      if (!activeVendorNames.length && !ev.started) stage = scheduledAssignment ? 'Assigned / Not Started' : 'Backlog';";
if(model.includes(strict)) model=model.replace(strict,scheduled);
else if(!model.includes(scheduled)) throw new Error('Backlog scheduling rule changed; refusing unsafe scheduled-assignment patch.');

fs.writeFileSync(modelPath,model);
console.log('Scheduled assignment truth applied: explicit vendor scheduling moves approved work to Assigned / Not Started without creating a fake vendor commitment.');
