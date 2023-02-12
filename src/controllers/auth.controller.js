const User = require('../models/user.model')
const createError = require('../utils/createError.utils')
const STATUS = require('../constant/status.constant')
const verifyToken = require('../utils/verifyToken.utils')

const controller = {}

controller.register = async (req, res, next) => {
   try {
      const { email } = req.body
      const isUserExisted = await User.findOne({ email })
      if (isUserExisted) return res.status(STATUS.CONFLICT).json({ message: 'User already existed' })
      await User.create(req.body)
      return res.status(STATUS.CREATED).json({ message: 'User successfully register' })
   } catch (err) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}
controller.login = async (req, res, next) => {
   try {
      const user = await User.findOne({ email: req.body.email })
      if (!user) return res.status(STATUS.NOT_FOUND).json({ message: 'User not existed' })

      const isMatch = await user.comparePassword(req.body.password)
      if (!isMatch) return res.status(STATUS.NOT_FOUND).json({ message: 'Wrong credentials' })

      const token = user.generateAuthToken()
      return res
         .status(STATUS.SUCCESS)
         .cookie('access_token', token, {
            httpOnly: true,
         })
         .json({})
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

controller.logedIn = async (req, res, next) => {
   try {
      const userId = verifyToken(req.headers.authorization)
      const user = await User.findById(userId)
      if (!user) return next(createError(STATUS.NOT_FOUND, 'User not found'))
      const { password, ...otherDetails } = user._doc
      return res.status(STATUS.SUCCESS).json({ user: otherDetails })
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

module.exports = controller
