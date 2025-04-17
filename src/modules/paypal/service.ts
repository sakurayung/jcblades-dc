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

import {
  Client,
  Environment,
  LogLevel,
  PaymentsProcessorResponse,
} from "@paypal/paypal-server-sdk";
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
    GetPaymentStatusInput: Record<string, unknown>
  ): Promise<GetPaymentStatusOutput> {
    const order = (await this.retrievePayment(
      GetPaymentStatusInput
    )) as PaypalOrder;

    switch (order.status) {
      case PaypalOrderStatus.CREATED:
        return { status: PaymentSessionStatus.PENDING };
      case PaypalOrderStatus.SAVED:
      case PaypalOrderStatus.APPROVED:
      case PaypalOrderStatus.PAYER_ACTION_REQUIRED:
        return { status: PaymentSessionStatus.REQUIRES_MORE };
      case PaypalOrderStatus.VOIDED:
        return { status: PaymentSessionStatus.CANCELED };
      case PaypalOrderStatus.COMPLETED:
        return { status: PaymentSessionStatus.AUTHORIZED };
      default:
        return { status: PaymentSessionStatus.PENDING };
    }
  }

  async initiatePayment(
  input: InitiatePaymentInput
): Promise<InitiatePaymentOutput> {
  const { amount, currency_code, context: customerDetails } = input;

  let session_data;
  try {
    const intent: CreateOrder["intent"] = this.options_.capture
      ? "CAPTURE"
      : "AUTHORIZE";
      
    // Prepare complete order payload according to PayPal API documentation
    const orderPayload: CreateOrder = {
      intent,
      purchase_units: [
        {
          reference_id: "default",
          custom_id: customerDetails?.customer?.id?.toString(),
          amount: {
            currency_code: currency_code.toUpperCase(),
            value: roundToTwo(
              humanizeAmount(Number(amount), currency_code),
              currency_code
            )
          }
        }
      ],
    };

    

    session_data = await this.paypal_.createOrder(orderPayload);

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
      const paymentData = input.data || {};

      const status = await this.getPaymentStatus({
        data: paymentData,
      });

      const order = (await this.retrievePayment(paymentData)) as PaypalOrder;

      return {
        status: status.status,
        data: order,
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error authorizing PayPal payment: ${error.message}`
      );
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

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const paymentData = input.data || {};
    const refundAmount = input.amount;

    const { purchase_units } = paymentData as {
      purchase_units: PurchaseUnits;
    };

    try {
      const purchaseUnit = purchase_units[0];
      const payments = purchaseUnit.payments;
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
            humanizeAmount(Number(refundAmount), currencyCode),
            currencyCode
          ),
        },
      });

      return await this.retrievePayment(paymentData);
    } catch (e) {
      return this.buildError("An error occured in refunding payment", e);
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
    const paymentData = input.data || {};

    try {
      const id = paymentData.id as string;
      return (await this.paypal_.getOrder(
        id
      )) as unknown as RetrievePaymentOutput;
    } catch (e) {
      return this.buildError("An error occured in retrieving payment", e);
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

  async retrieveOrderFromAuth(authorization: any) {
    const link = authorization.links.find((l: any) => l.rel === "up");
    const parts = link.href.split("/");
    const orderId = parts[parts.length - 1];

    if (!orderId) {
      return null;
    }

    return await this.paypal_.getOrder(orderId);
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
    const headers = payload.headers as Record<string, string>;
    const verifyData = {
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: this.options_.authWebhookId,
      webhook_event: payload.data,
    };

    const isVerified = await this.paypal_.verifyWebhook(verifyData);

    if (!isVerified) {
      return {
        action: "failed",
        data: {
          //@ts-ignore
          message: "Webhook verification failed",
        },
      };
    }

    const { data, rawData }  = payload
    try {
      switch (data.event_type) {
        case PaypalOrderStatus.CREATED:
          return {
            action: "pending",
          };
        case PaypalOrderStatus.APPROVED:
          return {
            action: "authorized",
            
          };
        case PaypalOrderStatus.COMPLETED:
          return {
            action: "captured",
            
          };
        case PaypalOrderStatus.VOIDED:
          return {
            action: "canceled",
            
          };
        default:
          return {
            action: "pending",
          };
      }
    } catch (e) {
      return {
        action: "failed",
        data: {
          //@ts-ignore
          message: "Webhook verification failed",
        },
      };
    }
  } 
}
export default PayPalPaymentProviderService;
