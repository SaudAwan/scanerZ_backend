const mongoose = require('mongoose')

const db = () => {
	mongoose.set('strictQuery', false)
	mongoose.connect(process.env.MONGO_URL, () => {
		console.log('database connected')
	})
}
module.exports = db
