import { AppError } from '@/lib/errors';

export type ServiceResult<T> =
    | { success: true; data: T }
    | { success: false; error: AppError };

export class BaseService {
    protected success<T>(data: T): ServiceResult<T> {
        return { success: true, data };
    }

    protected error<T>(error: AppError): ServiceResult<T> {
        return { success: false, error };
    }
}
