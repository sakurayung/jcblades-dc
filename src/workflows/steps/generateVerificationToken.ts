import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/workflows-sdk";
import { ICustomerModuleService } from "@medusajs/framework/types";

export const generateVerificationToken = createStep(
  "generate-verification-token",
  async ({ customerId }, { container }) => {
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const customerModuleService = container.resolve(
      Modules.CUSTOMER
    ) as ICustomerModuleService;
    await customerModuleService.updateCustomers(
      { id: customerId },
      {
        metadata: {
          verification_token: token,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }
    );
    return new StepResponse(token);
  }
);
