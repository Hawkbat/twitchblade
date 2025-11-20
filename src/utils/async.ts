
export function wait(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeoutID = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort)
            resolve()
        }, ms)
        const onAbort = () => {
            clearTimeout(timeoutID)
            reject(new DOMException('Aborted', 'AbortError'))
        }
        signal?.addEventListener('abort', onAbort)
    })
}

export type ExposedPromise<T> = Promise<T> & {
    resolve: (value: T) => void
    reject: (reason?: any) => void
}

export function createExposedPromise<T>(): ExposedPromise<T> {
    let resolve!: (value: T) => void
    let reject!: (reason?: any) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    }) as ExposedPromise<T>
    promise.resolve = resolve
    promise.reject = reject
    return promise
}

export type ExposedAsyncGenerator<T> = AsyncGenerator<T, void, unknown> & {
    push: (value: T) => void
    close: () => void
}

export function createExposedAsyncGenerator<T>(): ExposedAsyncGenerator<T> {
    const queue: T[] = []
    let resolveNext: ((value: IteratorResult<T, void>) => void) | null = null
    let done = false
    const generator = (async function* () {
        while (true) {
            if (queue.length > 0) {
                yield queue.shift()!
            } else if (done) {
                return
            } else {
                const nextValue = await new Promise<IteratorResult<T, void>>(res => {
                    resolveNext = res
                })
                if (nextValue.done) {
                    return
                }
                yield nextValue.value
            }
        }
    })() as ExposedAsyncGenerator<T>
    generator.push = (value: T) => {
        if (resolveNext) {
            resolveNext({ value, done: false })
            resolveNext = null
        }
        else {
            queue.push(value)
        }
    }
    generator.close = () => {
        done = true
        if (resolveNext) {
            resolveNext({ value: undefined, done: true })
            resolveNext = null
        }
    }
    return generator
}
