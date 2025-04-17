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
    )) as PaypalOrder

    switch (order.status) {
        case PaypalOrderStatus.CREATED:
          return { status: PaymentSessionStatus.PENDING }
        case PaypalOrderStatus.SAVED:
        case PaypalOrderStatus.APPROVED:
        case PaypalOrderStatus.PAYER_ACTION_REQUIRED:
          return { status: PaymentSessionStatus.REQUIRES_MORE }
        case PaypalOrderStatus.VOIDED:
          return { status: PaymentSessionStatus.CANCELED }
        case PaypalOrderStatus.COMPLETED:
          return { status: PaymentSessionStatus.AUTHORIZED }
        default:
          return { status: PaymentSessionStatus.PENDING }
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

      session_data = await this.paypal_.createOrder({
        intent,
        purchase_units: [
          {
            //@ts-ignore
            custom_id: context,
            amount: {
              currency_code: currency_code.toUpperCase(),
              
              value: roundToTwo(
                //@ts-ignore
                humanizeAmount(amount, currency_code),
                currency_code
              ),
            },
          },
        ],
      });
    } catch (e) {
      return this.buildError("An error occured in initiating payment", e);
    }

    return {
      //@ts-ignore
      session_data,
    };
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    throw new Error("Method not implemented.");
  }

  async capturePayment(
    CapturePaymentInput: Record<string, unknown>
  ): Promise<CapturePaymentOutput> {
    throw new Error("Method not implemented.");
  }

  cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    throw new Error("Method not implemented.");
  }

  deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    throw new Error("Method not implemented.");
  }

  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new Error("Method not implemented.");
  }
  retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    throw new Error("Method not implemented.");
  }
  updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    throw new Error("Method not implemented.");
  }
  getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    throw new Error("Method not implemented.");
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
}
