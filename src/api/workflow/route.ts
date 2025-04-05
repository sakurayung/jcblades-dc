import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createPaymentCollectionWorkflow } from "src/workflows/create-payment-collection";

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const { result } = await createPaymentCollectionWorkflow(req.scope).run();

    res.send(result)
}