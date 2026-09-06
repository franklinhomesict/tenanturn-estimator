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
  const withValues = [];
  let page = null;
  let pages = 0;

  do {
    const connection = buildConnection(page);
    const root = await pave({
      $: { grantKey },
      organization: { $: { id: ORG_ID }, [field]: connection }
    });
    const result = root?.organization?.[field];
    if (!result) throw new Error(`JobTread did not return organization.${field}`);
    nodes.push(...(result.nodes || []));
    if (Array.isArray(result.withValues)) withValues.push(...result.withValues);
    page = result.nextPage || null;
    pages += 1;
    if (pages > 50) throw new Error(`Pagination safety stop reached for ${field}`);
  } while (page);

  return { nodes, withValues, nextPage: null };
}

const jobConnection = page => ({
  $: {
    size: 100,
    ...(page ? { page } : {}),
    with: {
      approvedOrders: {
        _: 'documents',
        $: { where: { and: [['type', 'customerOrder'], ['status', 'approved']] } },
        count: {}, sum: { $: 'priceWithTax' }
      },
      pendingOrders: {
        _: 'documents',
        $: { where: { and: [['type', 'customerOrder'], ['status', 'pending']] } },
        count: {}, sum: { $: 'priceWithTax' }
      },
      vendorOrders: {
        _: 'documents',
        $: { where: { and: [['type', 'vendorOrder'], ['status', 'in', ['pending', 'approved']]] } },
        count: {}
      },
      issuedInvoices: {
        _: 'documents',
        $: { where: { and: [['type', 'customerInvoice'], ['status', '!=', 'draft']] } },
        count: {}, sum: { $: 'priceWithTax' }
      },
      dailyLogs: { _: 'dailyLogs', count: {} }
    },
    sortBy: [{ field: 'createdAt', order: 'desc' }]
  },
  nodes: {
    id: {}, number: {}, name: {}, description: {}, createdAt: {}, closedOn: {},
    projectedCost: {}, actualCost: {}
  },
  withValues: {}, nextPage: {}
});

const documentConnection = page => ({
  $: {
    size: 100,
    ...(page ? { page } : {}),
    where: { or: [
      ['type', 'customerOrder'], ['type', 'customerInvoice'],
      ['type', 'vendorBill'], ['type', 'vendorOrder']
    ] },
    sortBy: [{ field: 'createdAt', order: 'desc' }]
  },
  nodes: {
    id: {}, type: {}, status: {}, createdAt: {}, issueDate: {}, closedAt: {},
    priceWithTax: {}, cost: {}, amountPaid: {}, balance: {}, fullName: {},
    job: { id: {}, number: {}, name: {} },
    account: { name: {} },
    costItems: {
      $: { size: 100 },
      nodes: { id: {}, name: {}, cost: {}, price: {}, quantity: {}, unitCost: {}, unitPrice: {} }
    }
  },
  nextPage: {}
});

const commentConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'createdAt', order: 'desc' }] },
  nodes: { createdAt: {}, message: {}, job: { id: {}, number: {}, name: {} } },
  nextPage: {}
});

const logConnection = page => ({
  $: { size: 100, ...(page ? { page } : {}), sortBy: [{ field: 'date', order: 'desc' }] },
  nodes: { id: {}, date: {}, notes: {}, job: { id: {}, number: {}, name: {} } },
  nextPage: {}
});

export default async function handler(req, res) {
  const grantKey = process.env.JOBTREAD_GRANT_KEY;
  if (!grantKey) {
    return res.status(503).json({
      ok: false,
      code: 'JOBTREAD_NOT_CONFIGURED',
      error: 'JOBTREAD_GRANT_KEY is not configured for this Vercel project.'
    });
  }

  try {
    const identity = await pave({
      $: { grantKey },
      currentGrant: { organization: { id: {}, name: {} } }
    });
    const org = identity?.currentGrant?.organization;
    if (!org || org.id !== ORG_ID || org.name !== ORG_NAME) {
      return res.status(403).json({
        ok: false,
        code: 'WRONG_JOBTREAD_ORG',
        error: `Connected JobTread organization must be ${ORG_NAME}.`
      });
    }

    const [jobs, documents, comments, dailyLogs] = await Promise.all([
      fetchPaged(grantKey, 'jobs', jobConnection),
      fetchPaged(grantKey, 'documents', documentConnection),
      fetchPaged(grantKey, 'comments', commentConnection),
      fetchPaged(grantKey, 'dailyLogs', logConnection)
    ]);

    return res.status(200).json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      organizationId: org.id,
      organizationName: org.name,
      payload: { organization: { jobs, documents, comments, dailyLogs } }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || 'JobTread request failed' });
  }
}
