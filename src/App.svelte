<script lang="ts">
    import Editor from "./Editor.svelte";
</script>

<div class="test">
    <Editor />
</div>

<style>
    pre {
        font-size: 24px;
        font-family: "JetBrains Mono";
        display: inline;
    }
    .test {
        width: 100vw;
        height: 100vh;
        font-size: 0;
        /* border: 1px red solid; */
    }
</style>
