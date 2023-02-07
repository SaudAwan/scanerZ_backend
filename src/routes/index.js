const express = require('express')
const router = express.Router()
const authRoutes = require('./auth.route')
const fileRoutes = require('./file.route')

router.use('/auth', authRoutes)
router.use('/file', fileRoutes)

module.exports = router
