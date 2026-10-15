import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/app/api/ai/route.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

const setup = (output, fails = false) => {
  const calls = []
  class MockOpenAI {
    responses = {
      create: async (params) => {
        calls.push(params)
        if (fails) throw new Error('upstream failure')
        return { status: 'completed', output_text: output }
      },
    }
  }
  const context = {
    exports: {},
    require: () => ({ default: MockOpenAI }),
    Response,
    process: { env: { OPENAI_API_KEY: 'test-only' } },
  }
  vm.runInNewContext(compiled, context)
  return {
    calls,
    post: (body) => context.exports.POST(new Request('http://localhost/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })),
  }
}

test('quiz returns separate question and answer and forwards recent history', async () => {
  const api = setup(JSON.stringify({ answer: '문제', questionAns: '정답 및 해설' }))
  const history = Array.from({ length: 12 }, (_, i) => '문제 ' + i)
  const response = await api.post({ mode: 'quiz', message: 'useState', previousQuestions: history })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { answer: '문제', questionAns: '정답 및 해설' })
  assert.deepEqual(JSON.parse(api.calls[0].input).previousQuestions, history.slice(-10))
  assert.equal(api.calls[0].text.format.strict, true)
})

test('hint accepts an empty extra question and sends the current quiz', async () => {
  const api = setup('상태 변경 함수를 떠올려보세요.')
  const response = await api.post({ mode: 'hint', message: '', currentQuiz: '상태를 어떻게 바꾸나요?' })
  assert.equal(response.status, 200)
  assert.equal(JSON.parse(api.calls[0].input).currentQuiz, '상태를 어떻게 바꾸나요?')
})

test('invalid input is rejected before calling OpenAI', async () => {
  const api = setup('')
  for (const body of [
    { mode: 'hint', message: '' },
    { mode: 'quiz', message: ' ' },
    { mode: 'invalid', message: 'React' },
    { mode: 'explain', message: 3 },
    { mode: 'quiz', message: 'React', previousQuestions: [3] },
    null,
  ]) {
    assert.equal((await api.post(body)).status, 400)
  }
  assert.equal(api.calls.length, 0)
})

test('explanation remains a plain text answer', async () => {
  const api = setup('React 개념 설명')
  const response = await api.post({ mode: 'explain', message: 'React란?' })
  assert.deepEqual(await response.json(), { answer: 'React 개념 설명' })
  assert.equal(api.calls[0].input, 'React란?')
})

test('missing quiz answer and upstream failure return errors', async () => {
  const invalid = setup(JSON.stringify({ answer: '문제만 있음' }))
  assert.equal((await invalid.post({ mode: 'quiz', message: 'React' })).status, 502)
  const failed = setup('', true)
  assert.equal((await failed.post({ mode: 'explain', message: 'React' })).status, 500)
})
