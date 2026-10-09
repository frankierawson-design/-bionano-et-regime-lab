import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('status', '--porcelain')) {
  throw new Error('Commit or discard local changes before stamping source provenance.');
}
const codeCommit = git('rev-parse', 'HEAD');
writeFileSync('provenance.json', JSON.stringify({ codeCommit }, null, 2) + '\n');
console.log(`Stamped source commit ${codeCommit}`);
