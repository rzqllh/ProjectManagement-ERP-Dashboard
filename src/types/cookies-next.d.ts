declare module 'cookies-next' {
    export function setCookie(key: string, value: any, options?: any): void;
    export function deleteCookie(key: string, options?: any): void;
    export function getCookie(key: string, options?: any): any;
    export function hasCookie(key: string, options?: any): boolean;
    export function getCookies(options?: any): any;
}
