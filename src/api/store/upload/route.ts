import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { result } = await uploadFilesWorkflow(req.scope)
      .run({
        input: {
          files: req.body.files,
        }
      })

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error: error.message })
  }
}