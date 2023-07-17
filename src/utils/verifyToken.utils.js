const jwt = require('jsonwebtoken')
const createError = require('./createError.utils.js')

const verifyToken = (header) => {
   if (!header) {
      const error = createError(401, 'You are not logged in')
      throw error
   }

   const token = header.split(' ')[1]

   if (!token) {
      const error = createError(401, 'You are not authenticated')
      throw error
   }

   try {
      const { _id } = jwt.verify(token, process.env.JWT_SECRET)
      if (!_id) {
         const error = createError(401, 'Token is not valid')
         throw error
      }
      return _id
   } catch (error) {
      const tokenError = createError(401, 'Token is not valid')
      throw tokenError
   }
}

module.exports = verifyToken
