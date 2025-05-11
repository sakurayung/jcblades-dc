import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import multer from "multer";
import { promisify } from "util";
import ReceiptPaymentImage from "src/modules/receipt/service";
import { RECEIPT_IMAGE_MODULE } from "src/modules/receipt";
import { container } from "@medusajs/framework";
import { MedusaError, Modules } from "@medusajs/framework/utils";
import { Link } from "@medusajs/framework/modules-sdk";

const upload = multer();
const uploadMiddleware = promisify(upload.array("files"));

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    await uploadMiddleware(req as any, res as any);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded" });
    }
    //@ts-ignore
    const cartId = req.query.cart_id || req.body.cart_id;

    if (!cartId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cart ID is required"
      );
    }

    // @ts-ignore
    const filesToProcess = req.files.map((file) => ({
      filename: file.originalname,
      mimeType: file.mimetype,
      content: file.buffer,
      access: "public",
    }));

    const { result: workflowFileResults } = await uploadFilesWorkflow(
      req.scope
    ).run({
      input: { files: filesToProcess }, 
    });

    const imageRepository: ReceiptPaymentImage =
      container.resolve(RECEIPT_IMAGE_MODULE);
    const link = container.resolve("link") as Link;

    const savedFileRecords = [];
    if (Array.isArray(workflowFileResults)) {
      for (const fileResult of workflowFileResults) {
        const correspondingFile = filesToProcess.find((f) =>
          fileResult.id.includes(f.filename)
        );

        const dbRecord = await imageRepository.createReceiptImages({
          filename:
            correspondingFile?.filename || fileResult.id.split("/").pop(),
          mime_type: correspondingFile?.mimeType || "image/jpeg", 
          url: fileResult.url, 
          metadata: { cart_id: cartId },
        });

        await link.create({
          receipt_image: {
            receipt_image_id: dbRecord.id,
          },
          [Modules.CART]: {
            cart_id: cartId,
          },
        });

        savedFileRecords.push({
          ...dbRecord, 
        });
      }
    } else {
      console.warn(
        "uploadFilesWorkflow did not return an array in 'result'. Received:",
        workflowFileResults
      );
    }

    // *** THIS IS THE KEY CHANGE ***
    /**
     * The response now includes the saved file records with their metadata. In the front-end
     * it is labeled as "uploads" to be consistent with the previous implementation.
     */
    res.status(200).json({
      uploads: savedFileRecords, 
    });
  } catch (error) {
    console.error("Medusa File upload error:", error);
    // Provide more detailed error to the client if appropriate and safe
    const errorMessage =
      error instanceof MedusaError ? error.message : "File upload failed";
    const errorType = error instanceof MedusaError ? error.type : undefined;
    res.status(500).json({ error: errorMessage, type: errorType });
  }
}
