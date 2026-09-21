<script lang="ts">
    import { RARITY_NAMES, type Entity } from "@/game/Entity";

    interface Props {
        entity: Entity
    }

    const { entity }: Props = $props();
</script>

<div class="container">
    <img src={`/sprites/${entity.data.fileName}.png`} alt={entity.data.name}>
    <div class="tooltip">
        <div class="name">{entity.data.name.toUpperCase()}</div>
        <div class="rarity">{RARITY_NAMES[entity.data.rarity]}</div>
    </div>
</div>

<style>
    .container {
        display: inline-block;
        width: 70px;
        height: 70px;
        vertical-align: bottom;

        cursor: pointer;
    }

    img {
        width: 70px;
        height: 70px;
        object-fit: contain;
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

        font-weight: 600;
        line-height: initial;
        text-align: center;

        pointer-events: none;
    }

    .name {
        font-size: 1.25rem;
        margin-bottom: 2px;
    }

    .rarity {
        font-size: 1.1rem;
    }

    .container:hover {
        scale: 1.2;
    }

    .container:hover > .tooltip {
        display: block;
    }
</style>