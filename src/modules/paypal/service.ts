import {
  AbstractPaymentProvider,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import {
  PaypalOptions,
  PaypalOrder,
  PurchaseUnits,
  PaypalOrderStatus,
} from "./core/types/types";
import {
  CapturePaymentInput,
  CapturePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/types";

import { CreateOrder, PaypalSdk } from "./core";
import { Logger } from "@medusajs/medusa";
import { container } from "@medusajs/framework";
import { humanizeAmount } from "medusa-core-utils";
import { roundToTwo } from "./utils/utils";
import { MedusaError } from "@medusajs/framework/utils";

type InjectedDependencies = {
  logger: Logger;
};
class PayPalPaymentProviderService extends AbstractPaymentProvider<PaypalOptions> {
  static identifier = "paypal";

  protected paypal_: PaypalSdk;
  protected options_: PaypalOptions;
  protected readonly logger_: Logger | undefined;

  constructor({ logger }: InjectedDependencies, options: PaypalOptions) {
    super(container, options);

    this.logger_ = logger;
    this.options_ = options;
    this.init();
  }
  protected init(): void {
    this.paypal_ = new PaypalSdk({
      ...this.options_,
      logger: this.logger_,
    });
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const { data } = input;
    const status = PaymentSessionStatus;

    const order = (await this.retrievePayment(data)) as PaypalOrder;

    switch (order.status) {
      case PaypalOrderStatus.CREATED:
        return {
          status: status.PENDING,
          data: order,
        };
      case PaypalOrderStatus.APPROVED:
        return {
          status: status.REQUIRES_MORE,
          data: order,
        };
      case PaypalOrderStatus.COMPLETED:
        return {
          status: status.AUTHORIZED,
        };
      case PaypalOrderStatus.VOIDED:
        return {
          status: status.CANCELED,
        };
      default:
        return {
          status: status.PENDING,
        };
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input;

    let session_data;
    try {
      const intent: CreateOrder["intent"] = this.options_.capture
        ? "CAPTURE"
        : "AUTHORIZE";

      /**
       * Prepare complete order payload according to PayPal API documentation
       * Remove the application-context since it is deprecated so this is okay now resulting into 200 code response.
       */
      const orderPayload: CreateOrder = {
        intent,
        purchase_units: [
          {
            reference_id: "default",
            custom_id: context?.idempotency_key.toString(),
            amount: {
              currency_code: currency_code.toUpperCase(),
              value: roundToTwo(Number(amount), currency_code),
            },
          },
        ],
      };

      session_data = await this.paypal_.createOrder(orderPayload);

      if (!session_data) {
        throw new Error("Failed to create PayPal order: No response received");
      }

      if (!session_data.id) {
        throw new Error("Invalid PayPal order response: Missing order ID");
      }

      this.logger_?.info(`PayPal payment initiated: ${session_data.id}`);

      return {
        id: session_data.id,
        data: session_data,
      };
    } catch (e) {
      this.logger_?.error(`Error initiating PayPal payment: ${e.message}`);
      return this.buildError("An error occurred in initiating payment", e);
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const stat = await this.getPaymentStatus({
        data: { id: input.data?.id },
      });
      /**
       * Pass an object with the id property instead of just the id string
       */
      //@ts-ignore
      const order = (await this.retrievePayment({
        id: input.data.id,
      })) as PaypalOrder;
      return {
        data: order as unknown as Record<string, unknown>,
        status: stat.status,
      };
    } catch (error) {
      return this.buildError("An error occurred in authorizePayment", error);
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      const paymentData = input.data || {};

      const { purchase_units } = paymentData as {
        purchase_units: PurchaseUnits;
      };

      const authorizationId = purchase_units[0].payments.authorizations[0].id;

      await this.paypal_.captureAuthorizedPayment(authorizationId);
      return await this.retrievePayment(paymentData);
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error capturing PayPal payment: ${error.message}`
      );
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const paymentData = input.data || {};

    const order = (await this.retrievePayment(paymentData)) as PaypalOrder;

    const isAlreadyCanceled = order.status === PaypalOrderStatus.VOIDED;
    const isCanceledAndFullyRefund =
      order.status === PaypalOrderStatus.COMPLETED && !!order.invoice_id;

    if (isAlreadyCanceled || isCanceledAndFullyRefund) {
      return { data: order };
    }
    try {
      const { purchase_units } = paymentData as {
        purchase_units: PurchaseUnits;
      };

      const isAlreadyCaptured = purchase_units.some(
        (pu) => pu.payments.captures?.length
      );

      if (isAlreadyCaptured) {
        const payments = purchase_units[0].payments;

        const payId = payments.captures[0].id;
        await this.paypal_.refundPayment(payId);
      } else {
        const id = purchase_units[0].payments.authorizations[0].id;
        await this.paypal_.cancelAuthorizedPayment(id);
      }

      return (await this.retrievePayment(
        paymentData
      )) as unknown as CancelPaymentOutput;
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error cancelling PayPal payment: ${error.message}`
      );
    }
  }

  /**
   * Paypal does not provide such feature
   * @param DeletePaymentInput
   */

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    const paymentData = input.data || {};

    return Promise.resolve(paymentData as unknown as DeletePaymentOutput);
  }
  /**
   * Refunds a payment
   * @param RefundPaymentInput
   */

  async refundPayment({amount, data, context }: RefundPaymentInput): Promise<RefundPaymentOutput> {
  let paymentData = data || {};
  let refundAmount = amount;

  const { purchase_units } = paymentData as {
    purchase_units: PurchaseUnits;
  };

  try {
    const purchaseUnit = paymentData?.purchase_units[0];
    const payments = purchaseUnit?.payments?.captures?.[0];
    const isAlreadyCaptured = purchase_units.some(
      (pu) => pu.payments.captures?.length
    );

    if (!isAlreadyCaptured) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Payment is not captured yet`
      );
    }

    const paymentId = payments.captures[0].id;
    const currencyCode = purchaseUnit.amount.currency_code;

    await this.paypal_.refundPayment(paymentId, {
      amount: {
        currency_code: currencyCode,
        value: roundToTwo(
          Number(refundAmount),
          currencyCode
        ),
      },
    });

    return await this.retrievePayment(paymentData);
  } catch (e) {
    return this.buildError("An error occurred in refunding payment", e);
  }
}

  /**
   * Retrieves a payment by ID
   * @param RetrievePaymentInput
   * @returns
   */
  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      console.log("Payment input data:", JSON.stringify(input, null, 2));

      // Check the structure more deeply
      console.log("Input type:", typeof input);
      console.log("Input has data property:", input.hasOwnProperty("data"));

      if (input.data) {
        console.log("Data property type:", typeof input.data);
        console.log("Data property keys:", Object.keys(input.data));
        console.log("Data has id property:", input.data.hasOwnProperty("id"));
      }

      // Log direct properties
      console.log("Input has id property:", input.hasOwnProperty("id"));

      // Attempt to access ID through different paths
      let externalId = null;

      if (input.data && input.data.id) {
        externalId = input.data.id;
        console.log("Found ID in input.data.id:", externalId);
        //@ts-ignore
      } else if (input.id) {
        //@ts-ignore
        externalId = input.id;
        console.log("Found ID in input.id:", externalId);
      }

      console.log("Final External ID:", externalId);

      if (!externalId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing PayPal order ID"
        );
      }

      // Get the order from PayPal
      const order = await this.paypal_.getOrder(externalId);
      console.log("PayPal order response:", JSON.stringify(order, null, 2));

      if (!order) {
        console.log("Order is undefined!");
      } else {
        console.log("Order properties:", Object.keys(order));
      }

      // Return the order data
      const result = await this.retrieveOrderFromAuth(order);
      return result as unknown as RetrievePaymentOutput;
    } catch (error) {
      // Throw the error instead of returning it
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error retrieving PayPal payment: ${error.message}`
      );
    }
  }

  /***
   * * Updates a payment by ID
   */

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const paymentData = input.data || {};
    try {
      const { currency_code, amount } = input;
      const id = paymentData.id as string;

      await this.paypal_.patchOrder(id, [
        {
          op: "replace",
          path: "/purchase_units/@reference_id=='default'",
          value: {
            amount: {
              currency_code: currency_code.toUpperCase(),
              value: roundToTwo(
                humanizeAmount(Number(amount), currency_code),
                currency_code
              ),
            },
          },
        },
      ]);
      return { data: paymentData as unknown as UpdatePaymentOutput };
    } catch (e) {
      return await this.initiatePayment(input).catch((e) => {
        return this.buildError("An error occured in updating payment", e);
      });
    }
  }

  async updatePaymentData(sessionId: string, data: Record<string, unknown>) {
    try {
      // Prevent from updating the amount from here as it should go through
      // the updatePayment method to perform the correct logic
      if (data.amount) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot update amount, use updatePayment instead"
        );
      }
      return data;
    } catch (e) {
      return this.buildError("An error occured in updatePaymentData", e);
    }
  }

  async retrieveOrderFromAuth(order: any) {
    try {
      console.log(
        "Order in retrieveOrderFromAuth:",
        JSON.stringify(order, null, 2)
      );

      // Find the authorization inside the purchase units
      let authorization = null;

      if (
        order?.purchase_units &&
        order.purchase_units[0]?.payments?.authorizations &&
        order.purchase_units[0].payments.authorizations.length > 0
      ) {
        authorization = order.purchase_units[0].payments.authorizations[0];
      }

      if (!authorization || !authorization.links) {
        console.log("No authorization or links found");
        return order; // Return the original order if no authorization found
      }

      const link = authorization.links.find((l: any) => l.rel === "up");

      if (!link || !link.href) {
        console.log("No 'up' link found in authorization");
        return order; // Return the original order if no link found
      }

      const parts = link.href.split("/");
      const orderId = parts[parts.length - 1];

      if (!orderId) {
        return order; // Return the original order if no ID found
      }

      return await this.paypal_.getOrder(orderId);
    } catch (error) {
      console.log("Error in retrieveOrderFromAuth:", error);
      throw error;
    }
  }

  async retrieveAuthorization(id: any) {
    return await this.paypal_.getAuthorizationPayment(id);
  }

  protected buildError(message: string, error: Error | any): never {
    // Determine error type and message
    const errorMessage = `${message}: ${
      error.error || error.message || "Unknown error"
    }`;

    // Get error details if available
    const errorDetails = error.detail || error.stack || "";

    // Determine error type based on the error
    let errorType = MedusaError.Types.UNEXPECTED_STATE;

    // Map error codes to appropriate MedusaError types if needed
    if (error.code === "VALIDATION_ERROR") {
      errorType = MedusaError.Types.INVALID_DATA;
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      errorType = MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR;
    }

    // Throw a MedusaError with the appropriate type and message
    throw new MedusaError(
      errorType,
      `${errorMessage}${errorDetails ? `\n${errorDetails}` : ""}`
    );
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    try {
      await this.verifyWebhook(payload);
      const { data } = payload;

      this.logger_?.error(`PayPal webhook received: ${data.message}`);

      if (!data?.event_type) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing event type in webhook payload"
        );
      }

      //@ts-ignore
      const eventTypeToAction: Record<PaypalOrderStatus, WebhookActionResult> =
        {
          [PaypalOrderStatus.CREATED]: { action: "pending" },
          [PaypalOrderStatus.APPROVED]: { action: "authorized" },
          [PaypalOrderStatus.COMPLETED]: { action: "captured" },
          [PaypalOrderStatus.VOIDED]: { action: "canceled" },
        };
      return (
        //@ts-ignore
        eventTypeToAction[data.event_type as PaypalOrderStatus] || {
          action: "pending",
        }
      );
    } catch (error) {
      this.logger_?.error(`PayPal webhook error: ${error.message}`);
      return {
        action: "failed",
        // The data property is removed as it contained invalid properties for WebhookActionData
      };
    }
  }

  async verifyWebhook(data: ProviderWebhookPayload["payload"]) {
    return await this.paypal_.verifyWebhook({
      webhook_id: this.options_.authWebhookId,
      ...data,
      auth_algo: data.headers?.["paypal-auth-algo"] as string,
      cert_url: data.headers?.["paypal-cert-url"] as string,
      transmission_id: data.headers?.["paypal-transmission-id"] as string,
      transmission_sig: data.headers?.["paypal-transmission-sig"] as string,
      transmission_time: data.headers?.["paypal-transmission-time"] as string,
      webhook_event: data.data,
    });
  }
}
export default PayPalPaymentProviderService;
