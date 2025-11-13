export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  meta?: PaginationMeta;
}

export class ResponseBuilder {
  static success<T>(data: T, message: string = 'Success', meta?: PaginationMeta): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta
    };
  }

  static error(error: string, message: string = 'Error occurred'): ApiResponse {
    return {
      success: false,
      error,
      message
    };
  }

  static paginate<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success'
  ): ApiResponse<T[]> {
    const total_pages = Math.ceil(total / limit);
    const has_next = page < total_pages;
    const has_previous = page > 1;

    return {
      success: true,
      data,
      message,
      meta: {
        total,
        limit,
        page,
        total_pages,
        has_next,
        has_previous
      }
    };
  }
}
