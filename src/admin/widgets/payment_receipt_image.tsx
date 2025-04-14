import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";
import { Text, Container, Heading } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sdk } from "../lib/sdk/sdk";

/**Define type for API response */
type ReceiptImageItem = {
  receipt_image_id: string;
  cart_id: string;
  receipt_image: {
    filename: string;
    id: string;
  };
  cart: {
    id: string;
    customer_id: string;
    customer: {
      id: string;
    };
    order: {
      id: string;
    };
  };
};

type ReceiptImageResponse = {
  products?: ReceiptImageItem[];
};

// Create a client
const queryClient = new QueryClient();

const ReceiptImageContent = ({ data: resource }: DetailWidgetProps<AdminOrder>) => {
  // Get the current order ID from props
  const orderId = resource?.id;

  const { data, isLoading } = useQuery<ReceiptImageResponse>({
    queryFn: () => sdk.client.fetch("/admin/receipt_image"),
    queryKey: ["receipt_images", orderId],
  });

  console.log("Current order ID:", orderId);
  
  // Get the receipt items from the response
  const receiptItems = data?.products || [];
  
  // Check the first item to compare ID formats
  if (receiptItems.length > 0 && orderId) {
    console.log("Sample order ID from data:", receiptItems[0].cart?.order?.id);
    console.log("Order ID format comparison:", {
      "Resource ID": orderId,
      "Length": orderId.length,
      "Sample cart order ID": receiptItems[0].cart?.order?.id,
    });
  }

  // Filter the receipt images to only show those that match the current order ID
  // Use includes() for more flexible matching in case of format differences
  const orderReceiptImages = receiptItems.filter(item => {
    const itemOrderId = item.cart?.order?.id;
    
    return itemOrderId && itemOrderId.includes(orderId || "");
  });

  console.log("Filtered receipt images count:", orderReceiptImages.length);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Receipt Images</Heading>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          "Loading..."
        ) : orderReceiptImages.length > 0 ? (
          <div>
            {orderReceiptImages.map((item, index) => (
              <div key={index} className="mb-4 border p-3 rounded">
                <Text className="font-medium">Receipt: {item.receipt_image?.filename || "N/A"}</Text>
                <Text>Customer ID: {item.cart.customer_id || "N/A"}</Text>
                <Text>Order ID: {item.cart.order?.id || "N/A"}</Text>
                <Text>Cart ID: {item.cart_id || "N/A"}</Text>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <Text>No receipt images found for this order</Text>
            <Text className="text-sm text-gray-500 mt-2">
              Looking for order ID: {orderId}
            </Text>
          </div>
        )}
      </div>
    </Container>
  );
};

// Wrapper component that provides the QueryClient
const ReceiptImageWidget = (props: DetailWidgetProps<AdminOrder>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ReceiptImageContent {...props} />
    </QueryClientProvider>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default ReceiptImageWidget;