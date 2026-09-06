# TenanTurn Forensic Dashboard Rules

## Purpose
The dashboard is a management and reconciliation layer over TenanTurn LLC's JobTread organization. JobTread remains the source ledger. The dashboard must never manufacture precision: unresolved records are surfaced as exceptions and excluded from final metrics where appropriate.

## Fundamental accounting model

### Period-based events
A period filter may only be applied to an event with a defensible event date:
- New sale won: customer order approval/closed date.
- True loss: final denied outcome date, only when communication confirms the opportunity was actually lost.
- Approved change order: change-order approval date.
- Billed production: valid customer invoice issue date.
- Customer payment applied: linked payment paidAt date.
- Verified cash in/out: payment paidAt date after cash-evidence checks.

### Current-state balances
These are never backdated through the period selector:
- A/R.
- A/P.
- Backlog.
- Assigned / Not Started.
- WIP.
- Ready to Bill.
- Vendor open workload/capacity.

### Lifetime job economics
Profitability is kept with the entire job and is not split across calendar months:
- Billed production revenue.
- Actual production cost.
- Payment-processing fees.
- Customer refunds / leakage.
- Pass-through reimbursements.
- Job GP and margin.
- Vendor scope economics.

A job starting in August and ending in September must not create August revenue with September cost or vice versa.

## Valid document statuses

### Financial documents
Only `pending` and `approved` customer invoices and vendor bills are economically valid.
- `draft`: planning placeholder only; never revenue, A/R, cost, or A/P.
- `denied`: audit history only; never revenue, A/R, cost, or A/P.

This rule prevents replacement documents from being double-counted.

### Sales documents
Customer orders may be pending, approved, or denied for sales-outcome analysis. Draft orders are excluded.

## One opportunity = one job
- The first approved non-change-order customer order is the base win.
- Approved documents explicitly named `Change Order` are changes to an existing win, not new sales.
- Denied/revised proposals do not count as losses by themselves.
- A loss requires final communication evidence that the customer chose another option, declined the work, or otherwise ended the opportunity.
- Multiple approved non-change-order proposals on one job are a Critical exception.

## PM and work-source attribution
- Billing customer and work source are different concepts and must never be collapsed.
- For 316 work, the authoritative PM source is the original pinned scope message.
- Many original scope messages are organization-level comments. When a job description references `org comment <id>`, the dashboard resolves that exact pinned comment by ID.
- Job-attached pinned PM comments are a fallback only when there is no referenced source comment.
- If 316 work is identified but the PM cannot be resolved, the job is `Unattributed` and produces a data-quality exception.

## Scope-level reconciliation
JobTread `jobCostItem` IDs are the preferred reconciliation key across:
- approved customer orders,
- customer invoices,
- vendor work orders,
- vendor bills.

If a strong JobTread scope key is unavailable, normalized line-name matching is permitted only as a fallback and must be flagged as a Review exception.

### Approved vs billed
For each production scope key:
- Approved customer-order value establishes contracted production.
- Valid customer-invoice value establishes billed production.
- Billed value above approved value is `BILLED_UNCONTRACTED_SCOPE` and is Critical.
- Approved value not yet billed remains approved-unbilled production.

This specifically prevents added scope such as the 113 W 10th plumbing progress billing from silently inflating or distorting the original contract.

### Vendor commitment vs actual cost
For each vendor/scope key:
- Valid vendor work orders establish committed cost.
- Valid vendor bills establish incurred/actual cost.
- Actual cost above commitment is a Review exception.
- Actual cost without a matching active vendor commitment is a Review exception.
- Remaining vendor commitment is commitment less incurred cost on the same scope/vendor.

## Revenue and cost classifications

### Production revenue
Valid customer-invoice lines that are not explicit reimbursements/pass-throughs.

### Pass-through revenue/cost
Only lines explicitly identified by reimbursement/pass-through language are excluded from performance revenue and performance cost.
- Equal price and cost alone is never enough to classify a line as pass-through.
- Pass-through cash obligations remain real A/P even though they are excluded from performance margin.

### Production cost
Valid vendor-bill production lines, excluding:
- payment-processing fees,
- pass-through reimbursements,
- customer refunds/leakage.

### Payment-processing fees
316 Payment Processing Fee / Instant Pay costs are true leakage when TenanTurn bore them. Instant Pay being off today does not erase historical fee cost.

