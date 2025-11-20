//
// Override typings for built-in type definitions
//

// Replace 'any' with 'unknown' for better type safety

interface Response {
    json(): Promise<unknown>
}

interface JSON {
    parse(text: string, reviver?: (this: unknown, key: string, value: unknown) => any): unknown
}
