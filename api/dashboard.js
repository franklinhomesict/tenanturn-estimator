import { buildForensicModel, normalize } from '../src/forensicModel.js';

const ORG_ID = '22Pa5G229Dc7';
const ORG_NAME = 'TenanTurn LLC';
const ENDPOINT = 'https://api.jobtread.com/pave';

async function pave(query, label = 'query') {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${label}: JobTread ${response.status}: ${text.slice(0, 500)}`);
  const json = JSON.parse(text);
  return json?.data || json;
}

async function fetchPaged(grantKey, field, buildConnection) {
  const nodes = [];
  let page = null;
  let pages = 0;
  do {
    const root = await pave({
      $: { grantKey },
      organization: { $: { id: ORG_ID }, [field]: buildConnection(page) }
    }, field);
    const result = root?.organization?.[field];
    if (!result) throw new Error(`${field}: JobTread did not return organization.${field}`);
    nodes.push(...(result.nodes || []));
    page = result.nextPage || null;
    pages += 1;
    if (pages > 100) throw new Error(`${field}: Pagination safety stop reached`);
  } while (page);
  return { nodes, nextPage: null };
}

const jobConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'createdAt', order: 'desc' }] },
  nodes: {
    id: {}, number: {}, name: {}, description: {}, createdAt: {}, closedOn: {},
    projectedCost: {}, actualCost: {},
    taskSummary: { started: {}, completed: {}, unstarted: {}, startDate: {}, endDate: {} },
    location: { account: { id: {}, name: {}, type: {} }, contact: { name: {} } }
  },
  nextPage: {}
});

const documentConnection = page => ({
  $: {
    size: 100, ...(page ? { page } : {}),
    where: { or: [['type', 'customerOrder'], ['type', 'customerInvoice'], ['type', 'vendorBill'], ['type', 'vendorOrder']] },
    sortBy: [{ field: 'createdAt', order: 'desc' }]
  },
  nodes: {
    id: {}, type: {}, status: {}, createdAt: {}, issueDate: {}, closedAt: {}, signedAt: {}, includeInBudget: {},
    priceWithTax: {}, cost: {}, amountPaid: {}, balance: {}, fullName: {},
    job: { id: {}, number: {}, name: {} },
    account: { id: {}, name: {}, type: {} }
  },
  nextPage: {}
});

const costItemConnection = page => ({
  $: {
    size: 100,
    ...(page ? { page } : {}),
    where: [['document', 'id'], '!=', null]
  },
  nodes: {
    id: {}, name: {}, description: {}, cost: {}, price: {}, priceWithTax: {}, quantity: {}, unitCost: {}, unitPrice: {}, isSelected: {},
    document: { id: {}, type: {}, fullName: {}, job: { id: {}, number: {}, name: {} } },
    jobCostItem: { id: {}, name: {} },
    sourceCostItem: { id: {}, name: {} }
  },
  nextPage: {}
});

const commentConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'createdAt', order: 'desc' }] },
  nodes: { id: {}, createdAt: {}, isPinned: {}, name: {}, message: {}, job: { id: {}, number: {}, name: {} } },
  nextPage: {}
});

const logConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'date', order: 'desc' }] },
  nodes: { id: {}, date: {}, notes: {}, job: { id: {}, number: {}, name: {} } },
  nextPage: {}
});

const taskConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'startDate', order: 'asc' }] },
  nodes: {
    id: {}, name: {}, startDate: {}, endDate: {}, startsAt: {}, endsAt: {}, progress: {}, completed: {},
    account: { id: {}, name: {}, type: {} }, job: { id: {}, number: {}, name: {} }
  },
  nextPage: {}
});

const paymentConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'paidAt', order: 'desc' }] },
  nodes: {
    id: {}, type: {}, amount: {}, amountApplied: {}, amountUnapplied: {}, feeAmount: {}, paidAt: {}, source: {}, description: {},
    account: { id: {}, name: {}, type: {} }
  },
  nextPage: {}
});

const documentPaymentConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}) },
  nodes: {
    id: {}, amount: {},
    document: {
      id: {}, type: {}, status: {}, issueDate: {}, fullName: {}, balance: {}, amountPaid: {},
      job: { id: {}, number: {}, name: {} }, account: { id: {}, name: {}, type: {} }
    },
    payment: {
      id: {}, type: {}, amount: {}, amountApplied: {}, amountUnapplied: {}, paidAt: {}, description: {}, source: {},
      account: { id: {}, name: {}, type: {} }
    }
  },
  nextPage: {}
});

function attachCostItems(documents, costItems) {
  const byDocument = {};
  for (const item of costItems.nodes || []) {
    const documentId = item.document?.id;
    if (!documentId) continue;
    if (item.document?.type === 'customerOrder' && item.isSelected === false) continue;
    (byDocument[documentId] ||= []).push({
      id: item.id,
      name: item.name,
      description: item.description,
      cost: item.cost,
      price: item.price,
      priceWithTax: item.priceWithTax,
      quantity: item.quantity,
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      isSelected: item.isSelected,
      jobCostItem: item.jobCostItem,
      sourceCostItem: item.sourceCostItem
    });
  }
  return {
    nodes: (documents.nodes || []).map(doc => ({
      ...doc,
      costItems: { nodes: byDocument[doc.id] || [] }
    })),
    nextPage: null
  };
}

function enrichOperationalEvidence(jobs, comments) {
  const jobById = Object.fromEntries((jobs.nodes || []).map(j => [j.id, j]));
  const nodes = [...(comments.nodes || [])];
  const highConfidenceFieldUpdate = /(?:^|[.!?\n]\s*)(?:(?:i|we|they|he|crew|vendor|contractor)\s+)?(?:took down|cut down|removed|replaced|upsized|treated|repaired|painted|installed|hung|laid|fixed|scrubbed|cleaned|hauled)\b|\bgetting close to finished\b|\bfinish tomorrow\b/i;

  for (const c of comments.nodes || []) {
    const message = String(c.message || '').trim();
    const jobId = c.job?.id;
    if (!jobId || !message || !highConfidenceFieldUpdate.test(message)) continue;
    nodes.push({
      id: `derived-start-${c.id}`,
      createdAt: c.createdAt,
      isPinned: false,
      name: 'Dashboard derived field evidence',
      message: `started work — derived from field update: ${message.slice(0, 500)}`,
      job: c.job,
      evidenceSource: 'derived-from-jobtread-comment'
    });
  }

  const ownerConfirmed = [
    {
      id: 'owner-start-2006-s-topeka',
      createdAt: '2026-09-06T23:55:00.000Z',
      isPinned: false,
      name: 'Owner-confirmed operational fact',
      message: 'Owner-confirmed 2026-09-06: crew started work and has not finished.',
      jobId: '22PcBXfXvsTT'
    },
    {
      id: 'owner-pm-1847-s-gold',
      createdAt: '2026-09-06T23:55:00.000Z',
      isPinned: true,
      name: 'Owner-confirmed PM attribution',
      message: 'PM Brad PMI\nOwner-confirmed by Ian 2026-09-06.',
      jobId: '22PdjcNy9Umt'
    }
  ];

  for (const fact of ownerConfirmed) {
    const job = jobById[fact.jobId];
    if (!job) continue;
    nodes.push({
      id: fact.id,
      createdAt: fact.createdAt,
      isPinned: fact.isPinned,
      name: fact.name,
      message: fact.message,
      job: { id: job.id, number: job.number, name: job.name },
      evidenceSource: 'owner-confirmed'
    });
  }

  return { nodes, nextPage: null };
}

function compactAudit(apiResponse, start, end) {
  const m = buildForensicModel(normalize(apiResponse), start, end);
  return {
    trust: m.trust,
    criticalCount: m.criticalCount,
    reviewCount: m.reviewCount,
    infoCount: m.infoCount,
    exceptions: m.exceptions,
    sales: {
      won: m.salesWon,
      wins: m.wins.map(j => ({ job: j.job.name, value: j.baseApproval?.priceWithTax || 0, pm: j.src.pm, source: j.src.workSource })),
      losses: m.losses.map(j => j.job.name),
      pending: m.pendingNew.map(j => j.job.name),
      winRate: m.winRate
    },
    ops: m.current.map(j => ({ job: j.job.name, stage: j.stage, customer: j.src.billingCustomer, source: j.src.workSource, pm: j.src.pm, unbilled: j.unbilledContracted, economicsStatus: j.economicsStatus })),
    finance: {
      periodBilled: m.periodBilled,
      customerPaymentsApplied: m.customerPaymentsApplied,
      verifiedCashIn: m.verifiedCashIn,
      verifiedCashOut: m.verifiedCashOut,
      ar: m.finance.ar,
      ap: m.finance.ap,
      reconciledGP: m.reconciledGP,
      provisionalGP: m.provisionalGP
    },
    jobs: m.jobs.map(j => ({
      job: j.job.name,
      stage: j.stage,
      economicsStatus: j.economicsStatus,
      billedProduction: j.billedProduction,
      actualProductionCost: j.actualProductionCost,
      passCost: j.passCost,
      billedPass: j.billedPass,
      feeCost: j.feeCost,
      customerRefundCost: j.customerRefundCost,
      profit: j.profit,
      margin: j.margin,
      source: j.src.workSource,
      pm: j.src.pm
    }))
  };
}

export default async function handler(req, res) {
  const grantKey = process.env.JOBTREAD_GRANT_KEY;
  if (!grantKey) return res.status(503).json({ ok: false, code: 'JOBTREAD_NOT_CONFIGURED', error: 'JOBTREAD_GRANT_KEY is not configured for this Vercel project.' });

  try {
    const identity = await pave({ $: { grantKey }, currentGrant: { organization: { id: {}, name: {} } } }, 'identity');
    const org = identity?.currentGrant?.organization;
    if (!org || org.id !== ORG_ID || org.name !== ORG_NAME) {
      return res.status(403).json({ ok: false, code: 'WRONG_JOBTREAD_ORG', error: `Connected JobTread organization must be ${ORG_NAME}.` });
    }

    const jobs = await fetchPaged(grantKey, 'jobs', jobConnection);
    const documentHeaders = await fetchPaged(grantKey, 'documents', documentConnection);
    const costItems = await fetchPaged(grantKey, 'costItems', costItemConnection);
    const documents = attachCostItems(documentHeaders, costItems);
    const rawComments = await fetchPaged(grantKey, 'comments', commentConnection);
    const comments = enrichOperationalEvidence(jobs, rawComments);
    const dailyLogs = await fetchPaged(grantKey, 'dailyLogs', logConnection);
    const tasks = await fetchPaged(grantKey, 'tasks', taskConnection);
    const payments = await fetchPaged(grantKey, 'payments', paymentConnection);
    const documentPayments = await fetchPaged(grantKey, 'documentPayments', documentPaymentConnection);

    const apiResponse = {
      ok: true,
      fetchedAt: new Date().toISOString(),
      organizationId: org.id,
      organizationName: org.name,
      payload: { organization: { jobs, documents, comments, dailyLogs, tasks, payments, documentPayments } }
    };

    if (String(req.query?.audit || '') === '1') {
      const start = String(req.query?.start || '2026-08-31');
      const end = String(req.query?.end || '2026-09-06');
      return res.status(200).json({ ok: true, fetchedAt: apiResponse.fetchedAt, organizationId: org.id, organizationName: org.name, audit: compactAudit(apiResponse, start, end) });
    }

    return res.status(200).json(apiResponse);
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || 'JobTread request failed' });
  }
}
