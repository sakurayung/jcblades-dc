import { MedusaService } from "@medusajs/framework/utils";
import ReceiptImage from "./models/receipt";


class ReceiptPaymentImage extends MedusaService({
    ReceiptImage,
}) {    
    async getReceiptByCartId(cartId) {
        const receipts = await this.listReceiptImages({
            cart_id: cartId,
        }, {
            take: 1
        })
        return receipts[0]
    }
}

export default ReceiptPaymentImage;