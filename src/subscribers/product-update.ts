import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

export default async function productUpdateHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    await fetch(`${process.env.STOREFRONT_URL}/api/revalidate?tags=products`)
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}