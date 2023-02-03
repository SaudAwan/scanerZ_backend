const express = require('express')
const bodyParser = require('body-parser')
const cookiParser = require('cookie-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv').config()
const app = express()
const db = require('./db/db')
const allRoutes = require('./routes/index')

db()

app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookiParser())

app.use('/api', allRoutes)

app.get('/test', (req, res) => {
	res.send('hello world')
})

app.listen(process.env.PORT, () => {
	console.log(`server started on port ${process.env.PORT}`)
})
