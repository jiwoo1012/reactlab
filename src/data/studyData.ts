import type { StudyItem } from "@/types/study";

export const studyData: StudyItem[] = [
  {
    id: 1,
    title: "개념 설명",
    description:
      "궁금한 React 개념을 AI에게 쉽게 설명받습니다.",
    mode: "explain",
  },
  {
    id: 2,
    title: "문제 만들기",
    description:
      "입력한 주제로 간단한 문제를 만들어줍니다.",
    mode: "quiz",
  },
  {
    id: 3,
    title: "힌트 받기",
    description:
      "정답 대신 해결할 수 있는 힌트를 받습니다.",
    mode: "hint",
  },
]