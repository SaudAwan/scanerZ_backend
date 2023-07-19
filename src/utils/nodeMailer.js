const nodemailer = require('nodemailer')
const fs = require('fs')
let file
let subject

async function sendEmail(to, fullName, type, code, result) {
   let file
   let subject

   if (type === 'passwordReset') {
      file = fs.readFileSync('src/assets/templates/resetPassword.html', {
         encoding: 'utf-8',
      })
      file = file.replace('$code', code)
      file = file.replace('$name', fullName)

      subject = 'Reset ScanerZ Password'
   } else if (type === 'emailVerification') {
      file = fs.readFileSync('src/assets/welcome.html', {
         encoding: 'utf-8',
      })
      file = file.replace('$name', fullName)
      file = file.replace('$code', code)

      subject = 'Register ScanerZ'
   }
   console.log('here node mailer', to, file, subject)
   return send('alimuhammadghouri0@gmail.com', file, subject)
}

async function send(to, html, subject) {
   try {
      let from = process.env.SENDER_EMAIL
      let transporter = nodemailer.createTransport({
         host: process.env.EMAIL_HOST,
         port: 587,
         secure: false,
         auth: {
            user: from,
            pass: process.env.SENDER_PASSWORD,
         },
      })

      await transporter.sendMail({
         from: 'ScanerZ' + from,
         to: to,
         subject: subject,
         html: html,
      })
   } catch (error) {
      console.log(error)
   }
}

module.exports = {
   sendEmail,
}
