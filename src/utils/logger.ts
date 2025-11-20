
export enum LogLevel {
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
}

export interface Logger {
    debug(message: string): void
    info(message: string): void
    warn(message: string): void
    error(message: string, error?: unknown): void
}

export class ConsoleLogger implements Logger {
    constructor(public logLevel: LogLevel = LogLevel.INFO) {
        this.logLevel = logLevel
    }

    debug(message: string): void {
        if (this.logLevel < LogLevel.DEBUG) return
        console.debug(message)
    }
    info(message: string): void {
        if (this.logLevel < LogLevel.INFO) return
        console.info(message)
    }
    warn(message: string): void {
        if (this.logLevel < LogLevel.WARN) return
        console.warn(message)
    }
    error(message: string, error?: unknown): void {
        if (this.logLevel < LogLevel.ERROR) return
        console.error(message, error)
    }
}
