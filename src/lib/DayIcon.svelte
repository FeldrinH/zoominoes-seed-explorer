<script lang="ts">
    import type { Level } from "@/game/Entity";
    import { isShop } from "@/game/roll";

    interface Props {
        level: Level
    }

    const { level }: Props = $props();
</script>

<div class="container">
    {#if level.data.name}
        <div class="sprite" style:background-color={isShop(level) ? '#4D5186' : '#664089'} style:mask-image={`url("/sprites/${level.data.fileName}.png")`}></div>
        <div class="tooltip">{level.data.name.toUpperCase()}</div>
    {:else}
        {level.day}
    {/if}
</div>

<style>
    .container {
        display: inline-block;
        position: relative;
        width: 70px;
        height: 70px;
        
        font-size: 48px;
        font-weight: 700;
        line-height: 70px;
        text-align: center;
        vertical-align: middle;
        
        cursor: pointer;
        user-select: none;
    }

    .sprite {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        mask-size: contain;
    }

    .tooltip {
        display: none;
        position: absolute;
        bottom: 65px;
        left: 50%;
        translate: -50% 0;
        width: max-content;
        
        border: 2px solid #271915;
        border-radius: 10px;
        padding: 10px;
        background-color: #FFF1CE;

        font-size: 1.25rem;
        font-weight: 600;
        line-height: initial;
        text-align: center;

        pointer-events: none;
    }

    .container:hover {
        scale: 1.2;
    }

    .container:hover > .tooltip {
        display: block;
    }
</style>