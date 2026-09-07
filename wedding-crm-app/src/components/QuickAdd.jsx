import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

// A fast capture modal. Wired for the record types that are live today;
// the rest are listed so the shape is visible and easy to extend.
const TYPES = [
  { key: 'vendor', label: 'Vendor', live: true },
  { key: 'idea', label: 'Idea', live: true },
  { key: 'decision', label: 'Decision', live: true },
  { key: 'venue', label: 'Venue', live: false },
  { key: 'task', label: 'Task', live: false },
  { key: 'guest', label: 'Guest', live: false },
  { key: 'payment', label: 'Payment', live: false },
  { key: 'event', label: 'Event', live: false },
]

export default function QuickAdd({ onClose }) {
  const [type, setType] = useState('vendor')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const current = TYPES.find(t => t.key === type)

  async function save() {
    if (!name.trim()) return
    setBusy(true); setError(null)
    const { data: w } = await supabase.from('wedding').select('id').limit(1).single()
    const wedding_id = w?.id
    let res
    if (type === 'vendor') res = await supabase.from('vendor').insert({ wedding_id, name })
    else if (type === 'idea') res = await supabase.from('idea').insert({ wedding_id, name })
    else if (type === 'decision') res = await supabase.from('decision').insert({ wedding_id, title: name })
    if (res?.error) { setError(res.error.message); setBusy(false); return }
    onClose(true)
  }

  return (
    <div className="modal-scrim" onClick={() => onClose(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="display modal-title">Quick add</h2>
        <div className="chips">
          {TYPES.map(t => (
            <button key={t.key}
              className={'chip' + (type === t.key ? ' on' : '') + (t.live ? '' : ' soon')}
              onClick={() => t.live && setType(t.key)}
              disabled={!t.live}
              title={t.live ? '' : 'Coming soon'}>
              {t.label}
            </button>
          ))}
        </div>
        <label className="modal-field">{current.label} name
          <input value={name} onChange={e => setName(e.target.value)} autoFocus
            onKeyDown={e => e.key === 'Enter' && save()} placeholder={`New ${current.label.toLowerCase()}…`} />
        </label>
        {error && <div className="notice notice-error">{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => onClose(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy || !name.trim()}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
