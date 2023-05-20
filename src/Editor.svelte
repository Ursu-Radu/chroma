<script lang="ts">
    import { text } from "svelte/internal";
    import {
        EditorData,
        EditorSettings,
        FileState,
        TextSettings,
        specialKeys,
    } from "./editor";
    import { EMPTY_CHAR, fixedNewlineEnd, textSize } from "./util";

    let everything: HTMLDivElement;
    let codeRef: HTMLPreElement;

    let editorData = new EditorData(
        new EditorSettings(new TextSettings("JetBrains Mono", 24))
    );
    $: lineHeight =
        textSize("m\n".repeat(999) + "m", editorData.settings.text).y / 1000;

    let fileState = new FileState();
    const SPECIAL_KEYS = specialKeys(fileState);

    $: cursorPos = fileState.posInfo(
        fileState.cursor.pos,
        editorData.settings.text
    );

    let selecting = false;

    // setInterval(() => {
    //     console.log(fileState.cursor.sel);
    // }, 100);
</script>

<svelte:window
    on:mouseup={() => {}}
    on:paste={e => {
        e.preventDefault();
        fileState.write(e.clipboardData.getData("text"));
        fileState = fileState;
    }}
    on:copy={e => {
        e.preventDefault();
        e.clipboardData.setData("text/plain", fileState.getSelection());
        fileState = fileState;
    }}
    on:keypress={e => {
        getSelection().empty();
        e.preventDefault();
        fileState.write(e.key);
        fileState = fileState;
    }}
    on:keydown={e => {
        let f = SPECIAL_KEYS[e.key];
        if (f != undefined) {
            e.preventDefault();
            f(e);
            fileState = fileState;
        }
    }}
    on:mousemove={() => {
        if (selecting) {
            fileState.updateSelection(codeRef);

            fileState = fileState;
        }
    }}
    on:mouseup={() => {
        selecting = false;

        let sel = getSelection();

        sel.setPosition(sel.anchorNode, sel.anchorOffset);
    }}
/>

<div
    class="everything"
    style={`
    --code-font: "${editorData.settings.text.font}", monospace;
    --code-size: ${editorData.settings.text.size}px;
`}
    bind:this={everything}
>
    <div class="code_area">
        <pre
            class="code code_ref"
            bind:this={codeRef}
            on:mousedown={e => {
                setTimeout(() => {
                    selecting = true;
                    fileState.updateSelection(codeRef);

                    fileState = fileState;
                }, 0);
            }}>{fixedNewlineEnd(fileState.code)}</pre>
        <div class="sel_rects">
            {#each fileState.getSelRects(editorData.settings.text) as rect}
                <div
                    class="sel_rect"
                    style:height={`${lineHeight}px`}
                    style:width={`${rect.end - rect.start}px`}
                    style:left={`${rect.start}px`}
                    style:top={`${rect.line * lineHeight}px`}
                />
            {/each}
        </div>
        <pre class="code code_display">{fixedNewlineEnd(fileState.code)}</pre>

        <div
            class="cursor"
            tabindex="-1"
            style:height={`${lineHeight}px`}
            style:top={`${lineHeight * cursorPos.line}px`}
            style:left={`${cursorPos.width}px`}
        />
        <!-- {#if fileState.cursor.sel != undefined}
            <div
                class="sel_cursor"
                tabindex="-1"
                style:height={`${lineHeight}px`}
                style:top={`${lineHeight * cursorSelPos.line}px`}
                style:left={`${cursorSelPos.width}px`}
            />
        {/if} -->
    </div>
</div>

<style>
    .everything {
        width: 100%;
        height: 100%;
        position: relative;
    }
    .code_area {
        width: 100%;
        height: 100%;
        overflow: scroll;
    }
    .code {
        font-size: var(--code-size);
        font-family: var(--code-font);
        /* background-color: #222222; */
        /* border-bottom: 1px solid black;
        border-top: 1px solid black; */
    }
    .code_ref {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        user-select: text;
        background-color: #ffffff55;
        cursor: text;
    }
    .code_display {
        position: absolute;
        width: 100%;
        height: 100%;
        pointer-events: none;
        /* border: 1px solid red; */
    }

    .cursor {
        position: absolute;
        pointer-events: none;
        width: 2px;
        background-color: #ecbf0b;
        transition: top 0.05s ease-in-out, left 0.05s ease-in-out;
    }

    .sel_rects {
        width: 100%;
        height: 100%;
        position: absolute;
        pointer-events: none;
    }

    .sel_rect {
        position: absolute;
        background: #ffffff44;
        pointer-events: none;
        /* border-radius: 4px; */
    }
</style>
