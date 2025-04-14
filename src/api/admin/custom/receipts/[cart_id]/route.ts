import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import ReceiptPaymentImage from "src/modules/receipt/service";
import { RECEIPT_IMAGE_MODULE } from "src/modules/receipt";


export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const { cart_id } = req.params
    const receiptService: ReceiptPaymentImage = req.scope.resolve(RECEIPT_IMAGE_MODULE)

    const receipt = await receiptService.getReceiptByCartId(cart_id)
    if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" })
    }
    return res.status(200).json({ receipt })
}