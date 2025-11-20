
export function safeJsonParse(json: string): unknown {
    try {
        return JSON.parse(json)
    } catch {
        return undefined
    }
}
