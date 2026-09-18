import { onDestroy } from "svelte";

export class TaskContext {
    #taskId: symbol | null = null;

    constructor() {
        onDestroy(() => this.stop());
    }
    
    async run<T>(task: AsyncIterable<T>, callback: (value: T) => void) {
        const taskId = Symbol();
        this.#taskId = taskId;
        for await (const value of task) {
            if (this.#taskId != taskId) break;
            callback(value)
            await yieldToBrowser();
        }
    }

    isRunning(): boolean {
        return this.#taskId != null;
    }

    stop() {
        this.#taskId = null;
    }
}

function yieldToBrowser() {
    return new Promise(resolve => setTimeout(resolve, 0));
}
