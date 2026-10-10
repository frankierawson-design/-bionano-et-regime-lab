import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { computeModel } from '../src/model.js';
import { scenarios } from '../src/scenarios.js';

test('invalid input clears results, blocks stale exports, and recovers; JSON preserves diagnostic status', async () => {
  const nodes = new Map();
  const context = new Proxy({}, { get: (_, key) => key === 'measureText' ? () => ({ width: 1 }) : () => {} });
  let exported;
  class Element {
    constructor() { this.value = ''; this.style = {}; this.events = {}; this.dataset = {}; }
    set value(v) { this._value = String(v); }
    get value() { return this._value; }
    set id(v) { this._id = v; nodes.set(v, this); }
    get id() { return this._id; }
    append() {}
    replaceChildren() {}
    setAttribute() {}
    addEventListener(name, f) { this.events[name] = f; }
    getBoundingClientRect() { return { width: 600, height: 300 }; }
    getContext() { return context; }
    click() { return this.events.click?.(); }
  }
  const byId = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
  const sandbox = { computeModel, scenarios, Blob, console: { error() {} },
    document: { getElementById: byId, createElement: () => new Element(), body: new Element() },
    window: { devicePixelRatio: 1, addEventListener() {} },
    URL: { createObjectURL(blob) { exported = blob; return 'blob:test'; }, revokeObjectURL() {} } };
  vm.runInNewContext(readFileSync(new URL('../app.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, ''), sandbox);
  assert.equal(byId('export-button').disabled, false);
  byId('h0MeV-number').value = '';
  byId('h0MeV-number').events.change();
  assert.equal(byId('export-button').disabled, true);
  assert.equal(byId('metric-coupling').textContent, '—');
  assert.match(byId('model-status').textContent, /must be between/);
  byId('export-button').click();
  assert.equal(exported, undefined);
  for (const key of ['h0MeV', 'gamma1PerPs', 'gammaPhiPerPs', 'deltaEv']) byId(`${key}-number`).value = '0';
  byId('h0MeV-number').events.change();
  assert.equal(byId('export-button').disabled, false);
  assert.match(byId('metric-zeta').textContent, /undefined/);
  await byId('export-button').click();
  const payload = JSON.parse(await exported.text());
  assert.equal(payload.outputs.decoherence.zeta, null);
  assert.equal(payload.outputs.decoherence.zetaStatus, 'undefined');
  assert.equal(payload.outputs.twoState.periodPs, 'Infinity');
  assert.ok(payload.outputs.dynamics.points.length > 0);
  assert.equal(payload.version, '0.3.0');
  assert.equal(payload.codeCommit, null);
  assert.equal(payload.provenanceStatus, 'unstamped');
  const codeCommit = 'a'.repeat(40);
  sandbox.fetch = async () => ({ ok: true, json: async () => ({ codeCommit }) });
  await byId('export-button').click();
  const stamped = JSON.parse(await exported.text());
  assert.equal(stamped.codeCommit, codeCommit);
  assert.equal(stamped.provenanceStatus, 'stamped-clean-checkout');
});