### Customer refunds / leakage
A vendor-bill-style liability payable to a customer account is not vendor production labor. It reduces job profit as leakage/refund but must not make the customer appear as a vendor.

## Profit
`Job Profit = billed production revenue - actual production cost - payment-processing fees - customer refunds/other verified leakage`

Pass-through revenue and pass-through cost are excluded from both sides.

The dashboard must not call this company net profit because overhead is outside the job model.

### Reconciled vs provisional
- Open jobs are `Provisional`; their displayed GP is not final.
- Jobs with unresolved Critical financial exceptions are `Exception`.
- Closed/completed jobs with missing cost coverage remain `Cost incomplete`.
- Only fully reconciled job economics may be included in `Reconciled lifetime job GP`.

There is deliberately no generic week/month/quarter profit KPI until TenanTurn has a structured, auditable revenue-recognition/completion event.

## Cash model

Three concepts must remain separate:
1. Invoice status / amountPaid.
2. Customer payments applied to invoices.
3. Cash actually verified as reaching/leaving TenanTurn.

### Customer payments applied
Comes from JobTread document-payment links. This answers what JobTread applied against invoices.

### Verified cash in
Comes from payment records only when the record contains evidence that funds reached a TenanTurn bank/debit-card/check-deposit destination.

A payment explicitly misrouted to Franklin Homes or another account is not TenanTurn cash in, even if JobTread applied it to a TenanTurn invoice.

### Returned payments
Returned/reversed/failed payments are never counted as cash paid. `amountApplied = 0` on the returned Ethan Kornfield payment is a known example.

### Unapplied cash
Unapplied credits remain visible as a cash-clearing/reconciliation item and are not silently attached to revenue.

### Payment invariant
For every payment:
`amount = amountApplied + amountUnapplied`
within rounding tolerance. A failure is Critical.

### Document payment invariant
For every valid invoice or bill:
- linked document-payment total must equal `amountPaid`,
- document total less amountPaid must equal stored balance,
within rounding tolerance.

## Deposits and prepayments
Customer deposits/prepayments are legitimate billing/cash events, but they do not create period profit.

Examples:
- 1607 N Minneapolis was paid in advance before production began.
- 945 N Grove roof used a mobilization deposit.

They remain attached to lifetime job economics until production and costs reconcile.

## Operational stage rules
Draft invoices/bills never affect stage.

Current stage:
- Backlog: approved work, no vendor assignment, no actual-start evidence.
- Assigned / Not Started: vendor work order exists, no actual-start evidence.
- WIP: actual-start evidence exists and latest meaningful operational evidence does not establish whole-job completion.
- Ready to Bill: whole-job completion evidence exists and approved production remains unbilled.
- Complete / Billed: whole-job completion evidence and no approved production remains unbilled.
- Review: evidence conflicts with normal assignment/stage logic.

Only meaningful operational comments/logs are considered. A later unrelated comment or thumbs-up cannot erase earlier production evidence. A phrase such as `completed $1,800 of plumbing` is not whole-job completion.

## Capacity
Vendor capacity is planning data, never accounting data.

For P Property Maintenance:
- Weekly baseline: $2,000 vendor labor cost.
- Weekly hours: 40.
- Planning equivalent: $50/hour.

Remaining work-order cost on active jobs may be converted into equivalent workload weeks. This is a planning approximation until JobTread scheduling/progress is implemented.

Scheduling is future-ready but does not drive current KPIs yet.

## Required exception ledger
The dashboard must surface, not hide, at least:
- multiple base approvals,
- billed uncontracted scope,
- invoice/bill line totals that do not tie to document totals,
- invoice/bill payment-link mismatch,
- invoice/bill balance mismatch,
- cost over vendor commitment,
- uncommitted cost,
- closed job with unbilled approved scope,
- closed job with A/R or A/P,
- pass-through imbalance on completed jobs,
- PM attribution failure,
- weak/name-only scope matching,
- misrouted cash,
- returned/reversed payments,
- unapplied cash,
- payment arithmetic mismatch,
- cash destination not verifiable from JobTread records,
- denied financial documents retained as excluded audit history.

## Accuracy posture
When two records conflict:
1. Do not average them.
2. Do not choose the number that makes the dashboard look cleaner.
3. Preserve both source facts.
4. Exclude the disputed result from `final/reconciled` metrics.
5. Raise an exception with enough detail to resolve it in JobTread.

The goal is not zero exceptions. The goal is that no exception can silently change a trusted KPI.
