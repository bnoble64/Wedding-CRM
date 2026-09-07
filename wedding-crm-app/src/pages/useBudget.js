import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { vendorCost } from './useVendors.js'

export const PAYMENT_STATUS = ['Upcoming', 'Due Soon', 'Due', 'Paid', 'Late', 'Cancelled']
export const PAYMENT_TYPE = ['Deposit', 'Installment', 'Final', 'Refund', 'Other']

export function useBudget() {
  const [state, setState] = useState({ loading: true, error: null })

  const load = useCallback(async () => {
    try {
      const wedding = (await supabase.from('wedding').select('*').limit(1).single()).data
      const wid = wedding.id
      const [summary, cats, items, payments, vendors] = await Promise.all([
        supabase.from('budget_summary').select('*').eq('wedding_id', wid).maybeSingle(),
        supabase.from('budget_category').select('*').order('sort_order'),
        supabase.from('budget_item').select('*').eq('wedding_id', wid),
        supabase.from('payment').select('*').eq('wedding_id', wid).order('due_date'),
        supabase.from('vendor').select('id, name, status, pricing_estimate, quote_amount, contracted_amount, budget_category_id').eq('wedding_id', wid),
      ])
      setState({
        loading: false, error: null, wid, wedding,
        summary: summary.data || {}, categories: cats.data || [],
        items: items.data || [], payments: payments.data || [], vendors: vendors.data || [],
      })
    } catch (e) { setState(s => ({ ...s, loading: false, error: e.message })) }
  }, [])
  useEffect(() => { load() }, [load])

  // per-category rollup computed client-side (compute, don't store)
  function categoryRollup() {
    const { categories = [], vendors = [], items = [], payments = [] } = state
    return categories.map(c => {
      const vEst = vendors.filter(v => v.budget_category_id === c.id && v.status !== 'Passed')
        .reduce((s, v) => s + (Number(vendorCost(v)) || 0), 0)
      const iEst = items.filter(i => i.budget_category_id === c.id).reduce((s, i) => s + (Number(i.estimated) || 0), 0)
      const committed = vendors.filter(v => v.budget_category_id === c.id && ['Contracted', 'Paid', 'Complete'].includes(v.status))
        .reduce((s, v) => s + (Number(v.contracted_amount) || 0), 0)
        + items.filter(i => i.budget_category_id === c.id).reduce((s, i) => s + (Number(i.committed) || 0), 0)
      const paid = payments.filter(p => p.budget_category_id === c.id && p.status === 'Paid')
        .reduce((s, p) => s + (Number(p.amount) || 0), 0)
      return { c, estimated: vEst + iEst, committed, paid }
    }).filter(r => r.estimated || r.committed || r.paid || r.c.target_allocation)
  }

  const actions = {
    reload: load,
    async addItem(fields) { await supabase.from('budget_item').insert({ wedding_id: state.wid, ...fields }); await load() },
    async addPayment(fields) { await supabase.from('payment').insert({ wedding_id: state.wid, ...fields }); await load() },
    async markPaid(id) { await supabase.from('payment').update({ status: 'Paid', paid_date: new Date().toISOString().slice(0, 10) }).eq('id', id); await load() },
    async saveBudgetTargets(fields) { await supabase.from('wedding').update(fields).eq('id', state.wid); await load() },
  }
  return { ...state, categoryRollup, actions }
}
