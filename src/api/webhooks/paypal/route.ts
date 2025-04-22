import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { processPaymentWorkflow } from "@medusajs/medusa/core-flows";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

  try {
    const dataAndAction = await paymentModuleService.getWebhookActionAndData({
      provider: "paypal_paypal",
      payload: {
        //@ts-ignore
        data: req.body,
        rawData: req.rawBody,
        headers: req.headers,
      },
    });

    if (
      dataAndAction.action === "authorized" ||
      dataAndAction.action === "captured"
    ) {
      const { result } = await processPaymentWorkflow.run({
        input: {
          action: dataAndAction.action,
          data: dataAndAction.data,
        },
      });

      return res.status(200).json(result);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(400).json({
      error: error.message,
      type: error.type || "unknown_error",
    });
  }
}
