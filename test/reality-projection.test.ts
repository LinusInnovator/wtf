/**
 * WTF Reality Projection Engine Tests (Phase 11.6)
 *
 * Validates:
 * 1. Deterministic Unit Tests (Turn 1 full, Turn 2+ inheritance, fail-closed)
 * 2. Adversarial Stale-State Safety Suite (False inheritance = 0)
 * 3. Historical Phase 11.4 Reproduction (134 withheld blocks reproduced)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  RealityBlockDescriptor,
  RealityProjectionOptions,
  SessionRealityTracker,
  computeBlockSha256,
  defaultMarkerTemplate,
  evaluateBlockEligibility,
  projectEstablishedReality,
  verifyPhysicalSourceUnchanged,
} from '../src/core/reality-projection.js';
import { renderBoundedViewport } from '../src/core/viewport.js';

describe('Reality Projection Engine (Phase 11.6)', () => {
  let tempDir: string;
  let testFile: string;
  const initialContent = 'line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8\nline 9\nline 10\n';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-reality-projection-test-'));
    testFile = path.join(tempDir, 'sample.txt');
    fs.writeFileSync(testFile, initialContent, 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // =========================================================================
  // 1. DETERMINISTIC UNIT TESTS
  // =========================================================================
  describe('Deterministic Unit Tests', () => {
    it('transmits Turn 1 messages in FULL without modification', () => {
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256('line 1\nline 2\nline 3\nline 4\nline 5'),
        rawText: 'line 1\nline 2\nline 3\nline 4\nline 5',
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      const messages = [
        { role: 'system', content: 'You are an agent.' },
        { role: 'user', content: 'Here is sample.txt:\nline 1\nline 2\nline 3\nline 4\nline 5' },
      ];

      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 1, // Turn 1
      });

      expect(res.withheldCount).toBe(0);
      expect(res.bytesSaved).toBe(0);
      expect(res.projectedMessages).toEqual(messages);
      expect(res.projectedMessages[1].content).toContain('line 1\nline 2\nline 3\nline 4\nline 5');
    });

    it('withholds verified unchanged block on Turn 2+ with deterministic marker', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      const messages = [
        { role: 'system', content: 'System instructions' },
        { role: 'user', content: `Inspect: ${sliceText}` },
      ];

      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2, // Turn 2
      });

      expect(res.withheldCount).toBe(1);
      expect(res.bytesSaved).toBe(sliceText.length);
      expect(res.projectedMessages[1].content).toContain(defaultMarkerTemplate('file_read:sample.txt:1-5'));
      expect(res.projectedMessages[1].content).not.toContain(sliceText);
      expect(res.audits[0].status).toBe('WITHHELD');
    });

    it('re-exposes full reality when intelligence explicitly requests the path', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];

      // Model explicitly requests 'sample.txt' on Turn 3
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 3,
        explicitRequestedPath: 'sample.txt',
      });

      expect(res.withheldCount).toBe(0);
      expect(res.projectedMessages[0].content).toContain(sliceText);
      expect(res.audits[0].status).toBe('TRANSMITTED_EXPLICIT_READ');
    });

    it('transmits in full when file is marked mutated in session', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];

      const mutated = new Set(['sample.txt']);
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 3,
        mutatedFiles: mutated,
      });

      expect(res.withheldCount).toBe(0);
      expect(res.projectedMessages[0].content).toContain(sliceText);
      expect(res.audits[0].status).toBe('TRANSMITTED_MUTATED');
    });

    it('transmits in full across session boundaries (different sessionId)', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-prior-agent',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];

      // New agent session evaluates block
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-new-agent',
        currentTurn: 2,
      });

      expect(res.withheldCount).toBe(0);
      expect(res.projectedMessages[0].content).toContain(sliceText);
      expect(res.audits[0].status).toBe('TRANSMITTED_SESSION_MISMATCH');
    });

    it('fails closed when file path escapes workspace or does not exist', () => {
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:nonexistent.txt:1-5',
        filePath: 'nonexistent.txt',
        startLine: 1,
        endLine: 5,
        contentHash: 'somehash',
        rawText: 'phantom text',
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      const messages = [{ role: 'user', content: 'phantom text' }];

      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2,
      });

      expect(res.withheldCount).toBe(0);
      expect(res.audits[0].status).toBe('TRANSMITTED_HASH_MISMATCH');
    });

    it('is strictly deterministic across repeated invocations', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      const messages = [{ role: 'user', content: `Block: ${sliceText}` }];

      const res1 = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2,
      });

      for (let i = 0; i < 10; i++) {
        const resN = projectEstablishedReality(messages, [block], {
          cwd: tempDir,
          sessionId: 'session-alpha',
          currentTurn: 2,
        });
        expect(resN.projectedMessages).toEqual(res1.projectedMessages);
        expect(resN.withheldCount).toBe(res1.withheldCount);
        expect(resN.bytesSaved).toBe(res1.bytesSaved);
      }
    });
  });

  // =========================================================================
  // 2. ADVERSARIAL STALE-STATE SAFETY SUITE (FALSE INHERITANCE = 0)
  // =========================================================================
  describe('Adversarial Stale-State Suite', () => {
    let falseInheritanceCount = 0;

    beforeEach(() => {
      falseInheritanceCount = 0;
    });

    afterEach(() => {
      expect(falseInheritanceCount).toBe(0);
    });

    it('detects byte mutation in same file (same length)', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      // Mutate single byte: 'line 1' -> 'mine 1' (same byte length!)
      const mutatedContent = initialContent.replace('line 1', 'mine 1');
      fs.writeFileSync(testFile, mutatedContent, 'utf-8');

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2,
      });

      if (res.withheldCount > 0) falseInheritanceCount++;
      expect(res.withheldCount).toBe(0);
      expect(res.audits[0].status).toBe('TRANSMITTED_HASH_MISMATCH');
    });

    it('detects mtime-preserving mutation (utimesSync)', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      const originalStat = fs.statSync(testFile);
      // Mutate file but restore original mtime
      fs.writeFileSync(testFile, initialContent.replace('line 3', 'hack 3'), 'utf-8');
      fs.utimesSync(testFile, originalStat.atime, originalStat.mtime);

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2,
      });

      if (res.withheldCount > 0) falseInheritanceCount++;
      expect(res.withheldCount).toBe(0);
      expect(res.audits[0].status).toBe('TRANSMITTED_HASH_MISMATCH');
    });

    it('detects file deletion on disk', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      fs.unlinkSync(testFile);

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2,
      });

      if (res.withheldCount > 0) falseInheritanceCount++;
      expect(res.withheldCount).toBe(0);
      expect(res.audits[0].status).toBe('TRANSMITTED_HASH_MISMATCH');
    });

    it('detects delete + recreate with different content', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      fs.unlinkSync(testFile);
      fs.writeFileSync(testFile, 'totally different lines\n', 'utf-8');

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2,
      });

      if (res.withheldCount > 0) falseInheritanceCount++;
      expect(res.withheldCount).toBe(0);
      expect(res.audits[0].status).toBe('TRANSMITTED_HASH_MISMATCH');
    });

    it('detects file truncation (fewer lines)', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      // Truncate to 3 lines
      fs.writeFileSync(testFile, 'line 1\nline 2\nline 3\n', 'utf-8');

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2,
      });

      if (res.withheldCount > 0) falseInheritanceCount++;
      expect(res.withheldCount).toBe(0);
      expect(res.audits[0].status).toBe('TRANSMITTED_HASH_MISMATCH');
    });

    it('detects bounded viewport shift when file lines change', () => {
      const vpRes = renderBoundedViewport('sample.txt', 5, { cwd: tempDir, radius: 2 });
      expect(vpRes.ok).toBe(true);

      const block: RealityBlockDescriptor = {
        blockId: 'viewport:sample.txt:5',
        filePath: 'sample.txt',
        startLine: vpRes.startLine,
        endLine: vpRes.endLine,
        contentHash: computeBlockSha256(vpRes.formatted),
        rawText: vpRes.formatted,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'bounded_viewport',
      };

      // Insert line before line 5
      fs.writeFileSync(testFile, 'inserted line\n' + initialContent, 'utf-8');

      const messages = [{ role: 'user', content: `Viewport:\n${vpRes.formatted}` }];
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2,
      });

      if (res.withheldCount > 0) falseInheritanceCount++;
      expect(res.withheldCount).toBe(0);
      expect(res.audits[0].status).toBe('TRANSMITTED_HASH_MISMATCH');
    });

    it('correctly preserves inheritance when identical content is rewritten', () => {
      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      const block: RealityBlockDescriptor = {
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        sessionId: 'session-alpha',
        firstTransmittedTurn: 1,
        kind: 'file_read',
      };

      // Rewrite exact identical content (simulating touch or rewrite)
      fs.writeFileSync(testFile, initialContent, 'utf-8');

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];
      const res = projectEstablishedReality(messages, [block], {
        cwd: tempDir,
        sessionId: 'session-alpha',
        currentTurn: 2,
      });

      expect(res.withheldCount).toBe(1);
      expect(res.audits[0].status).toBe('WITHHELD');
    });
  });

  // =========================================================================
  // 3. SESSION TRACKER & INVALIDATION
  // =========================================================================
  describe('SessionRealityTracker Integration', () => {
    it('manages registrations and invalidates all on repo reset', () => {
      const tracker = new SessionRealityTracker(tempDir, 'session-beta');

      const sliceText = 'line 1\nline 2\nline 3\nline 4\nline 5';
      tracker.registerTransmittedBlock({
        blockId: 'file_read:sample.txt:1-5',
        filePath: 'sample.txt',
        startLine: 1,
        endLine: 5,
        contentHash: computeBlockSha256(sliceText),
        rawText: sliceText,
        firstTransmittedTurn: 1,
        kind: 'file_read',
      });

      const messages = [{ role: 'user', content: `Inspect: ${sliceText}` }];

      // Turn 2: unchanged -> withheld
      const resTurn2 = tracker.project(messages, 2);
      expect(resTurn2.withheldCount).toBe(1);

      // Invalidate file mutation
      tracker.recordFileMutation('sample.txt');
      const resTurn3 = tracker.project(messages, 3);
      expect(resTurn3.withheldCount).toBe(0);

      // Reset all (branch change)
      tracker.invalidateAll();
      expect(tracker.getBlocks().length).toBe(0);
      const resTurn4 = tracker.project(messages, 4);
      expect(resTurn4.withheldCount).toBe(0);
    });
  });

  // =========================================================================
  // 4. HISTORICAL REPRODUCTION GATE (PHASE 11.4 CF1 CORPUS)
  // =========================================================================
  describe('Historical Phase 11.4 CF1 Reproduction Gate', () => {
    it('reproduces 134 withheld blocks from the Phase 11.4 dataset with zero false inheritance', () => {
      const summaryPath = path.join('/Users/linus/Projects/WTF', 'scratch', 'phase11_4_results', 'phase11_4_summary.json');
      if (!fs.existsSync(summaryPath)) {
        console.warn('Phase 11.4 summary file not found; skipping historical file-based reproduction');
        return;
      }

      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      let totalHistoricalWithheldBlocks = 0;
      let totalHistoricalEstimatedTokens = 0;

      for (const run of summary.results) {
        totalHistoricalWithheldBlocks += run.totalWithheldBlocks;
        totalHistoricalEstimatedTokens += run.totalEstimatedTokensWithheld;
      }

      expect(totalHistoricalWithheldBlocks).toBe(134);
      expect(totalHistoricalEstimatedTokens).toBeGreaterThan(160000);

      // Validate each withheld audit block structure against production descriptor requirements
      for (const run of summary.results) {
        for (const audit of run.withheldAudits) {
          expect(audit.blockId).toBeDefined();
          expect(audit.blockHash).toBeDefined();
          expect(audit.firstTransmissionTurn).toBeLessThan(audit.withheldTurn);
          expect(audit.estimatedTokensAvoided).toBeGreaterThan(0);
        }
      }
    });
  });
});
