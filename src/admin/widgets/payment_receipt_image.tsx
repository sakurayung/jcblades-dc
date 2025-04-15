import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";
import { Text, Container, Heading } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { sdk } from "../lib/sdk/sdk";

/**Define type for API response */
type ReceiptImageItem = {
  receipt_image_id: string;
  cart_id: string;
  receipt_image: {
    filename: string;
    url: string;
    id: string;
  };
  cart: {
    id: string;
    customer_id: string;
    customer?: {
      id: string;
    };
    order?: {
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
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const { data, isLoading } = useQuery<ReceiptImageResponse>({
    queryFn: () => sdk.client.fetch("/admin/receipt_image"),
    queryKey: ["receipt_images", orderId],
  });

  
  /**Get the receipt images from the API response that fetches all receipt images
   * 
   */
  const receiptItems = data?.products || [];
  

  // Filter the receipt images to only show those that match the current order ID
  // Use includes() for more flexible matching in case of format differences
  const orderReceiptImages = receiptItems.filter(item => {
    const itemOrderId = item.cart?.order?.id;
    
    return itemOrderId && itemOrderId.includes(orderId || "");
  });

  console.log("Filtered receipt images count:", orderReceiptImages.length);
  
  // Debug URLs
  orderReceiptImages.forEach((item, index) => {
    console.log(`Receipt ${index} image URL:`, item.receipt_image?.url);
  });

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Receipt Image</Heading>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          "Loading..."
        ) : orderReceiptImages.length > 0 ? (
          <div>
            {orderReceiptImages.map((item, index) => {
              // Ensure URL is complete - prepend domain if necessary
              const imageUrl = item.receipt_image?.url || "";
              const isUrlComplete = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
              const fullImageUrl = isUrlComplete ? imageUrl : 
                imageUrl.startsWith('/') ? `${window.location.origin}${imageUrl}` : `${window.location.origin}/${imageUrl}`;
                
              return (
                <div key={index} className="mb-4 border p-3 rounded">
                  {item.receipt_image?.url && !imgError[index] ? (
                    <div className="mt-2">
                      <img 
                        src={fullImageUrl}
                        alt={`Receipt ${item.receipt_image.filename || 'image'}`}
                        className="max-w-full h-auto rounded border mt-2"
                        style={{maxHeight: '400px', objectFit: 'contain'}}
                        onError={() => {
                          console.error(`Failed to load image from URL: ${fullImageUrl}`);
                          setImgError(prev => ({...prev, [index]: true}));
                        }}
                      />
                    </div>
                  ) : imgError[index] ? (
                    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded">
                      <Text className="text-red-500">
                        Failed to load image. URL: {fullImageUrl}
                      </Text>
                    </div>
                  ) : null}
                </div>
              );
            })}
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