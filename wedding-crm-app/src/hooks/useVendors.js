import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export const VENDOR_STATUSES = [
  'Saved', 'Researching', 'Contacted', 'Quote Received',
  'Finalist', 'Selected', 'Contracted', 'Paid', 'Complete',
]

// best cost figure to show: contract > quote > estimate
export function vendorCost(v) {
  if (['Contracted', 'Paid', 'Complete'].includes(v.status) && v.contracted_amount != null) return v.contracted_amount
  if (v.quote_amount != null) return v.quote_amount
  return v.pricing_estimate
}

export function mutualFlag(v) {
  const b = v.brandon_rating, c = v.courtney_rating
  if (b == null || c == null) return null
  if (b === 5 && c === 5) return 'favorite'
  if (Math.abs(b - c) >= 3) return 'discuss'
  return null
}

export function useVendors() {
  const [state, setState] = useState({ loading: true, error: null, vendors: [], categories: [] })

  const load = useCallback(async () => {
    try {
      const wedding = (await supabase.from('wedding').select('id').limit(1).single()).data
      const wid = wedding.id
      const [cats, vends] = await Promise.all([
        supabase.from('vendor_category').select('id, name, is_venue').order('sort_order'),
        supabase.from('vendor')
          .select('*, venue:venue_detail(*), links:vendor_category_link(is_primary, vendor_category(id, name, is_venue))')
          .eq('wedding_id', wid).order('created_at', { ascending: false }),
      ])
      if (cats.error) throw cats.error
      if (vends.error) throw vends.error
      const vendors = (vends.data || []).map(v => {
        const primary = v.links?.find(l => l.is_primary)?.vendor_category
          || v.links?.[0]?.vendor_category || null
        const venue = Array.isArray(v.venue) ? v.venue[0] : v.venue
        const isVenue = !!venue || (v.links || []).some(l => l.vendor_category?.is_venue)
        return { ...v, primaryCategory: primary, venue, isVenue }
      })
      setState({ loading: false, error: null, vendors, categories: cats.data || [], wid })
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: e.message }))
    }
  }, [])

  useEffect(() => { load() }, [load])

  const actions = {
    reload: load,
    async addVendor({ name, categoryId, status }) {
      const { data: v, error } = await supabase.from('vendor')
        .insert({ wedding_id: state.wid, name, status: status || 'Saved' }).select('id').single()
      if (error) throw error
      if (categoryId) {
        await supabase.from('vendor_category_link')
          .insert({ vendor_id: v.id, category_id: categoryId, is_primary: true })
      }
      await load()
      return v.id
    },
    async addVenue({ name, categoryId, detail }) {
      const id = await this.addVendor({ name, categoryId })
      await supabase.from('venue_detail').insert({ vendor_id: id, ...detail })
      await load()
    },
    async updateVendor(id, fields) {
      await supabase.from('vendor').update(fields).eq('id', id)
      await load()
    },
    async updateVenueDetail(vendorId, fields) {
      await supabase.from('venue_detail').upsert({ vendor_id: vendorId, ...fields })
      await load()
    },
  }

  return { ...state, actions }
}
