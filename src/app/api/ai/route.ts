import OpenAI from 'openai'
import type { AiResponse } from '@/types/study'

export const POST = async (request: Request) => {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return Response.json({ message: '잘못된 요청입니다.' }, { status: 400 })
    }
    const { message, mode, currentQuiz, previousQuestions } = body as Record<string, unknown>
    if (mode !== 'explain' && mode !== 'quiz' && mode !== 'hint') {
      return Response.json({ message: '학습 모드를 확인해주세요.' }, { status: 400 })
    }
    if (typeof message !== 'string' || (mode !== 'hint' && !message.trim())) {
      return Response.json({ message: '질문을 입력해주세요.' }, { status: 400 })
    }
    if (mode === 'hint' && (typeof currentQuiz !== 'string' || !currentQuiz.trim())) {
      return Response.json({ message: '먼저 퀴즈를 출제해주세요.' }, { status: 400 })
    }
    if (previousQuestions !== undefined && (
      !Array.isArray(previousQuestions) ||
      !previousQuestions.every((item: unknown) => typeof item === 'string')
    )) {
      return Response.json({ message: '이전 문제 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const instructions = mode === 'quiz'
      ? 'React 초보자를 위한 쉬운 문제 1개를 만드세요. answer에는 정답이 없는 문제와 필요한 선택지만, questionAns에는 정답과 해설을 작성하세요. 이전 문제와 다른 문제를 출제하세요. 한국어로 답하세요.'
      : mode === 'hint'
        ? 'React 초보자를 위한 선생님입니다. 전달된 현재 퀴즈를 풀기 위한 짧은 힌트만 한국어로 제공하세요. 정답이나 완성된 풀이를 공개하지 마세요.'
        : 'React 초보자를 위한 선생님입니다. 질문의 개념을 쉬운 한국어로 설명하고 가능하면 간단한 코드 예제를 보여주세요.'
    const input = mode === 'hint'
      ? JSON.stringify({ currentQuiz, additionalQuestion: message })
      : mode === 'quiz'
        ? JSON.stringify({ topic: message, previousQuestions: previousQuestions?.slice(-10) ?? [] })
        : message

    const response = await openai.responses.create({
      model: 'gpt-5-mini',
      instructions,
      input,
      ...(mode === 'quiz' ? {
        text: {
          format: {
            type: 'json_schema' as const,
            name: 'study_quiz',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                answer: { type: 'string' },
                questionAns: { type: 'string' },
              },
              required: ['answer', 'questionAns'],
              additionalProperties: false,
            },
          },
        },
      } : {}),
    })

    if (response.status !== 'completed' || !response.output_text.trim()) {
      return Response.json({ message: '답변을 생성하지 못했습니다. 다시 시도해주세요.' }, { status: 502 })
    }
    if (mode === 'quiz') {
      const quiz: unknown = JSON.parse(response.output_text)
      if (!quiz || typeof quiz !== 'object' ||
        !('answer' in quiz) || typeof quiz.answer !== 'string' || !quiz.answer.trim() ||
        !('questionAns' in quiz) || typeof quiz.questionAns !== 'string' || !quiz.questionAns.trim()) {
        return Response.json({ message: '문제 형식이 올바르지 않습니다. 다시 시도해주세요.' }, { status: 502 })
      }
      return Response.json({ answer: quiz.answer, questionAns: quiz.questionAns } satisfies AiResponse)
    }
    return Response.json({ answer: response.output_text } satisfies AiResponse)
  } catch {
    return Response.json({ message: 'AI 요청 중에 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
  }
}
