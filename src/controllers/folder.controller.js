const STATUS = require('../constant/status.constant')
const Folder = require('../models/folder.modal')
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

controller.uploadFolder = async (req, res) => {
   try {
      const { folderName, folderId } = req.body
      console.log(folderName, 'here in the body')
      if (!folderName) return res.status(STATUS.BAD_REQUEST).json({ message: 'File is required' })

      const newFolder = new Folder({
         folderName: folderName,
         folderId: folderId ? folderId : null,
         user: req.user._id,
      })
      await newFolder.save()
      console.log(newFolder)
      res.status(STATUS.SUCCESS).json({ message: 'Folder created successfully', folder: newFolder })
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

controller.getAllFolders = async (req, res) => {
   try {
      const userId = verifyToken(req.headers.authorization)
      if (!userId) {
         return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
      }
      console.log(req.query, 'here')
      const { page, sortoption } = req.query

      const pageSize = 8
      const skipCount = (page - 1) * pageSize
      let folders
      let totalFolders
      let totalPages
      folders = await Folder.find({ user: userId, folderId: null })
         .sort({ createdAt: sortoption })
         .skip(skipCount)
         .limit(pageSize)
         // .populate('folderId', '-__v')
         //  .populate('FolderId', '_v')
         .exec()
      console.log(folders)
      for (let index = 0; index < folders.length; index++) {
         const element = folders[index];
         console.log(element);
      }
      totalFolders = await Folder.countDocuments({ user: userId, folderId: null })
      totalPages = Math.ceil(totalFolders / pageSize)
      if (folders.length < 1) {
         return res.status(STATUS.NOT_FOUND).json({ message: 'Folders not found' })
      }
      return res.status(STATUS.SUCCESS).json({ message: 'folders found', totalFolders, totalPages, folders })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

controller.getSingleFolder = async (req, res) => {
   try {
      const userId = verifyToken(req.headers.authorization)
      if (!userId) {
         return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
      }
      console.log(req.query, 'here')
      const { page, sortoption, folderId } = req.query

      const pageSize = 8
      const skipCount = (page - 1) * pageSize
      let folders, files
      let totalFolders, totalFiles
      let totalPages, filePages
      folders = await Folder.find({ user: userId, folderId })
         .sort({ createdAt: sortoption })
         .skip(skipCount)
         .limit(pageSize)
         .exec()

      totalFolders = await Folder.countDocuments({ user: userId, folderId })
      totalPages = Math.ceil(totalFolders / pageSize)
      // console.log(folders, 'folders', totalFolders, totalPages)

      files = await File.find({ user: userId, folderId })
         // .populate("folderId","folderName")
         .sort({ createdAt: sortoption })
         .skip(skipCount)
         .limit(pageSize)
         .exec()
      console.log(files);
      totalFiles = await File.countDocuments({ user: userId, folderId })
      filePages = Math.ceil(totalFiles / pageSize)

      if (folders.length < 1 && files.length < 1) {
         return res.status(STATUS.NOT_FOUND).json({ message: 'content not found' })
      }
      return res.status(STATUS.SUCCESS).json({
         message: 'content found',
         totalRecords: totalFolders + totalFiles,
         totalPage: Math.ceil((totalFolders + totalFiles) / pageSize),
         content: folders.concat(files),
      })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

// controller.getFile = async (req, res) => {
//    try {
//       const fileId = req.params.id
//       const file = await File.findById(fileId)
//       if (!file) return res.status(STATUS.NOT_FOUND).json({ message: 'File not found' })
//       return res.status(STATUS.SUCCESS).json(file)
//    } catch (error) {
//       return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
//    }
// }

// controller.getUserFiles = async (req, res) => {
//    try {
//       const { limit = 4, skip = 0 } = req.query
//       const files = await File.find({ user: req.params.id }).limit(+limit).skip(+skip)
//       if (!files) return res.status(STATUS.NOT_FOUND).send({ error: 'Files not found' })
//       return res.status(STATUS.SUCCESS).json(files)
//    } catch (error) {
//       return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
//    }
// }

// controller.getFileWithFormate = async (req, res) => {
//    try {
//       const userId = verifyToken(req.headers.authorization)
//       // console.log(userId)
//       if (!userId) {
//          return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
//       }
//       const formate = req.query.formate
//       const { page, sortoption } = req.query
//       console.log(req.query)
//       const pageSize = 8
//       const skipCount = (page - 1) * pageSize
//       let files
//       let totalFiles
//       let totalPages
//       // console.log(userId)

//       files = await File.find({
//          formate: { $regex: new RegExp(formate, 'i') },
//          user: userId,
//       })
//          .sort({ createdAt: sortoption })
//          .skip(skipCount)
//          .limit(pageSize)
//       totalFiles = await File.countDocuments({ formate: { $regex: new RegExp(formate, 'i') }, user: userId })
//       totalPages = Math.ceil(totalFiles / pageSize)
//       if (files.length < 1) {
//          return res.status(STATUS.NOT_FOUND).json({ message: 'Files not found' })
//       }
//       return res.status(STATUS.SUCCESS).json({ message: 'files found', totalFiles, totalPages, files })
//    } catch (error) {
//       return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' })
//    }
// }

// get Files By File Name

// controller.getFileWithName = async (req, res) => {
//    try {
//       const userId = verifyToken(req.headers.authorization)
//       // console.log(userId)
//       if (!userId) {
//          return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
//       }
//       const fileName = req.query.fileName
//       const { page, sortoption } = req.query
//       console.log(req.query)
//       const pageSize = 8
//       const skipCount = (page - 1) * pageSize
//       let files
//       let totalFiles
//       let totalPages
//       // console.log(userId)

//       files = await File.find({
//          title: { $regex: new RegExp(fileName, 'i') },
//          user: userId,
//       })
//          .sort({ createdAt: sortoption })
//          .skip(skipCount)
//          .limit(pageSize)
//       totalFiles = await File.countDocuments({ title: { $regex: new RegExp(fileName, 'i') }, user: userId })
//       totalPages = Math.ceil(totalFiles / pageSize)
//       if (files.length < 1) {
//          return res.status(STATUS.NOT_FOUND).json({ message: 'Files not found' })
//       }
//       return res.status(STATUS.SUCCESS).json({ message: 'filess found', totalFiles, totalPages, files })
//    } catch (error) {
//       return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' })
//    }
// }

// controller.updateFile = async (req, res) => {
//    try {
//       const updatedFile = await File.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
//       res.status(STATUS.SUCCESS).json(updatedFile)
//    } catch (error) {
//       return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
//    }
// }

// controller.deleteFile = async (req, res, next) => {
//    try {
//       const file = await File.findById(req.params.id)
//       if (!file) return res.status(STATUS.NOT_FOUND).json({ message: 'File not found' })
//       if (!req.user.isAdmin && !file.user === req.user._id)
//          return next(createError(STATUS.NOT_FOUND, `Access denied`))
//       await file.remove()
//       return res.status(STATUS.SUCCESS).json({ message: 'File deleted successfully' })
//    } catch (error) {
//       return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
//    }
// }

module.exports = controller
