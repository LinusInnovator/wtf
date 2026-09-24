/**
 * WTF Deterministic Path-Tree / Trie Projection
 *
 * Implements deterministic hierarchical projection of canonical CHANGE evidence
 * according to the Evidence Density Two-Tier Compact Trie specification:
 * - Single-child prefix folding (radix trie compaction)
 * - Root namespace aggregation (Tier 1)
 * - Immediate child directory projection (Tier 2)
 * - Deterministic sibling ceiling of 6 with explicit collapsed directory tracking
 * - Strict alphabetical/deterministic ordering
 * - Zero importance/severity/intent ranking
 * - Lossless addressability of all collapsed paths
 */

export interface PathTreeItem {
  file: string;
  additions: number;
  deletions: number;
  isMechanical?: boolean;
}

export interface DirectFileInfo {
  file: string;
  additions: number;
  deletions: number;
}

export interface ProjectedChildNode {
  name: string;
  fullPath: string;
  fileCount: number;
  additions: number;
  deletions: number;
  singleFileName?: string;
  isCollapsedGroup?: boolean;
  collapsedPaths?: string[];
}

export interface ProjectedClusterNode {
  path: string;
  fileCount: number;
  additions: number;
  deletions: number;
  directFiles: DirectFileInfo[];
  children: ProjectedChildNode[];
}

export interface PathTreeProjection {
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
  clusters: ProjectedClusterNode[];
  rootFiles: DirectFileInfo[];
}

interface RawTrieDirNode {
  name: string;
  fullPath: string;
  directFiles: DirectFileInfo[];
  childDirs: Map<string, RawTrieDirNode>;
}

function createRawDirNode(name: string, fullPath: string): RawTrieDirNode {
  return {
    name,
    fullPath,
    directFiles: [],
    childDirs: new Map(),
  };
}

function countFilesRecursively(node: RawTrieDirNode): { count: number; additions: number; deletions: number } {
  let count = node.directFiles.length;
  let additions = node.directFiles.reduce((acc, f) => acc + f.additions, 0);
  let deletions = node.directFiles.reduce((acc, f) => acc + f.deletions, 0);

  for (const child of node.childDirs.values()) {
    const sub = countFilesRecursively(child);
    count += sub.count;
    additions += sub.additions;
    deletions += sub.deletions;
  }

  return { count, additions, deletions };
}

function getSingleFileInSubtree(node: RawTrieDirNode): string | undefined {
  if (node.directFiles.length === 1 && node.childDirs.size === 0) {
    return node.directFiles[0].file;
  }
  if (node.directFiles.length === 0 && node.childDirs.size === 1) {
    const onlyChild = node.childDirs.values().next().value;
    if (onlyChild) return getSingleFileInSubtree(onlyChild);
  }
  return undefined;
}

export interface BuildPathTreeOptions {
  siblingCeiling?: number;
}

/**
 * Builds a deterministic Two-Tier Compact Trie projection from a flat list of change items.
 */
