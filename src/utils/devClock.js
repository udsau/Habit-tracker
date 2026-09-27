// Immediate one-time cleanup to ensure any simulated fake dates or test mode are cleared
try {
  localStorage.removeItem('devFakeToday')
  localStorage.removeItem('devTestMode')
} catch {
  // localStorage unavailable or restricted
}

/**
 * Returns the current date as a standard Date object.
 */
export function getToday() {
  return new Date()
}
