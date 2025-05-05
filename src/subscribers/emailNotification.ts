import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";

export default async function userVerificationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {

    /**
     * Define modules for fetching or inserting data later on
     */
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  const userModule = container.resolve(Modules.USER);

  const user = await userModule.retrieveUser(data.id)

  const token = await generateVerificationToken(user.id, container)

  const verificationUrl = `http://localhost:9000/verify-email?token=${token}&email${user.email}`

  await notificationModuleService.createNotifications({
    to: user.email,
    channel: "email",
    template: "email-verification",
    data: {
        user: user,
        verification_url: verificationUrl
    },
  })
}

export const config: SubscriberConfig = {
    event: "user.created",
}


async function generateVerificationToken(userId, container) {
const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

const userService = container.resolve(Modules.USER)

await userService.update(userId, {
    metadata: {
        verification_token: token,
        token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
})
return token
}