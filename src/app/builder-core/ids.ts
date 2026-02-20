/**
 * Creates readable unique ids for builder nodes.
 */
export function uid(prefix = 'n'): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/**
 * Normalizes a node id to a safe Formly field key.
 */
export function toFieldKey(id: string): string {
  return `field_${id.replace(/[^a-zA-Z0-9_]/g, '')}`;
}
