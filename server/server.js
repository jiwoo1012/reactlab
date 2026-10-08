
const path = require('node:path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true,
});

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { WebSocketServer } = require('ws');

const app = express();

// ========================================
// CORS 설정 - Vercel과 로컬 개발 환경 허용
// ========================================

const allowedOrigins = [
  'https://reactlab-nu.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS 허용되지 않은 출처'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ========================================
// MySQL 연결
// ========================================

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

// DB 연결 테스트
app.get('/db-test', async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      message: 'DB 연결 성공',
    });

    console.log('DB 연결 성공');
  } catch (err) {
    console.error('DB 연결 실패:', err);

    res.status(500).json({
      message: 'DB 연결 실패',
    });
  }
});

// ========================================
// 일반 회원가입
// ========================================

app.post('/signup', async (req, res) => {
  const { name, username, password } = req.body;

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof username !== 'string' || !username.trim() ||
    typeof password !== 'string' || !password.trim()
  ) {
    return res.status(400).json({
      message: '모든 필드를 입력해주세요.',
    });
  }

  try {
    // 같은 아이디가 있는지 확인
    const [rows] = await db.execute(
      'SELECT * FROM members WHERE username=?',
      [username.trim()]
    );

    if (rows.length > 0) {
      return res.status(400).json({
        message: '이미 존재하는 아이디입니다.',
      });
    }

    // 비밀번호 암호화
    const hash = await bcrypt.hash(password, 10);

    await db.execute(
      'INSERT INTO members (name, username, password, provider) VALUES (?, ?, ?, ?)',
      [name.trim(), username.trim(), hash, 'local']
    );

    res.json({
      message: '회원가입이 완료되었습니다.',
    });
  } catch (err) {
    console.error('회원가입 중 오류 발생:', err);

    return res.status(500).json({
      message: '회원가입 실패',
    });
  }
});

// ========================================
// 일반 로그인
// ========================================

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (
    typeof username !== 'string' || !username.trim() ||
    typeof password !== 'string' || !password.trim()
  ) {
    return res.status(400).json({
      message: '아이디와 비밀번호를 입력해주세요.',
    });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM members WHERE username=?',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: '존재하지 않는 아이디입니다.',
      });
    }

    const user = rows[0];

    const ok =
      typeof user.password === 'string' &&
      await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(400).json({
        message: '비밀번호가 일치하지 않습니다.',
      });
    }

    res.json({
      message: '로그인 성공',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('로그인 중 오류 발생:', err);

    res.status(500).json({
      message: '로그인 실패',
    });
  }
});

// ========================================
// 네이버 소셜 로그인
// ========================================

// 네이버 로그인 페이지로 이동
app.get('/auth/naver', async (req, res) => {
  const state = 'next-project';

  const url =
    'https://nid.naver.com/oauth2.0/authorize' +
    '?response_type=code' +
    `&client_id=${process.env.NAVER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(
      process.env.NAVER_REDIRECT_URI
    )}` +
    `&state=${state}`;

  res.redirect(url);
});

// 네이버 로그인 콜백
app.get('/auth/naver/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  try {
    // 네이버 Access Token 요청
    const tokenUrl =
      'https://nid.naver.com/oauth2.0/token' +
      '?grant_type=authorization_code' +
      `&client_id=${process.env.NAVER_CLIENT_ID}` +
      `&client_secret=${process.env.NAVER_CLIENT_SECRET}` +
      `&code=${code}` +
      `&state=${state}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    // 네이버 회원정보 요청
    const userResponse = await fetch(
      'https://openapi.naver.com/v1/nid/me',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const naverData = await userResponse.json();

    const socialId = String(naverData.response.id);

    const name =
      naverData.response.nickname ||
      naverData.response.name ||
      '네이버 사용자';

    // 기존 회원 확인
    const [users] = await db.execute(
      'SELECT * FROM members WHERE provider = ? AND social_id = ?',
      ['naver', socialId]
    );

    // 처음 로그인한 회원 저장
    if (users.length === 0) {
      await db.execute(
        'INSERT INTO members (name, provider, social_id) VALUES (?, ?, ?)',
        [name, 'naver', socialId]
      );
    }

    // Next.js 채팅 화면으로 이동
    res.redirect(
      `${process.env.FRONT_URL}/chat?name=${encodeURIComponent(name)}`
    );
  } catch (err) {
    console.error('네이버 로그인 오류:', err);

    res.status(500).send('네이버 로그인 실패');
  }
});

// ========================================
// 카카오 소셜 로그인
// ========================================

// 카카오 로그인 페이지로 이동
app.get('/auth/kakao', async (req, res) => {
  const url =
    'https://kauth.kakao.com/oauth/authorize' +
    `?client_id=${process.env.KAKAO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(
      process.env.KAKAO_REDIRECT_URI
    )}` +
    '&response_type=code';

  res.redirect(url);
});

// 카카오 로그인 콜백
app.get('/auth/kakao/callback', async (req, res) => {
  const code = req.query.code;

  try {
    // 카카오 Access Token 요청
    const tokenResponse = await fetch(
      'https://kauth.kakao.com/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.KAKAO_CLIENT_ID,
          client_secret: process.env.KAKAO_CLIENT_SECRET,
          redirect_uri: process.env.KAKAO_REDIRECT_URI,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    // 카카오 회원정보 요청
    const userResponse = await fetch(
      'https://kapi.kakao.com/v2/user/me',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const kakaoUser = await userResponse.json();

    const socialId = String(kakaoUser.id);

    const name =
      kakaoUser.properties?.nickname ||
      '카카오 사용자';

    // 기존 회원 확인
    const [users] = await db.execute(
      'SELECT * FROM members WHERE provider = ? AND social_id = ?',
      ['kakao', socialId]
    );

    // 처음 로그인한 회원 저장
    if (users.length === 0) {
      await db.execute(
        'INSERT INTO members (name, provider, social_id) VALUES (?, ?, ?)',
        [name, 'kakao', socialId]
      );
    }

    // Next.js 채팅 화면으로 이동
    res.redirect(
      `${process.env.FRONT_URL}/chat?name=${encodeURIComponent(name)}`
    );
  } catch (err) {
    console.error('카카오 로그인 오류:', err);

    res.status(500).send('카카오 로그인 실패');
  }
});

// ========================================
// Express 서버 실행
// ========================================

const PORT = Number(process.env.PORT) || 4000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`서버 실행: ${PORT}`);
});

// ========================================
// WebSocket 실시간 채팅
// ========================================

const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  console.log('채팅 접속');

  socket.on('message', (message) => {
    const data = message.toString();

    // 연결된 모든 클라이언트에게 메시지 전송
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(data);
      }
    });
  });

  socket.on('close', () => {
    console.log('채팅 종료');
  });
});
