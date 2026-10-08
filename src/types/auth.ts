// 회원정보 타입
export type User = {
  id: number;
  name: string;
  username: string;
};


// 로그인 응답 타입
export type LoginResponse = {
  message: string;
  user?: User;
};