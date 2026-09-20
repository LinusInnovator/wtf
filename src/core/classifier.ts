const MECHANICAL_PATTERNS = [
  // Lockfiles
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)Cargo\.lock$/,
  /(^|\/)poetry\.lock$/,
  /(^|\/)Pipfile\.lock$/,
  /(^|\/)composer\.lock$/,
  /(^|\/)Gemfile\.lock$/,
  /(^|\/)go\.sum$/,
  /(^|\/)flake\.lock$/,

  // Generated code & build artifacts
  /(^|\/)(dist|build|out|target|\.next|\.nuxt|\.turbo|\.output|coverage)\//,
  /\.min\.(js|css)$/,
  /\.bundle\.(js|css)$/,
  /\.map$/,
  /\.generated\.[a-z0-9]+$/i,
  /_pb2\.py$/,
  /\.pb\.go$/,
  /\.pb\.h$/,
  /\.pb\.cc$/,
  /\.g\.dart$/,
  /\.designer\.cs$/i,
  
  // Large data dumps / snapshots
  /__snapshots__\//,
  /\.snap$/,
];

export function isMechanicalPath(filePath: string): { isMechanical: boolean; reason?: string } {
  const normalized = filePath.replace(/\\/g, '/');

  for (const pattern of MECHANICAL_PATTERNS) {
    if (pattern.test(normalized)) {
      if (/lock(\.json|\.yaml|file)?$|\.sum$/i.test(normalized)) {
        return { isMechanical: true, reason: 'dependency lockfile' };
      }
      if (/\.min\.|\.bundle\.|\.map$/.test(normalized)) {
        return { isMechanical: true, reason: 'minified bundle or source map' };
      }
      if (/(dist|build|out|target|\.next|coverage)\//.test(normalized)) {
        return { isMechanical: true, reason: 'build artifact / output directory' };
      }
      if (/\.generated\.|\.pb\.|_pb2\.|\.g\./.test(normalized)) {
        return { isMechanical: true, reason: 'code generator output' };
      }
      if (/__snapshots__|\.snap$/.test(normalized)) {
        return { isMechanical: true, reason: 'test snapshot artifact' };
      }
      return { isMechanical: true, reason: 'generated or mechanical artifact' };
    }
  }

  return { isMechanical: false };
}

export function isBinaryPath(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const binaryExtensions = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'pdf', 'zip', 'tar', 'gz',
    'exe', 'bin', 'dll', 'dylib', 'so', 'woff', 'woff2', 'ttf', 'eot',
    'mp3', 'mp4', 'mov', 'wasm'
  ]);
  return ext ? binaryExtensions.has(ext) : false;
}

export interface MinimalHunk {
  lines: string[];
}

/**
 * Detects whether changes to agent configuration files (AGENTS.md, CLAUDE.md, etc.)
 * consist solely of WTF agent completion protocol bootstrapping or instructions.
 * If user instructions/rules unrelated to WTF are present, returns false.
 */
export function isWtfProtocolPatch(filePath: string, hunks: MinimalHunk[]): boolean {
  const norm = filePath.replace(/\\/g, '/');
  const isCandidate =
    /(^|\/)(AGENTS\.md|CLAUDE\.md|\.cursorrules|\.github\/copilot-instructions\.md)$/i.test(norm);
  if (!isCandidate) return false;

  const addedLines: string[] = [];
  for (const h of hunks) {
    for (const l of h.lines) {
      if (l.startsWith('+') && !l.startsWith('+++')) {
        const trimmed = l.slice(1).trim();
        if (trimmed) addedLines.push(trimmed);
      }
    }
  }

  // If no lines were added, this is not a WTF protocol addition
  if (addedLines.length === 0) return false;

  const wtfKeywords = [
    'wtf',
    'agent-wtf',
    'task completion protocol',
    'task verification with wtf',
    'epistemic',
    'passing checks prove only',
    'agents act. wtf proves. humans decide',
    'human decides',
    'agent implements',
    'agent thinks it\'s done',
    'pay attention',
    'observed',
    'verified',
    'unknown',
  ];

  const isStructuralOrProtocol = (line: string): boolean => {
    // Strip markdown formatting, heading markers, and symbols like ✓, ✗, ○, •
    const clean = line.replace(/^[#*\->|`~:\s↓✓✗○•]+/, '').replace(/[*_`]/g, '').trim();
    if (!clean) return true; // empty or pure punctuation line
    const lower = clean.toLowerCase();
    if (wtfKeywords.some((kw) => lower.includes(kw))) return true;
    if (/^[#*\->|`~:\s↓✓✗○•]+$/.test(line)) return true;
    if (/^```[a-z]*$/i.test(line)) return true;
    if (/^[0-9]+\.\s*$/.test(line)) return true;
    if (/^(agent guidelines|task completion protocol|task verification|how coding agents use|machine contract|protocol rules|schema|output format)/i.test(lower)) return true;
    if (/^(\d+\.|\*|-)?\s*(check before completion|never claim code is verified|inspect pay attention|clean up hygiene|no silent skips)/i.test(lower)) return true;
    if (/^(\d+\.|\*|-)?\s*(before declaring any coding task|if checks fail|include the|attach the|resolve issues|tests:\s*passed|tests:\s*failed)/i.test(lower)) return true;
    if (/^\s*(\d+\s+files?\s+changed:|\d+\s+meaningful\s+lines)/i.test(clean)) return true;
    if (/\(\+\d+\/-\d+\)/.test(clean)) return true;
    return false;
  };

  return addedLines.every(isStructuralOrProtocol);
}

