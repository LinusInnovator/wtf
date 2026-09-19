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
  sanitizeForTerminal,
} from '../src/core/security.js';
import { analyzeRepo } from '../src/core/evidence.js';
import { detectAuthChanges } from '../src/detectors/auth.js';
import { detectDatabaseChanges } from '../src/detectors/db.js';
import { detectHygieneIssues } from '../src/detectors/hygiene.js';
import type { FilePatch } from '../src/types.js';

describe('Security & Hardening Audit', () => {
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

    it('blocks symlinks pointing outside the repository', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-symlink-test-'));
      const outsideFile = path.join(os.tmpdir(), 'outside-secret.env');
      fs.writeFileSync(outsideFile, 'SECRET_KEY=12345');

      const linkPath = path.join(tempDir, 'symlink-to-outside');
      try {
        fs.symlinkSync(outsideFile, linkPath);

        // isPathInside must detect that link target escapes tempDir
        expect(isPathInside(tempDir, 'symlink-to-outside')).toBe(false);

        // safeReadRepoFile must refuse to read the symlink
        const content = safeReadRepoFile(tempDir, 'symlink-to-outside');
        expect(content).toBeNull();
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
        if (fs.existsSync(outsideFile)) fs.unlinkSync(outsideFile);
      }
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

  describe('Malicious Git Configuration Neutralization', () => {
    it('neutralizes malicious diff.external and core.fsmonitor', () => {
      const tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-git-config-test-'));
      const markerFile = path.join(os.tmpdir(), 'wtf-pwned-marker.txt');
      if (fs.existsSync(markerFile)) fs.unlinkSync(markerFile);

      try {
        // Initialize git repo
        safeGit(['init'], tempRepo);
        safeGit(['config', 'user.email', 'test@example.com'], tempRepo);
        safeGit(['config', 'user.name', 'Test'], tempRepo);

        // Configure malicious fsmonitor and diff driver
        safeGit(['config', 'core.fsmonitor', `touch "${markerFile}" && false`], tempRepo);
        safeGit(['config', 'diff.external', `touch "${markerFile}" && false`], tempRepo);

        // Create a file and commit
        fs.writeFileSync(path.join(tempRepo, 'file.txt'), 'line 1\n');
        safeGit(['add', '.'], tempRepo);
        safeGit(['commit', '-m', 'init'], tempRepo);

        // Modify file
        fs.writeFileSync(path.join(tempRepo, 'file.txt'), 'line 1\nline 2\n');

        // Execute safeGit status and diff
        safeGit(['status', '--porcelain'], tempRepo);
        safeGit(['diff', 'HEAD'], tempRepo);

        // Verify marker file was NEVER created
        expect(fs.existsSync(markerFile)).toBe(false);
      } finally {
        fs.rmSync(tempRepo, { recursive: true, force: true });
        if (fs.existsSync(markerFile)) fs.unlinkSync(markerFile);
      }
    });

    it('neutralizes malicious git smudge and textconv filters via cat-file and diff guards', () => {
      const tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-filter-test-'));
      const markerFile = path.join(os.tmpdir(), 'wtf-filter-marker.txt');
      if (fs.existsSync(markerFile)) fs.unlinkSync(markerFile);

      try {
        safeGit(['init'], tempRepo);
        safeGit(['config', 'user.email', 'test@example.com'], tempRepo);
        safeGit(['config', 'user.name', 'Test'], tempRepo);

        // Configure malicious smudge and textconv filter
        safeGit(['config', 'filter.evil.smudge', `touch "${markerFile}" && cat`], tempRepo);
        safeGit(['config', 'diff.evil.textconv', `touch "${markerFile}" && cat`], tempRepo);
        fs.writeFileSync(path.join(tempRepo, '.gitattributes'), '* filter=evil diff=evil\n');

        fs.writeFileSync(path.join(tempRepo, 'package.json'), '{"name":"test"}\n');
        safeGit(['add', '.'], tempRepo);
        safeGit(['commit', '-m', 'init'], tempRepo);

        // cat-file -p must read the raw blob without invoking smudge filter
        const catRes = safeGit(['cat-file', '-p', 'HEAD:package.json'], tempRepo);
        expect(catRes.status).toBe(0);
        expect(catRes.stdout).toContain('"name":"test"');

        // diff must not invoke textconv
        safeGit(['diff', 'HEAD'], tempRepo);

        // Verify marker file was NEVER created
        expect(fs.existsSync(markerFile)).toBe(false);
      } finally {
        fs.rmSync(tempRepo, { recursive: true, force: true });
        if (fs.existsSync(markerFile)) fs.unlinkSync(markerFile);
      }
    });
  });

  describe('Terminal Injection & Control Sequence Sanitization', () => {
    it('strips ANSI cursor escape sequences and line clear codes', () => {
      const malicious = '\x1b[3A\x1b[2K✓ tests passed\x1b[0m';
      const sanitized = sanitizeForTerminal(malicious);
      expect(sanitized).toBe('✓ tests passed');
      expect(sanitized.includes('\x1b')).toBe(false);
    });

    it('strips OSC hyperlink and title sequences', () => {
      const oscHyperlink = '\x1b]8;;http://evil.com\x07Click\x1b]8;;\x07';
      const sanitized = sanitizeForTerminal(oscHyperlink);
      expect(sanitized).toBe('Click');
      expect(sanitized.includes('evil.com')).toBe(false);
    });

    it('strips Unicode Bidi override characters (Trojan Source)', () => {
      // \u202E is Right-to-Left Override
      const bidiMalicious = 'access_level = "user"\u202E; // admin check';
      const sanitized = sanitizeForTerminal(bidiMalicious);
      expect(sanitized).toBe('access_level = "user"; // admin check');
      expect(sanitized.includes('\u202E')).toBe(false);
    });

    it('strips carriage returns that could overwrite lines', () => {
      const crMalicious = 'PAY ATTENTION\rFAKE VERIFIED';
      const sanitized = sanitizeForTerminal(crMalicious);
      expect(sanitized).toBe('PAY ATTENTIONFAKE VERIFIED');
      expect(sanitized.includes('\r')).toBe(false);
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
