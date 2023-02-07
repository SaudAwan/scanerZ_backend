const User = require('../models/user.model')
const createError = require('../utils/createError.utils')
const STATUS = require('../constant/status.constant')
const verifyToken = require('../utils/verifyToken.utils')

const controller = {}

controller.register = async (req, res, next) => {
   try {
      const { email } = req.body
      const isUserExisted = await User.findOne({ email })
      if (isUserExisted) return next(createError(STATUS.CONFLICT, 'User Already existed'))
      await User.create(req.body)
      return res.status(STATUS.CREATED).json({ msg: 'User successfully register' })
   } catch (err) {
      res.status(STATUS.INTERNAL_SERVER_ERROR).json({
         message: err.message,
      })
   }
}
controller.login = async (req, res, next) => {
   try {
      const user = await User.findOne({ email: req.body.email })
      if (!user) return next(createError(STATUS.NOT_FOUND, 'User not existed'))

      const isMatch = await user.comparePassword(req.body.password)
      if (!isMatch) return next(createError(STATUS.NOT_FOUND, 'Wrong credentials'))

      const token = user.generateAuthToken()
      return res
         .status(STATUS.SUCCESS)
         .cookie('access_token', token, {
            httpOnly: true,
         })
         .json({})
   } catch (error) {
      res.status(STATUS.INTERNAL_SERVER_ERROR).json({
         message: error.message,
      })
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
      res.status(STATUS.INTERNAL_SERVER_ERROR).json({
         message: error.message,
      })
   }
}

module.exports = controller
