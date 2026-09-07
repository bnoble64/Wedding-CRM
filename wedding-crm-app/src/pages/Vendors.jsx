import { useMemo, useState } from 'react'
import { useVendors, VENDOR_STATUSES, vendorCost, mutualFlag } from '../hooks/useVendors.js'
import { money } from '../lib/format.js'
import StatusBadge from '../components/StatusBadge.jsx'
import { RatingDots } from '../components/RatingPicker.jsx'
import VendorDrawer from '../components/VendorDrawer.jsx'

export default function Vendors() {
  const d = useVendors()
  const [filter, setFilter] = useState(null)   // category id or null
  const [open, setOpen] = useState(null)        // vendor being edited
  const [adding, setAdding] = useState(false)

  if (d.loading) return <div className="page"><div className="empty">Loading vendors…</div></div>
  if (d.error) return <div className="page"><div className="notice notice-error">{d.error}</div></div>

  const visible = d.vendors.filter(v =>
    v.status !== 'Passed' && (!filter || v.primaryCategory?.id === filter))

  // pipeline counts across the visible set
  const counts = {}
  visible.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1 })

  return (
    <div className="page">
      <header className="page-head row">
        <h1 className="display page-title">Vendors</h1>
        {!adding && <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Vendor</button>}
      </header>

      {adding && <AddVendor categories={d.categories} actions={d.actions} onDone={() => setAdding(false)} />}

      <div className="chips scroll">
        <button className={'chip' + (!filter ? ' on' : '')} onClick={() => setFilter(null)}>All ({d.vendors.filter(v => v.status !== 'Passed').length})</button>
        {d.categories.map(c => {
          const n = d.vendors.filter(v => v.primaryCategory?.id === c.id && v.status !== 'Passed').length
          if (n === 0) return null
          return <button key={c.id} className={'chip' + (filter === c.id ? ' on' : '')} onClick={() => setFilter(c.id)}>{c.name} ({n})</button>
        })}
      </div>

      <div className="pipeline-strip">
        {VENDOR_STATUSES.map(s => (
          <div key={s} className="pipe-cell">
            <span className="pipe-n">{counts[s] || 0}</span>
            <span className="pipe-s">{s}</span>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="empty">No vendors here yet. Add one to start tracking outreach, quotes, and where each stands.</div>
      )}

      <div className="vendor-table">
        {visible.map(v => {
          const flag = mutualFlag(v)
          return (
            <button key={v.id} className="vendor-row" onClick={() => setOpen(v)}>
              <div className="vr-main">
                <span className="vr-name">
                  {v.name}
                  {flag === 'favorite' && <span className="flag fav" title="Mutual favorite"> ♥</span>}
                  {flag === 'discuss' && <span className="flag disc" title="Needs discussion"> ⚠</span>}
                </span>
                <span className="vr-cat">{v.primaryCategory?.name || 'Uncategorized'}</span>
              </div>
              <StatusBadge status={v.status} />
              <div className="vr-ratings">
                <RatingDots value={v.brandon_rating} />
                <RatingDots value={v.courtney_rating} />
              </div>
              <span className="vr-cost">{vendorCost(v) != null ? money(vendorCost(v)) : '—'}</span>
            </button>
          )
        })}
      </div>

      {open && <VendorDrawer vendor={open} categories={d.categories} actions={d.actions} onClose={() => { setOpen(null); }} />}
    </div>
  )
}

function AddVendor({ categories, actions, onDone }) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) return
    setBusy(true)
    await actions.addVendor({ name, categoryId: categoryId || null })
    setBusy(false); onDone()
  }
  return (
    <div className="inline-form wide">
      <input placeholder="Vendor name" value={name} onChange={e => setName(e.target.value)} autoFocus
        onKeyDown={e => e.key === 'Enter' && save()} />
      <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
        <option value="">Choose category…</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={busy || !name.trim()}>Save</button>
      </div>
    </div>
  )
}
