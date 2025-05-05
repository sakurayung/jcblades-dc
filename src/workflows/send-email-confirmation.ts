import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";

type WorkflowInput = {
  id: string;
};

export const sendEmailConfirmationWorkflow = createWorkflow(
  "send-email-confirmation",
  ({ id }: WorkflowInput) => {
    // @ts-ignore
    const { data: emails } = useQueryGraphStep({
      entity: "email",
      fields: ["email", "customer.*"],
      filters: { id },
    });
    const notification = sendNotificationStep([
      {
        to: emails[0].email,
        channel: "email",
        template: "email-confirm",
        data: {
          email: emails[0],
        },
      },
    ]);
    return new WorkflowResponse(notification);
  },

  // TODO:
  // - figure out what module does email confirmation belong
  //
);
