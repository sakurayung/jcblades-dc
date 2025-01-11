import { Modules } from '@medusajs/framework/utils';
import { MedusaRequest, MedusaResponse} from '@medusajs/framework';
import { z } from 'zod';


const productCategoryFieldsMetadataSchema = z.object({
    image: z.object({
        id: z.string().optional(),
        url: z.string().url().optional(),
    }).optional(),
});


export async function GET(
    req: MedusaRequest,
    res: MedusaResponse,
): Promise<void> {
    const { categoriesId } = req.params;
    const productService = req.scope.resolve(Modules.PRODUCT);
    const productCategory = await productService.retrieveProductCategory(categoriesId, {
        select: [ 'id', 'name', 'metadata' ],
    });

    console.log('Product Category Metadata:', productCategory.metadata);

    const parsed = productCategoryFieldsMetadataSchema.safeParse(productCategory.metadata ?? {});
    console.log('Parsing Success:', parsed.success);
    console.log('Parsed Image:', parsed.data.image);

    res.json({
        image: parsed.success && parsed.data.image ? parsed.data.image : null,
    });
    console.log('Product Category Metadata:', JSON.stringify(productCategory.metadata, null, 2));
}

export async function POST(
    req: MedusaRequest<typeof productCategoryFieldsMetadataSchema>,
    res: MedusaResponse,
): Promise<void> {
    const { categoriesId } = req.params;
    const customFields = productCategoryFieldsMetadataSchema.parse(req.body);

    const productService = req.scope.resolve(Modules.PRODUCT);
    const category = await productService.retrieveProductCategory(
        categoriesId,
    );

    const updatedCategories = await productService.updateProductCategories(
        categoriesId,
        {
            metadata: {
                ...category.metadata,
                ...customFields,
            },
        },
    );
    res.json(updatedCategories);
}