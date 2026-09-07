import { useState } from 'react'
import { useVendors, vendorCost, mutualFlag } from '../hooks/useVendors.js'
import { money } from '../lib/format.js'
import StatusBadge from '../components/StatusBadge.jsx'
import VendorDrawer from '../components/VendorDrawer.jsx'

const bool = b => (b == null ? '—' : b ? 'Yes' : 'No')
const cap = n => (n == null ? '—' : n)

export default function Venues() {
  const d = useVendors()
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(null)
  const [editing, setEditing] = useState(null)   // vendor id whose detail form is open
  const [selected, setSelected] = useState([])   // ids to compare

  if (d.loading) return <div className="page"><div className="empty">Loading venues…</div></div>
  if (d.error) return <div className="page"><div className="notice notice-error">{d.error}</div></div>

  const venues = d.vendors.filter(v => v.isVenue && v.status !== 'Passed')
  const venueCat = d.categories.find(c => c.is_venue)
  const compareSet = venues.filter(v => selected.includes(v.id))

  function toggleCompare(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : (s.length < 5 ? [...s, id] : s))
  }

  return (
    <div className="page">
      <header className="page-head row">
        <h1 className="display page-title">Venues</h1>
        {!adding && <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Venue</button>}
      </header>

      {adding && <AddVenue venueCat={venueCat} actions={d.actions} onDone={() => setAdding(false)} />}

      {venues.length === 0 && !adding && (
        <div className="empty">No venues yet. Add the places you are considering — capacities, cost, and ceremony options — then compare any two to five side by side.</div>
      )}

      {compareSet.length >= 2 && <Comparison venues={compareSet} />}

      <div className="venue-grid">
        {venues.map(v => {
          const flag = mutualFlag(v)
          const det = v.venue || {}
          return (
            <div key={v.id} className={'venue-card' + (selected.includes(v.id) ? ' picked' : '')}>
              <div className="vc-head">
                <button className="vc-name" onClick={() => setOpen(v)}>
                  {v.name}
                  {flag === 'favorite' && <span className="flag fav"> ♥</span>}
                  {flag === 'discuss' && <span className="flag disc"> ⚠</span>}
                </button>
                <label className="vc-compare">
                  <input type="checkbox" checked={selected.includes(v.id)}
                    onChange={() => toggleCompare(v.id)} /> Compare
                </label>
              </div>
              <StatusBadge status={v.status} />
              <dl className="vc-stats">
                <div><dt>Reception</dt><dd>{cap(det.reception_capacity)}</dd></div>
                <div><dt>All-in</dt><dd>{det.estimated_all_in != null ? money(det.estimated_all_in) : (vendorCost(v) != null ? money(vendorCost(v)) : '—')}</dd></div>
                <div><dt>Venue fee</dt><dd>{det.venue_fee != null ? money(det.venue_fee) : '—'}</dd></div>
              </dl>
              <button className="linkish" onClick={() => setEditing(editing === v.id ? null : v.id)}>
                {editing === v.id ? 'Close details' : 'Edit venue details'}
              </button>
              {editing === v.id && <VenueDetailForm vendor={v} actions={d.actions} onDone={() => setEditing(null)} />}
            </div>
          )
        })}
      </div>

      {open && <VendorDrawer vendor={open} categories={d.categories} actions={d.actions} onClose={() => setOpen(null)} />}
    </div>
  )
}

const ROWS = [
  ['Reception capacity', v => cap(v.venue?.reception_capacity)],
  ['Ceremony capacity', v => cap(v.venue?.ceremony_capacity)],
  ['Venue fee', v => v.venue?.venue_fee != null ? money(v.venue.venue_fee) : '—'],
  ['Food minimum', v => v.venue?.food_minimum != null ? money(v.venue.food_minimum) : '—'],
  ['All-in estimate', v => v.venue?.estimated_all_in != null ? money(v.venue.estimated_all_in) : '—'],
  ['Indoor ceremony', v => bool(v.venue?.indoor_ceremony)],
  ['Outdoor ceremony', v => bool(v.venue?.outdoor_ceremony)],
  ['Rain backup', v => bool(v.venue?.rain_backup)],
  ['Parking', v => v.venue?.parking || '—'],
  ['End time', v => v.venue?.event_cutoff_time || '—'],
  ['Brandon', v => v.brandon_rating ?? '—'],
  ['Courtney', v => v.courtney_rating ?? '—'],
]

