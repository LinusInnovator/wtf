import type { FilePatch, Finding } from '../types.js';

const MIGRATION_PATH_PATTERNS = [
  /migration/i,
  /(^|\/)db\//,
  /(^|\/)prisma\/migrations\//,
  /(^|\/)drizzle\//,
  /(^|\/)alembic\//,
  /\.sql$/,
];

export function detectDatabaseChanges(patches: FilePatch[]): Finding[] {
  const findings: Finding[] = [];

  for (const patch of patches) {
    if (patch.isMechanical) continue;

    const isMigrationPath = MIGRATION_PATH_PATTERNS.some((p) => p.test(patch.path));
    if (!isMigrationPath && !patch.path.endsWith('.sql')) continue;

    let hasDestructive = false;
    let hasOwnershipChange = false;
    let newColumnsCount = 0;
    let tablesAffected: string[] = [];

    for (const hunk of patch.hunks) {
      let currentLineNum = hunk.newStart;

      for (const line of hunk.lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const content = line.slice(1).trim();

          // Destructive SQL operations
          if (/DROP\s+(TABLE|COLUMN|DATABASE|VIEW|INDEX)/i.test(content)) {
            hasDestructive = true;
            findings.push({
              id: `db-drop-${patch.path}-${currentLineNum}`,
              category: 'DATABASE',
              title: `Destructive schema operation (DROP) in ${patch.path}`,
              description: `Drop operation detected: "${content}"`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'CRITICAL',
              snippet: content,
            });
          }

          // Table ownership or permission changes
          if (/OWNER\s+TO|GRANT\s+|REVOKE\s+/i.test(content)) {
            hasOwnershipChange = true;
            findings.push({
              id: `db-owner-${patch.path}-${currentLineNum}`,
              category: 'DATABASE',
              title: `Database ownership / permissions altered in ${patch.path}`,
              description: `Ownership or permission change detected: "${content}"`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'CRITICAL',
              snippet: content,
            });
          }

          // Truncate
          if (/TRUNCATE\s+/i.test(content)) {
            hasDestructive = true;
            findings.push({
              id: `db-truncate-${patch.path}-${currentLineNum}`,
              category: 'DATABASE',
              title: `Destructive table truncation in ${patch.path}`,
              description: `Truncate statement detected: "${content}"`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'CRITICAL',
              snippet: content,
            });
          }

          // Column / table additions
          const alterMatch = content.match(/ALTER\s+TABLE\s+(\w+)/i);
          if (alterMatch) {
            tablesAffected.push(alterMatch[1]);
          }
          const createTableMatch = content.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
          if (createTableMatch) {
            tablesAffected.push(createTableMatch[1]);
          }

          currentLineNum++;
        } else if (line.startsWith(' ')) {
          currentLineNum++;
        }
      }
    }

    // If new migration was added
    if (patch.status === 'added' || patch.status === 'untracked') {
      const uniqueTables = Array.from(new Set(tablesAffected));
      const tablesDesc = uniqueTables.length > 0 ? ` on table(s) ${uniqueTables.join(', ')}` : '';

      findings.push({
        id: `db-new-migration-${patch.path}`,
        category: 'DATABASE',
        title: `New migration added: ${patch.path}`,
        description: `New database migration script${tablesDesc} (+${patch.added} lines)`,
        file: patch.path,
        evidenceTier: 'OBSERVED',
        severity: hasDestructive || hasOwnershipChange ? 'CRITICAL' : 'WARN',
      });
    }
  }

  return findings;
}
