
export interface KeyValueCache<K, V> {
    keys(): K[]
    values(): V[]
    entries(): [K, V][]
    get(key: K): V | undefined
    set(key: K, value: V): this
    delete(key: K): boolean
    has(key: K): boolean
    clear(): void
}

export interface KeyCache<K> {
    keys(): K[]
    add(key: K): this
    delete(key: K): boolean
    has(key: K): boolean
    clear(): void
}

/**
 * A simple First-In-First-Out (FIFO) size-limited cache implementation.
 */
export class FifoKeyCache<K> implements KeyCache<K> {
    // FIFO queue of keys to evict, implemented as a circular buffer
    private fifo: K[]
    private head = 0
    private size = 0
    constructor(
        private maxSize: number,
        private cache = new Set<K>(),
    ) {
        this.fifo = new Array<K>(maxSize)
        if (cache.size > 0) {
            // Pre-fill the FIFO queue if the initial cache is not empty
            const keys = Array.from(cache.keys())
            for (let i = 0; i < keys.length && i < maxSize; i++) {
                this.fifo[i] = keys[i]!
            }
            this.size = Math.min(cache.size, maxSize)
            this.head = this.size % maxSize
        }
    }

    keys(): K[] {
        return Array.from(this.cache.keys())
    }

    add(key: K): this {
        // If key already exists, do nothing
        if (this.cache.has(key)) {
            return this
        } 
        // If at capacity, evict the oldest item
        if (this.size >= this.maxSize) {
            const oldestKey = this.fifo[this.head]
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey)
            }
        } else {
            this.size++
        }
        // Add new key
        this.cache.add(key)
        this.fifo[this.head] = key
        this.head = (this.head + 1) % this.maxSize
        return this
    }

    delete(key: K): boolean {
        // Note: This does not remove the key from the FIFO queue to keep implementation simple.
        return this.cache.delete(key)
    }

    has(key: K): boolean {
        return this.cache.has(key)
    }

    clear(): void {
        this.cache.clear()
        this.head = 0
        this.size = 0
    }
}

/**
 * A simple First-In-First-Out (FIFO) size-limited cache implementation.
 */
export class FifoKeyValueCache<K, V> implements KeyValueCache<K, V> {
    // FIFO queue of keys to evict, implemented as a circular buffer
    private fifo: K[]
    private head = 0
    private size = 0

    constructor(
        private maxSize: number,
        private cache = new Map<K, V>(),
    ) {
        this.fifo = new Array<K>(maxSize)
        if (cache.size > 0) {
            // Pre-fill the FIFO queue if the initial cache is not empty
            const keys = Array.from(cache.keys())
            for (let i = 0; i < keys.length && i < maxSize; i++) {
                this.fifo[i] = keys[i]!
            }
            this.size = Math.min(cache.size, maxSize)
            this.head = this.size % maxSize
        }
    }

    keys(): K[] {
        return Array.from(this.cache.keys())
    }

    values(): V[] {
        return Array.from(this.cache.values())
    }

    entries(): [K, V][] {
        return Array.from(this.cache.entries())
    }

    get(key: K): V | undefined {
        return this.cache.get(key)
    }

    set(key: K, value: V): this {
        this.add(key, value)
        return this
    }
    
    add(key: K, value: V): this {
        // If key already exists, just update the value
        if (this.cache.has(key)) {
            this.cache.set(key, value)
            return this
        }

        // If at capacity, evict the oldest item
        if (this.size >= this.maxSize) {
            const oldestKey = this.fifo[this.head]
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey)
            }
        } else {
            this.size++
        }

        // Add new key-value pair
        this.cache.set(key, value)
        this.fifo[this.head] = key
        this.head = (this.head + 1) % this.maxSize
        return this
    }

    delete(key: K): boolean {
        // Note: This does not remove the key from the FIFO queue to keep implementation simple.
        return this.cache.delete(key)
    }

    has(key: K): boolean {
        return this.cache.has(key)
    }
    
    clear(): void {
        this.cache.clear()
        this.head = 0
        this.size = 0
    }
}
