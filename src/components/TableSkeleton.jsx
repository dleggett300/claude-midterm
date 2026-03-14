/**
 * Animated loading skeleton for data tables.
 *
 * Props:
 *   rows — number of skeleton rows (default: 3)
 *   cols — number of columns (default: 4)
 *          First column is narrow (date), last is narrow (actions),
 *          middle columns are flex-1.
 */
export default function TableSkeleton({ rows = 3, cols = 4 }) {
  return (
    <div className="animate-pulse" aria-label="Loading data…">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`flex gap-4 px-4 py-3.5 items-center ${
            i > 0 ? 'border-t border-gray-100' : ''
          }`}
        >
          {/* First col — narrow (date) */}
          <div className="h-4 w-20 shrink-0 bg-gray-200 rounded" />

          {/* Middle cols — flexible */}
          {Array.from({ length: Math.max(cols - 2, 1) }).map((_, j) => (
            <div key={j} className="h-4 flex-1 bg-gray-200 rounded" />
          ))}

          {/* Last col — narrow (actions) */}
          {cols >= 2 && (
            <div className="h-4 w-16 shrink-0 ml-auto bg-gray-200 rounded" />
          )}
        </div>
      ))}
    </div>
  )
}
