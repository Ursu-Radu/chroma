<script lang="ts">
    import { text } from "svelte/internal";
    import {
        Cursor,
        EditorData,
        EditorSettings,
        FileState,
        TextSettings,
        specialCtrlKeys,
        specialKeys,
    } from "./editor";
    import { EMPTY_CHAR, codeDisplayStr, textSize } from "./util";
    import { highlightCode } from "./highlighting";
    import lang from "./langs/lang_defs/rust";
    import { langElemColor } from "./langs/lang";

    let everything: HTMLDivElement;
    let codeRef: HTMLPreElement;

    let editorData = new EditorData(
        new EditorSettings(new TextSettings("JetBrains Mono", 18))
    );

    let fileState = new FileState();
    const SPECIAL_KEYS = specialKeys(fileState);
    const SPECIAL_CTRL_KEYS = specialCtrlKeys(fileState);

    $: cursorPos = fileState.cursors.map(c =>
        fileState.posInfo(c.pos, editorData.settings.text)
    );

    let selecting = false;

    let cursorVisible = true;
    let cursorBlinkID = -1;
    const startCursorBlink = () => {
        clearInterval(cursorBlinkID);
        cursorVisible = true;
        cursorBlinkID = setInterval(() => {
            cursorVisible = !cursorVisible;
        }, 500);
    };
    startCursorBlink();
    $: {
        fileState.cursors;
        startCursorBlink();
    }

    let measureHeight = 0;
    $: lineHeight = measureHeight / 1000;

    // setInterval(() => {
    //     console.log(fileState.cursor.sel);
    // }, 100);

    // $: console.log(
    //     JSON.stringify(fileState.cursors.map(c => [c.pos, c.sel])),
    //     JSON.stringify(fileState.getSelRects(editorData.settings.text), null, 4)
    // );

    $: syntaxElements = highlightCode(fileState.code, lang);
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
        let f = undefined;
        if (e.ctrlKey) {
            f = SPECIAL_CTRL_KEYS[e.key];
        } else {
            f = SPECIAL_KEYS[e.key];
        }

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
                    if (e.altKey) {
                        fileState.cursors.push(new Cursor(fileState, 0));
                    } else {
                        fileState.cursors = [new Cursor(fileState, 0)];
                        fileState.mainCursor = fileState.cursors[0];
                    }
                    fileState.activeCursor =
                        fileState.cursors[fileState.cursors.length - 1];
                    fileState.updateSelection(codeRef);

                    fileState = fileState;
                }, 0);
            }}>{codeDisplayStr(fileState.code)}</pre>
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

        <pre class="code code_display">{codeDisplayStr(fileState.code)}</pre>
        <div class="syntax_highlighting">
            {#each syntaxElements as elem}
                <pre
                    class="code"
                    style:color={langElemColor(elem.elem)}>{elem.text}</pre>
            {/each}
            <!--  -->
        </div>

        {#each cursorPos as pos, i}
            <div
                class={`cursor ${
                    fileState.activeCursor == fileState.cursors[i]
                        ? "active_cursor"
                        : ""
                } ${
                    fileState.mainCursor == fileState.cursors[i]
                        ? "main_cursor"
                        : ""
                }`}
                tabindex="-1"
                style:height={`${lineHeight}px`}
                style:top={`${lineHeight * pos.line}px`}
                style:left={`${
                    pos.width -
                    (fileState.mainCursor == fileState.cursors[i] ? 3 : 0.5)
                }px`}
                style:opacity={cursorVisible ? 1 : 0}
            />
        {/each}
    </div>
    <pre
        class="code line_height_measure"
        bind:offsetHeight={measureHeight}>{"m\n".repeat(999) + "m"}</pre>
</div>

<style>
    .everything {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    .code_area {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: scroll;
        /* background-color: #ff000011; */
        /* display: flex;
        justify-content: stretch;
        align-items: stretch; */
    }
    .code {
        font-size: var(--code-size);
        font-family: var(--code-font);
        /* background-color: #222222; */
        /* border-bottom: 1px solid black;
        border-top: 1px solid black; */
    }
    .line_height_measure {
        position: absolute;
        pointer-events: none;
        opacity: 0;
    }
    .code_ref {
        position: absolute;
        /* min */
        /* min-width: max-content;
        min-height: max-content; */
        /* width: 100%;
        height: 100%; */
        height: max-content;
        min-height: 100%;
        width: max-content;
        min-width: 100%;
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
        opacity: 0;
        -webkit-text-stroke: 2px lime;
        /* border: 1px solid red; */
    }

    .syntax_highlighting {
        position: absolute;
        width: 100%;
        height: 100%;
        pointer-events: none;
        font-size: 0;
    }
    .syntax_highlighting > * {
        display: inline;
        /* opacity: 0; */
    }

    .cursor {
        position: absolute;
        pointer-events: none;
        width: 2px;
        background-color: #ecbf0b;
        transition: top 0.05s ease-in-out, left 0.05s ease-in-out,
            opacity 0.05s ease-in-out;
        border-radius: 10px;
    }
    .active_cursor {
        background-color: #1aec0b;
    }
    .main_cursor {
        width: 6px;
        /* box-shadow: 0 0 3px #3e9fff; */
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
