const jwt = require('jsonwebtoken')
const createError = require('./createError.utils.js')

const verifyToken = (token) => {
	if (!token) return next(createError(401, 'You are not athenticated'))
	const { _id } = jwt.verify(token, process.env.JWT_SECRET)
	if (!_id) return next(createError(401, 'Token is not valid'))
	return _id
}

module.exports = verifyToken
