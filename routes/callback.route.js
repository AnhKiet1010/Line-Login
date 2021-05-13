const express = require('express');
const router = express.Router();

const {
    callback
} = require('../controllers/callback.controller');

router.get("/", callback);

module.exports = router;