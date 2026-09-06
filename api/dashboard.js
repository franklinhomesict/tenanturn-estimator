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
    where: [[['document', 'id'], '!=', null]]
  },
  nodes: {
    id: {}, name: {}, description: {}, cost: {}, price: {}, priceWithTax: {}, quantity: {}, unitCost: {}, unitPrice: {},
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
    const comments = await fetchPaged(grantKey, 'comments', commentConnection);
    const dailyLogs = await fetchPaged(grantKey, 'dailyLogs', logConnection);
    const tasks = await fetchPaged(grantKey, 'tasks', taskConnection);
    const payments = await fetchPaged(grantKey, 'payments', paymentConnection);
    const documentPayments = await fetchPaged(grantKey, 'documentPayments', documentPaymentConnection);

    return res.status(200).json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      organizationId: org.id,
      organizationName: org.name,
      payload: { organization: { jobs, documents, comments, dailyLogs, tasks, payments, documentPayments } }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || 'JobTread request failed' });
  }
}
