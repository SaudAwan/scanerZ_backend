const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')

router.post('/register', authController.register)
router.post("/verify-email", authController.verifyEmail);
router.post('/login', authController.login)
router.post('/logedin', authController.logedIn)

module.exports = router
