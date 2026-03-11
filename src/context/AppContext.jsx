import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'dml-bizcompanion'

const defaultState = {
  income:   [],
  expenses: [],
  receipts: [],
  tasks:    [],
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState
  } catch {
    return defaultState
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [income,   setIncome]   = useState(() => loadFromStorage().income)
  const [expenses, setExpenses] = useState(() => loadFromStorage().expenses)
  const [receipts, setReceipts] = useState(() => loadFromStorage().receipts)
  const [tasks,    setTasks]    = useState(() => loadFromStorage().tasks)

  // Sync all state to localStorage whenever anything changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ income, expenses, receipts, tasks }))
    } catch {
      // localStorage may be full (e.g. large base64 receipts) — fail silently
    }
  }, [income, expenses, receipts, tasks])

  return (
    <AppContext.Provider value={{ income, expenses, receipts, tasks, setIncome, setExpenses, setReceipts, setTasks }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
