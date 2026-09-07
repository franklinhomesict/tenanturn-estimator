const DAY=86400000;

export const manualOperationalOverrides=[
  {
    id:'owner-start-2006-s-topeka',
    jobId:'22PcBXfXvsTT',
    confirmedAt:'2026-09-06T23:55:00.000Z',
    confirmedBy:'Ian',
    fact:'Crew started work and has not finished.',
    kind:'started',
    reviewAfterDays:7
  }
];

export function manualOverrideAgeDays(override,asOf=new Date()){
  return Math.max(0,(new Date(asOf)-new Date(override.confirmedAt))/DAY);
}

export function manualOverrideIsStale(override,asOf=new Date()){
  return manualOverrideAgeDays(override,asOf)>Number(override.reviewAfterDays||7);
}

export function manualOverrideComment(override,job){
  return {
    id:override.id,
    createdAt:override.confirmedAt,
    isPinned:false,
    name:'Manual operational override',
    message:`Manual override — confirmed by ${override.confirmedBy} ${override.confirmedAt.slice(0,10)}: ${override.fact}`,
    job:{id:job.id,number:job.number,name:job.name},
    evidenceSource:'manual-override',
    manualOverride:{...override}
  };
}
