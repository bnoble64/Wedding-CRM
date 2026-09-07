import { useState } from 'react'
import { VENDOR_STATUSES } from '../hooks/useVendors.js'
import { RatingPicker } from './RatingPicker.jsx'

const numOrNull = v => (v === '' || v == null ? null : Number(v))

export default function VendorDrawer({ vendor, categories, onClose, actions }) {
  const [f, setF] = useState({
    name: vendor.name || '',
    status: vendor.status,
    brandon_rating: vendor.brandon_rating,
    courtney_rating: vendor.courtney_rating,
    pricing_estimate: vendor.pricing_estimate ?? '',
    quote_amount: vendor.quote_amount ?? '',
    contracted_amount: vendor.contracted_amount ?? '',
    website: vendor.website ?? '',
    location: vendor.location ?? '',
    notes: vendor.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  async function save() {
    setSaving(true)
    await actions.updateVendor(vendor.id, {
      name: f.name,
      status: f.status,
      brandon_rating: f.brandon_rating,
      courtney_rating: f.courtney_rating,
      pricing_estimate: numOrNull(f.pricing_estimate),
      quote_amount: numOrNull(f.quote_amount),
      contracted_amount: numOrNull(f.contracted_amount),
      website: f.website || null,
      location: f.location || null,
      notes: f.notes || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <input className="drawer-name" value={f.name} onChange={e => set('name', e.target.value)} />
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="drawer-cat">{vendor.primaryCategory?.name || 'Uncategorized'}</p>

        <label className="field">Status
          <select value={f.status} onChange={e => set('status', e.target.value)}>
            {VENDOR_STATUSES.map(s => <option key={s}>{s}</option>)}
            <option>Passed</option>
          </select>
        </label>

        <div className="ratings-row">
          <RatingPicker label="Brandon" value={f.brandon_rating} onChange={v => set('brandon_rating', v)} />
          <RatingPicker label="Courtney" value={f.courtney_rating} onChange={v => set('courtney_rating', v)} />
        </div>

        <div className="field-grid">
          <label className="field">Estimate
            <input type="number" value={f.pricing_estimate} onChange={e => set('pricing_estimate', e.target.value)} placeholder="0" />
          </label>
          <label className="field">Quote
            <input type="number" value={f.quote_amount} onChange={e => set('quote_amount', e.target.value)} placeholder="0" />
          </label>
          <label className="field">Contracted
            <input type="number" value={f.contracted_amount} onChange={e => set('contracted_amount', e.target.value)} placeholder="0" />
          </label>
        </div>

        <label className="field">Website
          <input value={f.website} onChange={e => set('website', e.target.value)} placeholder="https://" />
        </label>
        <label className="field">Location
          <input value={f.location} onChange={e => set('location', e.target.value)} />
        </label>
        <label className="field">Notes
          <textarea rows={4} value={f.notes} onChange={e => set('notes', e.target.value)} />
        </label>

        <div className="drawer-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </aside>
    </div>
  )
}
