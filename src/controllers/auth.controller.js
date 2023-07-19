const User = require('../models/user.model')
const createError = require('../utils/createError.utils')
const STATUS = require('../constant/status.constant')
const verifyToken = require('../utils/verifyToken.utils')
const { generateCode } = require('../utils/generateSixDigitCode')
const { sendEmail } = require('../utils/nodeMailer')

const controller = {}

controller.register = async (req, res, next) => {
   try {
      const { email } = req.body
      console.log(req.body)
      const sixDigitCode = generateCode()
      const isUserExisted = await User.findOne({ email })
      if (isUserExisted) return res.status(STATUS.CONFLICT).json({ message: 'User already existed' })
      const user = await User.create({
         ...req.body,
         passwordSecret: sixDigitCode,
      })
      console.log(user)
      const sent = sendEmail(email, user.email, 'emailVerification', user.passwordSecret)
      if (sent) {
         return res.status(STATUS.CREATED).json({ message: 'OTP sent successfully' })
      } else {
         return res.status(STATUS.BAD_REQUEST).json({ message: 'Failed to send email' })
      }
      // return res.status(STATUS.CREATED).json({ message: 'User successfully register' })
   } catch (err) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
   }
}

controller.verifyEmail = async (req, res) => {
   try {
      const { email, code } = req.body
      if (!email) {
         return res.status(STATUS.BAD_REQUEST).json({ message: 'Email is required' })
      }
      if (!code) {
         return res.status(STATUS.BAD_REQUEST).json({ message: 'Code is required' })
      }
      const user = await User.findOne({ email })
      if (!user) {
         return res.status(STATUS.NOT_FOUND).json({ message: 'Email is not existed' })
      }
      if (user.passwordSecret != code) {
         return res.status(STATUS.BAD_REQUEST).json({ message: 'Code is incorrect' })
      }
      user.isVerified = true
      await user.save()
      //   const intro = sendIntroEmail(email);
      //   if (intro) {
      return res.status(STATUS.SUCCESS).json({ message: 'Email is verified' })
      //   }
   } catch (error) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message })
   }
}

controller.login = async (req, res, next) => {
   try {
      const user = await User.findOne({ email: req.body.email })
      if (!user) return res.status(STATUS.NOT_FOUND).json({ message: 'User not existed' })

      const isMatch = await user.comparePassword(req.body.password)
      if (!isMatch) return res.status(STATUS.NOT_FOUND).json({ message: 'Wrong credentials' })

      const token = user.generateAuthToken()

      return res.status(STATUS.SUCCESS).json({ message: 'login success', token })
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
