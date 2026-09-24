import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

const modules = process.env.ZAKKO_TEST_MODULES;
assert.ok(modules, 'Run with node scripts/test-zakko.mjs');
const load = (name) => import(pathToFileURL(path.join(modules, name + '.js')).href);
const { requireLoopback, requireLoopbackEndpoint, requireCapacity, redactText, redactDiagnostic } = await load('policy');
const { requireContainedFile, scanSecretText, readAdmittedFile, assertBundleBounds } = await load('fileAdmission');
const { ensurePrivateDirectory, writePrivateJson, requirePrivateFile } = await load('privateStorage');
const { reserveIntent, readIntent, linkIntentSession } = await load('intentStore');
const { AdvisoryCoordinator } = await load('coordinator');
const { RunSlots, RunQueueFullError } = await load('runSlots');
async function fixture(t) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'oracle-zakko-fixture-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('literal loopback accepted without DNS', () => {
  for (const host of ['127.0.0.1', '127.2.3.4', '::1', '[::1]']) assert.ok(requireLoopback(host));
});
test('wildcard, LAN, hostnames, malformed literals rejected', () => {
  for (const host of ['0.0.0.0', '::', '192.168.1.1', '100.64.0.1', 'localhost', '127.0.0.1.evil', '[::1', '127.1', ' 127.0.0.1']) assert.throws(() => requireLoopback(host), /ORA_LOOPBACK_REQUIRED/);
});
test('CDP URL has literal loopback and no credential channels', () => {
  requireLoopbackEndpoint('ws://127.0.0.1:9222/devtools/browser/opaque-id');
  requireLoopbackEndpoint('http://[::1]:9222');
  for (const value of ['file:///tmp/a', 'http://a:b@127.0.0.1:9222', 'http://127.0.0.1:9222?token=x', 'http://example.com:9222', 'bad']) assert.throws(() => requireLoopbackEndpoint(value));
});
test('capacities reject nonintegers, infinity and excess', () => {
  assert.equal(requireCapacity(3, 1, 3, 'runs'), 3);
  for (const value of [0, -1, 3.1, NaN, Infinity, 4]) assert.throws(() => requireCapacity(value, 1, 3, 'runs'));
});
test('diagnostic token redaction does not modify identifiers', () => {
  const secret = 'test-only-' + 'q'.repeat(40);
  const redacted = redactText(`sessionId=abc-123 model=gpt-6-example Bearer ${secret} token=${secret} https://user:${secret}@host`, [secret]);
  assert.ok(!redacted.includes(secret));
  assert.ok(redacted.includes('sessionId=abc-123 model=gpt-6-example'));
});
test('nested cookie/config diagnostics redacted without mutation', () => {
  const input = { model: 'example-model-id', remoteToken: 'runtime-generated', nested: { authorization: 'value' }, inlineCookies: [{ value: 'cookie' }] };
  const output = redactDiagnostic(input);
  assert.equal(output.model, input.model);
  assert.equal(output.remoteToken, '[redacted]');
  assert.equal(output.nested.authorization, '[redacted]');
  assert.equal(input.remoteToken, 'runtime-generated');
});
test('sensitive file names and directories are rejected', () => {
  for (const file of ['.env', '.env.production', 'id_ed25519', 'x/private.pem', 'x/Cookies', '.ssh/config', '.oracle/sessions/x/meta.json', 'credentials.json']) assert.throws(() => requireContainedFile(file, '/repo'), /ORA_SECRET_FILE/);
});
test('prefix collision and traversal do not escape allowed root', () => {
  for (const file of ['../x.ts', '/repo2/x.ts', '/repo', '/outside/x.ts']) assert.throws(() => requireContainedFile(file, '/repo'), /ORA_FILE_OUTSIDE_ROOT/);
  assert.equal(requireContainedFile('src/a.ts', '/repo'), '/repo/src/a.ts');
});
test('runtime-generated secret candidates detected without disclosing values', () => {
  const candidates = ['sk-' + 'Q'.repeat(40), '-----BEGIN ' + 'PRIVATE KEY-----', 'Cookie: name=' + 'V'.repeat(24), 'postgres://user:' + 'V'.repeat(24) + '@host/db', 'api_key=' + 'V'.repeat(24)];
  for (const candidate of candidates) assert.throws(() => scanSecretText(candidate), (error) => error.code === 'ORA_SECRET_CONTENT' && !error.message.includes(candidate));
  scanSecretText('const value = 42; // reference the API documentation');
});
test('admitted file reads bounded safe text', async (t) => {
  const root = await fixture(t); await fs.writeFile(path.join(root, 'a.ts'), 'export const answer = 42;');
  assert.equal(await readAdmittedFile('a.ts', root), 'export const answer = 42;');
});
test('symlink files, directory symlinks and hard links fail closed', async (t) => {
  const root = await fixture(t); await fs.mkdir(path.join(root, 'real')); await fs.writeFile(path.join(root, 'real/a.ts'), 'hello');
  await fs.symlink('real/a.ts', path.join(root, 'link.ts')); await fs.symlink('real', path.join(root, 'linked'));
  await assert.rejects(readAdmittedFile('link.ts', root), /ORA_FILE_SYMLINK/);
  await assert.rejects(readAdmittedFile('linked/a.ts', root), /ORA_FILE_SYMLINK/);
  await fs.link(path.join(root, 'real/a.ts'), path.join(root, 'hard.ts'));
  await assert.rejects(readAdmittedFile('hard.ts', root), /ORA_FILE_SIZE_OR_TYPE/);
});
test('oversized input and aggregate bounds rejected', async (t) => {
  const root = await fixture(t); await fs.writeFile(path.join(root, 'a.ts'), '12345');
  await assert.rejects(readAdmittedFile('a.ts', root, 4), /ORA_FILE_SIZE_OR_TYPE/);
  assert.throws(() => assertBundleBounds(Array.from({ length: 129 }, () => ({ content: '' }))), /ORA_BUNDLE_SIZE/);
  assert.throws(() => assertBundleBounds([{ content: 'a'.repeat(8 * 1024 * 1024 + 1) }]), /ORA_BUNDLE_SIZE/);
});
test('private storage mode and atomic cleanup', async (t) => {
  const root = await fixture(t); const directory = path.join(root, 'private'); await ensurePrivateDirectory(directory);
  const file = path.join(directory, 'record.json'); await writePrivateJson(file, { version: 1 }); await requirePrivateFile(file);
  assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')), { version: 1 });
  if (process.platform !== 'win32') { assert.equal((await fs.stat(directory)).mode & 0o777, 0o700); assert.equal((await fs.stat(file)).mode & 0o777, 0o600); }
  assert.deepEqual(await fs.readdir(directory), ['record.json']);
});
test('storage refuses symlink directories and public files', async (t) => {
  const root = await fixture(t); await fs.mkdir(path.join(root, 'real')); await fs.symlink('real', path.join(root, 'linked'));
  await assert.rejects(ensurePrivateDirectory(path.join(root, 'linked')));
  const file = path.join(root, 'public.json'); await fs.writeFile(file, '{}'); await fs.chmod(file, 0o644);
  if (process.platform !== 'win32') await assert.rejects(requirePrivateFile(file), /ORA_STORAGE_FILE/);
});
test('11 parallel reservations for one request create exactly one owner', async (t) => {
  const home = await fixture(t); const values = await Promise.all(Array.from({ length: 11 }, () => reserveIntent(home, 'request-one')));
  assert.equal(values.filter((value) => value.created).length, 1);
});
test('session binding survives a fresh reader and rejects reassignment', async (t) => {
  const home = await fixture(t); await reserveIntent(home, 'request-two'); await linkIntentSession(home, 'request-two', 'session-123');
  assert.equal((await readIntent(home, 'request-two')).sessionId, 'session-123');
  await assert.rejects(linkIntentSession(home, 'request-two', 'session-other'), /ORA_SESSION_CONFLICT/);
});
test('crash window after mkdir is recovery-required, never a new reservation', async (t) => {
  const home = await fixture(t); const id = 'request-crash'; const dir = path.join(home, 'zakko/intents', createHash('sha256').update(id).digest('hex'));
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const result = await reserveIntent(home, id); assert.equal(result.created, false); assert.equal(result.intent.state, 'recovery-required');
});
test('cross-process reservation remains unique', async (t) => {
  const home = await fixture(t); const url = pathToFileURL(path.join(modules, 'intentStore.js')).href;
  const worker = `import { reserveIntent } from ${JSON.stringify(url)}; console.log((await reserveIntent(process.argv[1], 'request-process')).created);`;
  const values = await Promise.all(Array.from({ length: 4 }, () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', worker, home], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; let errors = ''; child.stdout.on('data', (chunk) => output += chunk); child.stderr.on('data', (chunk) => errors += chunk);
    child.on('error', reject); child.on('exit', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(errors)));
  })));
  assert.equal(values.filter((value) => value === 'true').length, 1);
});
test('coordinator persists session ID before dispatch and duplicate requests reuse it', async (t) => {
  const home = await fixture(t); const coordinator = new AdvisoryCoordinator(); let calls = 0;
  const job = { createSession: async () => 'session-job', run: async () => { assert.equal((await readIntent(home, 'request-job')).sessionId, 'session-job'); calls++; }, failed: async () => {} };
  const first = await coordinator.submit(home, 'request-job', job); const duplicate = await coordinator.submit(home, 'request-job', job);
  assert.equal(first.reused, false); assert.equal(duplicate.reused, true); await tick(); await tick(); assert.equal(calls, 1);
});
test('new coordinator after restart never resends an existing request', async (t) => {
  const home = await fixture(t); await reserveIntent(home, 'request-restart'); await linkIntentSession(home, 'request-restart', 'session-before-crash');
  const result = await new AdvisoryCoordinator().submit(home, 'request-restart', { createSession: async () => { throw new Error('must not execute'); }, run: async () => { throw new Error('must not execute'); }, failed: async () => {} });
  assert.equal(result.reused, true); assert.equal(result.intent.sessionId, 'session-before-crash');
});
test('coordinator failure is recorded once, without retry', async (t) => {
  const home = await fixture(t); const coordinator = new AdvisoryCoordinator(); let failures = 0;
  await coordinator.submit(home, 'request-failed', { createSession: async () => 'session-failed', run: async () => { throw new Error('simulated disconnect'); }, failed: async () => { failures++; } });
  for (let i = 0; i < 10 && coordinator.pendingCount; i++) await tick();
  assert.equal(failures, 1); assert.equal(coordinator.pendingCount, 0);
  assert.equal((await readIntent(home, 'request-failed')).sessionId, 'session-failed');
});
test('original RunSlots enforces 3 active and 8 waiting, rejects overflow', async () => {
  const slots = new RunSlots(3, 8); const active = await Promise.all([slots.acquire(), slots.acquire(), slots.acquire()]);
  const queued = Array.from({ length: 8 }, () => slots.acquire());
  assert.equal(slots.activeCount, 3); assert.equal(slots.queuedCount, 8); assert.equal(slots.isSaturated, true);
  await assert.rejects(slots.acquire(), RunQueueFullError);
  for (const release of active) release();
  for (const promise of queued) (await promise)();
  assert.equal(slots.activeCount, 0); assert.equal(slots.queuedCount, 0);
});
test('RunSlots abort removes waiting work and release is idempotent', async () => {
  const slots = new RunSlots(1, 1); const release = await slots.acquire(); const controller = new AbortController();
  const waiting = slots.acquire(controller.signal); controller.abort(); await assert.rejects(waiting);
  release(); release(); assert.equal(slots.activeCount, 0); assert.equal(slots.queuedCount, 0);
});

