import { Modules } from '@medusajs/framework/utils';
import { MedusaRequest, MedusaResponse} from '@medusajs/framework';
import { z } from 'zod';


const categoriesFieldsMetadataSchema = z.object({
    image: z.object({
        id: z.string(),
        url: z.string().url(),
    }).optional(),
    description: z.string().optional(),
})

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
    // Extract the categoriesId from the request parameters
    const { categoryId} = req.params;
    // Resolve the product service from the dependency injection container
    const productService = req.scope.resolve(Modules.PRODUCT);
    // Retrieve the product category details
    const category = await productService.retrieveProductCategory(categoryId,);

    const parsed = categoriesFieldsMetadataSchema.safeParse(category.metadata ?? {});

    res.json({
        image: parsed.success && parsed.data.image ? parsed.data.image : null,
        description: parsed.success && parsed.data.description ? parsed.data.description : '',
    });
}

export async function POST(
    req: MedusaRequest<typeof categoriesFieldsMetadataSchema>,
    res: MedusaResponse,
): Promise<void> {
    const { categoriesId } = req.params;
    const customFields = categoriesFieldsMetadataSchema.parse(req.body);

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