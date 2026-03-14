import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function useTasks() {
  const { user } = useApp()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchTasks()
  }, [user])

  async function fetchTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setTasks(data)
    setLoading(false)
  }

  async function addTask(entry) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...entry, user_id: user.id }])
      .select()
      .single()
    if (error) throw error
    setTasks(prev => [...prev, data])
    return data
  }

  async function updateTask(id, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setTasks(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    // DB cascade handles sub-task deletion; mirror it in local state
    setTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id))
  }

  // Toggles a task's completed state.
  // Completing a parent → auto-completes all its sub-tasks (spec 6.9).
  // Un-completing a parent → only un-completes the parent itself.
  async function toggleTask(id, completed) {
    const now = completed ? new Date().toISOString() : null
    const updates = { completed, completed_at: now }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    const task = tasks.find(t => t.id === id)
    const isParent = task && !task.parent_id

    if (completed && isParent) {
      const subIds = tasks.filter(t => t.parent_id === id).map(t => t.id)
      if (subIds.length > 0) {
        const { data: updatedSubs, error: subErr } = await supabase
          .from('tasks')
          .update({ completed: true, completed_at: now })
          .in('id', subIds)
          .select()
        if (subErr) {
          // Parent is already updated in DB but sub-tasks failed.
          // Resync local state with DB ground truth to avoid UI/DB desync.
          await fetchTasks()
          throw subErr
        }
        setTasks(prev => prev.map(t => {
          if (t.id === id) return data
          return updatedSubs.find(s => s.id === t.id) ?? t
        }))
        return data
      }
    }

    setTasks(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  return { tasks, loading, addTask, updateTask, deleteTask, toggleTask }
}
