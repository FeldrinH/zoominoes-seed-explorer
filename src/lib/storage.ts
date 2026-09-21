import { onDestroy } from "svelte";

export function getQueryParams(): URLSearchParams {
    return new URLSearchParams(window.location.search);
}

export function setQueryParams(...params: [string, string][]) {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams(params).toString();
    history.replaceState(history.state, '', url);
}

export function loadValue<T>(key: string, defaultValue: T): T {
    const value = localStorage.getItem(key);
    return (value != null ? JSON.parse(value) : defaultValue);
}

export function saveValue<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function onDestroyOrHide(callback: () => void) {
    onDestroy(() => {
        callback();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            callback();
        }
    });
}