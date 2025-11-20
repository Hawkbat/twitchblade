
/**
 * A simple event emitter with async and AbortSignal support.
 */
export class EventEmitter<T extends Record<string, any[]>> {
    private listeners: { [K in keyof T]?: Array<(...args: T[K]) => void> } = {}

    /**
     * Adds an event listener for the specified event. Returns a function to remove the listener. Can be used with an AbortSignal to remove the listener if aborted.
     */
    on<K extends keyof T>(event: K, listener: (...args: T[K]) => void, signal?: AbortSignal): () => void {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        this.listeners[event]!.push(listener)
        if (signal) {
            signal.addEventListener('abort', () => {
                this.off(event, listener)
            }, { once: true })
        }
        return () => this.off(event, listener)
    }

    /**
     * Removes an event listener for the specified event.
     */
    off<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event]!.filter(l => l !== listener)
        }
    }
    /**
     * Emits the specified event to all its listeners.
     */
    emit<K extends keyof T>(event: K, ...args: T[K]): void {
        if (this.listeners[event]) {
            for (const listener of this.listeners[event]!) {
                listener(...args)
            }
        }
    }

    /**
     * Adds a one-time event listener for the specified event. Returns a function to remove the listener. Can be used with an AbortSignal to remove the listener if aborted before invocation.
     */
    once<K extends keyof T>(event: K, listener: (...args: T[K]) => void, signal?: AbortSignal): () => void {
        const wrapper = (...args: T[K]) => {
            listener(...args)
            this.off(event, wrapper)
        }
        this.on(event, wrapper, signal)
        return () => this.off(event, wrapper)
    }

    /**
     * Waits for the next occurrence of the specified event and resolves with its arguments. If an AbortSignal is provided and aborted before the event occurs, resolves with null.
     */
    next<K extends keyof T>(event: K): Promise<T[K]>
    next<K extends keyof T>(event: K, signal: AbortSignal): Promise<T[K] | null>
    next<K extends keyof T>(event: K, signal?: AbortSignal): Promise<T[K] | null> {
        return new Promise<T[K] | null>((resolve, reject) => {
            const wrapper = (...args: T[K]) => {
                try {
                    resolve(args)
                } catch (err) {
                    reject(err)
                } finally {
                    this.off(event, wrapper)
                }
            }
            this.on(event, wrapper)
            if (signal) {
                if (signal.aborted) {
                    this.off(event, wrapper)
                    resolve(null)
                    return
                }
                signal.addEventListener('abort', () => {
                    this.off(event, wrapper)
                    resolve(null)
                }, { once: true })
            }
        })
    }

    /**
     * Creates an async generator that yields every occurrence of the specified event. If an AbortSignal is provided, the generator will stop when the signal is aborted.
     */
    async *every<K extends keyof T>(event: K, signal?: AbortSignal): AsyncGenerator<T[K]> {
        if (signal) {
            if (signal.aborted) {
                return
            }
            while (!signal.aborted) {
                const args = await this.next(event, signal)
                if (args === null) {
                    return
                }
                yield args
            }
        } else {
            while (true) {
                const args = await this.next(event)
                yield args
            }
        }
    }
    
    /**
     * Removes all listeners for the specified event.
     */
    removeListeners<K extends keyof T>(event: K): void {
        if (this.listeners[event]) {
            this.listeners[event].length = 0
        }
    }

    /**
     * Removes all listeners for all events.
     */
    removeAllListeners(): void {
        for (const key in this.listeners) {
            this.removeListeners(key as keyof T)
        }
    }

}

