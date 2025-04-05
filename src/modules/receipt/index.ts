import ReceiptPaymentImage from "./service";
import { Module } from "@medusajs/framework/utils";


export const RECEIPT_IMAGE_MODULE = "receiptImage"

export default Module(RECEIPT_IMAGE_MODULE, {
    service: ReceiptPaymentImage
})