/**
 * Reusable confirmation modal — used before every destructive action.
 *
 * Props:
 *   isOpen       — boolean, controls visibility
 *   title        — dialog heading (default: "Are you sure?")
 *   message      — optional body text
 *   confirmLabel — label for the confirm button (default: "Delete")
 *   cancelLabel  — label for the cancel button (default: "Cancel")
 *   onConfirm()  — called when the confirm button is clicked
 *   onCancel()   — called when the cancel button or backdrop is clicked
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
            {title}
          </h2>

          {message && (
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onCancel}
              autoFocus
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
