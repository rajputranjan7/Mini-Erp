import { Request } from "express";

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function getPagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const rawPageSize = parseInt(String(req.query.pageSize ?? DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(1, rawPageSize), MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function paginatedResponse<T>(data: T[], total: number, pagination: PaginationParams) {
  return {
    data,
    meta: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages: Math.ceil(total / pagination.pageSize) || 1,
    },
  };
}
