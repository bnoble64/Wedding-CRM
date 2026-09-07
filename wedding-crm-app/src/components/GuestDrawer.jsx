import { useState } from 'react'
import { TIERS, RSVP, SIDES } from '../hooks/useGuests.js'

export default function GuestDrawer({ guest, onClose, actions }) {
  const [f, setF] = useState({
    first_name: guest.first_name || '', last_name: guest.last_name || '',
    side: guest.side || 'Both', relationship: guest.relationship || '',
    invitation_tier: guest.invitation_tier || 'Likely', rsvp_status: guest.rsvp_status || 'No Response',
    meal_selection: guest.meal_selection || '', dietary_needs: guest.dietary_needs || '',
    plus_one: guest.plus_one || false, plus_one_name: guest.plus_one_name || '',
    is_child: guest.is_child || false, hotel_needed: guest.hotel_needed || false,
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    await actions.updateGuest(guest.id, {
      ...f, plus_one_name: f.plus_one_name || null, meal_selection: f.meal_selection || null,
      dietary_needs: f.dietary_needs || null, relationship: f.relationship || null,
    })
    setSaving(false); onClose()
  }
  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <span className="display drawer-name-static">{f.first_name} {f.last_name}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="field-grid two">
          <label className="field">First name<input value={f.first_name} onChange={e => set('first_name', e.target.value)} /></label>
          <label className="field">Last name<input value={f.last_name} onChange={e => set('last_name', e.target.value)} /></label>
        </div>
        <div className="field-grid two">
          <label className="field">Side
            <select value={f.side} onChange={e => set('side', e.target.value)}>{SIDES.map(s => <option key={s}>{s}</option>)}</select>
          </label>
          <label className="field">Relationship<input value={f.relationship} onChange={e => set('relationship', e.target.value)} placeholder="Aunt, college friend…" /></label>
        </div>
        <div className="field-grid two">
          <label className="field">Invitation tier
            <select value={f.invitation_tier} onChange={e => set('invitation_tier', e.target.value)}>{TIERS.map(t => <option key={t}>{t}</option>)}</select>
          </label>
          <label className="field">RSVP
            <select value={f.rsvp_status} onChange={e => set('rsvp_status', e.target.value)}>{RSVP.map(r => <option key={r}>{r}</option>)}</select>
          </label>
        </div>
        <div className="field-grid two">
          <label className="field">Meal<input value={f.meal_selection} onChange={e => set('meal_selection', e.target.value)} /></label>
          <label className="field">Dietary needs<input value={f.dietary_needs} onChange={e => set('dietary_needs', e.target.value)} /></label>
        </div>
        <div className="check-row">
          <label><input type="checkbox" checked={f.plus_one} onChange={e => set('plus_one', e.target.checked)} /> Plus-one</label>
          <label><input type="checkbox" checked={f.is_child} onChange={e => set('is_child', e.target.checked)} /> Child</label>
          <label><input type="checkbox" checked={f.hotel_needed} onChange={e => set('hotel_needed', e.target.checked)} /> Needs hotel</label>
        </div>
        {f.plus_one && (
          <label className="field">Plus-one name (leave blank if unknown)
            <input value={f.plus_one_name} onChange={e => set('plus_one_name', e.target.value)} placeholder="TBD" /></label>
        )}
        <div className="drawer-actions">
          <button className="linkish danger" onClick={() => { actions.removeGuest(guest.id); onClose() }}>Remove guest</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </aside>
    </div>
  )
}
