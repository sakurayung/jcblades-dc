import { defineLink } from "@medusajs/framework/utils";
import receipt from "src/modules/receipt";
import OrderModule from "@medusajs/medusa/order";

export default defineLink({
    ...receipt.linkable.receiptImage,
    field: "order_id",
}, OrderModule.linkable.order, {
    readOnly: true,
}
)