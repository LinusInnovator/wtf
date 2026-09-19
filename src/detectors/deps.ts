import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AnalyzeOptions, FilePatch, Finding } from '../types.js';

export function detectDependencyChanges(
  patches: FilePatch[],
  repoRoot?: string,
  options: AnalyzeOptions = {}
): {
  findings: Finding[];
  summaryItems: string[];
} {
  const findings: Finding[] = [];
  const addedDeps: string[] = [];
  const updatedDeps: string[] = [];
  const removedDeps: string[] = [];

  const pkgPatch = patches.find((p) => p.path.endsWith('package.json'));

  if (pkgPatch && repoRoot) {
    try {
      const fullPath = path.join(repoRoot, pkgPatch.path);
      let newPkg: any = {};
      let oldPkg: any = {};

      if (options.commit) {
        try {
          const newContent = execSync(`git show ${options.commit}:${pkgPatch.path}`, {
            cwd: repoRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
          });
          newPkg = JSON.parse(newContent);
        } catch {
          if (fs.existsSync(fullPath)) newPkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        }

        try {
          const oldContent = execSync(`git show ${options.commit}^1:${pkgPatch.path}`, {
            cwd: repoRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
          });
          oldPkg = JSON.parse(oldContent);
        } catch {
          oldPkg = {};
        }
      } else if (options.range && options.range.includes('..')) {
        const [rev1, rev2] = options.range.split('..');
        try {
          const newContent = execSync(`git show ${rev2 || 'HEAD'}:${pkgPatch.path}`, {
            cwd: repoRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
          });
          newPkg = JSON.parse(newContent);
        } catch {}
        try {
          const oldContent = execSync(`git show ${rev1}:${pkgPatch.path}`, {
            cwd: repoRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
          });
          oldPkg = JSON.parse(oldContent);
        } catch {}
      } else {
        if (fs.existsSync(fullPath)) {
          newPkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        }
        try {
          const oldContent = execSync(`git show HEAD:${pkgPatch.path}`, {
            cwd: repoRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
          });
          oldPkg = JSON.parse(oldContent);
        } catch {
          oldPkg = {};
        }
      }

      const depFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

      for (const field of depFields) {
        const oldMap = oldPkg[field] || {};
        const newMap = newPkg[field] || {};

        for (const [dep, ver] of Object.entries(newMap)) {
          if (!oldMap[dep]) {
            addedDeps.push(`${dep}@${ver}`);
          } else if (oldMap[dep] !== ver) {
            updatedDeps.push(`${dep} (${oldMap[dep]} -> ${ver})`);
          }
        }

        for (const dep of Object.keys(oldMap)) {
          if (!newMap[dep]) {
            removedDeps.push(dep);
          }
        }
      }
    } catch {
      // fallback to hunk parsing
    }
  }

  // Cargo.toml check
  const cargoPatch = patches.find((p) => p.path.endsWith('Cargo.toml'));
  if (cargoPatch && repoRoot) {
    try {
      const fullPath = path.join(repoRoot, cargoPatch.path);
      let newContent = '';
      let oldContent = '';

      if (options.commit) {
        try {
          newContent = execSync(`git show ${options.commit}:${cargoPatch.path}`, {
            cwd: repoRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
          });
        } catch {
          if (fs.existsSync(fullPath)) newContent = fs.readFileSync(fullPath, 'utf-8');
        }
        try {
          oldContent = execSync(`git show ${options.commit}^1:${cargoPatch.path}`, {
            cwd: repoRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
          });
        } catch {}
      } else {
        if (fs.existsSync(fullPath)) newContent = fs.readFileSync(fullPath, 'utf-8');
        try {
          oldContent = execSync(`git show HEAD:${cargoPatch.path}`, {
            cwd: repoRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
          });
        } catch {}
      }

      const extractCargoDeps = (toml: string) => {
        const deps = new Map<string, string>();
        let inDeps = false;
        for (const line of toml.split('\n')) {
          const trimmed = line.trim();
          if (/^\[(dependencies|dev-dependencies)\]/.test(trimmed)) {
            inDeps = true;
            continue;
          }
          if (inDeps && /^\[/.test(trimmed)) {
            inDeps = false;
            continue;
          }
          if (inDeps) {
            const m = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*=\s*(.*)$/);
            if (m) deps.set(m[1], m[2]);
          }
        }
        return deps;
      };

      const oldDeps = extractCargoDeps(oldContent);
      const newDeps = extractCargoDeps(newContent);

      for (const [k, v] of newDeps.entries()) {
        if (!oldDeps.has(k)) {
          addedDeps.push(`${k} (${v})`);
        } else if (oldDeps.get(k) !== v) {
          updatedDeps.push(`${k} (${oldDeps.get(k)} -> ${v})`);
        }
      }
      for (const k of oldDeps.keys()) {
        if (!newDeps.has(k)) {
          removedDeps.push(k);
        }
      }
    } catch {}
  }

  // Fallback for requirements.txt / go.mod via hunks
  for (const patch of patches) {
    if (patch.path.endsWith('requirements.txt') || patch.path.endsWith('pyproject.toml')) {
      for (const hunk of patch.hunks) {
        for (const line of hunk.lines) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            const trimmed = line.slice(1).trim();
            if (trimmed && !trimmed.startsWith('#') && /^[a-zA-Z0-9_\-]+/.test(trimmed)) {
              addedDeps.push(trimmed);
            }
          }
        }
      }
    } else if (patch.path.endsWith('go.mod')) {
      for (const hunk of patch.hunks) {
        for (const line of hunk.lines) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            const trimmed = line.slice(1).trim();
            const match = trimmed.match(/^([a-zA-Z0-9.\-\/]+)\s+(v[0-9a-zA-Z.\-]+)/);
            if (match) {
              addedDeps.push(`${match[1]}@${match[2]}`);
            }
          }
        }
      }
    }
  }

  const summaryItems: string[] = [];
  const totalChanged = addedDeps.length + updatedDeps.length;
  if (totalChanged > 0) {
    const noun = totalChanged === 1 ? 'dependency' : 'dependencies';
    summaryItems.push(`+ ${totalChanged} ${noun}`);
    const detailList = [...addedDeps, ...updatedDeps];
    findings.push({
      id: 'deps-added',
      category: 'DEPENDENCY',
      title: `${addedDeps.length > 0 ? `Added ${addedDeps.length}` : ''}${addedDeps.length > 0 && updatedDeps.length > 0 ? ', ' : ''}${updatedDeps.length > 0 ? `Updated ${updatedDeps.length}` : ''} ${noun}`,
      description: `Dependency modifications: ${detailList.slice(0, 5).join(', ')}${detailList.length > 5 ? ` and ${detailList.length - 5} more` : ''}`,
      evidenceTier: 'OBSERVED',
      severity: 'INFO',
    });
  }

  if (removedDeps.length > 0) {
    summaryItems.push(`- ${removedDeps.length} ${removedDeps.length === 1 ? 'dependency' : 'dependencies'}`);
  }

  return { findings, summaryItems };
}
