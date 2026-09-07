import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export const TASK_STATUS = ['Not Started', 'Researching', 'In Progress', 'Waiting', 'Needs Decision', 'Blocked', 'Complete', 'Not Applicable']
export const OWNERS = ['Brandon', 'Courtney', 'Both', 'Other']

export function priorityState(t) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (t.status === 'Complete') return 'Complete'
  if (t.status === 'Not Applicable') return 'N/A'
  const due = t.effective_due ? new Date(t.effective_due + 'T00:00:00') : null
  if (!due) return 'Not Yet'
  const start = t.calc_start ? new Date(t.calc_start + 'T00:00:00') : null
  const latest = t.calc_latest ? new Date(t.calc_latest + 'T00:00:00') : due
  const inProgress = ['Researching', 'In Progress', 'Waiting', 'Needs Decision'].includes(t.status)
  const days = x => (x - today) / 86400000
  if (days(latest) < 0) return 'Critical'
  if (days(latest) <= 14) return 'Critical'
  if (inProgress) return 'On Track'
  if (start && today >= start) return 'Needs Attention'
  if (start && days(start) <= 45) return 'Coming Up'
  return 'Not Yet'
}

export function usePlanning() {
  const [state, setState] = useState({ loading: true, error: null, needsMigration: false })

  const load = useCallback(async () => {
    try {
      const wedding = (await supabase.from('wedding').select('id, wedding_date').limit(1).single()).data
      const wid = wedding.id
      const templates = (await supabase.from('planning_template').select('*').eq('wedding_id', wid).order('sort_order')).data || []
      const tv = await supabase.from('v_planning_task').select('*').eq('wedding_id', wid)
      if (tv.error) {
        // view not created yet — fall back to raw tasks, flag for migration
        const raw = await supabase.from('planning_task').select('*').eq('wedding_id', wid)
        setState({ loading: false, error: null, needsMigration: true, wid, wedding, templates, tasks: raw.data || [] })
        return
      }
      setState({ loading: false, error: null, needsMigration: false, wid, wedding, templates, tasks: tv.data || [] })
    } catch (e) { setState(s => ({ ...s, loading: false, error: e.message })) }
  }, [])
  useEffect(() => { load() }, [load])

  const actions = {
    reload: load,
    async activate() {
      const rows = state.templates.map(t => ({
        wedding_id: state.wid, template_id: t.id, title: t.title, description: t.description,
        category: t.category, phase: t.phase, offset_start: t.offset_start,
        offset_target: t.offset_target, offset_latest: t.offset_latest,
        is_auto_generated: true, status: 'Not Started',
      }))
      // chunk inserts to stay well within limits
      for (let i = 0; i < rows.length; i += 50) {
        await supabase.from('planning_task').insert(rows.slice(i, i + 50))
      }
      await load()
    },
    async updateTask(id, fields) { await supabase.from('planning_task').update(fields).eq('id', id); await load() },
    async addTask(fields) { await supabase.from('planning_task').insert({ wedding_id: state.wid, ...fields }); await load() },
  }
  return { ...state, actions }
}
