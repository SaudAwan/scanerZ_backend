const jwt = require('jsonwebtoken')
const createError = require('./createError.utils.js')

const verifyToken = (header) => {
	if (!header) return createError(401, 'Please provide a token')
	const token = header.split(' ')[1]
	if (!token) return createError(401, 'You are not athenticated')
	const { _id } = jwt.verify(token, process.env.JWT_SECRET)
	if (!_id) return createError(401, 'Token is not valid')
	return _id
}

module.exports = verifyToken
