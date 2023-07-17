const express = require('express')
const router = express.Router()
const fileController = require('../controllers/file.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.post('/upload', authMiddleware, fileController.uploadFile)
router.post('/uploadUrl', authMiddleware, fileController.saveUrl)
router.get('/qrcode', authMiddleware, fileController.generateQRcode)
router.get('/get-files', authMiddleware, fileController.getAllFiles)
router.get('/get-file-with-formate', authMiddleware, fileController.getFileWithFormate)
router.get('/get-user-files/:id', fileController.getUserFiles)
router.get('/:id', fileController.getFile)
router.put('/data/:id', authMiddleware, fileController.updateFile)
router.delete('/:id', authMiddleware, fileController.deleteFile)

module.exports = router
