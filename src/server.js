require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const connectToMongoDB = require('./config/connectDB.config')
const routes = require('./routes')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const qrcode = require('qrcode')

const app = express()

app.use(
   fileUpload({
      useTempFiles: true,
   })
)
app.use(cors())
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
   res.send('Welcome to the API')
})

app.use('/api/v1', routes)

const startServer = async () => {
   try {
      const PORT = process.env.PORT || 5002
      await connectToMongoDB()
      app.listen(PORT, () => {
         console.log(`server started on port http://localhost:${PORT}`)
      })
   } catch (err) {
      console.error(err.message)
      process.exit(1)
   }
}

startServer()
