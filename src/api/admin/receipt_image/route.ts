import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: receiptImage } = await query.graph({
    entity: "cart_receipt_image",
    fields: ["receipt_image.filename", "cart.customer.id", "cart.order.id"],
  });

  res.json({ products: receiptImage });
};
