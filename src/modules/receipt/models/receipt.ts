import { model } from "@medusajs/framework/utils"

const ReceiptImage = model.define("receipt_image", {
  id: model.id().primaryKey(),
  filename: model.text(),
  mime_type: model.text(),
  url: model.text(),
  metadata: model.json().nullable(),
})

export default ReceiptImage