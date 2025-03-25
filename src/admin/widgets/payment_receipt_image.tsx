import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container } from "@medusajs/ui";
const PaymentReceiptImageWidget = () => {
    return (
        <Container>
            <p>Image Receipt goes here</p>
        </Container>
    )
}

export const config = defineWidgetConfig({
    zone: 'order.details.side.after',
});


export default PaymentReceiptImageWidget;