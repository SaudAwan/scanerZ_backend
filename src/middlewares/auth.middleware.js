const jwt = require('jsonwebtoken')
const STATUS = require('../constant/status.constant')
const User = require('../models/user.model')
const createError = require('../utils/createError.utils')
const verifyToken = require('../utils/verifyToken.utils')

const authMiddleware = async (req, res, next) => {
   try {
      const userId = verifyToken(req.headers.authorization)
      const user = await User.findById(userId)
      if (!user) return next(createError(STATUS.NOT_FOUND, 'User not found'))
      req.user = user
      next()
   } catch (err) {
      res.status(STATUS.UNAUTHORIZED).json({
         status: STATUS.UNAUTHORIZED,
         message: err.message,
      })
   }
}

module.exports = authMiddleware
