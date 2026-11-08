/**
 * Host half of dsh-collapse-groups.
 *
 * The plugin is browser-only: it injects one button into the workspace sidebar
 * header and drives the existing group rows. This host entry exists because
 * every inserted plugin needs one; it deliberately does nothing.
 */

/** Loader identity. */
export const name = "dsh-collapse-groups";

/** No host services are required. */
export const inject = [];

/** No host behaviour. */
export function apply() {}
