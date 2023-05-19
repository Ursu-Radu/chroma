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

    let editorData = new EditorData(
        new EditorSettings(new TextSettings("JetBrains Mono", 24))
    );
    $: lineHeight = textSize("measure", editorData.settings.text).y;

    let fileState = new FileState();
    const SPECIAL_KEYS = specialKeys(fileState);

    $: cursorPos = fileState.posInfo(
        fileState.cursor.pos,
        editorData.settings.text
    );
</script>

<svelte:window
    on:mouseup={() => {}}
    on:paste={e => {
        // e.preventDefault();
        // fileState.write(e.clipboardData.getData("text"));
        // fileState = fileState;
    }}
    on:copy={e => {
        // e.preventDefault();
        // e.clipboardData.setData("text/plain", fileState.getSelection());
        // fileState = fileState;
    }}
    on:keypress={e => {
        e.preventDefault();
        fileState.write(e.key);
        fileState = fileState;
    }}
    on:keydown={e => {
        // selecting = Selecting.No;
        getSelection().empty();
        let f = SPECIAL_KEYS[e.key];
        if (f != undefined) {
            e.preventDefault();
            f(e);
            fileState = fileState;
        }
    }}
    on:mousemove={() => {
        // if (selecting != Selecting.No) {
        //     let sel = getSelection();
        //     if (sel == null) return;
        //     if (sel.anchorNode == null) return;
        //     if (sel.focusNode == null) return;
        //     let anchorX = sel.anchorOffset;
        //     let anchorY = parseInt(
        //         sel.anchorNode.parentElement.getAttribute("data-lineid")
        //     );
        //     let focusX = sel.focusOffset;
        //     let focusY = parseInt(
        //         sel.focusNode.parentElement.getAttribute("data-lineid")
        //     );
        //     let cursor = fileState.getPlacedCursorPos(anchorX, anchorY);
        //     let selection = fileState.getPlacedCursorPos(focusX, focusY);
        //     fileState.cursor.x = cursor.x;
        //     fileState.cursor.y = cursor.y;
        //     fileState.cursor.selection = selection;
        //     fileState.collapseCursor();
        //     fileState = fileState;
        //     // console.log(
        //     //     sel.anchorNode.parentElement.getAttribute("data-lineid"),
        //     //     sel.focusNode.parentElement.getAttribute("data-lineid")
        //     // );
        //     // console.log(getSelection());
        // }
    }}
    on:mouseup={() => {
        // selecting = Selecting.No;
        // getSelection().empty();
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
    <pre
        class="code code_ref"
        on:mousedown={e => {
            setTimeout(() => {
                let sel = getSelection();
                let pos = sel.anchorOffset;

                // console.log(fileState.cursor == fileState.code.length);
                if (
                    pos == fileState.code.length + 1 &&
                    fileState.code[fileState.code.length - 1] == "\n"
                ) {
                    pos -= 1;
                }
                fileState.cursor.move(pos);
                fileState = fileState;
                sel.empty();
            }, 0);
        }}>{fixedNewlineEnd(fileState.code)}</pre>

    <div
        class="cursor"
        tabindex="-1"
        style:height={`${lineHeight}px`}
        style:top={`${lineHeight * cursorPos.line}px`}
        style:left={`${cursorPos.width}px`}
    />

    <input type="number" bind:value={fileState.cursor.pos} />
    <br />
    {JSON.stringify([
        fileState.posInfo(fileState.cursor.pos, editorData.settings.text),
        fileState.codeLines,
    ])}
</div>

<style>
    .code {
        font-size: var(--code-size);
        font-family: var(--code-font);
        /* background-color: #222222; */
        /* border-bottom: 1px solid black;
        border-top: 1px solid black; */
        border: 1px solid red;
        user-select: text;
        cursor: text;
    }
    .cursor {
        pointer-events: none;
        width: 2px;
        background-color: #ecbf0b;
        position: absolute;
        transition: top 0.05s ease-in-out, left 0.05s ease-in-out;
    }
</style>
