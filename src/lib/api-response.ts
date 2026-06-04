import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { ZodError } from 'zod';

type SuccessResponse<T> = {
    success: true;
    data: T;
    meta?: Record<string, any>;
};

type ErrorResponse = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
};

export function successResponse<T>(
    data: T,
    status = 200,
    meta?: Record<string, any>
): NextResponse<SuccessResponse<T>> {
    return NextResponse.json(
        { success: true, data, meta },
        { status }
    );
}

export function errorResponse(error: unknown): NextResponse<ErrorResponse> {
    console.error('API Error:', error);

    if (error instanceof AppError) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                },
            },
            { status: error.statusCode }
        );
    }

    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.flatten(),
                },
            },
            { status: 400 }
        );
    }

    // Fallback for unhandled errors
    return NextResponse.json(
        {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
            },
        },
        { status: 500 }
    );
}
