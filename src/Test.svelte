<script lang="ts">
    import {
        EditorData,
        EditorSettings,
        FileState,
        TextSettings,
        specialKeys,
    } from "./editor_old";

    let everything: HTMLDivElement;

    let editorData = new EditorData(
        new EditorSettings(new TextSettings("JetBrains Mono", 24))
    );

    let fileState = new FileState();
    const SPECIAL_KEYS = specialKeys(fileState);

    let lineHeight = 0;

    let cursorVisualX = 0;
    let selCursorVisualX = 0;

    enum Selecting {
        No,
        Normal,
        Shift,
    }

    let selecting = Selecting.No;
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
        e.preventDefault();
        fileState.write(e.key);
        fileState = fileState;
    }}
    on:keydown={e => {
        selecting = Selecting.No;
        getSelection().empty();
        let f = SPECIAL_KEYS[e.key];
        if (f != undefined) {
            e.preventDefault();
            f(e);
            fileState = fileState;
        }
    }}
    on:mousemove={() => {
        if (selecting != Selecting.No) {
            let sel = getSelection();
            if (sel == null) return;
            if (sel.anchorNode == null) return;
            if (sel.focusNode == null) return;
            let anchorX = sel.anchorOffset;
            let anchorY = parseInt(
                sel.anchorNode.parentElement.getAttribute("data-lineid")
            );
            let focusX = sel.focusOffset;
            let focusY = parseInt(
                sel.focusNode.parentElement.getAttribute("data-lineid")
            );
            let cursor = fileState.getPlacedCursorPos(anchorX, anchorY);
            let selection = fileState.getPlacedCursorPos(focusX, focusY);
            fileState.cursor.x = cursor.x;
            fileState.cursor.y = cursor.y;
            fileState.cursor.selection = selection;
            fileState.collapseCursor();
            fileState = fileState;
            // console.log(
            //     sel.anchorNode.parentElement.getAttribute("data-lineid"),
            //     sel.focusNode.parentElement.getAttribute("data-lineid")
            // );
            // console.log(getSelection());
        }
    }}
    on:mouseup={() => {
        selecting = Selecting.No;
        getSelection().empty();
    }}
/>

<div
    class="everything"
    style={`
    --code-font: "${editorData.settings.text.font}", monospace;
    --code-size: ${editorData.settings.text.size}px;

    --line-height: ${lineHeight}px;
`}
    bind:this={everything}
>
    {#each fileState.codeLines as line, i}
        <pre
            class="code code_reference"
            tabindex="-1"
            data-lineid={i}
            on:mousedown={e => {
                if (e.shiftKey) {
                    selecting = Selecting.Shift;
                } else {
                    selecting = Selecting.Normal;
                }
                setTimeout(() => {
                    let sel = getSelection();

                    let newCursor = fileState.getPlacedCursorPos(
                        sel.anchorOffset,
                        i
                    );

                    if (e.shiftKey) {
                        fileState.cursor.selection = newCursor;
                    } else {
                        fileState.cursor.move(newCursor.x, newCursor.y);
                    }

                    fileState = fileState;
                }, 0);
            }}>{line.length == 0 ? " " : line}</pre>
    {/each}

    <div
        class="cursor"
        tabindex="-1"
        style:height={`${lineHeight}px`}
        style:top={`${lineHeight * fileState.cursor.y}px`}
        style:left={`${cursorVisualX - 1}px`}
    />
    {#if fileState.cursor.selection != undefined}
        <div
            class="sel_cursor"
            tabindex="-1"
            style:height={`${lineHeight}px`}
            style:top={`${lineHeight * fileState.cursor.selection.y}px`}
            style:left={`${selCursorVisualX - 1}px`}
        />
    {/if}

    {JSON.stringify(fileState.cursor)} <br />
    {JSON.stringify(selecting)}

    <pre
        class="code measure"
        tabindex="-1"
        bind:offsetWidth={cursorVisualX}>{fileState.codeLines[
            fileState.cursor.y
        ].slice(0, fileState.cursor.x)}</pre>

    {#if fileState.cursor.selection != undefined}
        <pre
            class="code measure"
            tabindex="-1"
            bind:offsetWidth={selCursorVisualX}>{fileState.codeLines[
                fileState.cursor.selection.y
            ].slice(0, fileState.cursor.selection.x)}</pre>
    {/if}

    <pre
        class="code measure"
        tabindex="-1"
        bind:offsetHeight={lineHeight}>Line measure</pre>

    <!-- <pre
        class="code code_reference"
        tabindex="-1"
        on:mousedown={() => {
            setTimeout(() => {
                let sel = getSelection();
                cursor = sel.focusOffset;
                inputArea.select();
                // sel.empty();
            }, 0);
        }}>{code}</pre> -->
    <!-- <div
        class="cursor"
        tabindex="-1"
        style:height={`${cursorDisplay.height}px`}
        style:top={`${cursorDisplay.y}px`}
        style:left={`${cursorDisplay.x - 1}px`}
    />
    <textarea
        class="input_area"
        tabindex="-1"
        bind:this={inputArea}
        bind:value={inputValue}
        on:keydown={e => {
            switch (e.key) {
                case "Backspace":
                    code = code.slice(0, cursor - 1) + code.slice(cursor);
                    cursor -= 1;
                    break;
            }
        }}
        on:input={e => {
            if (inputValue.length > 0) {
                code =
                    code.slice(0, cursor) +
                    inputValue +
                    code.slice(cursor);
                cursor += inputValue.length;
                inputValue = "";
            }
        }}
    />
    <pre
        class="code measure"
        tabindex="-1"
        bind:offsetWidth={measureSize.x}
        bind:offsetHeight={measureSize.y}>{cursorInfo.measureText}</pre>
     </div> 
    <br /><br />-->
</div>

<style>
    .everything {
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
    }

    .cursor {
        pointer-events: none;
        width: 2px;
        background-color: #ecbf0b;
        position: absolute;
        transition: top 0.05s ease-in-out, left 0.05s ease-in-out;
    }
    .sel_cursor {
        pointer-events: none;
        width: 2px;
        background-color: #0b83ec;
        position: absolute;
        transition: top 0.05s ease-in-out, left 0.05s ease-in-out;
    }

    .measure {
        position: absolute;
        pointer-events: none;
        opacity: 0;
    }

    .code_reference {
        min-height: var(--line-height);
        max-height: var(--line-height);
        /* display: inline-block; */
        /* position: absolute; */
        /* min-width: 512px;
        min-height: 512px; */
    }

    .code {
        /* display: inline-block; */
        font-size: var(--code-size);
        font-family: var(--code-font);
        background-color: #222222;
        border-bottom: 1px solid black;
        border-top: 1px solid black;
        user-select: text;
        cursor: text;
    }
</style>
