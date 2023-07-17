const mongoose = require('mongoose')
const Schema = mongoose.Schema

const fileSchema = new Schema(
   {
      file: {
         type: String,
         required: true,
      },
      title: {
         type: String,
         required: true,
      },
      formate: {
         type: String,
         required: true,
      },
      qrCode: {
         type: String,
      },
      user: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'User is required'],
      },
   },
   {
      timestamps: true,
   }
)

const File = mongoose.model('File', fileSchema)

module.exports = File
