import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createReceiptImageWorkflow } from "src/workflows/create-receipt-image";

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const { result: image } = await createReceiptImageWorkflow(req.scope).run({
        input: {
            url: "https://filwawqhhhfsaxvstiuq.supabase.co/storage/v1/object/public/image//OLLY3620-01JQVJWPTJZB30RNBAMBQR4C4R.JPG",
            mimeType: "image/jpeg",
            order_id: "order_01JDRNA7Y30GXQYT14GNM4MPDG",
        }
    })

    res.json({
        image,
    })
}