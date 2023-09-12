const STATUS = require('../constant/status.constant')
const File = require('../models/file.model')
const Folder = require('../models/folder.modal')
const cloudinary = require('cloudinary').v2
const fs = require('fs')
const qrcode = require('qrcode')
const isValidURL = require('../utils/isValidURL.utils')
const createError = require('../utils/createError.utils')
const verifyToken = require('../utils/verifyToken.utils')

controller = {}

cloudinary.config({
   cloud_name: process.env.CLOUD_NAME,
   api_key: process.env.API_KEY,
   api_secret: process.env.API_SECRET,
})

controller.uploadFile = async (req, res) => {
   try {
      const file = req.files.file
      // console.log(file, 'here in the file')
      if (!file) return res.status(STATUS.BAD_REQUEST).json({ message: 'File is required' })
      let result
      if (file.mimetype === 'video/mp4') {
         result = await cloudinary.uploader.upload(file.tempFilePath, { resource_type: 'video' })
      } else {
         result = await cloudinary.uploader.upload(file.tempFilePath)
      }
      // console.log(result.url, 'result.url')
      let mask = result.url
      if (!isValidURL(result.url)) mask = process.env.FRONTEND_DOMAIN + `file/${result.url}`
      const qrCode = await qrcode.toDataURL(mask)
      console.log(qrCode, 'qr code')
      // await res.contentType('image/png')
      // await res.send(qrCode)
      const newFile = await new File({
         title: req.body.title,
         file: result.secure_url,
         user: req.user._id,
         formate: file.mimetype,
         qrCode: qrCode,
         folderId: req.body.folderId,
      })
      fs.unlinkSync(req.files.file.tempFilePath)
      await newFile.save()
      res.status(STATUS.SUCCESS).json(newFile)
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message })
   }
}

controller.saveUrl = async (req, res) => {
   try {
      console.log(req.body)
      // const file = req.files.file
      // if (!file) return res.status(STATUS.BAD_REQUEST).json({ message: 'File is required' })
      // const result = await cloudinary.uploader.upload(file.tempFilePath)
      // console.log(result.url, 'result.url')
      const newFile = await new File({
         title: req.body.title,
         file: req.body.url,
         folderId: req.body.folderId,
         user: req.user._id,
         formate: 'urls',
         qrCode: req.body.qrCode,
      })
      // fs.unlinkSync(req.files.file.tempFilePath)
      await newFile.save()
      res.status(STATUS.SUCCESS).json({ newFile: newFile, message: 'File Saved' })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message })
   }
}

