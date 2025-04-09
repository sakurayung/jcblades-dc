import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import receipt from "src/modules/receipt";

export default defineLink(
    OrderModule.linkable.order,
    receipt.linkable.receiptImage
)