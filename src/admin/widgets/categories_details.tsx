import * as React from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  DetailWidgetProps,
  ProductCategoryDTO,
} from "@medusajs/framework/types";
import { Container, Heading, Button, Drawer, Text } from "@medusajs/ui";
import { PencilSquare } from "@medusajs/icons";
import { z } from "zod";
import { ImageField, imageFieldSchema } from "../components/Form/ImageField";
import { Form } from "../components/Form/Form";
import { withQueryClient } from "../components/QueryClientProvider";


const detailsFormSchema = z.object({
  image: imageFieldSchema().optional(),
});

const UpdateDetailsDrawer: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  title: React.ReactNode;
  initialValue: z.infer<typeof detailsFormSchema>;
  onSave: (values: z.infer<typeof detailsFormSchema>) => void;
}> = ({ children, isOpen, onOpenChange, id, title, initialValue, onSave }) => {
  console.log('UpdateDetailsDrawer props:', { isOpen, id, initialValue });

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Content className="max-h-full">
        <Drawer.Header>
          <Drawer.Title>{title}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <Form
            schema={detailsFormSchema}
            onSubmit={async (values) => {
              console.log('Form value submitted:', values);
              await fetch(`/admin/custom/product-categories/${id}/details`, {
                method: "POST",
                body: JSON.stringify(values),
                headers: {
                    'Content-type': 'application/json',
                },
                credentials: "include",
              })
              .then((res) => {
                console.log('Response:', res);
                return res.json();
              })
              .then((data) => {
                console.log('Parsed server response:', data);
              })
              .catch((error) => {
                console.error('Error during fetch', error);
              })

              onSave(values);
            }}
            defaultValues={initialValue}
            formProps={{
              id: `edit-product-category-${id}-fields`,
            }}
          >
            <div className="flex flex-col gap-y-4">
              <ImageField
                name="image"
                label="Image"
                dropzoneRootClassName="h-60"
              ></ImageField>
            </div>
          </Form>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button type="submit" form={`edit-product-category-${id}-fields`}>
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};

 const CategoriesDetailsWidget = ({
  data,
}: DetailWidgetProps<ProductCategoryDTO>) => {
  const [isEditModalOpen, setIsModalOpen] = React.useState(false);
  const [details, setDetails] = React.useState<z.infer<typeof detailsFormSchema> | null>(null);

  React.useEffect(() => {
    console.log('Fetching details for category:', data.id);
    fetch(`/admin/custom/product-categories/${data.id}/details`, {
      credentials: "include",
    })
      .then((res) => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then((json) => {
        console.log('Details fetched:', json);
        setDetails(json);
      })
      .catch((e) => {
        console.error('Error fetching details:', e);
      });
  }, [data.id]);

  console.log('Current details state:', details);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Category Thumbnail</Heading>
        {details !== null && (
          <UpdateDetailsDrawer
            isOpen={isEditModalOpen}
            onOpenChange={setIsModalOpen}
            title="Update Category Thumbnail"
            id={data.id}
            initialValue={details}
            onSave={(value) => {
              setDetails(value);
              setIsModalOpen(false);
            }}
          >
            <Button
              variant="transparent"
              size="small"
              className="text-ui-fg-muted hover:text-ui-fg-subtle"
              onClick={(event) => {
                console.log('Edit button clicked');
                console.log('Event:', event);
                event.preventDefault();
                setIsModalOpen(true);
              }}
            >
              <PencilSquare /> Edit
            </Button>
          </UpdateDetailsDrawer>      
        )}
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        {details === null ? (
          <Text>No details found</Text>
        ) : (
          <div className="flex flex-col gap-2">
            {typeof details.image?.url === 'string' && (
              <div>
                <img
                  src={details.image.url}
                  className="max-h-60 max-w-none w-auto"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
    zone: 'product_category.details.before',
});

export default withQueryClient(CategoriesDetailsWidget);
