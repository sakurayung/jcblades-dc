import * as React from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  DetailWidgetProps,
  AdminProductCategory,
} from "@medusajs/framework/types";
import { Container, Heading, Button, Drawer, Text } from "@medusajs/ui";
import { PencilSquare } from "@medusajs/icons";
import { z } from "zod";
import { ImageField, imageFieldSchema } from "../components/Form/ImageField";
import { Form } from "../components/Form/Form";
import { TextAreaField } from "../components/Form/TextAreaField";



const detailsFormSchema = z.object({
  image: imageFieldSchema().optional(),
  description: z.string().optional(),
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
              await fetch(`/admin/custom/product_categories/${id}/details`, {
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
              id: `edit-product_category-${id}-fields`,
            }}
          >
            <div className="flex flex-col gap-y-4">
              <ImageField
                name="image"
                label="Image"
                dropzoneRootClassName="h-60"
              ></ImageField>
              <TextAreaField name="description" label="Description" />
            </div>
          </Form>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button type="submit" form={`edit-product_category-${id}-fields`}>
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};

 const CategoriesDetailsWidget = ({
  data,
}: DetailWidgetProps<AdminProductCategory>) => {
  const [isEditModalOpen, setIsModalOpen] = React.useState(false);
  const [details, setDetails] = React.useState<z.infer<typeof detailsFormSchema> | null>(null);

  React.useEffect(() => {
    console.log('Fetching details for category:', data.id);
    fetch(`/admin/custom/product_categories/${data.id}/details`, {
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
        <Heading>Details</Heading>
        {details !== null && (
          <UpdateDetailsDrawer
            isOpen={isEditModalOpen}
            onOpenChange={setIsModalOpen}
            title="Update categories details"
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
            {(details.description?.length ?? 0) > 0 && (
              <Text>{details.description}</Text>
            )}

            {typeof details.image?.url !== 'string' && !details.description && (
              <Text>No details available</Text>
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

export default CategoriesDetailsWidget;