const { resolveServiceToken } = await load('token');
const { measureDirectory, retentionReport, classifySession } = await load('maintenance');
const { jaOptions, recoveryGuidance, translateServiceMessage } = await load('copy');

test('token file uses private bounded input and never prints contents', async (t) => {
  const root = await fixture(t);
  const file = path.join(root, 'transport-secret');
  const value = 'synthetic-' + 'x'.repeat(40);
  await fs.writeFile(file, value + '\n', { mode: 0o600 });
  assert.equal(await resolveServiceToken(undefined, file), value);
  await assert.rejects(resolveServiceToken('small'), /ORA_TOKEN_REQUIRED/);
  await fs.chmod(file, 0o644);
  if (process.platform !== 'win32') await assert.rejects(resolveServiceToken(undefined, file), /ORA_TOKEN_FILE/);
});
test('token input rejects symlink, hardlink, oversized and whitespace', async (t) => {
  const root = await fixture(t);
  const target = path.join(root, 'value');
  await fs.writeFile(target, 'synthetic-' + 'z'.repeat(40), { mode: 0o600 });
  await fs.symlink(target, path.join(root, 'link'));
  await assert.rejects(resolveServiceToken(undefined, path.join(root, 'link')));
  await fs.link(target, path.join(root, 'hard'));
  await assert.rejects(resolveServiceToken(undefined, target), /ORA_TOKEN_FILE/);
  await fs.writeFile(path.join(root, 'huge'), 'q'.repeat(4097), { mode: 0o600 });
  await assert.rejects(resolveServiceToken(undefined, path.join(root, 'huge')), /ORA_TOKEN_FILE/);
  await assert.rejects(resolveServiceToken('t'.repeat(40) + ' '), /ORA_TOKEN_REQUIRED/);
});
test('capacity report skips external symlinks and enforces traversal budget', async (t) => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, 'data'));
  await fs.writeFile(path.join(root, 'data', 'log'), 'hello');
  await fs.symlink('/etc', path.join(root, 'outside'));
  assert.deepEqual(await measureDirectory(root), { bytes: 5, entries: 3 });
  await assert.rejects(measureDirectory(root, 1), /ORA_STORAGE_SCAN_LIMIT/);
});
test('retention never makes unfinished, pinned, malformed or future records deletion candidates', () => {
  const now = Date.parse('2026-09-24T00:00:00Z');
  const old = { completedAt: '2026-09-01T00:00:00Z' };
  assert.equal(classifySession({ ...old, status: 'completed' }, now), 'prune-candidate');
  for (const status of ['pending', 'running', 'partial', 'error', 'cancelled', undefined]) assert.equal(classifySession({ ...old, status }, now), 'recovery');
  assert.equal(classifySession({ ...old, status: 'completed', pinned: true }, now), 'keep');
  assert.equal(classifySession({ status: 'completed', completedAt: 'bad' }, now), 'keep');
  assert.equal(classifySession({ status: 'completed', completedAt: '2030-01-01' }, now), 'keep');
  assert.equal(classifySession({ ...old, status: 'completed', browser: { harvest: { state: 'detached' } } }, now), 'recovery');
  assert.throws(() => classifySession({}, now, 0), /ORA_RETENTION_INVALID/);
});
test('retention report is read-only, handles corrupt metadata and does not expose prompts', async (t) => {
  const root = await fixture(t);
  for (const id of ['old-session', 'broken-session']) await fs.mkdir(path.join(root, 'sessions', id), { recursive: true });
  await fs.writeFile(path.join(root, 'sessions', 'old-session', 'meta.json'), JSON.stringify({ status: 'completed', completedAt: '2026-08-01', prompt: 'private-source-example' }));
  await fs.writeFile(path.join(root, 'sessions', 'broken-session', 'meta.json'), '{');
  const report = await retentionReport(root, Date.parse('2026-09-24'));
  assert.deepEqual(report, [{ id: 'broken-session', disposition: 'recovery' }, { id: 'old-session', disposition: 'prune-candidate' }]);
  assert.ok(!JSON.stringify(report).includes('private-source-example'));
  assert.equal((await fs.readdir(path.join(root, 'sessions'))).length, 2);
});
test('Japanese copy preserves flags and session IDs while hiding token banners', () => {
  assert.ok(jaOptions['--engine'].includes('browser'));
  assert.ok(recoveryGuidance('stable-session-123').includes('oracle session stable-session-123'));
  assert.ok(!translateServiceMessage('Access token: synthetic-value').includes('synthetic-value'));
});
test('coordinator locally bounds outstanding work at eleven across await points', async (t) => {
  const root = await fixture(t);
  const coordinator = new AdvisoryCoordinator();
  let release;
  const blocking = new Promise((resolve) => { release = resolve; });
  const calls = [];
  for (let i = 0; i < 11; i++) calls.push(coordinator.submit(root, `bounded-request-${i}`, {
    createSession: async () => `session-${i}`, run: () => blocking, failed: async () => {},
  }));
  await assert.rejects(coordinator.submit(root, 'bounded-overflow', { createSession: async () => 'unused', run: async () => {}, failed: async () => {} }), /ORA_QUEUE_FULL/);
  await Promise.all(calls);
  assert.equal(coordinator.pendingCount, 11);
  release();
  await tick(); await tick();
  assert.equal(coordinator.pendingCount, 0);
});
