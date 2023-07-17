const STATUS = require('../constant/status.constant')
const File = require('../models/file.model')
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
      console.log(file, 'here in the file')
      if (!file) return res.status(STATUS.BAD_REQUEST).json({ message: 'File is required' })
      const result = await cloudinary.uploader.upload(file.tempFilePath)
      console.log(result.url, 'result.url')
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
      console.log('here', req.headers)
      const userId = verifyToken(req.headers.authorization)
      if (!userId) {
         return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
      }
      const { page } = req.query
      const pageSize = 8
      const skipCount = (page - 1) * pageSize
      let files
      let totalFiles
      let totalPages
      files = await File.find({ user: userId }).skip(skipCount).limit(pageSize)
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
      const file = await File.findById(fileId)
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
      console.log(userId)
      if (!userId) {
         return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
      }
      const formate = req.query.formate
      const { page } = req.query
      const pageSize = 8
      const skipCount = (page - 1) * pageSize
      let files
      let totalFiles
      let totalPages
      console.log(userId)

      files = await File.find({
         formate: { $in: formate },
         user: userId,
      })
         .skip(skipCount)
         .limit(pageSize)
      totalFiles = await File.countDocuments({ user: userId })
      totalPages = Math.ceil(totalFiles / pageSize)
      if (files.length < 1) {
         return res.status(STATUS.NOT_FOUND).json({ message: 'Files not found' })
      }
      return res.status(STATUS.SUCCESS).json({ message: 'filess found', totalFiles, totalPages, files })
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
