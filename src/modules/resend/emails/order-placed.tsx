import {
  Text,
  Column,
  Container,
  Heading,
  Html,
  Img,
  Row,
  Section,
  Tailwind,
} from "@react-email/components";
import { BigNumberValue, OrderDTO } from "@medusajs/framework/types";

type OrderPlacedEmailProps = {
  order: OrderDTO;
};

function OrderPlacedEmailComponent({ order }: OrderPlacedEmailProps) {
  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: order.currency_code,
  });

  const formatPrice = (price: BigNumberValue) => {
    if (typeof price === "number") {
      return formatter.format(price);
    }
    if (typeof price === "string") {
      return formatter.format(parseFloat(price));
    }

    return price?.toString() || "";
  };

  return (
    <Html>
      <Tailwind>
        {" "}
        <Heading>Thank you for your order!</Heading>
        {order.email}'s Items
        <Container>
          {order.items.map((item) => {
            return (
              <Section key={item.id} className="py-10">
                <Row>
                  <Column>
                    <Img
                      src={item.thumbnail}
                      alt={item.product_title}
                      className="float-left w-[260px]"
                    />
                  </Column>
                  <Column className="align-top pl-[12px]">
                    <Text className="font-medium">{item.product_title}</Text>
                    <Text>{item.variant_title}</Text>
                    <Text>{formatPrice(item.total)}</Text>
                  </Column>
                </Row>
              </Section>
            );
          })}
        </Container>
      </Tailwind>
    </Html>
  );
}

export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
);
