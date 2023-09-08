const express = require('express')
const router = express.Router()
const authRoutes = require('./auth.route')
const fileRoutes = require('./file.route')
const folderRoutes = require('./folder.route')


router.use('/auth', authRoutes)
router.use('/file', fileRoutes)
router.use('/folder', folderRoutes)


module.exports = router
