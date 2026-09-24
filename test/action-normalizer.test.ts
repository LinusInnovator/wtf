import { describe, it, expect } from 'vitest';
import {
  normalizeActionName,
  isMutationAction,
  isReadAction,
  isShellAction,
  isFinishAction,
  CANONICAL_ACTION_MAP,
} from '../src/core/action-normalizer.js';

describe('Action Normalizer (Phase 9.2)', () => {
  it('correctly maps all known mutation action verbs to MUTATION', () => {
    const mutations = [
      'replace_in_file',
      'replace_file_content',
      'write_file',
      'write_to_file',
      'edit_file',
      'apply_patch',
    ];
    for (const m of mutations) {
      expect(normalizeActionName(m)).toBe('MUTATION');
      expect(isMutationAction(m)).toBe(true);
    }
  });

  it('correctly maps all known read action verbs to READ', () => {
    const reads = ['read_file', 'view_file', 'get_file', 'cat'];
    for (const r of reads) {
      expect(normalizeActionName(r)).toBe('READ');
      expect(isReadAction(r)).toBe(true);
    }
  });

  it('correctly maps all known shell action verbs to SHELL', () => {
    const shells = ['run_command', 'run_shell', 'bash', 'search', 'list_dir', 'ls'];
    for (const s of shells) {
      expect(normalizeActionName(s)).toBe('SHELL');
      expect(isShellAction(s)).toBe(true);
    }
  });

  it('correctly maps all known lifecycle action verbs to FINISH', () => {
    const finishes = ['finish', 'complete', 'exit'];
    for (const f of finishes) {
      expect(normalizeActionName(f)).toBe('FINISH');
      expect(isFinishAction(f)).toBe(true);
    }
  });

  it('is case-insensitive and trims surrounding whitespace', () => {
    expect(normalizeActionName('  REPLACE_IN_FILE  ')).toBe('MUTATION');
    expect(normalizeActionName('View_File')).toBe('READ');
    expect(normalizeActionName('\tRUN_COMMAND\n')).toBe('SHELL');
    expect(normalizeActionName('  FINISH  ')).toBe('FINISH');
  });

  it('strictly fails closed to UNKNOWN for unmapped or invalid verbs', () => {
    expect(normalizeActionName('random_tool')).toBe('UNKNOWN');
    expect(normalizeActionName('delete_everything')).toBe('UNKNOWN');
    expect(normalizeActionName('')).toBe('UNKNOWN');
    expect(normalizeActionName('   ')).toBe('UNKNOWN');
    expect(normalizeActionName(null as any)).toBe('UNKNOWN');
    expect(normalizeActionName(undefined as any)).toBe('UNKNOWN');
  });

  it('preserves frozen dictionary size and completeness', () => {
    expect(Object.keys(CANONICAL_ACTION_MAP).length).toBe(19);
  });
});
