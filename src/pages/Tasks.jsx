import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { MAX_LEN } from '../lib/validation'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'

// Sort: high priority first → soonest due date → alphabetical (no due date last)
function sortParentTasks(list) {
  return [...list].sort((a, b) => {
    if (a.priority !== b.priority) return (b.priority ? 1 : 0) - (a.priority ? 1 : 0)
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return a.title.localeCompare(b.title)
  })
}

// Maps days-until-due to a Tailwind color pair.
// 0–2 days → red, fading through orange → amber → yellow → lime → green at 60 days.
function dueDateClasses(diff) {
  if (diff <= 2)  return 'bg-red-100 text-red-600'
  if (diff <= 10) return 'bg-orange-100 text-orange-600'
  if (diff <= 20) return 'bg-amber-100 text-amber-600'
  if (diff <= 35) return 'bg-yellow-100 text-yellow-600'
  if (diff <= 50) return 'bg-lime-100 text-lime-600'
  return 'bg-green-100 text-green-600'
}

function DueDateBadge({ dateStr }) {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24))

  const label =
    diff < 0 ? 'Overdue' :
    diff === 0 ? 'Today' :
    diff === 1 ? 'Tomorrow' :
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${dueDateClasses(diff)}`}>
      {label}
    </span>
  )
}

// Loading skeleton — two placeholder task cards
function TasksSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-gray-200 shrink-0" />
            <div className="h-4 flex-1 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded shrink-0" />
            <div className="h-4 w-12 bg-gray-200 rounded shrink-0" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Empty state icon — clipboard with checkmark
function EmptyIcon() {
  return (
    <svg className="w-12 h-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

export default function Tasks() {
  const { tasks, loading, addTask, updateTask, deleteTask, toggleTask } = useTasks()
  const toast = useToast()

  // Add / Edit task form
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState('personal')
  const [formPriority, setFormPriority] = useState(false)
  const [formDueDate, setFormDueDate] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')

  // Inline add sub-task
  const [addingSubFor, setAddingSubFor] = useState(null)
  const [subTitle, setSubTitle] = useState('')

  // Catalog of Success
  const [showCatalog, setShowCatalog] = useState(false)

  // Delete confirmation — stores { id, title, subCount }
  const [pendingDelete, setPendingDelete] = useState(null)

  // ── 9.5 Search state ──────────────────────────────────────────────────────
  const [search,     setSearch]     = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Active parent tasks with their sub-tasks attached (filtered by search)
  const activeTasks = useMemo(() => {
    const parents = tasks.filter(t => !t.parent_id && !t.completed)
    const withSubs = sortParentTasks(parents).map(parent => ({
      ...parent,
      subTasks: tasks.filter(t => t.parent_id === parent.id),
    }))
    if (!search.trim()) return withSubs
    const q = search.trim().toLowerCase()
    return withSubs.filter(task =>
      task.title.toLowerCase().includes(q) ||
      task.subTasks.some(s => s.title.toLowerCase().includes(q))
    )
  }, [tasks, search])

  // Completed parent tasks sorted by most recently completed (filtered by search)
  const completedTasks = useMemo(() => {
    const parents = tasks.filter(t => !t.parent_id && t.completed)
    const withSubs = [...parents]
      .sort((a, b) => {
        if (a.completed_at && b.completed_at) return b.completed_at.localeCompare(a.completed_at)
        if (a.completed_at) return -1
        if (b.completed_at) return 1
        return 0
      })
      .map(parent => ({
        ...parent,
        subTasks: tasks.filter(t => t.parent_id === parent.id),
      }))
    if (!search.trim()) return withSubs
    const q = search.trim().toLowerCase()
    return withSubs.filter(task =>
      task.title.toLowerCase().includes(q) ||
      task.subTasks.some(s => s.title.toLowerCase().includes(q))
    )
  }, [tasks, search])

  function resetForm() {
    setFormTitle('')
    setFormType('personal')
    setFormPriority(false)
    setFormDueDate('')
    setFormError('')
    setActionError('')
    setShowForm(false)
    setEditingTask(null)
  }

  function startEdit(task) {
    setEditingTask(task)
    setFormTitle(task.title)
    setFormType(task.type)
    setFormPriority(task.priority)
    setFormDueDate(task.due_date || '')
    setFormError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmitTask(e) {
    e.preventDefault()
    setFormError('')
    if (!formTitle.trim()) { setFormError('Title is required.'); return }
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: formTitle.trim(),
          type: formType,
          priority: formPriority,
          due_date: formDueDate || null,
        })
        toast('Task updated.')
      } else {
        await addTask({
          title: formTitle.trim(),
          type: formType,
          priority: formPriority,
          due_date: formDueDate || null,
        })
        toast('Task added.')
      }
      resetForm()
    } catch (err) {
      setFormError(err.message || 'Something went wrong.')
    }
  }

  async function handleAddSubTask(parentId) {
    if (!subTitle.trim()) return
    try {
      await addTask({
        title: subTitle.trim(),
        parent_id: parentId,
        type: 'personal',
        priority: false,
        due_date: null,
      })
      setSubTitle('')
      setAddingSubFor(null)
      toast('Sub-task added.')
    } catch (err) {
      setActionError(err.message || 'Something went wrong.')
      toast(err.message || 'Something went wrong.', 'error')
    }
  }

  async function handleToggle(id, current) {
    try {
      await toggleTask(id, !current)
    } catch (err) {
      setActionError(err.message || 'Something went wrong.')
      toast(err.message || 'Could not update task.', 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id)
      if (editingTask?.id === id) resetForm()
      toast('Task deleted.')
    } catch (err) {
      setActionError(err.message || 'Something went wrong.')
      toast(err.message || 'Could not delete task.', 'error')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mr-auto">Tasks</h1>

        {/* Search icon — visible when tasks exist */}
        {!loading && tasks.filter(t => !t.parent_id).length > 0 && (
          <button
            onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch('') }}
            title="Search tasks"
            className={`relative p-1.5 border rounded-lg transition-colors ${
              showSearch || search
                ? 'border-brand-500 text-brand-600 bg-brand-50'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            {/* Dot badge: search active but panel closed */}
            {search && !showSearch && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full" />
            )}
          </button>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Add Task
          </button>
        )}
      </div>

      {actionError && <p className="text-sm text-red-500 mb-4">{actionError}</p>}

      {/* ── Search expanded row (shown when icon is active) ── */}
      {showSearch && !loading && tasks.filter(t => !t.parent_id).length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            autoFocus
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={() => { setShowSearch(false); setSearch('') }}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── ADD / EDIT TASK FORM (6.7 / 6.8) ── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            {editingTask ? 'Edit Task' : 'New Task'}
          </h2>
          <form onSubmit={handleSubmitTask} className="space-y-4">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="What needs to be done?"
                maxLength={MAX_LEN.title}
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Type · Priority · Due date */}
            <div className="flex gap-5 flex-wrap items-end">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('personal')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      formType === 'personal'
                        ? 'bg-gray-700 text-white border-gray-700'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('paid')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      formType === 'paid'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none pb-1">
                <input
                  type="checkbox"
                  checked={formPriority}
                  onChange={e => setFormPriority(e.target.checked)}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-sm text-gray-700">⚑ High priority</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due date <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={e => setFormDueDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
              >
                {editingTask ? 'Save Changes' : 'Add Task'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── ACTIVE TASK LIST (6.3 – 6.6) ── */}
      {loading ? (
        <TasksSkeleton />
      ) : activeTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 flex flex-col items-center gap-3 text-center">
          {search.trim() ? (
            <>
              <p className="text-gray-500 font-medium text-sm">No active tasks match "{search}".</p>
              <button onClick={() => setSearch('')} className="text-sm text-brand-500 hover:text-brand-700">
                Clear search
              </button>
            </>
          ) : (
            <>
              <EmptyIcon />
              <p className="text-gray-600 font-medium">All clear!</p>
              <p className="text-sm text-gray-400">No active tasks — click "+ Add Task" to get started.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {activeTasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200">

              {/* ── Parent task row (6.4 / 6.8) ── */}
              <div className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggle(task.id, task.completed)}
                  className="w-4 h-4 accent-brand-500 shrink-0 cursor-pointer"
                />

                <span className="flex-1 text-sm font-medium text-gray-800">{task.title}</span>

                {/* Type badge */}
                {task.type === 'paid' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 shrink-0">
                    Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-600 shrink-0">
                    Personal
                  </span>
                )}

                {/* Priority flag */}
                {task.priority && (
                  <span className="text-red-500 shrink-0" title="High priority">⚑</span>
                )}

                {/* Due date badge */}
                <DueDateBadge dateStr={task.due_date} />

                {/* Actions */}
                <button
                  onClick={() => {
                    setAddingSubFor(addingSubFor === task.id ? null : task.id)
                    setSubTitle('')
                  }}
                  className="text-xs text-gray-400 hover:text-brand-600 transition-colors shrink-0"
                  title="Add sub-task"
                >
                  + sub
                </button>
                <button
                  onClick={() => startEdit(task)}
                  className="text-xs text-gray-400 hover:text-brand-600 transition-colors shrink-0"
                  title="Edit task"
                >
                  ✎
                </button>
                <button
                  onClick={() => setPendingDelete({ id: task.id, title: task.title, subCount: task.subTasks.length })}
                  className="text-gray-300 hover:text-red-400 text-xs transition-colors shrink-0"
                  title="Delete task"
                >
                  ✕
                </button>
              </div>

              {/* ── Sub-task rows (6.5) ── */}
              {task.subTasks.length > 0 && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {task.subTasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 pl-11 pr-4 py-2">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggle(sub.id, sub.completed)}
                        className="w-3.5 h-3.5 accent-brand-500 shrink-0 cursor-pointer"
                      />
                      <span className={`flex-1 text-sm ${sub.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {sub.title}
                      </span>
                      <button
                        onClick={() => setPendingDelete({ id: sub.id, title: sub.title, subCount: 0 })}
                        className="text-gray-300 hover:text-red-400 text-xs transition-colors shrink-0"
                        title="Delete sub-task"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Inline add sub-task (6.6) ── */}
              {addingSubFor === task.id && (
                <div className="border-t border-gray-100 pl-11 pr-4 py-2.5 flex gap-2 items-center">
                  <input
                    type="text"
                    value={subTitle}
                    onChange={e => setSubTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddSubTask(task.id) }
                      if (e.key === 'Escape') { setAddingSubFor(null); setSubTitle('') }
                    }}
                    placeholder="Sub-task title..."
                    maxLength={MAX_LEN.title}
                    autoFocus
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubTask(task.id)}
                    className="bg-brand-500 hover:bg-brand-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingSubFor(null); setSubTitle('') }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── CATALOG OF SUCCESS (6.10) ── */}
      {completedTasks.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowCatalog(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-600">
              🏆 Catalog of Success
              <span className="ml-2 text-xs font-normal text-gray-400">
                {completedTasks.length} completed task{completedTasks.length !== 1 ? 's' : ''}
              </span>
            </span>
            <span className="text-gray-400 text-xs">{showCatalog ? '▲' : '▼'}</span>
          </button>

          {showCatalog && (
            <div className="mt-2 space-y-2">
              {completedTasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl border border-gray-200 opacity-70">

                  {/* Completed parent row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => handleToggle(task.id, task.completed)}
                      className="w-4 h-4 accent-brand-500 shrink-0 cursor-pointer"
                      title="Uncheck to restore to active"
                    />

                    <span className="flex-1 text-sm font-medium text-gray-400 line-through">
                      {task.title}
                    </span>

                    {task.type === 'paid' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-600 shrink-0">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-400 shrink-0">
                        Personal
                      </span>
                    )}

                    {task.completed_at && (
                      <span className="text-xs text-gray-400 shrink-0">
                        ✓ {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}

                    <button
                      onClick={() => setPendingDelete({ id: task.id, title: task.title, subCount: task.subTasks.length })}
                      className="text-gray-300 hover:text-red-400 text-xs transition-colors shrink-0"
                      title="Delete task"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Completed sub-tasks */}
                  {task.subTasks.length > 0 && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {task.subTasks.map(sub => (
                        <div key={sub.id} className="flex items-center gap-3 pl-11 pr-4 py-2">
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            readOnly
                            className="w-3.5 h-3.5 accent-brand-500 shrink-0"
                          />
                          <span className="flex-1 text-sm text-gray-400 line-through">
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Delete Task?"
        message={
          pendingDelete
            ? pendingDelete.subCount > 0
              ? `Delete "${pendingDelete.title}" and its ${pendingDelete.subCount} sub-task${pendingDelete.subCount !== 1 ? 's' : ''}? This cannot be undone.`
              : `Delete "${pendingDelete.title}"? This cannot be undone.`
            : ''
        }
        onConfirm={() => {
          handleDelete(pendingDelete.id)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
