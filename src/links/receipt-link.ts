import { defineLink } from "@medusajs/framework/utils";
import receipt from "src/modules/receipt";
import CartModule from "@medusajs/medusa/cart";
export default defineLink(
    CartModule.linkable.cart,
    receipt.linkable.receiptImage
)