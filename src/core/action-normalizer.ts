/**
 * WTF Action Normalization Engine (Phase 9.2 / Protocol v0.2)
 *
 * Deterministically classifies and maps heterogeneous tool invocation names and action verbs
 * (from various agent harnesses, models, and protocols) into canonical WTF action classes:
 * - MUTATION
 * - READ
 * - SHELL
 * - FINISH
 * - UNKNOWN
 *
 * Epistemic Invariants:
 * 1. Pure static string table lookup.
 * 2. Zero heuristic or model-driven guessing.
 * 3. Any unmapped or unknown tool verb evaluates strictly to 'UNKNOWN'.
 */

export type CanonicalActionClass = 'MUTATION' | 'READ' | 'SHELL' | 'FINISH' | 'UNKNOWN';

export const CANONICAL_ACTION_MAP: Readonly<Record<string, CanonicalActionClass>> = Object.freeze({
  // Mutation actions
  'replace_in_file': 'MUTATION',
  'replace_file_content': 'MUTATION',
  'write_file': 'MUTATION',
  'write_to_file': 'MUTATION',
  'edit_file': 'MUTATION',
  'apply_patch': 'MUTATION',

  // Read / View actions
  'read_file': 'READ',
  'view_file': 'READ',
  'get_file': 'READ',
  'cat': 'READ',

  // Shell / Navigation actions
  'run_command': 'SHELL',
  'run_shell': 'SHELL',
  'bash': 'SHELL',
  'search': 'SHELL',
  'list_dir': 'SHELL',
  'ls': 'SHELL',

  // Lifecycle actions
  'finish': 'FINISH',
  'complete': 'FINISH',
  'exit': 'FINISH',
});

/**
 * Maps any raw tool verb or action string to its canonical WTF action class.
 * Case-insensitive, whitespace-trimmed. Unmapped strings return 'UNKNOWN'.
 */
export function normalizeActionName(rawAction: string | null | undefined): CanonicalActionClass {
  if (!rawAction || typeof rawAction !== 'string') {
    return 'UNKNOWN';
  }
  const norm = rawAction.trim().toLowerCase();
  return CANONICAL_ACTION_MAP[norm] ?? 'UNKNOWN';
}

export function isMutationAction(rawAction: string | null | undefined): boolean {
  return normalizeActionName(rawAction) === 'MUTATION';
}

export function isReadAction(rawAction: string | null | undefined): boolean {
  return normalizeActionName(rawAction) === 'READ';
}

export function isShellAction(rawAction: string | null | undefined): boolean {
  return normalizeActionName(rawAction) === 'SHELL';
}

export function isFinishAction(rawAction: string | null | undefined): boolean {
  return normalizeActionName(rawAction) === 'FINISH';
}
