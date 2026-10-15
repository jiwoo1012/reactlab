import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/app/api/guide/route.ts', import.meta.url), 'utf8')
const material = fs.readFileSync(new URL('../public/data/next_step4_guide_rag_complete.txt', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

const setup = (document) => {
  const calls = []
  class MockOpenAI {
    responses = { create: async (params) => {
      calls.push(params)
      return { output_text: '학습 답변' }
    } }
  }
  const modules = {
    openai: { default: MockOpenAI },
    'next/server': { NextResponse: Response },
    'fs/promises': { readFile: async () => document },
    path: { default: path },
  }
  const context = {
    exports: {},
    require: (name) => modules[name],
    process: { env: { OPENAI_API_KEY: 'test-only' }, cwd: () => '.' },
    console,
  }
  vm.runInNewContext(compiled, context)
  return {
    calls,
    post: (question) => context.exports.POST(new Request('http://localhost/api/guide', {
      method: 'POST',
      body: JSON.stringify({ question }),
    })),
  }
}

test('common instructions survive a renamed heading and appear once', async () => {
  for (const title of ['AI 스터디 공통 답변 원칙', '새로운 학습 규칙']) {
    const api = setup(material.replace('[00. AI 스터디 공통 답변 원칙]', '[00. ' + title + ']'))
    assert.equal((await api.post('useState 설명해주세요')).status, 200)
    assert.equal(api.calls.length, 1)
    const instructions = api.calls[0].instructions
    assert.ok(instructions.includes('[00. ' + title + ']'))
    assert.equal(instructions.split('[00.').length - 1, 1)
    assert.ok(instructions.includes('React 학습 도우미'))
  }
})

test('common instructions alone do not count as a search match', async () => {
  const api = setup(material)
  const response = await api.post('zzzzzzzzzz')
  assert.equal(response.status, 200)
  assert.match((await response.json()).answer, /관련 학습 자료를 찾지 못했어요/)
  assert.equal(api.calls.length, 0)
})
