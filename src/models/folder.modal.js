const mongoose = require('mongoose')
const Schema = mongoose.Schema

const folderSchema = new Schema(
   {
      folderName: {
         type: String,
         required: true,
      },
      folderId: {
         type: Schema.Types.ObjectId,
         ref: 'Folder',
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

folderSchema.index({ createdAt: 1 })

const Folder = mongoose.model('Folder', folderSchema)

module.exports = Folder
