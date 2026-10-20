import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Run the actual storage/calculation modules with isolated browser storage.
function browser({ blockedLocal = false, cacheAvailable = true } = {}) {
  const local = new Map();
  const cachesByName = new Map();
  const caches = {
    keys: async () => [...cachesByName.keys()],
    open: async (name) => {
      if (!cachesByName.has(name)) cachesByName.set(name, new Map());
      const entries = cachesByName.get(name);
      return {
        put: async (key, response) => entries.set(String(key), response.clone()),
        match: async (key) => entries.get(String(key))?.clone(),
        delete: async (key) => entries.delete(String(key)),
      };
    },
  };
  const context = vm.createContext({
    console, Date, Intl, URL, Response, crypto: { randomUUID },
    document: { baseURI: 'https://example.test/class-financial/' },
    navigator: {}, window: cacheAvailable ? { caches } : {}, caches,
    indexedDB: { open() { throw new Error('IndexedDB unavailable'); } },
    localStorage: {
      getItem(key) {
        if (blockedLocal) throw new Error('SecurityError');
        return local.get(key) ?? null;
      },
      setItem(key, value) {
        if (blockedLocal) throw new Error('SecurityError');
        local.set(key, value);
      },
    },
  });
  const modules = new Map();
  function load(file) {
    file = path.resolve(file);
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} };
    modules.set(file, module);
    const js = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const run = vm.runInContext(`(function(require,module,exports){${js}\n})`, context);
    run((specifier) => load(path.resolve(path.dirname(file), `${specifier}.ts`)), module, module.exports);
    return module.exports;
  }
  return { load, local, caches };
}

function populated(storage) {
  const root = storage.createEmptyRoot();
  root.byClass[root.activeClassId].children = [
    { id: 'kid', firstName: 'А', lastName: 'Б', gender: 'boy', createdAt: 1 },
  ];
  return root;
}

test('an intentionally emptied class stays empty after restart and localStorage loss', async () => {
  const b = browser();
  const s = b.load('src/app/storage.ts');
  const adapter = s.createAdapter();
  const root = populated(s);
  adapter.save(root);
  root.byClass[root.activeClassId].children = [];
  adapter.save(root);
  let recovered = await adapter.recover(adapter.load());
  assert.equal(recovered.byClass[root.activeClassId].children.length, 0);
  b.local.clear();
  recovered = await adapter.recover(adapter.load());
  assert.equal(recovered.classes[0].id, root.activeClassId);
  assert.equal(recovered.byClass[root.activeClassId].children.length, 0);
});

test('recovery uses original snapshot dates and skips a corrupt mirror', async () => {
  const b = browser();
  const s = b.load('src/app/storage.ts');
  const old = populated(s);
  const latest = s.createEmptyRoot('Актуальный класс');
  b.local.set('klassnaya-kopilka/backup-a', '{broken');
  b.local.set('klassnaya-kopilka/backup-b', JSON.stringify({ updatedAt: 10, data: old }));
  const cache = await b.caches.open(s.USER_CACHE);
  await cache.put('https://example.test/class-financial/__kopilka_backup__/latest',
    new Response(JSON.stringify({ updatedAt: 20, data: latest })));
  const adapter = s.createAdapter();
  assert.equal(adapter.loadBackup().classes[0].id, old.activeClassId);
  const recovered = await adapter.recover(adapter.load());
  assert.equal(recovered.classes[0].name, 'Актуальный класс');
});

test('unavailable localStorage still recovers data from Cache Storage', async () => {
  const b = browser({ blockedLocal: true });
  const s = b.load('src/app/storage.ts');
  const root = populated(s);
  const cache = await b.caches.open(s.USER_CACHE);
  await cache.put('https://example.test/class-financial/__kopilka_backup__/latest',
    new Response(JSON.stringify({ updatedAt: 20, data: root })));
  const adapter = s.createAdapter();
  const recovered = await adapter.recover(adapter.load());
  assert.equal(recovered.byClass[root.activeClassId].children.length, 1);
});

test('partial payments with kopecks settle exactly, including totals and debts', () => {
  const b = browser();
  const s = b.load('src/app/storage.ts');
  const u = b.load('src/app/utils.ts');
  const root = populated(s);
  const data = root.byClass[root.activeClassId];
  data.collections = [{ id: 'coll', amount: 0.8, title: 'Сбор', createdAt: 1, date: '2026-10-20' }];
  const state = { contributions: [{ amount: 0.1 }, { amount: 0.7 }] };
  data.payments = { coll: { kid: state } };
  data.expenses = { coll: [{ amount: 0.1 }, { amount: 0.2 }] };
  assert.equal(u.paidAmount(state), 0.8);
  assert.equal(u.paymentStatus(state, 0.8), 'full');
  assert.equal(u.remainingFor(state, 0.8), 0);
  assert.equal(u.debtsByChild(data).length, 0);
  assert.equal(u.collectionStats(data, data.collections[0]).done, true);
  assert.equal(u.grandTotals(data).balance, 0.5);
});

test('service worker preserves unrelated applications caches', async () => {
  const handlers = {};
  const deleted = [];
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { addEventListener: (type, fn) => handlers[type] = fn, clients: { claim: async () => {} } },
    caches: {
      keys: async () => ['my-finance-v1', 'other-pwa', 'kopilka-obsolete', 'kopilka-v1', 'kopilka-v2-host', 'kopilka-user-data-v1'],
      delete: async (key) => deleted.push(key),
    },
  });
  await new Promise((resolve, reject) => handlers.activate({ waitUntil: (promise) => promise.then(resolve, reject) }));
  assert.deepEqual(deleted, ['kopilka-obsolete']);
});

test('photo save reports failure when all storage layers are unavailable', async () => {
  const b = browser({ cacheAvailable: false });
  const photos = b.load('src/app/photos.ts');
  await assert.rejects(photos.savePhoto('receipt', 'data:image/jpeg;base64,test'), /Не удалось сохранить фото/);
});

test('photo can be saved and retrieved through cache when IndexedDB fails', async () => {
  const b = browser();
  const photos = b.load('src/app/photos.ts');
  const image = 'data:image/jpeg;base64,test';
  await photos.savePhoto('receipt', image);
  assert.equal(await photos.getPhoto('receipt'), image);
});