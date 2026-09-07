// Stage colouring: early = grey, mid = brass, committed = sage, passed = muted.
const TONE = {
  'Saved': 'grey', 'Researching': 'grey', 'Contacted': 'brass', 'Quote Received': 'brass',
  'Finalist': 'brass', 'Selected': 'sage', 'Contracted': 'sage', 'Paid': 'sage',
  'Complete': 'sage', 'Passed': 'muted',
}
export default function StatusBadge({ status }) {
  return <span className={'status-badge tone-' + (TONE[status] || 'grey')}>
    <span className="sb-dot" />{status}
  </span>
}
