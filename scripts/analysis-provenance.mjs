import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
// Generated results are excluded so a rerun does not change its own provenance.
const sourcePaths = ['package.json', 'src', 'scripts', 'data'];

export function analysisProvenance() {
  let codeCommit = null;
  let sourceTreeDirty = null;
  try {
    const git = (...args) => execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    // Prevent an enclosing repository from being misattributed to a source export.
    const prefix = git('rev-parse', '--show-prefix');
    if (prefix === '') {
      const candidate = git('rev-parse', 'HEAD');
      if (/^[a-f0-9]{40}$/.test(candidate)) {
        codeCommit = candidate;
        sourceTreeDirty = git('status', '--porcelain', '--', ...sourcePaths) !== '';
      }
    }
  } catch { /* A source archive may have no Git metadata. */ }
  return { softwareVersion: version, codeCommit, sourceTreeDirty, sourcePaths };
}
