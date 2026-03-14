// Matches postgres numeric(10,2) ceiling — prevents error 22003
export const MAX_AMOUNT = 99_999_999.99

// UX character caps for text inputs
// (all DB string columns use `text` type with no length limit,
//  but these guards keep data reasonable and prevent 22001 on any future varchar migrations)
export const MAX_LEN = {
  title:       255,  // task titles, expense descriptions
  description: 255,  // custom item description
  notes:       1000, // notes textareas
  serviceName: 100,  // income_items.name
}

/**
 * Validates a currency amount value.
 * @param {string|number} value
 * @param {string} label  — field name used in the error message
 * @returns {string|null} error message, or null if valid
 */
export function validateAmount(value, label = 'Amount') {
  if (value === '' || value === null || value === undefined)
    return `${label} is required.`
  const n = Number(value)
  if (isNaN(n))    return `${label} must be a number.`
  if (n < 0)       return `${label} cannot be negative.`
  if (n > MAX_AMOUNT) return `${label} cannot exceed $99,999,999.99.`
  return null
}
