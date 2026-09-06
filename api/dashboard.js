const ORG_ID = '22Pa5G229Dc7';
const ORG_NAME = 'TenanTurn LLC';
const ENDPOINT = 'https://api.jobtread.com/pave';

async function pave(query) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`JobTread ${response.status}: ${text.slice(0, 500)}`);
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
    });
    const result = root?.organization?.[field];
    if (!result) throw new Error(`JobTread did not return organization.${field}`);
    nodes.push(...(result.nodes || []));
    page = result.nextPage || null;
    pages += 1;
    if (pages > 50) throw new Error(`Pagination safety stop reached for ${field}`);
  } while (page);
  return { nodes, nextPage: null };
}

const jobConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'createdAt', order: 'desc' }] },
  nodes: {
    id: {}, number: {}, name: {}, description: {}, createdAt: {}, closedOn: {},
    projectedCost: {}, actualCost: {}, taskSummary: { started: {}, completed: {}, unstarted: {}, startDate: {}, endDate: {} },
    location: { account: { name: {} }, contact: { name: {} } }
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
    id: {}, type: {}, status: {}, createdAt: {}, issueDate: {}, closedAt: {}, signedAt: {},
    priceWithTax: {}, cost: {}, amountPaid: {}, balance: {}, fullName: {},
    job: { id: {}, number: {}, name: {} }, account: { name: {} },
    costItems: { $: { size: 100 }, nodes: { id: {}, name: {}, cost: {}, price: {}, quantity: {}, unitCost: {}, unitPrice: {}, description: {} } }
  },
  nextPage: {}
});

const commentConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'createdAt', order: 'desc' }] },
  nodes: { createdAt: {}, message: {}, job: { id: {}, number: {}, name: {} } }, nextPage: {}
});

const logConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'date', order: 'desc' }] },
  nodes: { id: {}, date: {}, notes: {}, job: { id: {}, number: {}, name: {} } }, nextPage: {}
});

const taskConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'startDate', order: 'asc' }] },
  nodes: {
    id: {}, name: {}, startDate: {}, endDate: {}, startsAt: {}, endsAt: {}, progress: {}, completed: {},
    account: { name: {} }, job: { id: {}, number: {}, name: {} }
  },
  nextPage: {}
});

const paymentConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'paidAt', order: 'desc' }] },
  nodes: { id: {}, type: {}, amount: {}, feeAmount: {}, paidAt: {}, source: {}, description: {}, account: { name: {} } },
  nextPage: {}
});

const documentPaymentConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}) },
  nodes: {
    id: {}, amount: {},
    document: { id: {}, type: {}, status: {}, issueDate: {}, fullName: {}, job: { id: {}, number: {}, name: {} } },
    payment: { id: {}, type: {}, amount: {}, paidAt: {}, account: { name: {} } }
  },
  nextPage: {}
});

export default async function handler(req, res) {
  const grantKey = process.env.JOBTREAD_GRANT_KEY;
  if (!grantKey) return res.status(503).json({ ok: false, code: 'JOBTREAD_NOT_CONFIGURED', error: 'JOBTREAD_GRANT_KEY is not configured for this Vercel project.' });

  try {
    const identity = await pave({ $: { grantKey }, currentGrant: { organization: { id: {}, name: {} } } });
    const org = identity?.currentGrant?.organization;
    if (!org || org.id !== ORG_ID || org.name !== ORG_NAME) {
      return res.status(403).json({ ok: false, code: 'WRONG_JOBTREAD_ORG', error: `Connected JobTread organization must be ${ORG_NAME}.` });
    }

    const [jobs, documents, comments, dailyLogs, tasks, payments, documentPayments] = await Promise.all([
      fetchPaged(grantKey, 'jobs', jobConnection),
      fetchPaged(grantKey, 'documents', documentConnection),
      fetchPaged(grantKey, 'comments', commentConnection),
      fetchPaged(grantKey, 'dailyLogs', logConnection),
      fetchPaged(grantKey, 'tasks', taskConnection),
      fetchPaged(grantKey, 'payments', paymentConnection),
      fetchPaged(grantKey, 'documentPayments', documentPaymentConnection)
    ]);

    return res.status(200).json({
      ok: true, fetchedAt: new Date().toISOString(), organizationId: org.id, organizationName: org.name,
      payload: { organization: { jobs, documents, comments, dailyLogs, tasks, payments, documentPayments } }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || 'JobTread request failed' });
  }
}
