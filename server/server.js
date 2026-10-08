const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const express = require ('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const {WebSocketServer} = require('ws');

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        const isLocalDevelopment = process.env.NODE_ENV !== 'production' &&
            /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
        callback(null, origin === process.env.FRONT_URL || isLocalDevelopment);
    },
}));
app.use(express.json());

const db=mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT||3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:{
        rejectUnauthorized:false
    }
})

app.get('/db-test', async (req,res)=>{
    try{
        await db.query('SELECT 1');
        res.json({ 
            message: 'DB 연결 성공'
        });
        console.log('DB 연결 성공');
    } catch (err) {
        console.log('DB 연결 실패');
        res.status(500).json({ 
            message: 'DB 연결 실패',
        });
    }
});

app.post('/signup', async (req,res)=>{
    const {name, username, password}=req.body

        if(typeof name !== 'string' || !name.trim() ||
            typeof username !== 'string' || !username.trim() ||
            typeof password !== 'string' || !password.trim()){
            return res.status(400).json({message:'모든 필드를 입력해주세요.'});
        }

    try{
    // 같은 아이디가 있는지 확인
    const [rows] =await db.execute('SELECT * FROM members where username=?', [username.trim()]);
    if(rows.length > 0){
        return res.status(400).json({
            message:'이미 존재하는 아이디입니다.'
        });
    }
    const hash=await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO members (name, username, password, provider) VALUES (?, ?, ?, ?)',
         [name.trim(), username.trim(), hash, 'local']);
    res.json({
        message:'회원가입이 완료되었습니다.'
    });

    }catch(err){
        console.error('회원가입 중 오류 발생:', err);
        return res.status(500).json({
            message:'회원가입 실패'
        });
    }
})

// 일반 로그인(내 서버의 테이블에서 조회)
app.post('/login', async (req,res)=>{
    const {username, password}=req.body
    if(typeof username !== 'string' || !username.trim() ||
        typeof password !== 'string' || !password.trim()){
        return res.status(400).json({message:'아이디와 비밀번호를 입력해주세요.'});
    }
    try{
        const [rows]=await db.execute('SELECT * FROM members WHERE username=?', [username.trim()]);
        if(rows.length === 0){
            return res.status(400).json({
                message:'존재하지 않는 아이디입니다.'
            });
        }
        const user=rows[0];
        const ok=typeof user.password === 'string' && await bcrypt.compare(password, user.password);
        if(!ok){
            return res.status(400).json({
                message:'비밀번호가 일치하지 않습니다.'
            });
        }
        res.json({
            message:'로그인 성공',
            user:{
                id:user.id,
                name:user.name,
                username:user.username
            }
        });

    }catch(err){
        console.error('로그인 중 오류 발생:', err);
        res.status(500).json({
            message:'로그인 실패'
        });
    }
        
})

/*
    소셜 로그인(네이버, 카카오)
    사용자가 네이버, 카카오 로그인을 클릭 -> express 서버의 /auth/naver, /auth/kakao로 이동
    -> express 서버가 네이버, 카카오 로그인 페이지로 이동하게 함
    -> 사용자가 로그인 함
    -> 네이버/카카오가 콜백 주소로 (express 서버) code를 전달(code는 임시 교환권)
    -> express 서버 code (임시 교환권)을 네이버/카카오에게 다시 줌
    -> 네이버/카카오가 access_token을 발급해 express 서버에게 다시 줌
    // access_token: 임시 허가증
    -> express 서버가 access_token을 보여주고 사용자 정보를 요청
    -> 네이버/카카오가 이름, 이메일 등을 제공
    -> 내 db(mysql) 기본 회원이 있는지 확인하고 없으면 회원 추가
    -> express 서버가 로그인 처리
    -> 프론트가 로그인된 화면을 볼 수 있음
 */
app.get('/auth/naver', async (req,res)=>{
      const state = "next-project";
    const url ="https://nid.naver.com/oauth2.0/authorize" +
        "?response_type=code" +
        `&client_id=${process.env.NAVER_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(
            process.env.NAVER_REDIRECT_URI
        )}` + `&state=${state}`;

    // 네이버 로그인 화면으로 이동
    res.redirect(url);
})

