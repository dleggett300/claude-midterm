import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp }   from '../context/AppContext'

export function useSavedCharts() {
  const { user } = useApp()
  const [savedCharts, setSavedCharts] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!user) return
    fetch()
  }, [user])

  async function fetch() {
    setLoading(true)
    const { data, error } = await supabase
      .from('saved_charts')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setSavedCharts(data ?? [])
    setLoading(false)
  }

  async function saveChart(name, config) {
    const { data, error } = await supabase
      .from('saved_charts')
      .insert([{ name: name.trim(), config, user_id: user.id }])
      .select()
      .single()
    if (error) throw error
    setSavedCharts(prev => [data, ...prev])
    return data
  }

  async function deleteChart(id) {
    const { error } = await supabase
      .from('saved_charts')
      .delete()
      .eq('id', id)
    if (error) throw error
    setSavedCharts(prev => prev.filter(c => c.id !== id))
  }

  return { savedCharts, loading, saveChart, deleteChart }
}
