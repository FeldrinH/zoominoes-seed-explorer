import { onDestroy } from "svelte";

export function getQueryParam(key: string): string {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) ?? '';
}

export function setQueryParam(key: string, value: string) {
    const url = new URL(window.location.href);
    if (value == '') {
        url.searchParams.delete(key);
    } else {
        url.searchParams.set(key, value);
    }
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