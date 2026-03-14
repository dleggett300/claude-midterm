import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function useIncome() {
  const { user } = useApp()
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchIncome()
  }, [user])

  async function fetchIncome() {
    setLoading(true)
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .order('date', { ascending: false })
    if (!error) setIncome(data)
    setLoading(false)
  }

  async function addIncome(entry) {
    const { data, error } = await supabase
      .from('income')
      .insert([{ ...entry, user_id: user.id }])
      .select()
      .single()
    if (error) throw error
    setIncome(prev => [data, ...prev])
    return data
  }

  async function updateIncome(id, updates) {
    const { data, error } = await supabase
      .from('income')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setIncome(prev => prev.map(item => item.id === id ? data : item))
    return data
  }

  async function deleteIncome(id) {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id)
    if (error) throw error
    setIncome(prev => prev.filter(item => item.id !== id))
  }

  return { income, loading, addIncome, updateIncome, deleteIncome }
}
