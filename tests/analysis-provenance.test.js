import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

function fixture(root) {
  mkdirSync(join(root, 'scripts'), { recursive: true });
  copyFileSync(new URL('../scripts/analysis-provenance.mjs', import.meta.url), join(root, 'scripts/analysis-provenance.mjs'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '9.8.7' }));
}
function inspect(root) {
  const url = pathToFileURL(join(root, 'scripts/analysis-provenance.mjs')).href;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    `import { analysisProvenance } from ${JSON.stringify(url)}; console.log(JSON.stringify(analysisProvenance()));`], { encoding: 'utf8' }));
}
function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

test('analysis metadata identifies package, commit and changed source without counting generated results', () => {
  const root = mkdtempSync(join(tmpdir(), 'bionano-provenance-'));
  try {
    fixture(root);
    git(root, 'init');
    git(root, 'add', '.');
    git(root, '-c', 'user.name=Verification', '-c', 'user.email=verification@example.invalid', 'commit', '-m', 'fixture');
    const clean = inspect(root);
    assert.equal(clean.softwareVersion, '9.8.7');
    assert.equal(clean.codeCommit, git(root, 'rev-parse', 'HEAD'));
    assert.equal(clean.sourceTreeDirty, false);
    mkdirSync(join(root, 'results'));
    writeFileSync(join(root, 'results/generated.json'), '{}');
    assert.deepEqual(inspect(root), clean);
    writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '9.8.8' }));
    assert.equal(inspect(root).softwareVersion, '9.8.8');
    assert.equal(inspect(root).sourceTreeDirty, true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('source exports report unknown Git identity including inside an unrelated parent repository', () => {
  const root = mkdtempSync(join(tmpdir(), 'bionano-export-'));
  try {
    const exported = join(root, 'export');
    fixture(exported);
    assert.equal(inspect(exported).codeCommit, null);
    assert.equal(inspect(exported).sourceTreeDirty, null);
    git(root, 'init');
    git(root, 'add', '.');
    git(root, '-c', 'user.name=Verification', '-c', 'user.email=verification@example.invalid', 'commit', '-m', 'unrelated parent');
    assert.equal(inspect(exported).codeCommit, null);
    assert.equal(inspect(exported).sourceTreeDirty, null);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
