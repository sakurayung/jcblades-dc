import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { removeCustomerAccountWorkflow } from "@medusajs/medusa/core-flows";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const customerId  = req.body
    if (!customerId) {
        res.status(400).json({ error: "Customer ID is required" });
        return;
    }

    const { result } = await removeCustomerAccountWorkflow.run({
        input: { customerId}
    })
    res.send(result);
}