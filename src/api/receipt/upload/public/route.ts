import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import multer from "multer";
import { promisify } from "util";
import ReceiptPaymentImage from "src/modules/receipt/service";
import { RECEIPT_IMAGE_MODULE } from "src/modules/receipt";
import { container } from "@medusajs/framework";

/**
 * * Handles file uploads and processes them using the uploadFilesWorkflow. 
 *  Instead of making a middleware, we are using the uploadFilesWorkflow directly in the route handler.
 * * This allows us to handle the file upload and processing in a single step.
 */
const upload = multer();
const uploadMiddleware = promisify(upload.array("files"));

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    await uploadMiddleware(req as any, res as any);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded" });
    }

    // @ts-ignore
    const files = req.files.map((file) => ({
      filename: file.originalname,
      mimeType: file.mimetype,
      content: file.buffer.toString("base64"),
      access: "public",
    }));

    const { result } = await uploadFilesWorkflow(req.scope).run({
      input: { files },
    });

    const imageRepository: ReceiptPaymentImage = container.resolve(RECEIPT_IMAGE_MODULE)

    const savedFileRecords = []
    for (const fileResult of result) {
        /***
         * Save to files to the database by using the MedusaService
         * that I created in the receipt module.
         */
        const correspondingFile = files.find(f => fileResult.id.includes(f.filename))


        const data = await imageRepository.createReceiptImages({
            filename: correspondingFile?.filename || fileResult.id.split("/").pop(),
            mime_type: correspondingFile?.mimeType || "image/jpeg",
            url: fileResult.url,
            metadata: {}, 
        })
        savedFileRecords.push(data)
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
}
