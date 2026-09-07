import { useState } from 'react'
import { useGuests, TIERS, SIDES } from '../hooks/useGuests.js'
import GuestDrawer from '../components/GuestDrawer.jsx'

const TIER_TONE = { 'Must Invite': 'sage', 'Likely': 'brass', 'Maybe': 'grey', 'Backup': 'grey', 'Not Invited': 'muted' }
const RSVP_TONE = { 'Attending': 'sage', 'Declined': 'muted', 'Tentative': 'brass', 'No Response': 'grey' }

export default function Guests() {
  const d = useGuests()
  const [open, setOpen] = useState(null)
  const [addHh, setAddHh] = useState(false)
  const [addGuestTo, setAddGuestTo] = useState(undefined) // household id, or null for solo

  if (d.loading) return <div className="page"><div className="empty">Loading guests…</div></div>
  if (d.error) return <div className="page"><div className="notice notice-error">{d.error}</div></div>

  const s = d.summary
  const solo = d.guests.filter(g => !g.household_id)
  const groups = d.households.map(h => ({ h, members: d.guests.filter(g => g.household_id === h.id) }))

  return (
    <div className="page">
      <header className="page-head row">
        <h1 className="display page-title">Guests</h1>
        {!addHh && <button className="btn btn-primary" onClick={() => setAddHh(true)}>+ Household</button>}
      </header>

      <div className="cards guest-cards">
        <MiniStat n={s.potential ?? d.guests.length} label="Potential" />
        <MiniStat n={s.confirmed_yes ?? 0} label="Attending" />
        <MiniStat n={s.declined ?? 0} label="Declined" />
        <MiniStat n={s.awaiting_rsvp ?? 0} label="Awaiting" />
        <MiniStat n={s.children ?? 0} label="Children" />
      </div>

      {addHh && <AddHousehold actions={d.actions} onDone={() => setAddHh(false)} />}

      {groups.length === 0 && solo.length === 0 && !addHh && (
        <div className="empty">No guests yet. Start with a household (a couple, a family) and add people to it — or add individuals. Set an invitation tier on each so you can shape the list before invites go out.</div>
      )}

      <div className="hh-list">
        {groups.map(({ h, members }) => (
          <section key={h.id} className="hh">
            <div className="hh-head">
              <div>
                <span className="hh-name">{h.name}</span>
                {h.side && <span className="hh-side">{h.side}</span>}
              </div>
              <button className="linkish" onClick={() => setAddGuestTo(h.id)}>+ Person</button>
            </div>
            {members.length === 0 && <p className="hh-empty">No one added yet.</p>}
            <div className="guest-rows">
              {members.map(g => <GuestRow key={g.id} g={g} onClick={() => setOpen(g)} />)}
            </div>
            {addGuestTo === h.id && <AddGuest householdId={h.id} actions={d.actions} onDone={() => setAddGuestTo(undefined)} />}
          </section>
        ))}

        {solo.length > 0 && (
          <section className="hh">
            <div className="hh-head"><span className="hh-name">Individual guests</span></div>
            <div className="guest-rows">{solo.map(g => <GuestRow key={g.id} g={g} onClick={() => setOpen(g)} />)}</div>
          </section>
        )}
      </div>

      <div className="add-solo">
        {addGuestTo === null
          ? <AddGuest householdId={null} actions={d.actions} onDone={() => setAddGuestTo(undefined)} />
          : <button className="linkish" onClick={() => setAddGuestTo(null)}>+ Add an individual guest (no household)</button>}
      </div>

      {open && <GuestDrawer guest={open} actions={d.actions} onClose={() => setOpen(null)} />}
    </div>
  )
}

function MiniStat({ n, label }) {
  return <div className="card ministat"><div className="card-big display">{n}</div><div className="card-note">{label}</div></div>
}

function GuestRow({ g, onClick }) {
  const name = [g.first_name, g.last_name].filter(Boolean).join(' ') || 'Unnamed'
  return (
    <button className="guest-row" onClick={onClick}>
      <span className="g-name">
        {name}
        {g.plus_one && <span className="g-plus" title="Has a plus-one"> +1{g.plus_one_name ? ` (${g.plus_one_name})` : ''}</span>}
      </span>
      <span className="spacer" />
      {g.invitation_tier && <span className={'status-badge tone-' + (TIER_TONE[g.invitation_tier] || 'grey')}><span className="sb-dot" />{g.invitation_tier}</span>}
      <span className={'status-badge tone-' + (RSVP_TONE[g.rsvp_status] || 'grey')}><span className="sb-dot" />{g.rsvp_status}</span>
    </button>
  )
}

function AddHousehold({ actions, onDone }) {
  const [name, setName] = useState(''); const [side, setSide] = useState('Both'); const [busy, setBusy] = useState(false)
  async function save() {
    if (!name.trim()) return
    setBusy(true); await actions.addHousehold({ name, side }); setBusy(false); onDone()
  }
  return (
    <div className="inline-form wide">
      <input placeholder="Household name — e.g. The Williams Family" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <select value={side} onChange={e => setSide(e.target.value)}>{SIDES.map(s => <option key={s}>{s}</option>)}</select>
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={busy || !name.trim()}>Save</button>
      </div>
    </div>
  )
}

function AddGuest({ householdId, actions, onDone }) {
  const [first, setFirst] = useState(''); const [last, setLast] = useState('')
  const [tier, setTier] = useState('Likely'); const [busy, setBusy] = useState(false)
  async function save() {
    if (!first.trim()) return
    setBusy(true)
    await actions.addGuest({ household_id: householdId, first_name: first, last_name: last || null, invitation_tier: tier })
    setBusy(false); onDone()
  }
  return (
    <div className="inline-form wide guest-add">
      <input placeholder="First name" value={first} onChange={e => setFirst(e.target.value)} autoFocus />
      <input placeholder="Last name" value={last} onChange={e => setLast(e.target.value)} />
      <select value={tier} onChange={e => setTier(e.target.value)}>{TIERS.map(t => <option key={t}>{t}</option>)}</select>
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={busy || !first.trim()}>Save</button>
      </div>
    </div>
  )
}
