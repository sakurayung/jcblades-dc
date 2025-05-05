import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/hooks/*", // adjust the path pattern as needed
      bodyParser: { preserveRawBody: true },
      method: ["POST"],
    },
  ],
})