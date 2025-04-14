import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
    //@ts-ignore
    baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
    //@ts-ignore
    debug: import.meta.env.DEV,
    auth: {
        type: "session",
    }
})