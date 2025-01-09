import { Modules } from '@medusajs/framework/utils';
import { MedusaRequest, MedusaResponse} from '@medusajs/framework';
import { z } from 'zod';


const categoriesFieldsMetadataSchema = z.object({
    image: z.object({
        id: z.string(),
        url: z.string().url(),
    }).optional(),
    description: z.string().optional(),
});

/**
 * Handles a GET request to retrieve product category details, including metadata.
 * @param {MedusaRequest} req - the request object containing route parameters and scope
 * @param {MedusaResponse} res - the response object used to send back the JSON response.
 * @returns {Promise<void>} - Resolves when the response is sent.
 */

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse,
): Promise<void> {
    const { categoriesId } = req.params;
    const productService = req.scope.resolve(Modules.PRODUCT);
    const category = await productService.retrieveProductCategory(categoriesId);

    const parsed = categoriesFieldsMetadataSchema.safeParse(category.metadata ?? {});

    res.json({
        image: parsed.success && parsed.data.image ? parsed.data.image : null,
        description: parsed.success && parsed.data.description ? parsed.data.description : 'di mo gana yate',
    });
}

export async function POST(
    req: MedusaRequest<typeof categoriesFieldsMetadataSchema>,
    res: MedusaResponse,
): Promise<void> {
    const { categoriesId } = req.params;

    console.log('Request body:', req.body);
    const customFields = categoriesFieldsMetadataSchema.parse(req.body);

    console.log('Parsed custom fields:', customFields);
    const productService = req.scope.resolve(Modules.PRODUCT);
    const category = await productService.retrieveProductCategory(
        categoriesId,
    );

    console.log('Original product category:', category.metadata);

    const updatedCategory = await productService.updateProductCategories(
        categoriesId,
        {
            metadata: {
                ...category.metadata,
                ...customFields,
            },
        },
    );

    console.log('Updated product category:', updatedCategory.metadata);
    res.json(updatedCategory);
}