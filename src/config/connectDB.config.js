const mongoose = require('mongoose')

const connectToMongoDB = async () => {
	try {
		mongoose.set('strictQuery', false)
		mongoose.connect(process.env.MONGO_URL)
		console.log('MongoDB connected...')
	} catch {
		console.error(err.message)
		process.exit(1)
	}
}
module.exports = connectToMongoDB
