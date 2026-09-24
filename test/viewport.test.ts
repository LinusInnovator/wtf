import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { renderBoundedViewport } from '../src/core/viewport.js';

describe('Bounded Context Viewport (Phase 9.2)', () => {
  let tempDir: string;
  let sampleFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-viewport-test-'));
    sampleFile = path.join(tempDir, 'demo.py');
    // Write 50 lines
    const lines = Array.from({ length: 50 }, (_, i) => `line_${i + 1} = ${i + 1}`);
    fs.writeFileSync(sampleFile, lines.join('\n') + '\n', 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('renders a bounded window centered on coordinate line with default radius 15', () => {
    const res = renderBoundedViewport('demo.py', 25, { cwd: tempDir, radius: 15 });
    expect(res.ok).toBe(true);
    expect(res.startLine).toBe(10); // 25 - 15
    expect(res.endLine).toBe(40);   // 25 + 15
    expect(res.totalLines).toBe(51); // 50 lines + trailing blank line from split
    expect(res.centerLine).toBe(25);
    expect(res.formatted).toContain('[WTF BOUNDED VIEWPORT: demo.py lines 10 to 40 (coordinate line 25 of 51)]:');
    expect(res.formatted).toContain('==>   25 | line_25 = 25');
    expect(res.formatted).toContain('      10 | line_10 = 10');
    expect(res.formatted).toContain('      40 | line_40 = 40');
  });

  it('clamps startLine to 1 when coordinate is near the beginning of file', () => {
    const res = renderBoundedViewport('demo.py', 3, { cwd: tempDir, radius: 15 });
    expect(res.ok).toBe(true);
    expect(res.startLine).toBe(1);
    expect(res.endLine).toBe(18); // 3 + 15
    expect(res.formatted).toContain('==>    3 | line_3 = 3');
    expect(res.formatted).toContain('       1 | line_1 = 1');
  });

  it('clamps endLine to totalLines when coordinate is near the end of file', () => {
    const res = renderBoundedViewport('demo.py', 48, { cwd: tempDir, radius: 15 });
    expect(res.ok).toBe(true);
    expect(res.startLine).toBe(33); // 48 - 15
    expect(res.endLine).toBe(res.totalLines);
    expect(res.formatted).toContain('==>   48 | line_48 = 48');
  });

  it('supports custom radius option', () => {
    const res = renderBoundedViewport('demo.py', 20, { cwd: tempDir, radius: 3 });
    expect(res.ok).toBe(true);
    expect(res.startLine).toBe(17);
    expect(res.endLine).toBe(23);
    expect(res.rawLines.length).toBe(7);
  });

  it('supports disabling pointer marker', () => {
    const res = renderBoundedViewport('demo.py', 20, { cwd: tempDir, radius: 2, showPointer: false });
    expect(res.ok).toBe(true);
    expect(res.formatted).not.toContain('==>');
    expect(res.formatted).toContain('      20 | line_20 = 20');
  });

  it('strictly prevents path traversal attacks outside workspace root', () => {
    const res = renderBoundedViewport('../../etc/passwd', 1, { cwd: tempDir });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Security violation: Path');
  });

  it('fails closed when file does not exist on disk', () => {
    const res = renderBoundedViewport('nonexistent.py', 1, { cwd: tempDir });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('File not found');
  });

  it('fails closed when path is a directory', () => {
    const dirPath = path.join(tempDir, 'sub_dir');
    fs.mkdirSync(dirPath);
    const res = renderBoundedViewport('sub_dir', 1, { cwd: tempDir });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Path is not a regular file');
  });
});
