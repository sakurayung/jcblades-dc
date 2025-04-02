import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createClient } from '@supabase/supabase-js'
import multer from "multer"

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."))
    }
  },
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    upload.single("image")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          error: true,
          message: "File upload error: " + err.message,
        })
      } else if (err) {
        return res.status(500).json({
          error: true,
          message: "Unknown error: " + err.message,
        })
      }

      const file = req.file
      if (!file) {
        return res.status(400).json({
          error: true,
          message: "No file uploaded",
        })
      }

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`
      const { data, error } = await supabase.storage
        .from('image') // Replace with your bucket name
        .upload(`uploads/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        })

      if (error) {
        console.error("Supabase upload error:", error)
        return res.status(500).json({
          error: true,
          message: "Failed to upload to storage",
        })
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('image')
        .getPublicUrl(`uploads/${fileName}`)

      res.status(200).json({
        message: "File uploaded successfully",
        data: {
          url: publicUrl,
          mimetype: file.mimetype,
          size: file.size,
        },
      })
    })
  } catch (error) {
    console.error("Error handling file upload:", error)
    res.status(500).json({
      error: true,
      message: "Server error while handling file upload",
    })
  }
}