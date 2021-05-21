const express = require('express');
const app = express();
const nunjucjks = require('nunjucks');
const axios = require('axios');
const qs = require('qs');
const session = require('express-session');

console.log('test');

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
    res.render('index.html');
})

app.get('/auth/kako', (req, res)=>{
    const kakaoAuthURL =  `https://kauth.kakao.com/oauth/authorize?client_id=${kakao.clientID}&redirect_uri=${kakao.redirectUri}&response_type=code&scope=profile,account_email`;
    res.redirect(kakaoAuthURL);
})



// 로그인 요청, 회원 정보 요청 2번의 요청
app.get('/auth/kakao/callback', async (req, res)=>{
    //axios => Promise Object
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
                    code:req.query.code,
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
    console.log(user);
    req.session.kakao = user.data;
    

    res.redirect('/');
    
})

app.get('/auth/info',(req, res)=>{
    console.log(req.session);
    let {nickname, profile_image} = req.session.kakao.properties;
    res.render('info',{
        nickname, profile_image,
    });
    
})

app.listen(3000, ()=>{
    console.log('start with 3000');
})