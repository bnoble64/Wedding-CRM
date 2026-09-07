import { useState } from 'react'
import { useBudget, PAYMENT_STATUS } from '../hooks/useBudget.js'
import { money, shortDate } from '../lib/format.js'

export default function Budget() {
  const d = useBudget()
  const [tab, setTab] = useState('overview')
  if (d.loading) return <div className="page"><div className="empty">Loading budget…</div></div>
  if (d.error) return <div className="page"><div className="notice notice-error">{d.error}</div></div>

  const s = d.summary
  const rollup = d.categoryRollup()
  const remaining = Number(s.funds_available || 0) - Number(s.estimated_total || 0)
  const owed = Number(s.committed_total || 0) - Number(s.paid_total || 0)

  return (
    <div className="page">
      <header className="page-head"><h1 className="display page-title">Budget</h1></header>

      <div className="cards budget-cards">
        <Stat label="Available funds" value={money(s.funds_available)} note={Number(s.contributions_received) > 0 ? `incl. ${money(s.contributions_received)} gifts` : 'your target'} />
        <Stat label="Estimated" value={money(s.estimated_total)} note="best current guess" />
        <Stat label="Committed" value={money(s.committed_total)} note={`${money(owed)} still owed`} />
        <Stat label="Remaining to spend" value={money(remaining)} note={remaining < 0 ? 'over available funds' : 'against available'} danger={remaining < 0} />
      </div>

      <div className="chips">
        {['overview', 'items', 'payments'].map(t => (
          <button key={t} className={'chip' + (tab === t ? ' on' : '')} onClick={() => setTab(t)}>
            {t === 'overview' ? 'By category' : t === 'items' ? 'Line items' : 'Payments'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        rollup.length === 0
          ? <div className="empty">Nothing costed yet. Vendor estimates and line items land here, grouped by category. Add a vendor's budget category or a line item to see it roll up.</div>
          : <div className="panel">
              <table className="compare-table budget-table">
                <thead><tr><th>Category</th><th>Target</th><th>Estimated</th><th>Committed</th><th>Paid</th></tr></thead>
                <tbody>
                  {rollup.map(r => (
                    <tr key={r.c.id}>
                      <th scope="row">{r.c.name}</th>
                      <td>{r.c.target_allocation != null ? money(r.c.target_allocation) : '—'}</td>
                      <td>{money(r.estimated)}</td>
                      <td>{money(r.committed)}</td>
                      <td>{money(r.paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {tab === 'items' && <Items d={d} />}
      {tab === 'payments' && <Payments d={d} />}
    </div>
  )
}

function Stat({ label, value, note, danger }) {
  return <div className="card"><p className="card-label">{label}</p>
    <div className={'card-big display' + (danger ? ' danger-text' : '')}>{value}</div>
    <div className="card-note">{note}</div></div>
}

const num = v => (v === '' || v == null ? null : Number(v))

function Items({ d }) {
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ name: '', budget_category_id: '', estimated: '' })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  async function save() {
    if (!f.name.trim()) return
    await d.actions.addItem({ name: f.name, budget_category_id: f.budget_category_id || null, estimated: num(f.estimated) })
    setF({ name: '', budget_category_id: '', estimated: '' }); setAdding(false)
  }
  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Line items (non-vendor costs)</h2>
        {!adding && <button className="linkish" onClick={() => setAdding(true)}>+ Add</button>}
      </div>
      <p className="panel-note">For costs with no vendor — marriage license, favors, DIY decor.</p>
      {adding && (
        <div className="inline-form">
          <input placeholder="Item name" value={f.name} onChange={e => set('name', e.target.value)} autoFocus />
          <select value={f.budget_category_id} onChange={e => set('budget_category_id', e.target.value)}>
            <option value="">Category…</option>
            {d.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" placeholder="Estimated cost" value={f.estimated} onChange={e => set('estimated', e.target.value)} />
          <div className="inline-actions">
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={!f.name.trim()}>Save</button>
          </div>
        </div>
      )}
      {d.items.length === 0 && !adding && <p className="panel-empty">No line items yet.</p>}
      <ul className="candidate-list">
        {d.items.map(i => {
          const cat = d.categories.find(c => c.id === i.budget_category_id)
          return <li key={i.id} className="candidate">
            <div><span className="candidate-label">{i.name}</span>{cat && <span className="candidate-pros">{cat.name}</span>}</div>
            <span className="amount">{money(i.estimated)}</span>
          </li>
        })}
      </ul>
    </div>
  )
}

function Payments({ d }) {
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ name: '', amount: '', due_date: '', budget_category_id: '', vendor_id: '', status: 'Upcoming' })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  async function save() {
    if (!f.amount) return
    await d.actions.addPayment({
      name: f.name || null, amount: Number(f.amount), due_date: f.due_date || null,
      budget_category_id: f.budget_category_id || null, vendor_id: f.vendor_id || null, status: f.status,
    })
    setF({ name: '', amount: '', due_date: '', budget_category_id: '', vendor_id: '', status: 'Upcoming' }); setAdding(false)
  }
  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Payments</h2>
        {!adding && <button className="linkish" onClick={() => setAdding(true)}>+ Add</button>}
      </div>
      {adding && (
        <div className="inline-form">
          <input placeholder="Payment name — e.g. Venue deposit" value={f.name} onChange={e => set('name', e.target.value)} autoFocus />
          <input type="number" placeholder="Amount" value={f.amount} onChange={e => set('amount', e.target.value)} />
          <input type="date" value={f.due_date} onChange={e => set('due_date', e.target.value)} />
          <select value={f.vendor_id} onChange={e => set('vendor_id', e.target.value)}>
            <option value="">Vendor (optional)…</option>
            {d.vendors.filter(v => v.status !== 'Passed').map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select value={f.budget_category_id} onChange={e => set('budget_category_id', e.target.value)}>
            <option value="">Category…</option>
            {d.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="inline-actions">
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={!f.amount}>Save</button>
          </div>
        </div>
      )}
      {d.payments.length === 0 && !adding && <p className="panel-empty">No payments logged. These draw down against your committed total.</p>}
      <ul className="candidate-list">
        {d.payments.map(p => (
          <li key={p.id} className="candidate">
            <div>
              <span className="candidate-label">{p.name || 'Payment'}</span>
              <span className="candidate-pros">{p.due_date ? `due ${shortDate(p.due_date)}` : 'no due date'}</span>
            </div>
            <div className="candidate-actions">
              <span className="amount">{money(p.amount)}</span>
              {p.status === 'Paid'
                ? <span className="pill pill-ok">Paid</span>
                : <button className="btn btn-small btn-ghost" onClick={() => d.actions.markPaid(p.id)}>Mark paid</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
