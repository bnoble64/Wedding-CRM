import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Loads the dashboard's data. The heavy math (totals, funds available, counts)
// comes from the SQL views, so this hook mostly reads and refetches.
export function useWeddingData() {
  const [state, setState] = useState({ loading: true, error: null })

  const load = useCallback(async () => {
    try {
      const wedding = (await supabase.from('wedding').select('*').limit(1).single()).data
      if (!wedding) throw new Error('No wedding record found. Did the schema run?')
      const wid = wedding.id
      const [budget, guests, dates, contributions] = await Promise.all([
        supabase.from('budget_summary').select('*').eq('wedding_id', wid).maybeSingle(),
        supabase.from('guest_summary').select('*').eq('wedding_id', wid).maybeSingle(),
        supabase.from('potential_date').select('*').eq('wedding_id', wid).order('created_at'),
        supabase.from('contribution').select('*').eq('wedding_id', wid).order('created_at'),
      ])
      setState({
        loading: false, error: null, wedding,
        budget: budget.data || {},
        guests: guests.data || {},
        dates: dates.data || [],
        contributions: contributions.data || [],
      })
    } catch (e) {
      setState({ loading: false, error: e.message })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const actions = {
    reload: load,
    async addPotentialDate(fields) {
      const wid = state.wedding.id
      await supabase.from('potential_date').insert({ wedding_id: wid, ...fields })
      load()
    },
    async removePotentialDate(id) {
      await supabase.from('potential_date').delete().eq('id', id)
      load()
    },
    async setWeddingDate(dateStr) {
      await supabase.from('wedding')
        .update({ wedding_date: dateStr, status_override: 'Early Planning' })
        .eq('id', state.wedding.id)
      await supabase.from('potential_date')
        .update({ is_selected: false }).eq('wedding_id', state.wedding.id)
      load()
    },
    async clearWeddingDate() {
      await supabase.from('wedding')
        .update({ wedding_date: null, status_override: 'Exploration' })
        .eq('id', state.wedding.id)
      load()
    },
    async addContribution(fields) {
      await supabase.from('contribution').insert({ wedding_id: state.wedding.id, ...fields })
      load()
    },
    async saveWeddingFields(fields) {
      await supabase.from('wedding').update(fields).eq('id', state.wedding.id)
      load()
    },
  }

  return { ...state, actions }
}
