export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

/**
 * Validates and parses pagination and sorting query parameters.
 * 
 * @param {Object} query - Express req.query object
 * @param {Object} options - Configuration options
 * @param {string[]} options.allowedSortFields - Allowlist of sort field names
 * @param {string} [options.defaultSortBy='createdAt'] - Default sort field
 * @param {string} [options.defaultSortOrder='desc'] - Default sort order ('asc' or 'desc')
 * @param {number} [options.defaultLimit=10] - Default limit if omitted
 * @param {number} [options.defaultPage=1] - Default page if omitted
 * @param {number} [options.maxLimit=100] - Maximum allowable limit
 * @returns {{ error?: string, page?: number, limit?: number, skip?: number, sortBy?: string, sortOrder?: string, sort?: Object }}
 */
export const parsePaginationAndSort = (query = {}, options = {}) => {
    const {
        allowedSortFields = [],
        defaultSortBy = 'createdAt',
        defaultSortOrder = 'desc',
        defaultLimit = DEFAULT_LIMIT,
        defaultPage = DEFAULT_PAGE,
        maxLimit = MAX_LIMIT
    } = options;

    let page = defaultPage;
    let limit = defaultLimit;
    let sortBy = defaultSortBy;
    let sortOrder = defaultSortOrder;

    // Validate and parse 'page'
    if (query.page !== undefined) {
        const pageRaw = String(query.page).trim();
        const pageNum = Number(pageRaw);

        if (!/^\d+$/.test(pageRaw) || !Number.isInteger(pageNum) || pageNum < 1) {
            return {
                error: 'Invalid page parameter. Page must be a positive integer (greater than or equal to 1).'
            };
        }
        page = pageNum;
    }

    // Validate and parse 'limit'
    if (query.limit !== undefined) {
        const limitRaw = String(query.limit).trim();
        const limitNum = Number(limitRaw);

        if (!/^\d+$/.test(limitRaw) || !Number.isInteger(limitNum) || limitNum < 1) {
            return {
                error: 'Invalid limit parameter. Limit must be a positive integer (greater than or equal to 1).'
            };
        }

        if (limitNum > maxLimit) {
            return {
                error: `Limit exceeds maximum allowed value of ${maxLimit}.`
            };
        }
        limit = limitNum;
    }

    // Validate and parse 'sortBy'
    if (query.sortBy !== undefined && query.sortBy !== '') {
        const requestedSortBy = String(query.sortBy).trim();
        if (!allowedSortFields.includes(requestedSortBy)) {
            return {
                error: `Invalid sortBy field '${requestedSortBy}'. Allowed sort fields: ${allowedSortFields.join(', ')}.`
            };
        }
        sortBy = requestedSortBy;
    }

    // Validate and parse 'sortOrder'
    if (query.sortOrder !== undefined && query.sortOrder !== '') {
        const orderRaw = String(query.sortOrder).toLowerCase().trim();
        if (orderRaw === 'asc' || orderRaw === 'ascending' || orderRaw === '1') {
            sortOrder = 'asc';
        } else if (orderRaw === 'desc' || orderRaw === 'descending' || orderRaw === '-1') {
            sortOrder = 'desc';
        } else {
            return {
                error: `Invalid sortOrder '${query.sortOrder}'. Allowed values are 'asc' or 'desc'.`
            };
        }
    }

    const direction = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: direction };

    // Deterministic tie-breaker
    if (sortBy !== '_id') {
        sort._id = direction;
    }

    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        sortBy,
        sortOrder,
        sort
    };
};

// ============================================================================
// Pagination Metadata Helper
// ============================================================================

/**
 * Builds a standardized pagination metadata object containing page numbers,
 * limit, total matching document count, calculated total pages, and navigation flags.
 * 
 * @param {number} total - Total count of matching documents in the database collection
 * @param {number} page - Current active page number (1-indexed)
 * @param {number} limit - Number of items displayed per page
 * @returns {{ page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean }}
 */
export const buildPaginationMeta = (total, page, limit) => {
    // Calculate total pages safely (0 when there are no documents)
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    
    // Determine whether next or previous pages exist
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1 && totalPages > 0;

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage
    };
};

