const mongoose = require('mongoose')
const { hashPassword, comparePassword } = require('../utils/hashPassword.utils')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		validate: {
			validator: function (value) {
				return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)
			},
			message: 'Email is invalid',
		},
	},
	password: {
		type: String,
		required: true,
		minlength: 6,
	},
	isAdmin: {
		type: Boolean,
		default: false,
	},
})

userSchema.pre('save', async function (next) {
	try {
		if (this.isModified('password')) {
			this.password = await hashPassword(this.password)
		}
		next()
	} catch (err) {
		next(err)
	}
})

userSchema.methods.comparePassword = async function (candidatePassword) {
	try {
		const isMatch = await comparePassword(candidatePassword, this.password)
		return isMatch
	} catch (err) {
		throw new Error(err)
	}
}

userSchema.methods.generateAuthToken = function () {
	const token = jwt.sign(
		{
			_id: this._id,
		},
		process.env.JWT_SECRET
	)
	return token
}

const User = mongoose.model('User', userSchema)

module.exports = User
