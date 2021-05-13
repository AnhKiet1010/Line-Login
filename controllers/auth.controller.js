const axios = require('axios');
const User = require('../models/user.model');
const qs = require('qs');

exports.index = async (req, res) => {
    
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
};

exports.login = (req, res) => {
    if(req.cookies.access_token) {
        res.redirect('/');
    } else {
        res.render('login', {
            uri: process.env.REDIRECT_URI
        });
    }
}

exports.logout =  async (req,res) => {
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
}