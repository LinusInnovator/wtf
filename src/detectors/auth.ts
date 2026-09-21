import type { FilePatch, Finding } from '../types.js';
import { truncateLineForRegex } from '../core/security.js';

const AUTH_PATH_PATTERNS = [
  /(^|\/)auth/i,
  /(^|\/)session/i,
  /(^|\/)login/i,
  /(^|\/)permission/i,
  /(^|\/)role/i,
  /(^|\/)jwt/i,
  /(^|\/)token/i,
  /(^|\/)passport/i,
  /(^|\/)oauth/i,
  /(^|\/)security/i,
];

export function detectAuthChanges(patches: FilePatch[]): Finding[] {
  const findings: Finding[] = [];

  for (const patch of patches) {
    if (patch.isMechanical) continue;

    // Skip documentation and markdown files
    if (/\.(md|markdown|txt|rst|json)$/i.test(patch.path) || patch.path.startsWith('docs/')) {
      continue;
    }

    const pathMatches = AUTH_PATH_PATTERNS.some((p) => p.test(patch.path));

    for (const hunk of patch.hunks) {
      let currentLineNum = hunk.newStart;

      for (const line of hunk.lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const content = truncateLineForRegex(line.slice(1).trim());

          // Session expiry / timeout
          if (
            /\b(expiresIn|maxAge|sessionTimeout|session_timeout|token_expiry|sessionExpiry)\b/i.test(content) ||
            (pathMatches && /\b(expiry|timeout|ttl)\b/i.test(content))
          ) {
            findings.push({
              id: `auth-expiry-${patch.path}-${currentLineNum}`,
              category: 'AUTH',
              title: `Session expiry / timeout token match in ${patch.path}`,
              description: `Observed token matching session expiry / timeout pattern in ${patch.path}`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'WARN',
              snippet: content,
            });
          }

          // Permission / Role checks bypass or change
          else if (
            /\b(hasPermission|hasRole|requireRole|isAdmin|allowAll|permitAll|skipAuth)\b/i.test(content) &&
            !patch.path.includes('test')
          ) {
            findings.push({
              id: `auth-permission-${patch.path}-${currentLineNum}`,
              category: 'AUTH',
              title: `Permission / role authorization token match in ${patch.path}`,
              description: `Observed token matching role or permission check pattern in ${patch.path}`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'WARN',
              snippet: content,
            });
          }

          // Crypto / secret / signing key
          else if (
            /\b(createHash|createHmac|crypto\.subtle|bcrypt|argon2|jwt\.sign|jwt\.verify)\b/i.test(
              content
            ) &&
            !patch.path.includes('test')
          ) {
            findings.push({
              id: `auth-crypto-${patch.path}-${currentLineNum}`,
              category: 'AUTH',
              title: `Cryptographic / token routine token match in ${patch.path}`,
              description: `Observed token matching cryptography or token routine in ${patch.path}`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'WARN',
              snippet: content,
            });
          }

          currentLineNum++;
        } else if (line.startsWith(' ')) {
          currentLineNum++;
        }
      }
    }

    // If whole auth file was modified or added but no granular line matched yet
    if (pathMatches && findings.filter((f) => f.file === patch.path).length === 0) {
      findings.push({
        id: `auth-file-${patch.path}`,
        category: 'AUTH',
        title: `Auth/session path match: ${patch.path}`,
        description: `Changed file matches auth/session path pattern: ${patch.path} (+${patch.added}/-${patch.deleted})`,
        file: patch.path,
        evidenceTier: 'OBSERVED',
        severity: 'WARN',
      });
    }
  }

  return findings;
}
