  const express = require('express');
const router = express.Router();

const {
    index,
    login,
    logout
} = require('../controllers/auth.controller');

router.get("/", index);
router.get("/logout", logout);
router.get("/login", login);

module.exports = router;