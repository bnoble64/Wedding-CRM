import { useState } from 'react'
import { usePlanning, priorityState, TASK_STATUS, OWNERS } from '../hooks/usePlanning.js'
import { shortDate, daysUntil } from '../lib/format.js'

const P_TONE = { 'Critical': 'brick', 'Needs Attention': 'brass', 'Coming Up': 'brass', 'On Track': 'sage', 'Complete': 'sage', 'Not Yet': 'grey', 'N/A': 'muted' }

export default function Planning() {
  const d = usePlanning()
  const [adding, setAdding] = useState(false)
  if (d.loading) return <div className="page"><div className="empty">Loading planning…</div></div>
  if (d.error) return <div className="page"><div className="notice notice-error">{d.error}</div></div>

  const exploring = !d.wedding.wedding_date
  const hasTasks = d.tasks.length > 0

  return (
    <div className="page">
      <header className="page-head row">
        <h1 className="display page-title">Planning</h1>
        {hasTasks && !adding && <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Task</button>}
      </header>

      {d.needsMigration && (
        <div className="notice notice-error">
          One quick setup step: the planning date view hasn't been created in Supabase yet, so deadlines can't be
          calculated. Run the v_planning_task snippet (in chat) once, then refresh. Tasks below still work — they just
          won't show computed dates until then.
        </div>
      )}

      {exploring && (
        <div className="empty">
          Your timeline activates once a wedding date is set. {d.templates.length} recommended milestones are ready
          to generate — from booking the venue 12–18 months out to final headcount a few weeks before. Set a date on
          the Dashboard, then come back here to activate.
        </div>
      )}

      {!exploring && !hasTasks && (
        <div className="activate-box">
          <h2 className="display">Activate your planning timeline</h2>
          <p>You've got a date. Generate {d.templates.length} recommended tasks, each with a deadline calculated
          back from {shortDate(d.wedding.wedding_date)}. You can edit, reschedule, or delete any of them after.</p>
          <button className="btn btn-primary" onClick={d.actions.activate}>Activate timeline</button>
        </div>
      )}

      {adding && <AddTask actions={d.actions} onDone={() => setAdding(false)} />}

      {hasTasks && (
        <div className="task-list">
          {[...d.tasks].sort(sortByDue).map(t => {
            const state = priorityState(t)
            const days = daysUntil(t.effective_due)
            return (
              <div key={t.id} className="task-row">
                <span className={'status-badge tone-' + (P_TONE[state] || 'grey')}><span className="sb-dot" />{state}</span>
                <div className="task-main">
                  <span className="task-title">{t.title}</span>
                  <span className="task-meta">
                    {t.phase}{t.effective_due ? ` · ${shortDate(t.effective_due)}` : ''}
                    {days != null && days >= 0 ? ` · ${days}d` : days != null ? ` · ${Math.abs(days)}d ago` : ''}
                  </span>
                </div>
                <select className="task-owner" value={t.owner || ''} onChange={e => d.actions.updateTask(t.id, { owner: e.target.value || null })}>
                  <option value="">Owner…</option>{OWNERS.map(o => <option key={o}>{o}</option>)}
                </select>
                <select className="task-status" value={t.status} onChange={e => d.actions.updateTask(t.id, { status: e.target.value, completed_date: e.target.value === 'Complete' ? new Date().toISOString().slice(0, 10) : null })}>
                  {TASK_STATUS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function sortByDue(a, b) {
  if (!a.effective_due) return 1
  if (!b.effective_due) return -1
  return a.effective_due < b.effective_due ? -1 : 1
}

function AddTask({ actions, onDone }) {
  const [title, setTitle] = useState(''); const [due, setDue] = useState(''); const [owner, setOwner] = useState('')
  async function save() {
    if (!title.trim()) return
    await actions.addTask({ title, manual_due_date: due || null, owner: owner || null, status: 'Not Started' })
    onDone()
  }
  return (
    <div className="inline-form wide">
      <input placeholder="Task" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      <input type="date" value={due} onChange={e => setDue(e.target.value)} />
      <select value={owner} onChange={e => setOwner(e.target.value)}><option value="">Owner…</option>{OWNERS.map(o => <option key={o}>{o}</option>)}</select>
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={!title.trim()}>Save</button>
      </div>
    </div>
  )
}
