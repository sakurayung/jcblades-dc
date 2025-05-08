import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/workflows-sdk";
import { ICustomerModuleService } from "@medusajs/framework/types";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";

type SendVerificationEmailInput = {
  customerId: string;
};


/**
 * updateCustomer is different from the createCustomer step in that it updates an existing customer.
 * This workflow is used to send a verification email to the customer.
 * It generates a verification token and sends an email to the customer with the token.
 * The token is stored in the customer's metadata and expires after 24 hours.

 */
const generateVerificationToken = createStep(
  "generate-verification-token",
  async ({ customerId }, { container }) => {
    console.log("[Workflow: generateVerificationToken] Updating customer metadata:", JSON.stringify(customerId, null, 2));
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const customerModuleService = container.resolve(
      Modules.CUSTOMER
    ) as ICustomerModuleService;
    //Insert the data into the customer metadata
    await customerModuleService.updateCustomers(
      { id: customerId },
      {
        metadata: {
          email_verified: "false",
          verification_token: token,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }
    );
    return new StepResponse(token);
  }
);


/**
 * sendCustomerVerificationWorkflow is a workflow that sends a verification email to the customer.
 * It generates a verification token and sends an email to the customer with the token.
 * The token is stored in the customer's metadata and expires after 24 hours.
 * The workflow uses the generateVerificationToken step to generate the token and the sendNotificationStep to send the email.
 */
export const sendCustomerVerificationWorkflow = createWorkflow(
  "customer-verification",
  ({customerId}: SendVerificationEmailInput) => {
    //@ts-ignore
    const token = generateVerificationToken({customerId}); 

    //@ts-ignore
    const {data : customer } = useQueryGraphStep({
      entity: "customer",
      fields: [
        "id",
        "first_name",
        "last_name",
        "email",
        "metadata.verification_token",
        "metadata.token_expires_at"
      ],
      filters: { id: customerId }
    })


  
    const notification = sendNotificationStep([
      {
        to: customer[0].email,
        channel: "email",
        template: "email-confirm",
        data: {
          customer: customer[0],
          verification_token: token,
        },
      }
    ])
    return new WorkflowResponse(notification);
  }
)


