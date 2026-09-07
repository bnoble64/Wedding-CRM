import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export const TIERS = ['Must Invite', 'Likely', 'Maybe', 'Backup', 'Not Invited']
export const RSVP = ['No Response', 'Attending', 'Declined', 'Tentative']
export const INVITE = ['Not Sent', 'Save the Date Sent', 'Invited']
export const SIDES = ['Brandon', 'Courtney', 'Both']

export function useGuests() {
  const [state, setState] = useState({ loading: true, error: null, households: [], guests: [], summary: {} })

  const load = useCallback(async () => {
    try {
      const wedding = (await supabase.from('wedding').select('id').limit(1).single()).data
      const wid = wedding.id
      const [hh, gs, sum] = await Promise.all([
        supabase.from('household').select('*').eq('wedding_id', wid).order('created_at'),
        supabase.from('guest').select('*').eq('wedding_id', wid).order('created_at'),
        supabase.from('guest_summary').select('*').eq('wedding_id', wid).maybeSingle(),
      ])
      if (gs.error) throw gs.error
      setState({ loading: false, error: null, wid,
        households: hh.data || [], guests: gs.data || [], summary: sum.data || {} })
    } catch (e) { setState(s => ({ ...s, loading: false, error: e.message })) }
  }, [])
  useEffect(() => { load() }, [load])

  const actions = {
    reload: load,
    async addHousehold(fields) {
      const { data, error } = await supabase.from('household')
        .insert({ wedding_id: state.wid, ...fields }).select('id').single()
      if (error) throw error
      await load(); return data.id
    },
    async addGuest(fields) {
      await supabase.from('guest').insert({ wedding_id: state.wid, ...fields })
      await load()
    },
    async updateGuest(id, fields) { await supabase.from('guest').update(fields).eq('id', id); await load() },
    async removeGuest(id) { await supabase.from('guest').delete().eq('id', id); await load() },
    async updateHousehold(id, fields) { await supabase.from('household').update(fields).eq('id', id); await load() },
  }
  return { ...state, actions }
}
