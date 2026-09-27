// Web worker for parallel search

import type { Zookeeper } from "@/game/roll";
import { onDestroy } from "svelte";
import SearchWorker from "@/lib/searchworker?worker";

export interface SearchParams {
    difficulty: string;
    zookeeper: Zookeeper;
    rewardGoals: Goal[];
    shopGoals: Goal[];
}

export interface SearchResult {
    attempts: number;
    seed?: string;
}

export interface Goal {
    target: string;
    minDay: number;
    maxDay: number;
    count: number;
}

export class SearchRunner {
    #running: boolean = $state(false);
    #workers: Worker[] = []

    constructor() {
        onDestroy(() => this.stop());
    }
    
    async run(params: SearchParams, callback: (value: SearchResult) => void) {
        if (this.#running) {
            this.stop();
        }
        this.#running = true;

        // Optimal worker count is kind of tricky to estimate, but this seems to do reasonably well.
        const workerCount = Math.ceil(navigator.hardwareConcurrency * 0.8);
        
        let attempts = 0;

        for (let i = 0; i < workerCount; i++) {
            const worker = new SearchWorker();
            worker.onmessage = event => {
                if (event.data.seed != undefined) {
                    this.stop();
                }
                attempts += event.data.attempts;
                callback({ attempts, seed: event.data.seed });
            }
            worker.postMessage(params);
            this.#workers.push(worker);
        }

        callback({ attempts: 0 });
    }

    isRunning(): boolean {
        return this.#running;
    }

    stop() {
        for (const worker of this.#workers) {
            worker.terminate();
        }
        this.#workers = [];
        this.#running = false;
    }
}
