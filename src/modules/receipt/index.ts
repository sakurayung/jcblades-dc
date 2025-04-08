import ReceiptPaymentImage from "./service";
import { Module } from "@medusajs/framework/utils";


export const RECEIPT_IMAGE_MODULE = "receipt_image"

export default Module(RECEIPT_IMAGE_MODULE, {
    service: ReceiptPaymentImage
})