export function buildPathTree(
  files: PathTreeItem[],
  options?: BuildPathTreeOptions
): PathTreeProjection {
  const siblingCeiling = options?.siblingCeiling ?? 6;

  let totalAdditions = 0;
  let totalDeletions = 0;
  const rootFiles: DirectFileInfo[] = [];
  const rootDirMap = new Map<string, RawTrieDirNode>();

  // 1. Ingest files into raw trie
  for (const item of files) {
    const normalized = item.file.replace(/\\/g, '/').replace(/^\/+/, '');
    totalAdditions += item.additions;
    totalDeletions += item.deletions;

    const parts = normalized.split('/');
    if (parts.length === 1) {
      // Root file
      rootFiles.push({
        file: parts[0],
        additions: item.additions,
        deletions: item.deletions,
      });
    } else {
      // Directory file: parts = ['src', 'verify', 'runner.ts']
      const topDir = parts[0];
      if (!rootDirMap.has(topDir)) {
        rootDirMap.set(topDir, createRawDirNode(topDir, topDir));
      }
      let current = rootDirMap.get(topDir)!;

      for (let i = 1; i < parts.length - 1; i++) {
        const seg = parts[i];
        if (!current.childDirs.has(seg)) {
          const subPath = `${current.fullPath}/${seg}`;
          current.childDirs.set(seg, createRawDirNode(seg, subPath));
        }
        current = current.childDirs.get(seg)!;
      }

      // Add direct file to leaf directory
      current.directFiles.push({
        file: normalized,
        additions: item.additions,
        deletions: item.deletions,
      });
    }
  }

  // Sort root files alphabetically
  rootFiles.sort((a, b) => a.file.localeCompare(b.file));

  // 2. Single-Child Prefix Folding (Radix Compaction)
  function foldSingleChildDir(node: RawTrieDirNode): RawTrieDirNode {
    let curr = node;
    while (curr.directFiles.length === 0 && curr.childDirs.size === 1) {
      const onlyChild = curr.childDirs.values().next().value as RawTrieDirNode;
      curr = {
        name: `${curr.name}/${onlyChild.name}`,
        fullPath: onlyChild.fullPath,
        directFiles: onlyChild.directFiles,
        childDirs: onlyChild.childDirs,
      };
    }
    return curr;
  }

  // 3. Project Tier 1 Clusters & Tier 2 Immediate Children
  const clusters: ProjectedClusterNode[] = [];
  const sortedTopKeys = Array.from(rootDirMap.keys()).sort((a, b) => a.localeCompare(b));

  for (const key of sortedTopKeys) {
    const rawRootNode = rootDirMap.get(key)!;
    const foldedNode = foldSingleChildDir(rawRootNode);

    const totals = countFilesRecursively(foldedNode);
    const sortedDirectFiles = [...foldedNode.directFiles].sort((a, b) => a.file.localeCompare(b.file));

    // Project Tier 2 immediate children
    const childDirs = Array.from(foldedNode.childDirs.values()).sort((a, b) => a.name.localeCompare(b.name));
    const projectedChildren: ProjectedChildNode[] = [];

    if (childDirs.length <= siblingCeiling) {
      for (const cd of childDirs) {
        const foldedChild = foldSingleChildDir(cd);
        const childTotals = countFilesRecursively(foldedChild);
        const singleFile = childTotals.count === 1 ? getSingleFileInSubtree(foldedChild) : undefined;

        projectedChildren.push({
          name: foldedChild.name,
          fullPath: foldedChild.fullPath,
          fileCount: childTotals.count,
          additions: childTotals.additions,
          deletions: childTotals.deletions,
          singleFileName: singleFile ? singleFile.split('/').pop() : undefined,
        });
      }
    } else {
      // Ceil to first siblingCeiling children
      const head = childDirs.slice(0, siblingCeiling);
      const tail = childDirs.slice(siblingCeiling);

      for (const cd of head) {
        const foldedChild = foldSingleChildDir(cd);
        const childTotals = countFilesRecursively(foldedChild);
        const singleFile = childTotals.count === 1 ? getSingleFileInSubtree(foldedChild) : undefined;

        projectedChildren.push({
          name: foldedChild.name,
          fullPath: foldedChild.fullPath,
          fileCount: childTotals.count,
          additions: childTotals.additions,
          deletions: childTotals.deletions,
          singleFileName: singleFile ? singleFile.split('/').pop() : undefined,
        });
      }

      // Aggregate remaining siblings into single collapsed group
      let tailCount = 0;
      let tailAdd = 0;
      let tailDel = 0;
      const collapsedPaths: string[] = [];

      for (const cd of tail) {
        collapsedPaths.push(cd.fullPath);
        const childTotals = countFilesRecursively(cd);
        tailCount += childTotals.count;
        tailAdd += childTotals.additions;
        tailDel += childTotals.deletions;
      }

      projectedChildren.push({
        name: `... and ${tail.length} other directories`,
        fullPath: `${foldedNode.fullPath}/...`,
        fileCount: tailCount,
        additions: tailAdd,
        deletions: tailDel,
        isCollapsedGroup: true,
        collapsedPaths,
      });
    }

    clusters.push({
      path: foldedNode.name.endsWith('/') ? foldedNode.name : `${foldedNode.name}/`,
      fileCount: totals.count,
      additions: totals.additions,
      deletions: totals.deletions,
      directFiles: sortedDirectFiles,
      children: projectedChildren,
    });
  }

  return {
    totalFiles: files.length,
    totalAdditions,
    totalDeletions,
    clusters,
    rootFiles,
  };
}

