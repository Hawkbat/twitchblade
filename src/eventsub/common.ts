
export function generateSubscriptionSecret(): string {
    return crypto.getRandomValues(new Uint8Array(32)).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
}
