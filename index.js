require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const cookieParser = require('cookie-parser');
const fs = require('fs');

/* Set up static file */
app.use(express.static('public'));
/* Set up bodyparser */
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

/* Set up view pug */
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/',async (req, res) => {
    
    if (req.cookies.access_token) {

        await fs.readFile('data.json', (err, data) => {
            if (err) throw err;
            let user = JSON.parse(data);
            if(user.userId === req.cookies.id) {
                res.render('index', {
                    name: user.displayName,
                    picture: user.pictureUrl,
                    email: user.email
                });
                return;
            }
        });
    } else {
        res.redirect('/login');
    }
})

app.get('/login', (req, res) => {
    res.render('login', {
        uri: process.env.REDIRECT_URI
    });
});

app.get('/callback', async (req, res) => {
    const result = await axios({
        method: "POST",
        url: "https://api.line.me/oauth2/v2.1/token",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        data: qs.stringify({
            'grant_type': 'authorization_code',
            'code': req.query.code,
            'redirect_uri': process.env.REDIRECT_URI,
            'client_id': process.env.CLIENT_ID,
            'client_secret': process.env.CLIENT_SECRET
        })
    });

    const userInfo1 = await axios({
        method: "POST",
        url: "https://api.line.me/oauth2/v2.1/verify",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        data: qs.stringify({
            'id_token': result.data.id_token,
            'client_id': process.env.CLIENT_ID
        })
    });


    const userInfo = await axios({
        method: "GET",
        url: "https://api.line.me/v2/profile",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            'Authorization': `Bearer ${result.data.access_token}`
        }
    });

    const { userId, displayName, pictureUrl, statusMessage } = userInfo.data;

    const user = {
        userId, displayName, pictureUrl, statusMessage, email: userInfo1.data.email
    }

    let data = JSON.stringify(user);

    await fs.writeFileSync('data.json', data);

    res
        .status(201)
        .cookie('access_token', result.data.access_token, {
            expires: new Date(Date.now() + 8 * 3600000) // cookie will be removed after 8 hours
        })
        .cookie('id', userInfo.data.userId)
        .redirect('/');
});

app.get("/logout", async (req,res) => {
    await axios({
        method: "POST",
        url: "https://api.line.me/oauth2/v2.1/revoke",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        data: qs.stringify({
            'client_id': process.env.CLIENT_ID,
            'client_secret': process.env.CLIENT_SECRET,
            'access_token': req.cookies.access_token
        })
    });

    res.clearCookie('access_token');
    res.clearCookie('id');
    res.redirect("/");
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})