/**
 * Renders the path tree projection as compact Markdown lines for the agent view.
 */
export function renderPathTreeMarkdown(
  projection: PathTreeProjection,
  options?: { smallFileThreshold?: number }
): string[] {
  const threshold = options?.smallFileThreshold ?? 4;
  const lines: string[] = [];

  // Small change fast-path: preserve flat list for small changes (<= threshold)
  if (projection.totalFiles <= threshold) {
    for (const cluster of projection.clusters) {
      for (const f of cluster.directFiles) {
        lines.push(`  • ${f.file} (+${f.additions}/-${f.deletions})`);
      }
      for (const child of cluster.children) {
        if (child.singleFileName) {
          lines.push(`  • ${child.fullPath}/${child.singleFileName} (+${child.additions}/-${child.deletions})`);
        } else {
          lines.push(`  • ${child.fullPath}/ (${child.fileCount} files · +${child.additions}/-${child.deletions})`);
        }
      }
    }
    for (const rf of projection.rootFiles) {
      lines.push(`  • ${rf.file} (+${rf.additions}/-${rf.deletions})`);
    }
    return lines;
  }

  // Hierarchical Two-Tier Projection for larger changes
  for (const cluster of projection.clusters) {
    lines.push(`  • ${cluster.path} (${cluster.fileCount} files · +${cluster.additions}/-${cluster.deletions})`);

    // Render direct files if present
    if (cluster.directFiles.length > 0) {
      if (cluster.directFiles.length <= 3) {
        const fileSnippets = cluster.directFiles
          .map((f) => {
            const basename = f.file.split('/').pop() || f.file;
            return `${basename} (+${f.additions}/-${f.deletions})`;
          })
          .join(', ');
        lines.push(`    ├── direct files: ${fileSnippets}`);
      } else {
        const add = cluster.directFiles.reduce((a, f) => a + f.additions, 0);
        const del = cluster.directFiles.reduce((a, f) => a + f.deletions, 0);
        lines.push(`    ├── direct files: ${cluster.directFiles.length} files · +${add}/-${del}`);
      }
    }

    // Render Tier 2 children
    for (let i = 0; i < cluster.children.length; i++) {
      const child = cluster.children[i];
      const isLast = i === cluster.children.length - 1;
      const prefix = isLast ? '    └── ' : '    ├── ';

      if (child.isCollapsedGroup) {
        lines.push(`${prefix}${child.name} (${child.fileCount} files · +${child.additions}/-${child.deletions})`);
      } else if (child.singleFileName) {
        lines.push(
          `${prefix}${child.name}/ (${child.fileCount} file · +${child.additions}/-${child.deletions}) [${child.singleFileName}]`
        );
      } else {
        lines.push(
          `${prefix}${child.name}/ (${child.fileCount} files · +${child.additions}/-${child.deletions})`
        );
      }
    }
  }

  // Render root files
  if (projection.rootFiles.length > 0) {
    const rfAdd = projection.rootFiles.reduce((a, f) => a + f.additions, 0);
    const rfDel = projection.rootFiles.reduce((a, f) => a + f.deletions, 0);
    if (projection.rootFiles.length <= 3) {
      const fileList = projection.rootFiles
        .map((f) => `${f.file} (+${f.additions}/-${f.deletions})`)
        .join(', ');
      lines.push(`  • root files (${projection.rootFiles.length} files · +${rfAdd}/-${rfDel}): ${fileList}`);
    } else {
      lines.push(`  • root files (${projection.rootFiles.length} files · +${rfAdd}/-${rfDel})`);
    }
  }

  return lines;
}
