const STATUS = require('../constant/status.constant')
const File = require('../models/file.model')
const cloudinary = require('cloudinary').v2
const fs = require('fs')

controller = {}

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECRET,
})

controller.uploadFile = async (req, res) => {
	try {
		const file = req.files.file
		const result = await cloudinary.uploader.upload(file.tempFilePath)
		const newFile = new File({
			title: req.body.title,
			file: result.url,
			user: req.user._id,
		})
		fs.unlinkSync(req.files.file.tempFilePath)
		await newFile.save()
		res.status(STATUS.SUCCESS).json(newFile)
	} catch (error) {
		return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
			status: STATUS.INTERNAL_SERVER_ERROR,
			message: error.message,
		})
	}
}

controller.getAllFiles = async (req, res) => {
	try {
		const { limit = 4, skip = 0 } = req.query
		const files = await File.find({}).limit(+limit).skip(+skip)
		return res.status(STATUS.SUCCESS).json(files)
	} catch (error) {
		return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message })
	}
}

controller.getFile = async (req, res) => {
	try {
		const fileId = req.params.id
		const file = await File.findById(fileId)
		if (!file) return res.status(STATUS.NOT_FOUND).json({ message: 'File not found' })
		return res.status(STATUS.SUCCESS).json(file)
	} catch (error) {
		return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message })
	}
}

controller.getUserFiles = async (req, res) => {
	try {
		const { limit = 4, skip = 0 } = req.query
		const files = await File.find({ user: req.params.id }).limit(+limit).skip(+skip)
		if (!files) return res.status(STATUS.NOT_FOUND).send({ error: 'Files not found' })
		return res.status(STATUS.SUCCESS).json(files)
	} catch (error) {
		return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message })
	}
}

controller.updateFile = async (req, res) => {
	try {
		const updatedFile = await File.findByIdAndUpdate(
			req.params.id,
			{ $set: req.body },
			{ new: true }
		)
		res.status(STATUS.SUCCESS).json(updatedFile)
	} catch (error) {
		return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message })
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
		console.error(error)
	}
}

module.exports = controller
