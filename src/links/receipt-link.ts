import { defineLink } from "@medusajs/framework/utils";
import CartModule from "@medusajs/medusa/cart";
import receipt from "src/modules/receipt";

export default defineLink(
    receipt.linkable.receiptImage,
    CartModule.linkable.cart
)