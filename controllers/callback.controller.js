const axios = require('axios');
const User = require('../models/user.model');
const qs = require('qs');


exports.callback = async (req, res) => {
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
}