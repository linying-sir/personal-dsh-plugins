/**
 * Host half of dsh-wsl-badge.
 *
 * The plugin is browser-only: it injects one stylesheet that restyles the
 * sidebar action owned by dsh-wsl-workspace. This host entry exists because
 * every inserted plugin needs one; it deliberately does nothing.
 */

/** Loader identity. */
export const name = "dsh-wsl-badge";

/** No host services are required. */
export const inject = [];

/** No host behaviour. */
export function apply() {}
