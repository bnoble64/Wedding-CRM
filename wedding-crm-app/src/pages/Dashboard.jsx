import { useState } from 'react'
import { useWeddingData } from '../hooks/useWeddingData.js'
import { money, longDate, shortDate, daysUntil } from '../lib/format.js'

export default function Dashboard() {
  const d = useWeddingData()
  if (d.loading) return <div className="page"><div className="empty">Loading your wedding…</div></div>
  if (d.error) return <div className="page"><div className="notice notice-error">{d.error}</div></div>

  const { wedding, budget, guests, dates, contributions, actions } = d
  const exploring = !wedding.wedding_date
  const countdown = daysUntil(wedding.wedding_date)

  // Foundational-decision progress for Exploration Mode (computed from what's set).
  const foundations = [
    ['Comfortable budget', wedding.budget_target != null],
    ['Maximum budget', wedding.budget_ceiling != null],
    ['Target guest count', wedding.target_guest_count != null],
    ['Preferred season', !!wedding.season_preference],
    ['Geographic area', !!wedding.geographic_preference],
    ['Wedding style', !!wedding.style],
  ]
  const done = foundations.filter(f => f[1]).length

  return (
    <div className="page">
      <header className="hero">
        <p className="hero-eyebrow">{exploring ? 'Exploration mode' : (wedding.status_override || 'Planning')}</p>
        <h1 className="display hero-title">{wedding.couple_names || 'Your Wedding'}</h1>
        <p className="hero-sub">
          {exploring
            ? 'No date yet — the goal right now is to decide the shape of the day.'
            : `The plan is in motion. Here is what matters right now.`}
        </p>
      </header>

      <section className="cards">
        <Card label="Wedding date">
          {exploring
            ? <><div className="card-big display">TBD</div><div className="card-note">Set one from a candidate below</div></>
            : <><div className="card-big display">{shortDate(wedding.wedding_date)}</div>
                <button className="linkish" onClick={actions.clearWeddingDate}>Back to exploring</button></>}
        </Card>

        <Card label="Countdown">
          {exploring
            ? <div className="card-quiet">Starts once a date is set</div>
            : <><div className="card-big display">{countdown}</div><div className="card-note">days to go</div></>}
        </Card>

        <Card label="Budget">
          <div className="card-big display">{money(budget.funds_available)}</div>
          <div className="card-note">available · {money(budget.estimated_total)} estimated</div>
          <div className="ledger">
            <span>Committed {money(budget.committed_total)}</span>
            <span>Paid {money(budget.paid_total)}</span>
          </div>
          {Number(budget.contributions_received) > 0 &&
            <div className="card-note gift">Includes {money(budget.contributions_received)} in gifts</div>}
        </Card>

        <Card label="Guests">
          <div className="card-big display">{guests.potential ?? 0}</div>
          <div className="card-note">
            {exploring
              ? `${wedding.target_guest_count ?? '—'} target`
              : `${guests.confirmed_yes ?? 0} yes · ${guests.awaiting_rsvp ?? 0} awaiting`}
          </div>
        </Card>
      </section>

      <section className="phase">
        <div className="phase-row">
          <span className="phase-label">{exploring ? 'Foundations' : 'Current phase'}</span>
          <span className="phase-count">{done} of {foundations.length} set</span>
        </div>
        <div className="bar"><div className="bar-fill" style={{ width: `${(done / foundations.length) * 100}%` }} /></div>
        <ul className="foundation-list">
          {foundations.map(([label, ok]) => (
            <li key={label} className={ok ? 'ok' : ''}><span className="dot" />{label}</li>
          ))}
        </ul>
      </section>

      <div className="two-col">
        <PotentialDates dates={dates} exploring={exploring} actions={actions} />
        <Funding contributions={contributions} budget={budget} actions={actions} />
      </div>
    </div>
  )
}

function Card({ label, children }) {
  return (
    <div className="card">
      <p className="card-label">{label}</p>
      {children}
    </div>
  )
}

function PotentialDates({ dates, exploring, actions }) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [pros, setPros] = useState('')

  async function add() {
    if (!label.trim()) return
    await actions.addPotentialDate({ label, specific_date: date || null, pros: pros || null })
    setLabel(''); setDate(''); setPros(''); setAdding(false)
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Potential dates</h2>
        {!adding && <button className="linkish" onClick={() => setAdding(true)}>+ Add</button>}
      </div>

      {adding && (
        <div className="inline-form">
          <input placeholder="Label — e.g. Fall 2027" value={label} onChange={e => setLabel(e.target.value)} autoFocus />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <input placeholder="Why it appeals (optional)" value={pros} onChange={e => setPros(e.target.value)} />
          <div className="inline-actions">
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add} disabled={!label.trim()}>Save</button>
          </div>
        </div>
      )}

      {dates.length === 0 && !adding && (
        <p className="panel-empty">No candidates yet. Add a few seasons or specific dates you are weighing.</p>
      )}

      <ul className="candidate-list">
        {dates.map(pd => (
          <li key={pd.id} className="candidate">
            <div>
              <span className="candidate-label">{pd.label}</span>
              {pd.specific_date && <span className="candidate-date">{longDate(pd.specific_date)}</span>}
              {pd.pros && <span className="candidate-pros">{pd.pros}</span>}
            </div>
            <div className="candidate-actions">
              {pd.specific_date && exploring &&
                <button className="btn btn-small btn-primary" onClick={() => actions.setWeddingDate(pd.specific_date)}>Set as date</button>}
              <button className="linkish danger" onClick={() => actions.removePotentialDate(pd.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Funding({ contributions, budget, actions }) {
  const [adding, setAdding] = useState(false)
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('Pledged')

  async function add() {
    if (!source.trim() || !amount) return
    await actions.addContribution({ source_label: source, amount: Number(amount), status })
    setSource(''); setAmount(''); setStatus('Pledged'); setAdding(false)
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Gifted budget</h2>
        {!adding && <button className="linkish" onClick={() => setAdding(true)}>+ Add</button>}
      </div>

      <p className="panel-note">
        Received {money(budget.contributions_received)} · pledged {money(budget.contributions_pledged)}.
        Pledged gifts do not raise spending power until they land.
      </p>

      {adding && (
        <div className="inline-form">
          <input placeholder="Source — e.g. Courtney's parents" value={source} onChange={e => setSource(e.target.value)} autoFocus />
          <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option>Pledged</option>
            <option>Received</option>
          </select>
          <div className="inline-actions">
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add} disabled={!source.trim() || !amount}>Save</button>
          </div>
        </div>
      )}

      {contributions.length === 0 && !adding && (
        <p className="panel-empty">No gifts logged yet.</p>
      )}

      <ul className="candidate-list">
        {contributions.map(c => (
          <li key={c.id} className="candidate">
            <div>
              <span className="candidate-label">{c.source_label}</span>
              <span className="candidate-pros">{c.type}</span>
            </div>
            <div className="candidate-actions">
              <span className="amount">{money(c.amount)}</span>
              <span className={'pill ' + (c.status === 'Received' ? 'pill-ok' : 'pill-soon')}>{c.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