// 네이버 콜백
app.get( "/auth/naver/callback",  async (req, res) => {
        const code = req.query.code;
        const state = req.query.state;
        try {
            // 네이버 Access Token 요청
            const tokenUrl = "https://nid.naver.com/oauth2.0/token" +
                "?grant_type=authorization_code" +
                `&client_id=${process.env.NAVER_CLIENT_ID}` +
                `&client_secret=${process.env.NAVER_CLIENT_SECRET}` +
                `&code=${code}` + `&state=${state}`;
            const tokenResponse = await fetch(tokenUrl);
            const tokenData =  await tokenResponse.json();


            // 네이버 회원정보 요청
            const userResponse = await fetch( "https://openapi.naver.com/v1/nid/me",
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );
            const naverData =   await userResponse.json();


            const socialId = String( naverData.response.id );
            const name = naverData.response.nickname || naverData.response.name || "네이버 사용자";

            // 이미 가입한 회원인지 확인
            const [users] = await db.execute(
                `SELECT * FROM members    WHERE provider = ?   AND social_id = ?`,
                    [ "naver", socialId ]
            );


            // 처음 로그인한 회원
            if (users.length === 0) {
                // 회원정보 저장
                await db.execute( `INSERT INTO members (name, provider, social_id) VALUES (?, ?, ?)`,
                    [  name, "naver", socialId  ]
                );
            }
            // 채팅 화면으로 이동
            res.redirect(`${process.env.FRONT_URL}/chat?name=${encodeURIComponent( name )}` );
        } catch (err) {
            console.log(err);
            res.status(500).send("네이버 로그인 실패" );
        }
    }
);



// 카카오 로그인 페이지로 이동
app.get('/auth/kakao', async (req,res)=>{
    const url ="https://kauth.kakao.com/oauth/authorize" +
        `?client_id=${process.env.KAKAO_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(
            process.env.KAKAO_REDIRECT_URI
        )}` + "&response_type=code";

    // 카카오 로그인 화면으로 이동
    res.redirect(url);
})

// 카카오 로그인 완료 후 돌아오는 주소(콜백 주소) code를 받은 상태
// 받은 code를 카카오에게 주고 토큰을 받음
app.get( "/auth/kakao/callback",  async (req, res) => {
        const code = req.query.code;
        try {
            // 카카오 Access Token 요청
            const tokenResponse = await fetch( "https://kauth.kakao.com/oauth/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: new URLSearchParams({
                        grant_type: "authorization_code",
                        client_id:  process.env.KAKAO_CLIENT_ID,
                        client_secret:  process.env.KAKAO_CLIENT_SECRET,
                        redirect_uri: process.env.KAKAO_REDIRECT_URI,
                        code
                    })
                }
            );
            const tokenData = await tokenResponse.json();

            // 토큰을 가지고 카카오 회원정보 요청
            const userResponse = await fetch( "https://kapi.kakao.com/v2/user/me",  {
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );
            const kakaoUser =  await userResponse.json();
            const socialId = String(kakaoUser.id);
            const name =  kakaoUser.properties?.nickname || "카카오 사용자";

            // 이미 가입한 카카오 회원인지 확인
            const [users] = await db.execute(
                `SELECT * FROM members   WHERE provider = ?  AND social_id = ?`,
                [  "kakao",  socialId  ]
            );


            // 처음 로그인한 회원
            if (users.length === 0) {
                // 회원정보 저장
                await db.execute(
                    `INSERT INTO members   (name, provider, social_id)   VALUES (?, ?, ?)`,
                    [  name,  "kakao",  socialId  ]
                );
            }
            // Next 채팅 화면으로 이동
            res.redirect(
                // http://localhost:3000/chat?name=이수호
                `${process.env.FRONT_URL}/chat?name=${encodeURIComponent(
                    name
                )}`
            );
        } catch (err) {
            console.log(err);
            res.status(500).send(
                "카카오 로그인 실패"
            );
        }
    }
);


const PORT = Number(process.env.PORT) || 4000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버 실행: ${PORT}`);
});

//

/*
 웹소켓: 브라우저와 서버가 연결을 계속 유지하면서 서로 데이터를 주고 받는 통신 방식
 기존의 우리가 알고 있는 fetch의 통신 방식
 : fatch(http://localhost:4000/login)의 경우 요청을 하고 응답하면 통신이 끝남
 next a -> 웹 소켓 -> 서버 -> 웹 소켓 -> next b
 next a 유저와 next b 유저가 데이터 웹소켓을 통하여 주고 받음
 브로드캐스트: 철수가 안녕하세여 입력하면 서버에 접속된 영희, 민수가 동시에 안녕하세요라는 글자를 볼 수 있음
*/


const wss = new WebSocketServer({server})

wss.on('connection', (socket)=>{
    console.log('채팅 접속')
    socket.on('message', (message)=>{
        const data=message.toString()
        wss.clients.forEach((client)=>{
            if(client.readyState === 1){
                client.send(data)
            }
        })
    })

    socket.on('close',()=>{
        console.log('채팅 종료')
    })

})

