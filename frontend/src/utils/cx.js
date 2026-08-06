/**
 * Minimal class-name joiner. Drops falsy values so conditional classes can be
 * written inline without a `clsx` dependency.
 */
export function cx(...values) {
  return values.filter(Boolean).join(" ");
}
