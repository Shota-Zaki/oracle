import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const modules = process.env.ZAKKO_LIFECYCLE_MODULES;
assert.ok(modules, 'Run with node scripts/test-session-lifecycle.mjs');
const { buildSessionLifecycle, formatSessionLifecycleBlock, formatSessionExecutionLabel } =
  await import(pathToFileURL(path.join(modules, 'src/cli/sessionLifecycle.js')).href);

function session(engine, detached, extra = {}) {
  return {
    id: 'stable-session-123', createdAt: '2026-05-15T00:00:00.000Z',
    status: 'running', mode: engine, options: {},
    lifecycle: buildSessionLifecycle({
      engine, detached, workerPid: 1234,
      reattachCommand: 'oracle session "stable-session-123" --model gpt-5.2-pro',
    }),
    ...extra,
  };
}

test('foreground browser with a single model displays Japanese copy', () => {
  const meta = session('browser', false, { model: 'gpt-5.2-pro' });
  assert.deepEqual(formatSessionLifecycleBlock(meta), [
    'セッション: stable-session-123',
    'モード: browser フォアグラウンド',
    'モデル: 1',
    '切り離し: いいえ',
    '再接続: oracle session "stable-session-123" --model gpt-5.2-pro',
  ]);
});

test('detached API with parallel models displays polling and model count', () => {
  const meta = session('api', true, {
    models: [{ model: 'gpt-5.2-pro', status: 'running' }, { model: 'gemini-3-pro', status: 'running' }],
  });
  assert.deepEqual(formatSessionLifecycleBlock(meta), [
    'セッション: stable-session-123',
    'モード: api バックグラウンド',
    'モデル: 2（並列）',
    '切り離し: はい（ポーリング中）',
    '再接続: oracle session "stable-session-123" --model gpt-5.2-pro',
  ]);
});

test('model arrays, absent models and empty arrays retain the existing count fallback', () => {
  for (const extra of [{}, { models: [] }, { models: [], model: 'stable-model' }, { models: [{ model: 'stable-model', status: 'running' }] }]) {
    assert.equal(formatSessionLifecycleBlock(session('api', true, extra))[2], 'モデル: 1');
  }
});

test('a detached foreground record retains its nonpolling presentation', () => {
  const meta = session('browser', true);
  meta.lifecycle.execution = 'foreground';
  assert.equal(formatSessionLifecycleBlock(meta)[3], '切り離し: はい');
});

test('all engine/execution labels retain their exact compact values', () => {
  for (const [engine, detached, expected] of [
    ['api', false, 'api/fg'], ['api', true, 'api/bg'],
    ['browser', false, 'br/fg'], ['browser', true, 'br/bg'],
  ]) {
    assert.equal(formatSessionExecutionLabel(session(engine, detached)), expected);
  }
});

test('formatting preserves stored lifecycle fields, identifiers and exact command bytes', () => {
  const meta = session('api', true, { models: [{ model: 'stable-model-id', status: 'running' }] });
  meta.lifecycle.reattachCommand = '  oracle session "stable-session-123" --model stable-model-id\t';
  const before = structuredClone(meta);
  const command = Buffer.from(meta.lifecycle.reattachCommand);
  assert.deepEqual(meta.lifecycle, {
    engine: 'api', execution: 'background', attached: false, detached: true,
    workerPid: 1234, reattachCommand: before.lifecycle.reattachCommand,
  });
  Object.freeze(meta.lifecycle);
  Object.freeze(meta.models[0]);
  Object.freeze(meta.models);
  Object.freeze(meta);
  const lines = formatSessionLifecycleBlock(meta);
  assert.equal(lines[0], `セッション: ${before.id}`);
  assert.deepEqual(Buffer.from(lines[4].slice('再接続: '.length)), command);
  assert.equal(formatSessionExecutionLabel(meta), 'api/bg');
  assert.deepEqual(meta, before);
});

test('legacy sessions without lifecycle data emit no block and keep each mode fallback', () => {
  for (const [extra, expected] of [
    [{ mode: 'browser', options: { mode: 'api' } }, 'browser'],
    [{ mode: 'api' }, 'api'], [{ options: { mode: 'browser' } }, 'browser'], [{}, 'api'],
  ]) {
    const meta = { id: 'legacy', options: {}, ...extra };
    assert.deepEqual(formatSessionLifecycleBlock(meta), []);
    assert.equal(formatSessionExecutionLabel(meta), expected);
  }
});
