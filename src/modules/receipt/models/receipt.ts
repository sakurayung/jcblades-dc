import { model } from "@medusajs/framework/utils";


const ReceiptImage = model.define("ReceiptImage", {
    id: model.id().primaryKey(),
    url: model.text(),
    mimeType: model.text(),
    order_id: model.text(),
})

export default ReceiptImage;