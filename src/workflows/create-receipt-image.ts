import { Modules } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { RECEIPT_IMAGE_MODULE } from "src/modules/receipt";
import ReceiptPaymentImage from "src/modules/receipt/service";


type UploadReceiptImageInput = {
  url: string
  mimeType: string
  order_id: string
}



const createImageStep = createStep(
  "create-receipt-image",
  async ( input : UploadReceiptImageInput, { container }) => {
    const receiptImageService: ReceiptPaymentImage = container.resolve(RECEIPT_IMAGE_MODULE)

    const image = await receiptImageService.createReceiptImages({
      url: input.url,
      mimeType: input.mimeType,
      order_id: input.order_id,
    })

    return new StepResponse(image, image)
  },

  async (image, { container }) => {
    const receiptImageService: ReceiptPaymentImage = container.resolve(RECEIPT_IMAGE_MODULE)
    await receiptImageService.deleteReceiptImages(image.id)
  }
)


export const createReceiptImageWorkflow = createWorkflow(
  "create-image",
  (imageInput: UploadReceiptImageInput) => {
    const image = createImageStep(imageInput)
    return new WorkflowResponse(image)
  }
)