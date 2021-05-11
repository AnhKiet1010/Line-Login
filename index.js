require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const port = process.env.PORT || 5000;
const User = require('./models/user.model');
const nodemailer = require("nodemailer");

async function main(mail) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();
  
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Fred Foo 👻" <foo@example.com>', // sender address
      to: mail, // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // html body
    });
  
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  }
  

/* Set up static file */
app.use(express.static('public'));
/* Set up bodyparser */
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const connectDB = require("./db");
// Connect to database
connectDB();

/* Set up view pug */
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/',async (req, res) => {
    
    if (req.cookies.access_token) {
        const user = await User.findOne({lineId: req.cookies.id}).exec();
        
        if(!user) {
            res.redirect('/login');
        } else {
            res.render('index', {
                name: user.name,
                picture: user.avatar,
                email: user.email,
                statusMessage: user.statusMessage
            });
        }
    } else {
        res.redirect('/login');
    }
})

app.get('/login', (req, res) => {
    if(req.cookies.access_token) {
        res.redirect('/');
    } else {
        res.render('login', {
            uri: process.env.REDIRECT_URI
        });
    }
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

    const savedUser = await User.findOne({lineId: userId}).exec();

    if(!savedUser) {
        const user = new User({
            lineId: userId,
            name: displayName,
            avatar: pictureUrl,
            statusMessage,
            email: userInfo1.data.email
        });

        
        await user.save(err => {
            if(err) {
                res.send("Error save User");
            }
        });
        await main(userInfo1.data.email).catch(console.error);
    } else {
        await User.findOneAndUpdate({lineId: userId}, {
            name: displayName,
            avatar: pictureUrl,
            statusMessage,
            email: userInfo1.data.email
        }).exec();
    }
    res
        .status(201)
        .cookie('access_token', result.data.access_token, {
            expires: new Date(Date.now() + 8 * 3600000) // cookie will be removed after 8 hours
        })
        .cookie('id', userInfo.data.userId)
        .redirect('/');
});

app.get("/logout", async (req,res) => {
    if(req.cookies.access_token) {
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
    }
    res.redirect("/login");
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})