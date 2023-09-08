const express = require('express')
const router = express.Router()
const folderController = require('../controllers/folder.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.post('/uploadFolder', authMiddleware, folderController.uploadFolder)
// router.post('/uploadUrl', authMiddleware, fileController.saveUrl)
// router.get('/qrcode', authMiddleware, fileController.generateQRcode)
router.get('/get-folders', authMiddleware, folderController.getAllFolders)
router.get('/get-single-folder', authMiddleware, folderController.getSingleFolder)

// router.get('/search-files-by-name', authMiddleware, fileController.getFileWithName)
// router.get('/get-file-with-formate', authMiddleware, fileController.getFileWithFormate)
// router.get('/get-user-folder/:id', fileController.getUserFiles)
// router.get('/:id', fileController.getFile)
// router.put('/data/:id', authMiddleware, fileController.updateFile)
// router.delete('/:id', authMiddleware, fileController.deleteFile)

module.exports = router
