export const getPage = (page: number, limit = 10): number => Number(page - 1) * Number(limit);
