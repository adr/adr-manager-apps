/** Resolves to the response data, or undefined after logging the error. */
export async function request<T>(promise: Promise<{ data: T }>): Promise<T | undefined> {
    try {
        const response = await promise;
        return response.data;
    } catch (err) {
        console.error(err);
        return undefined;
    }
}