function Comparison({ venues }) {
  return (
    <section className="panel compare">
      <h2 className="panel-title">Comparing {venues.length} venues</h2>
      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr><th></th>{venues.map(v => <th key={v.id}>{v.name}</th>)}</tr>
          </thead>
          <tbody>
            {ROWS.map(([label, get]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {venues.map(v => <td key={v.id}>{get(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const num = v => (v === '' || v == null ? null : Number(v))

function VenueDetailForm({ vendor, actions, onDone }) {
  const det = vendor.venue || {}
  const [f, setF] = useState({
    ceremony_capacity: det.ceremony_capacity ?? '',
    reception_capacity: det.reception_capacity ?? '',
    venue_fee: det.venue_fee ?? '',
    food_minimum: det.food_minimum ?? '',
    estimated_all_in: det.estimated_all_in ?? '',
    indoor_ceremony: det.indoor_ceremony ?? false,
    outdoor_ceremony: det.outdoor_ceremony ?? false,
    rain_backup: det.rain_backup ?? false,
    parking: det.parking ?? '',
    event_cutoff_time: det.event_cutoff_time ?? '',
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  async function save() {
    await actions.updateVenueDetail(vendor.id, {
      ceremony_capacity: num(f.ceremony_capacity), reception_capacity: num(f.reception_capacity),
      venue_fee: num(f.venue_fee), food_minimum: num(f.food_minimum), estimated_all_in: num(f.estimated_all_in),
      indoor_ceremony: f.indoor_ceremony, outdoor_ceremony: f.outdoor_ceremony, rain_backup: f.rain_backup,
      parking: f.parking || null, event_cutoff_time: f.event_cutoff_time || null,
    })
    onDone()
  }
  return (
    <div className="detail-form">
      <div className="field-grid">
        <label className="field">Ceremony cap<input type="number" value={f.ceremony_capacity} onChange={e => set('ceremony_capacity', e.target.value)} /></label>
        <label className="field">Reception cap<input type="number" value={f.reception_capacity} onChange={e => set('reception_capacity', e.target.value)} /></label>
        <label className="field">Venue fee<input type="number" value={f.venue_fee} onChange={e => set('venue_fee', e.target.value)} /></label>
        <label className="field">Food min<input type="number" value={f.food_minimum} onChange={e => set('food_minimum', e.target.value)} /></label>
        <label className="field">All-in est<input type="number" value={f.estimated_all_in} onChange={e => set('estimated_all_in', e.target.value)} /></label>
        <label className="field">End time<input value={f.event_cutoff_time} onChange={e => set('event_cutoff_time', e.target.value)} placeholder="11 PM" /></label>
        <label className="field">Parking<input value={f.parking} onChange={e => set('parking', e.target.value)} /></label>
      </div>
      <div className="check-row">
        <label><input type="checkbox" checked={f.indoor_ceremony} onChange={e => set('indoor_ceremony', e.target.checked)} /> Indoor ceremony</label>
        <label><input type="checkbox" checked={f.outdoor_ceremony} onChange={e => set('outdoor_ceremony', e.target.checked)} /> Outdoor ceremony</label>
        <label><input type="checkbox" checked={f.rain_backup} onChange={e => set('rain_backup', e.target.checked)} /> Rain backup</label>
      </div>
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>Save details</button>
      </div>
    </div>
  )
}

function AddVenue({ venueCat, actions, onDone }) {
  const [name, setName] = useState('')
  const [reception, setReception] = useState('')
  const [allin, setAllin] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    if (!name.trim()) return
    setBusy(true)
    await actions.addVenue({
      name, categoryId: venueCat?.id || null,
      detail: { reception_capacity: num(reception), estimated_all_in: num(allin) },
    })
    setBusy(false); onDone()
  }
  return (
    <div className="inline-form wide">
      <input placeholder="Venue name" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <input type="number" placeholder="Reception capacity" value={reception} onChange={e => setReception(e.target.value)} />
      <input type="number" placeholder="All-in estimate" value={allin} onChange={e => setAllin(e.target.value)} />
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={busy || !name.trim()}>Save</button>
      </div>
    </div>
  )
}
