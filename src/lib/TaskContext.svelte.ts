import { onDestroy } from "svelte";

export class TaskContext {
    #running: boolean = $state(false);
    #taskId: symbol | null = null;

    constructor() {
        onDestroy(() => this.stop());
    }
    
    async run<T>(task: Iterable<T>, callback: (value: T) => void) {
        const taskId = Symbol();
        this.#running = true;
        this.#taskId = taskId;
        for (const value of task) {
            if (this.#taskId != taskId) break;
            callback(value)
            await yieldToBrowser();
        }
        this.#running = false;
    }

    isRunning(): boolean {
        return this.#running;
    }

    stop() {
        this.#running = false;
        this.#taskId = null;
    }
}

function yieldToBrowser() {
    return new Promise(resolve => setTimeout(resolve, 0));
}
