import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import fs from 'fs'

const isCloudinaryConfigured = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'votre_api_key'

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

const storage = isCloudinaryConfigured 
  ? new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => {
        const isVideo = file.mimetype.startsWith('video')
        const isAudio = file.mimetype.startsWith('audio')
        return {
          folder: 'forum-multimedia',
          resource_type: isVideo || isAudio ? 'video' : 'image',
          allowed_formats: ['jpg','jpeg','png','gif','webp','mp4','mov','mp3','wav','ogg'],
        }
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = 'uploads/'
        if (!fs.existsSync(dir)) fs.mkdirSync(dir)
        cb(null, dir)
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
      }
    })

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})
