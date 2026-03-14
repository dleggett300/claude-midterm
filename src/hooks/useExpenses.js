import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function useExpenses() {
  const { user } = useApp()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchExpenses()
  }, [user])

  async function fetchExpenses() {
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    if (!error) setExpenses(data)
    setLoading(false)
  }

  async function addExpense(entry, file) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...entry, user_id: user.id }])
      .select()
      .single()
    if (error) throw error

    if (file) {
      let path
      try {
        path = await _uploadFile(data.id, file)
      } catch (uploadErr) {
        // Upload failed — row saved without receipt, no orphan
        setExpenses(prev => [data, ...prev])
        return data
      }
      const { data: updated, error: err2 } = await supabase
        .from('expenses')
        .update({ receipt_path: path })
        .eq('id', data.id)
        .select()
        .single()
      if (err2) {
        // DB update failed — clean up the orphaned file then surface the error
        await supabase.storage.from('receipts').remove([path])
        throw err2
      }
      setExpenses(prev => [updated, ...prev])
      return updated
    }

    setExpenses(prev => [data, ...prev])
    return data
  }

  async function updateExpense(id, updates) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setExpenses(prev => prev.map(item => item.id === id ? data : item))
    return data
  }

  async function deleteExpense(id, receiptPath) {
    if (receiptPath) {
      const { error: storageErr } = await supabase.storage.from('receipts').remove([receiptPath])
      if (storageErr) throw storageErr
    }
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    setExpenses(prev => prev.filter(item => item.id !== id))
  }

  async function uploadReceipt(id, file) {
    // If the expense already has a receipt with a different extension, delete the old
    // file first — otherwise upsert would leave the old extension as an orphan in storage
    const existing = expenses.find(e => e.id === id)?.receipt_path ?? null
    if (existing) {
      const existingExt = existing.split('.').pop().toLowerCase()
      const newExt = file.name.split('.').pop().toLowerCase()
      if (existingExt !== newExt) {
        await supabase.storage.from('receipts').remove([existing])
      }
    }
    const path = await _uploadFile(id, file)
    const { data, error } = await supabase
      .from('expenses')
      .update({ receipt_path: path })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      await supabase.storage.from('receipts').remove([path])
      throw error
    }
    setExpenses(prev => prev.map(item => item.id === id ? data : item))
    return data
  }

  async function removeReceipt(id, path) {
    const { error: storageErr } = await supabase.storage.from('receipts').remove([path])
    if (storageErr) throw storageErr
    const { data, error } = await supabase
      .from('expenses')
      .update({ receipt_path: null })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setExpenses(prev => prev.map(item => item.id === id ? data : item))
    return data
  }

  async function getReceiptUrl(path) {
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(path, 3600)
    if (error) throw error
    return data.signedUrl
  }

  // Internal — uploads file to Storage, returns the storage path
  async function _uploadFile(expenseId, file) {
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${user.id}/${expenseId}.${ext}`
    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, file, { upsert: true })
    if (error) throw error
    return path
  }

  return { expenses, loading, addExpense, updateExpense, deleteExpense, uploadReceipt, removeReceipt, getReceiptUrl }
}
