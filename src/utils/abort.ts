
export function isAbortError(error: unknown): error is DOMException {
    if (error instanceof DOMException) {
        return error.name === 'AbortError'
    }
    return false
}

export function getAbortError(): DOMException {
    try {
        AbortSignal.abort().throwIfAborted()
    }
    catch (e) {
        if (isAbortError(e)) {
            return e
        }
    }
    throw new Error('Failed to create AbortError')
}