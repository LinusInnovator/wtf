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
