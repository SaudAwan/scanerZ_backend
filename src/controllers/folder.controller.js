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
      // console.log(folderName, 'here in the body')
      if (!folderName) return res.status(STATUS.BAD_REQUEST).json({ message: 'File is required' })

      const newFolder = new Folder({
         folderName: folderName,
         folderId: folderId ? folderId : null,
         user: req.user._id,
      })
      await newFolder.save()
      // console.log(newFolder)
      res.status(STATUS.SUCCESS).json({ message: 'Folder created successfully', folder: newFolder })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message })
   }
}

controller.saveUrl = async (req, res) => {
   try {
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
      // console.log(req.query, 'here')
      const { page, sortoption } = req.query

      const pageSize = 24
      const skipCount = (page - 1) * pageSize
      let folders
      let totalFolders
      let totalPages
      folders = await Folder.find({ user: userId, folderId: null })
         .sort({ createdAt: sortoption })
         .skip(skipCount)
         .limit(pageSize)
         .exec()
      // console.log(folders)
      for (let index = 0; index < folders.length; index++) {
         const element = folders[index]
         console.log(element)
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
      // console.log(req.query, 'here')
      const { page, sortoption, folderId } = req.query

      const pageSize = 24
      const skipCount = ((page - 1) * pageSize) / 2
      let folders, files
      let totalFolders, totalFiles
      let totalPages, filePages
      folders = await Folder.find({ user: userId, folderId })
         .skip(skipCount)
         .limit(pageSize / 2)
         .exec()

      totalFolders = await Folder.countDocuments({ user: userId, folderId })
      totalPages = Math.ceil(totalFolders / pageSize)
      // console.log(folders, 'folders', totalFolders, totalPages)

      files = await File.find({ user: userId, folderId })
         .skip(skipCount)
         .limit(pageSize / 2)
         .exec()

      totalFiles = await File.countDocuments({ user: userId, folderId })
      filePages = Math.ceil(totalFiles / pageSize)

      if (folders.length < 1 && files.length < 1) {
         return res.status(STATUS.NOT_FOUND).json({ message: 'content not found' })
      }
      const combinedContent = folders.concat(files)

      // Sort the combined array based on the dynamic `sortoption`
      combinedContent.sort((a, b) => {
         if (sortoption == -1) {
            return b.createdAt - a.createdAt
         } else {
            return a.createdAt - b.createdAt
         }
      })

      return res.status(STATUS.SUCCESS).json({
         message: 'content found',
         totalRecords: totalFolders + totalFiles,
         totalPage: Math.ceil((totalFolders + totalFiles) / pageSize),
         content: combinedContent,
      })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

controller.getSidebarFolders = async (req, res) => {
   try {
      const userId = verifyToken(req.headers.authorization)
      if (!userId) {
         return res.status(STATUS.UNAUTHORIZED).json({ message: 'You are not logged in' })
      }

      const MAX_NESTING_LEVEL = 3 // Set the maximum nesting level you want

      const populateContent = async (folder, currentLevel) => {
         if (currentLevel >= MAX_NESTING_LEVEL) {
            return folder
         }

         const firstFiles = await File.find({ user: userId, folderId: folder._id })
         const firstFolders = await Folder.find({ user: userId, folderId: folder._id })

         // Create a new object with the content attribute
         const folderWithContent = {
            ...folder.toObject(),
            content: firstFolders.concat(firstFiles),
         }

         const contentPromises = folderWithContent.content.map(async (subFolder) => {
            return await populateContent(subFolder, currentLevel + 1)
         })

         folderWithContent.content = await Promise.all(contentPromises)

         return folderWithContent
      }

      // Find root folders with folderId set to null
      let rootFolders = await Folder.find({ user: userId, folderId: null }).sort({ createdAt: -1 }).exec()

      // Create a new array with objects containing the content attribute
      const rootFoldersWithContent = await Promise.all(
         rootFolders.map(async (rootFolder) => {
            return await populateContent(rootFolder, 0)
         })
      )
      return res.status(STATUS.SUCCESS).json({
         message: 'content found',
         folders: rootFoldersWithContent,
      })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

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
