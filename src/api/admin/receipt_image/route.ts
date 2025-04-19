import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: receiptImage } = await query.graph({
    entity: "receipt_image_cart",
    fields: ["receipt_image.filename", "receipt_image.url", "cart.customer.id", "cart.order.id"],
  });

  res.json({ products: receiptImage });
};
