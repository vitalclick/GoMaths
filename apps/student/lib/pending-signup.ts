/**
 * Holds the short-lived signup ticket between the sign-in screen and
 * /complete-profile.
 *
 * Module-level rather than a route param on purpose: the ticket is a
 * bearer credential, and route params end up in the URL bar and browser
 * history on web. It's also deliberately not persisted — if the app is
 * killed mid-signup the learner just taps the provider button again,
 * which is cheaper than storing a credential we'd have to expire.
 */

export interface PendingSignup {
  signupToken: string;
  email?: string;
  displayName?: string;
  /** ISO timestamp after which the backend will reject the ticket. */
  expiresAt: string;
}

let pending: PendingSignup | null = null;

export function setPendingSignup(next: PendingSignup): void {
  pending = next;
}

export function getPendingSignup(): PendingSignup | null {
  if (pending && Date.parse(pending.expiresAt) <= Date.now()) {
    pending = null;
  }
  return pending;
}

export function clearPendingSignup(): void {
  pending = null;
}
