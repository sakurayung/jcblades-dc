import {
  AbstractPaymentProvider,
  ModuleProvider,
  Modules,
} from "@medusajs/framework/utils";
import {
  PaymentProviderError,
  PaymentProviderSessionResponse,
  PaymentSessionStatus,
  CreatePaymentProviderSession,
  UpdatePaymentProviderSession,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types";

import { BigNumber } from "bignumber.js";

type Options = {
  apiKey: string;
  merchantId: string;
  sandBox: boolean;
};

class ManualPaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "Manual Payment";
  options_: Options;

  constructor(container: Record<string, any>, options: Options) {
    super(container, options);
    this.options_ = options;
    console.log("[ManualPaymentProviderService] initialized with options");
  }

  /**
   *
   * @initiatePayment
   * For our manual receipt flow, initiatePayment simply delegates to createPayment.
   */

  async initiatePayment(
    context: CreatePaymentProviderSession
  ): Promise<PaymentProviderSessionResponse> {
    console.log(
      "[Manual Provider Debug] Intiating payment with context",
      context
    );
    return this.createPayment(context);
  }

  /**
   *
   * @retrievePayment
   *  Since our manual flow does not require external lookup,
   * simply return the provided session data
   */
  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProviderSessionResponse> {
    console.log(
      "[Manual Provider Debug] Retrieving payment session data:",
      paymentSessionData
    );
    return paymentSessionData;
  }

  /**
   *
   * @createPayment
   * When a customer selects the Manual Payment at checkout,
   * return a session that instructs them to upload their payment receipt.
   */
  async createPayment(
    context: CreatePaymentProviderSession
  ): Promise<PaymentProviderSessionResponse> {
    console.log(
      "[Manual Payment Provider] Creating payment with context:",
      context
    );
    const sessionId =
      context.context?.session_id || `manual_session_${Date.now()}`;
    console.log("[Manual Payment Provider Debug] Using session ID:", sessionId);

    const response = {
      session_id: sessionId,
      data: {
        session_id: sessionId,
        manual_action_required: true,
        instructions:
          "Please upload your Manual Payment receipt to complete your payment.",
      },
    };
    console.log("[Manual Provider Debug] Created payment session:", response);
    return response;
  }

  /**
   *
   * @authorizePayment
   * For a manual receipt upload flow, verify the
   * receipt has been uploaded
   * before authorizing the payment.
   */
  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<
    | {
        status: PaymentSessionStatus;
        data: PaymentProviderSessionResponse["data"];
      }
    | PaymentProviderError
  > {
    console.log("[Manual Payment Provider] Authorizing payment with data:", {
      sessionData: paymentSessionData,
      context: context,
    });

    //Check if receipt is uploaded in the session data
    if (
      !paymentSessionData.data ||
      typeof paymentSessionData.data !== "object"
    ) {
      console.log(
        "[Manua Payment Provider] Authorization failed: Invalid session data",
        paymentSessionData
      );
      return {
        error: "Invalid session data",
        code: "invalid_data",
        detail: "Payment session data is invalid",
      };
    }

    const sessionData = paymentSessionData.data as Record<string, unknown>;
    console.log(
      "[Manual Payment Provider] Session data for authorization: ",
      sessionData
    );

    if (!sessionData.receipt_uploaded) {
      console.log(
        "[Manual Payment Provider] Authorization failed: Receipt not uploaded"
      );
      return {
        error: "Receipt not uploaded",
        code: "invalid_payment",
        detail: "Please upload payment receipt before authorizing",
      };
    }

    if (!sessionData.receipt_url) {
      console.log(
        "[Manual Payment Provider] Authorization failed: Receipt URL not found"
      );
      return {
        error: "Receipt URL not found",
        code: "invalid_payment",
        detail: "Receipt URL is required",
      };
    }

    console.log("[Manual Payment Provider] Payment authorized successfully");
    return {
      status: "authorized",
      data: {
        ...sessionData,
        status: "authorized",
      },
    };
  }
  /**
   * capturePayment()
   * In our manual receipt flow, capturing is not performed automatically.
   */

  async capturePayment(
    paymentData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProviderError> {
    console.log("Capturing payment with data:", paymentData);
    return { ...paymentData, status: "pending" };
  }

  /**
   * cancelPayment()
   * @param
   */

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProviderError> {
    console.log("Cancelling payment with data", paymentSessionData);
    return { ...paymentSessionData, status: "cancelled" };
  }

  /**
   * deletePayment()
   *
   * Simply delegates to cancelPayment for the manual flow.
   */

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProviderError> {
    console.log("Deleting payment with data", paymentSessionData);
    return this.cancelPayment(paymentSessionData);
  }

  /**
   *
   * @param paymentSessionData
   *
   * Returns the current status from the session data
   */
  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    console.log("Getting payment status for session data", paymentSessionData);
    return (paymentSessionData["status"] as PaymentSessionStatus) || "pending";
  }

  /**
   *
   * refundPayment()
   *
   * For the manual flow, refund is implemented as a dummy operation.
   * Instead of returning a "refunded" status (which is not allowed), we return "authorized"
   * and include refund details in the data.
   */
  async refundPayment(
    paymentData: Record<string, unknown>,
    refundAmount: number
  ): Promise<Record<string, unknown> | PaymentProviderError> {
    console.log(
      "Refunding payment with data",
      paymentData,
      "amount",
      refundAmount
    );
    return { ...paymentData, refunded: refundAmount, status: "authorized" };
  }

  /**
   *
   * @param updatePayment()
   *
   * For our manual flow, handle receipt upload and update session data.
   */

  async updatePayment(
    context: UpdatePaymentProviderSession
  ): Promise<PaymentProviderSessionResponse | PaymentProviderError> {
    try {
      //Merge existing data with updates
      const mergedData = {
        ...(context.data || {}),
        receipt_uploaded: true,
        status: "pending",
        manual_action_required: false,
        instructions: "Receipt received. Verification in progress...",
      };

      return {
        data: mergedData,
        amount: context.amount,
        currency_code: context.currency_code,
      };
    } catch (error) {
      console.error("Update payment error:", error);
      return {
        error: "Failed to update payment session",
        code: "update_failed",
      };
    }
  }

  /**
   * getWEBHOOKActionAndData()
   * Processses an incoming webhook event. For our manual flow, if the payload indicates that
   * the receipt has been uploaded (i.e payload.data.receipt_uploaded == true) and verified, we update the session data accordingly. 
   */
 async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    console.log("Processing webhook data:", payload);
    try {
        if (payload && payload.data && payload.data.receipt_uploaded == true) {
            console.log("Receipt uploaded. Updating session data...");
            return {
                action: "authorized",
                data: {
                    session_id: String(payload.data.session_id),
                    amount: new BigNumber(String(payload.data.amount)),
                },
            };
        }
        console.log("Webhook action not supported");
        return { action: "not_supported"};
    } catch (error) {
        console.error("Webhook processing error:", error);
        return { action: "failed"};
    }
  }
}

export default ManualPaymentProviderService;
