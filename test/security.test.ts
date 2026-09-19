import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  sanitizeGitRef,
  isPathInside,
  safeGit,
  safeReadRepoFile,
  truncateLineForRegex,
} from '../src/core/security.js';
import { analyzeRepo } from '../src/core/evidence.js';
import { detectAuthChanges } from '../src/detectors/auth.js';
import { detectDatabaseChanges } from '../src/detectors/db.js';
import { detectHygieneIssues } from '../src/detectors/hygiene.js';
import type { FilePatch } from '../src/types.js';

describe('Security & Hardening Audit (AAA Rating)', () => {
  describe('Git Reference Sanitization & Flag Injection Prevention', () => {
    it('allows valid git SHAs and branches', () => {
      expect(sanitizeGitRef('main')).toBe('main');
      expect(sanitizeGitRef('feature/user-auth')).toBe('feature/user-auth');
      expect(sanitizeGitRef('v1.0.0')).toBe('v1.0.0');
      expect(sanitizeGitRef('abc1234')).toBe('abc1234');
      expect(sanitizeGitRef('HEAD~1')).toBe('HEAD~1');
      expect(sanitizeGitRef('main..HEAD')).toBe('main..HEAD');
      expect(sanitizeGitRef('origin/main...HEAD')).toBe('origin/main...HEAD');
      expect(sanitizeGitRef('refs/heads/master')).toBe('refs/heads/master');
    });

    it('rejects flag injection (leading dashes)', () => {
      expect(() => sanitizeGitRef('--upload-pack=evil')).toThrow(/Security violation/);
      expect(() => sanitizeGitRef('-oProxyCommand=calc.exe')).toThrow(/Security violation/);
      expect(() => sanitizeGitRef('--exec=calc.exe')).toThrow(/Security violation/);
      expect(() => sanitizeGitRef('-c')).toThrow(/Security violation/);
    });

    it('rejects shell metacharacters and injection payloads', () => {
      const maliciousRefs = [
        'HEAD; touch /tmp/pwned',
        'HEAD && rm -rf /',
        'HEAD | cat /etc/passwd',
        '$(whoami)',
        '`id`',
        'HEAD\nls',
        'HEAD\0hidden',
        'HEAD > /dev/null',
        'HEAD & sleep 10',
        'HEAD; echo pwned',
        'main//evil',
      ];

      for (const ref of maliciousRefs) {
        expect(() => sanitizeGitRef(ref)).toThrow(/Security violation/);
      }
    });

    it('rejects null byte in git arguments', () => {
      expect(() => safeGit(['status', 'file\0.txt'], process.cwd())).toThrow(
        /null byte detected/
      );
    });
  });

  describe('Path Traversal Prevention', () => {
    const root = '/Users/alice/projects/app';

    it('allows paths within repository boundary', () => {
      expect(isPathInside(root, 'src/index.ts')).toBe(true);
      expect(isPathInside(root, './package.json')).toBe(true);
      expect(isPathInside(root, 'nested/deep/file.js')).toBe(true);
      expect(isPathInside(root, '')).toBe(true);
    });

    it('blocks directory traversal attempts escaping repository root', () => {
      expect(isPathInside(root, '../../etc/passwd')).toBe(false);
      expect(isPathInside(root, '../other-repo')).toBe(false);
      expect(isPathInside(root, '/etc/passwd')).toBe(false);
      expect(isPathInside(root, 'subdir/../../../../etc/shadow')).toBe(false);
    });

    it('safeReadRepoFile strictly refuses to read files outside repo', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-sec-test-'));
      const outsideFile = path.join(os.tmpdir(), 'secret-outside.txt');
      fs.writeFileSync(outsideFile, 'TOP_SECRET_DATA');

      try {
        const result = safeReadRepoFile(tempDir, '../secret-outside.txt');
        expect(result).toBeNull();
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
        if (fs.existsSync(outsideFile)) fs.unlinkSync(outsideFile);
      }
    });
  });

  describe('ReDoS & Massive Line Adversarial Testing', () => {
    it('truncates oversized lines before regex execution', () => {
      const massiveLine = 'a'.repeat(50000);
      const truncated = truncateLineForRegex(massiveLine, 2000);
      expect(truncated.length).toBe(2000);
    });

    it('auth detector handles massive lines without CPU hang', () => {
      const hugeLine = '+' + 'expiresIn = 3600; '.repeat(5000); // ~90KB
      const patch: FilePatch = {
        path: 'src/auth/session.ts',
        hunks: [
          {
            oldStart: 1,
            oldLines: 1,
            newStart: 1,
            newLines: 1,
            lines: [hugeLine],
          },
        ],
        added: 1,
        deleted: 0,
        isMechanical: false,
        status: 'modified',
      };

      const start = Date.now();
      const findings = detectAuthChanges([patch]);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // Under 50ms
      expect(findings.length).toBeGreaterThan(0);
    });

    it('database detector handles adversarial nested regex strings safely', () => {
      // ReDoS pattern testing: valid SQL followed by adversarial whitespace / repetition
      const adversarialLine = '+' + 'DROP TABLE users; ' + '   '.repeat(10000);
      const patch: FilePatch = {
        path: 'db/migration.sql',
        hunks: [
          {
            oldStart: 1,
            oldLines: 1,
            newStart: 1,
            newLines: 1,
            lines: [adversarialLine],
          },
        ],
        added: 1,
        deleted: 0,
        isMechanical: false,
        status: 'modified',
      };

      const start = Date.now();
      const findings = detectDatabaseChanges([patch]);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
      expect(findings.length).toBeGreaterThan(0);
    });

    it('hygiene detector handles adversarial debug strings safely', () => {
      const adversarialLine = '+' + 'console.log('.repeat(1000) + '"test");';
      const patch: FilePatch = {
        path: 'src/service.ts',
        hunks: [
          {
            oldStart: 1,
            oldLines: 1,
            newStart: 1,
            newLines: 1,
            lines: [adversarialLine],
          },
        ],
        added: 1,
        deleted: 0,
        isMechanical: false,
        status: 'modified',
      };

      const start = Date.now();
      const { findings } = detectHygieneIssues([patch]);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Command Injection Protection in analyzeRepo', () => {
    it('safely rejects malicious commit option in analyzeRepo', () => {
      expect(() => {
        analyzeRepo(process.cwd(), { commit: 'HEAD; touch /tmp/fail' });
      }).toThrow(/Security violation/);
    });

    it('safely rejects malicious range option in analyzeRepo', () => {
      expect(() => {
        analyzeRepo(process.cwd(), { range: 'main..HEAD; malicious' });
      }).toThrow(/Security violation/);
    });
  });
});
