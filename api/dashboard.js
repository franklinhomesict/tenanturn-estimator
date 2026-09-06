const ORG_ID = '22Pa5G229Dc7';

export default async function handler(req, res) {
  const grantKey = process.env.JOBTREAD_GRANT_KEY;

  if (!grantKey) {
    return res.status(503).json({
      ok: false,
      code: 'JOBTREAD_NOT_CONFIGURED',
      error: 'JOBTREAD_GRANT_KEY is not configured for this Vercel project.'
    });
  }

  const query = {
    $: { grantKey },
    currentGrant: { organization: { id: {}, name: {} } },
    organization: {
      $: { id: ORG_ID },
      jobs: {
        $: {
          size: 200,
          with: {
            approvedOrders: {
              _: 'documents',
              $: { where: { and: [['type', 'customerOrder'], ['status', 'approved']] } },
              count: {},
              sum: { $: 'priceWithTax' }
            },
            pendingOrders: {
              _: 'documents',
              $: { where: { and: [['type', 'customerOrder'], ['status', 'pending']] } },
              count: {},
              sum: { $: 'priceWithTax' }
            },
            vendorOrders: {
              _: 'documents',
              $: { where: { and: [['type', 'vendorOrder'], ['status', 'in', ['pending', 'approved']]] } },
              count: {}
            },
            issuedInvoices: {
              _: 'documents',
              $: { where: { and: [['type', 'customerInvoice'], ['status', '!=', 'draft']] } },
              count: {},
              sum: { $: 'priceWithTax' }
            },
            dailyLogs: { _: 'dailyLogs', count: {} }
          },
          sortBy: [{ field: 'createdAt', order: 'desc' }]
        },
        nodes: {
          id: {}, number: {}, name: {}, description: {}, createdAt: {}, closedOn: {},
          projectedCost: {}, actualCost: {}
        },
        withValues: {},
        nextPage: {}
      },
      documents: {
        $: {
          size: 500,
          where: {
            or: [
              ['type', 'customerOrder'],
              ['type', 'customerInvoice'],
              ['type', 'vendorBill'],
              ['type', 'vendorOrder']
            ]
          },
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
      },
      comments: {
        $: { size: 500, sortBy: [{ field: 'createdAt', order: 'desc' }] },
        nodes: { createdAt: {}, message: {}, job: { id: {}, number: {}, name: {} } },
        nextPage: {}
      },
      dailyLogs: {
        $: { size: 500, sortBy: [{ field: 'date', order: 'desc' }] },
        nodes: { id: {}, date: {}, notes: {}, job: { id: {}, number: {}, name: {} } },
        nextPage: {}
      }
    }
  };

  try {
    const response = await fetch('https://api.jobtread.com/pave', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const text = await response.text();
    if (!response.ok) return res.status(response.status).send(text);

    const payload = JSON.parse(text);
    return res.status(200).json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      organizationId: ORG_ID,
      payload
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || 'JobTread request failed' });
  }
}
