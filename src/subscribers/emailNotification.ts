import { sendCustomerVerificationWorkflow } from "../workflows/send-email-confirmation";
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";


export default async function userVerificationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendCustomerVerificationWorkflow(container).run({
    input: { customerId: data.id },
  });
}

export const config: SubscriberConfig = {
  event: "customer.created",
};