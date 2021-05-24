const express = require('express');
const app = express();
const nunjucjks = require('nunjucks');
const axios = require('axios');
const qs = require('qs');
const session = require('express-session');


console.log('test');

app.use(express.urlencoded({extended:false}));
app.use(session({
    secret:'adasda',
    resave:false,
    secure:false,
    saveUninitialized:false,
}))

const REST_API = "1c5a3e706894eba05d0a985e159c68d5";
const secret_key = "WGCZw68mz8uRwDGJnKuC2lhjD8tCIGaP";
const redirect_uri = "http://localhost:3000/auth/kakao/callback"; // 여기서 지정한 포트 번호가 아니면 모두 에러

app.set('view engine', 'html');
nunjucjks.configure('views', {
    express:app,
})

const kakao = {
    clientID : REST_API,
    clientSecret : secret_key,
    redirectUri : redirect_uri,
}

app.get('/', (req, res) => {
    const {msg} = req.query;
    console.log(req.session.authData);
    res.render('index.html',{
        msg,
        loginInfo: req.session.authData,
    });
})

app.get('/auth/kako', (req, res)=>{
    const kakaoAuthURL =  `https://kauth.kakao.com/oauth/authorize?client_id=${kakao.clientID}&redirect_uri=${kakao.redirectUri}&response_type=code&scope=profile,account_email`;
    res.redirect(kakaoAuthURL);
})


app.get('/login', (req, res)=>{
    res.render('login');
})

app.post('/login', (req, res)=>{
    console.log(req.body);
    const {session, body} = req;
    const {userId, userPw} = body;
})


// 로그인 요청, 회원 정보 요청 2번의 요청
app.get('/auth/kakao/callback', async (req, res)=>{
    //axios => Promise Object

    const {session, query} = req;
    const {code} = query;

    try{
        token = await axios({
            method: 'POST',
                url: 'https://kauth.kakao.com/oauth/token',
                headers:{
                    'content-type':'application/x-www-form-urlencoded'
                }, // npm install qs
                data:qs.stringify({
                    grant_type:'authorization_code', // 특정 스트링 
                    client_id:kakao.clientID,
                    client_secret:kakao.clientSecret,
                    redirectUri:kakao.redirectUri,
                    code, // code : code (const {code} = query;) req.query.code;
                }) // 객체를 String으로 변환.
        })
    }catch(err){
        res.json(err.data);
    }
    let user;
    try{
        user = await axios({
            method:'GET',
            url: 'https://kapi.kakao.com/v2/user/me',
            headers:{
                Authorization: `Bearer ${token.data.access_token}`
            }
        })
    }catch(err){
        res.json(err.data);
    }
  

    const authData = {
        ...token.data,     // 비구조 할당문 -> 명시적으로 할당되지 않은 나머지 값들을 사용, 깊은 복사 (token 이전의 모든 값을)
        ...user.data,
    }

    req.session.authData = {
        ["kakao"] : authData,
    }
    console.log(req.session);

    req.session.kakao = user.data;
    

    res.redirect('/');
    
})

const authMiddleware = (req, res, next) => {
    const {session} = req;
    if(session.authData == undefined){
        console.log('로그인 x');
        res.redirect('/?msg=로그인x');
    }else{
        console.log('로그인 o');
        next();
    }
}


app.get('/auth/info', authMiddleware,(req, res)=>{
    const {session} = req  // req.session
    const {authData} = req.session; // req.session.authData
    let {nickname, profile_image} = session.kakao.properties;
    const provider = Object.keys(authData)[0];
    console.log(provider);
    let userInfo = {}
    switch(provider){
        case "kakao": 
            userInfo = {
                userId:authData[provider].properties.nickname,
            }
            break;
        case "local":
            userInfo = {
                userId:authData[provider].userId,
            }
    }
    
    res.render('info',{
        userInfo, profile_image,
    });
   
    
})


app.get('/auth/kakao/unlink',authMiddleware, async (req, res)=>{
    const {session} = req;
    const{access_token} = session.authData.kakao;

    if(userId = 'root' && userPw == '1234'){
        const data = {
            userId,
        }
        session.authData = {
            ['local'] : data,
        }

        res.redirect('/?msg="로그인 완료');
    }else{
        res.redirect('/?msg=아이디와 패스워드를 확인해주세요');
    }
    
    console.log(access_token);

    let unlink;
    try{
        unlink = await axios({
            mehtod:"POST",
            url:"https://kapi.kakao.com/v1/user/unlink",
            headers:{
                Authorization: `Bearer ${access_token}`
            }
        })
    } catch (error){
        res.json(error.data);
    }

    console.log(unlink.data); // 카카오에서는 아이디 로그아웃 or 탈퇴 완료
    // local 세션을 지워줘야함
    const {id} = unlink.data;
    
    if(session.authData["kakao"].id == id){
        delete session.authData;
    }

    res.redirect('/?msg=로그아웃 완료');
})


app.get('/auth/logout', (req, res)=>{
    const {authData} = req.session; // req.session.authData
    const provider = Object.keys(authData)[0];

    switch(provider){
        case "local":
          
            delete req.session.authData;
            res.redirect('/?msg=로그아웃 되었습니다')
          
            break;
        case "kakao":
            res.redirect('/auth/kakao/unlink');
            break;
    }
})

app.listen(3000, ()=>{
    console.log('start with 3000');
})