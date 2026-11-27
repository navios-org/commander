function distance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) {
    return limit + 1
  }
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        // Two letters typed in the wrong order count once.
        value = Math.min(value, previous[j - 1])
      }
      current.push(value)
      best = Math.min(best, value)
    }
    if (best > limit) {
      return limit + 1
    }
    previous = current
  }
  return previous[b.length]
}

/** The candidate that `input` is most likely a typo of, if any is close. */
export function closest(input: string, candidates: Iterable<string>): string | undefined {
  const limit = Math.max(1, Math.min(3, Math.floor(input.length / 3)))
  let best: string | undefined
  let bestDistance = limit + 1
  for (const candidate of candidates) {
    const d = distance(input, candidate, limit)
    if (d < bestDistance) {
      best = candidate
      bestDistance = d
    }
  }
  return best
}
