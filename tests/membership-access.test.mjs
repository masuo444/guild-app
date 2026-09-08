import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(source, dependencies = {}) {
  const exports = {}
  const { outputText } = ts.transpileModule(readFileSync(source, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  vm.runInNewContext(outputText, { exports, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
    return dependencies[name]
  } })
  return exports
}
const access = load('src/lib/access.ts')

for (const status of ['free_tier', 'inactive', 'past_due', 'canceled', 'active', 'free']) {
  test(`Paid features for ${status}`, async () => {
    const expected = status === 'active' || status === 'free'
    for (const feature of ['canViewMembers', 'canViewOffers', 'canRegisterHub', 'canViewDashboardDetails', 'hasFullAccess']) {
      assert.equal(access[feature](status), expected, feature)
    }
    const profile = { role: 'user', subscription_status: status }
    const query = { select() { return this }, eq() { return this }, async single() { return { data: profile } } }
    const server = load('src/lib/member-access.ts', {
      '@/lib/access': access,
      '@/lib/supabase/server': { createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'member', email: 'member@example.test' } } }) },
        from: () => query,
      }) },
    })
    assert.equal(await server.hasMemberAccess(), expected)
  })
}

test('Unauthenticated visitors cannot use paid features', async () => {
  const server = load('src/lib/member-access.ts', {
    '@/lib/access': access,
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: () => { throw new Error('Must not query profiles without a user') },
    }) },
  })
  assert.equal(await server.hasMemberAccess(), false)
})
