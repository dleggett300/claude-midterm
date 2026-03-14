import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function useIncomeItems() {
  const { user } = useApp()
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!user) return
    fetchItems()
  }, [user])

  async function fetchItems() {
    const { data, error } = await supabase
      .from('income_items')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setItems(data)
  }

  async function addItem(name, price) {
    const { data, error } = await supabase
      .from('income_items')
      .insert([{ name, price: parseFloat(price), user_id: user.id }])
      .select()
      .single()
    if (error) throw error
    setItems(prev => [...prev, data])
    return data
  }

  async function removeItem(id) {
    const { error } = await supabase
      .from('income_items')
      .delete()
      .eq('id', id)
    if (error) throw error
    setItems(prev => prev.filter(item => item.id !== id))
  }

  return { items, addItem, removeItem }
}
