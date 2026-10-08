import type { Metadata } from 'next'
import "@/styles/globals.scss";
import Header from './components/Header';

export const metadata: Metadata = {
  title: "React AI Study",
  description: "React AI 학습 프로젝트"
};

type Props = {
  children: React.ReactNode
}

const RootLayout = ({ children }: Props) => {
  return (
    <html lang="ko">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}

export default RootLayout