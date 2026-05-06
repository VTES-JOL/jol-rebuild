type OnUnauthorized = () => void;

let unauthorizedHandler: OnUnauthorized | null = null;

export function setUnauthorizedHandler(handler: OnUnauthorized) {
    unauthorizedHandler = handler;
}

export async function baseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, {
        ...init,
        credentials: init?.credentials ?? "include",
    });

    if (response.status === 401) {
        if (unauthorizedHandler) {
            unauthorizedHandler();
        }
    }

    return response;
}

export async function json<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.message ?? `${res.status} ${res.statusText}`;
        throw new Error(message);
    }
    return res.json();
}