controller.getAllFiles = async (req, res) => {
   try {
      const userId = verifyToken(req.headers.authorization)
      if (!userId) {
         return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
      }
      console.log(req.query, 'here')
      const { page, sortoption } = req.query

      const pageSize = 8
      const skipCount = (page - 1) * pageSize
      let files
      let totalFiles
      let totalPages
      files = await File.find({ user: userId })
         .sort({ createdAt: sortoption })
         .skip(skipCount)
         .limit(pageSize)
      totalFiles = await File.countDocuments({ user: userId })
      totalPages = Math.ceil(totalFiles / pageSize)
      if (files.length < 1) {
         return res.status(STATUS.NOT_FOUND).json({ message: 'Files not found' })
      }
      return res.status(STATUS.SUCCESS).json({ message: 'filess found', totalFiles, totalPages, files })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

controller.getFile = async (req, res) => {
   try {
      const fileId = req.params.id
      const file = await File.findById(fileId).populate('folderId', 'folderName').exec()
      if (!file) return res.status(STATUS.NOT_FOUND).json({ message: 'File not found' })
      return res.status(STATUS.SUCCESS).json(file)
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

controller.getUserFiles = async (req, res) => {
   try {
      const { limit = 4, skip = 0 } = req.query
      const files = await File.find({ user: req.params.id }).limit(+limit).skip(+skip)
      if (!files) return res.status(STATUS.NOT_FOUND).send({ error: 'Files not found' })
      return res.status(STATUS.SUCCESS).json(files)
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

controller.getFileWithFormate = async (req, res) => {
   try {
      const userId = verifyToken(req.headers.authorization)
      // console.log(userId)
      if (!userId) {
         return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
      }
      const formate = req.query.formate
      const { page, sortoption } = req.query
      console.log(req.query)
      const pageSize = 8
      const skipCount = (page - 1) * pageSize
      let files
      let totalFiles
      let totalPages
      // console.log(userId)

      files = await File.find({
         formate: { $regex: new RegExp(formate, 'i') },
         user: userId,
      })
         .sort({ createdAt: sortoption })
         .skip(skipCount)
         .limit(pageSize)
      totalFiles = await File.countDocuments({ formate: { $regex: new RegExp(formate, 'i') }, user: userId })
      totalPages = Math.ceil(totalFiles / pageSize)
      if (files.length < 1) {
         return res.status(STATUS.NOT_FOUND).json({ message: 'Files not found' })
      }
      return res.status(STATUS.SUCCESS).json({ message: 'files found', totalFiles, totalPages, files })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' })
   }
}

// get Files By File Name

controller.getFileFolderWithName = async (req, res) => {
   try {
      const userId = verifyToken(req.headers.authorization)
      // console.log(userId)
      if (!userId) {
         return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
      }
      const fileName = req.query.fileName
      const { page, sortoption } = req.query
      console.log(req.query)
      const pageSize = 8
      const skipCount = (page - 1) * pageSize
      let folders, files
      let totalFolders, totalFiles
      let totalPages, filePages
      // console.log(userId)

      folders = await Folder.find({ folderName: { $regex: new RegExp(fileName, 'i') }, user: userId })
         .sort({ createdAt: sortoption })
         .skip(skipCount)
         .limit(pageSize)
         .exec()

      totalFolders = await Folder.countDocuments({
         folderName: { $regex: new RegExp(fileName, 'i') },
         user: userId,
      })
      totalPages = Math.ceil(totalFolders / pageSize)

      files = await File.find({
         title: { $regex: new RegExp(fileName, 'i') },
         user: userId,
      })
         .sort({ createdAt: sortoption })
         .skip(skipCount)
         .limit(pageSize)
      totalFiles = await File.countDocuments({ title: { $regex: new RegExp(fileName, 'i') }, user: userId })
      filePages = Math.ceil(totalFiles / pageSize)

      if (folders.length < 1 && files.length < 1) {
         return res.status(STATUS.NOT_FOUND).json({ message: 'content not found' })
      }
      return res.status(STATUS.SUCCESS).json({
         message: 'search found',
         totalRecords: totalFolders + totalFiles,
         totalPage: Math.ceil((totalFolders + totalFiles) / pageSize),
         content: folders.concat(files),
      })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' })
   }
}

controller.updateFile = async (req, res) => {
   try {
      const updatedFile = await File.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
      res.status(STATUS.SUCCESS).json(updatedFile)
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

controller.deleteFile = async (req, res, next) => {
   try {
      const file = await File.findById(req.params.id)
      if (!file) return res.status(STATUS.NOT_FOUND).json({ message: 'File not found' })
      if (!req.user.isAdmin && !file.user === req.user._id)
         return next(createError(STATUS.NOT_FOUND, `Access denied`))
      await file.remove()
      return res.status(STATUS.SUCCESS).json({ message: 'File deleted successfully' })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

controller.generateQRcode = async (req, res, next) => {
   try {
      // if(req.query){
      let link = req.query.link
      console.log(link)
      let mask = link
      if (!isValidURL(link)) mask = process.env.FRONTEND_DOMAIN + `file/${link}`
      const qrCode = await qrcode.toDataURL(mask)
      await res.contentType('image/png')
      await res.send(qrCode)
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

module.exports = controller
