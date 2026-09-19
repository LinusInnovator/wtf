import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FilePatch, Finding } from '../types.js';

export function detectDependencyChanges(
  patches: FilePatch[],
  repoRoot?: string
): {
  findings: Finding[];
  summaryItems: string[];
} {
  const findings: Finding[] = [];
  const addedDeps: string[] = [];
  const removedDeps: string[] = [];

  const pkgPatch = patches.find((p) => p.path.endsWith('package.json'));

  if (pkgPatch && repoRoot) {
    try {
      const fullPath = path.join(repoRoot, pkgPatch.path);
      let newPkg: any = {};
      if (fs.existsSync(fullPath)) {
        newPkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      }

      let oldPkg: any = {};
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

      const depFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

      for (const field of depFields) {
        const oldMap = oldPkg[field] || {};
        const newMap = newPkg[field] || {};

        for (const [dep, ver] of Object.entries(newMap)) {
          if (!oldMap[dep]) {
            addedDeps.push(`${dep}@${ver}`);
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
      if (fs.existsSync(fullPath)) {
        newContent = fs.readFileSync(fullPath, 'utf-8');
      }
      let oldContent = '';
      try {
        oldContent = execSync(`git show HEAD:${cargoPatch.path}`, {
          cwd: repoRoot,
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf-8',
        });
      } catch {
        oldContent = '';
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
        }
      }
      for (const k of oldDeps.keys()) {
        if (!newDeps.has(k)) {
          removedDeps.push(k);
        }
      }
    } catch {
      // fallback
    }
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
            const match = line.match(/^\s*([a-zA-Z0-9.\-\/]+)\s+(v[0-9a-zA-Z.\-]+)/);
            if (match) {
              addedDeps.push(`${match[1]}@${match[2]}`);
            }
          }
        }
      }
    }
  }

  const summaryItems: string[] = [];
  if (addedDeps.length > 0) {
    summaryItems.push(`+ ${addedDeps.length} ${addedDeps.length === 1 ? 'dependency' : 'dependencies'}`);
    findings.push({
      id: 'deps-added',
      category: 'DEPENDENCY',
      title: `Added ${addedDeps.length} ${addedDeps.length === 1 ? 'dependency' : 'dependencies'}`,
      description: `New dependencies added: ${addedDeps.slice(0, 5).join(', ')}${addedDeps.length > 5 ? ` and ${addedDeps.length - 5} more` : ''}`,
      evidenceTier: 'OBSERVED',
      severity: 'INFO',
    });
  }

  if (removedDeps.length > 0) {
    summaryItems.push(`- ${removedDeps.length} ${removedDeps.length === 1 ? 'dependency' : 'dependencies'}`);
  }

  return { findings, summaryItems };
}
