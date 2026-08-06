/**
 * Client-side form validation.
 *
 * These rules exist purely to give the auth UI something real to validate
 * against — there is no auth backend in this build, so nothing here is a
 * security control. Any production deployment must re-validate on the server.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value) {
  if (!value.trim()) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(value.trim())) return "That does not look like a valid email address.";
  return null;
}

export function validatePassword(value, { min = 8 } = {}) {
  if (!value) return "Enter a password.";
  if (value.length < min) return `Use at least ${min} characters.`;
  return null;
}

export function validateConfirmation(password, confirmation) {
  if (!confirmation) return "Re-enter your password.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}

export function validateName(value) {
  if (!value.trim()) return "Enter your name.";
  if (value.trim().length < 2) return "That name looks too short.";
  return null;
}

const STRENGTH_LEVELS = ["weak", "fair", "good", "strong"];

/**
 * Rough password strength, scored 0–4 on length and character variety.
 * A hint for the user, not a policy — the only enforced rule is the minimum
 * length in `validatePassword`.
 */
export function passwordStrength(value) {
  if (!value) return { score: 0, level: null, label: "" };

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;

  const level = STRENGTH_LEVELS[Math.max(0, score - 1)];
  const labels = {
    weak: "Weak — add length or variety",
    fair: "Fair — a longer passphrase would help",
    good: "Good",
    strong: "Strong",
  };

  return { score, level, label: labels[level] ?? "" };
}
