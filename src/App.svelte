<script lang="ts">
    import {
        EditorData,
        EditorSettings,
        FileState,
        TextSettings,
    } from "./editor";

    let editorData = new EditorData(
        new EditorSettings(new TextSettings("JetBrains Mono", 24))
    );

    let fileState = new FileState();
    let lineHeight = 0;

    let cursorVisualX = 0;

    let inputArea: HTMLTextAreaElement;
    let inputValue = "";
</script>

<div
    class="everything"
    style={`
    --code-font: "${editorData.settings.text.font}", monospace;
    --code-size: ${editorData.settings.text.size}px;

    --line-height: ${lineHeight}px;
`}
>
    {#each fileState.codeLines as line, i}
        <pre
            class="code code_reference"
            tabindex="-1"
            on:mousedown={() => {
                setTimeout(() => {
                    let sel = getSelection();

                    let newCursor = {
                        x: sel.focusOffset,
                        y: i,
                    };

                    if (fileState.codeLines[i].length == 0) {
                        newCursor.x = 0;
                    }
                    fileState.cursor.move(newCursor.x, newCursor.y);
                    fileState = fileState;
                    inputArea.select();
                }, 0);
            }}>{line}</pre>
    {/each}

    <div
        class="cursor"
        tabindex="-1"
        style:height={`${lineHeight}px`}
        style:top={`${lineHeight * fileState.cursor.y}px`}
        style:left={`${cursorVisualX - 1}px`}
    />

    <pre
        class="code measure"
        tabindex="-1"
        bind:offsetWidth={cursorVisualX}>{fileState.codeLines[
            fileState.cursor.y
        ].slice(0, fileState.cursor.x)}</pre>

    <pre
        class="code measure"
        tabindex="-1"
        bind:offsetHeight={lineHeight}>Line measure</pre>

    <textarea
        class="input_area"
        tabindex="-1"
        bind:this={inputArea}
        bind:value={inputValue}
        on:input={e => {
            if (inputValue.length > 0) {
                fileState.write(inputValue);
                fileState = fileState;
                inputValue = "";
            }
        }}
        on:keydown={e => {
            console.log(e);
            switch (e.key) {
                case "Backspace":
                    fileState.backspace();
                    fileState = fileState;
                    break;
                case "ArrowUp":
                    fileState.cursorUp();
                    fileState = fileState;
                    break;
                case "ArrowDown":
                    fileState.cursorDown();
                    fileState = fileState;
                    break;
                case "ArrowLeft":
                    fileState.cursorLeft();
                    fileState = fileState;
                    break;
                case "ArrowRight":
                    fileState.cursorRight();
                    fileState = fileState;
                    break;
                case "Tab":
                    e.preventDefault();
                    if (e.shiftKey) {
                        fileState.unshiftLine();
                        fileState = fileState;
                    } else {
                        fileState.write(
                            " ".repeat(4 - (fileState.cursor.x % 4))
                        );
                        fileState = fileState;
                    }
                    break;
                case "Enter":
                    e.preventDefault();
                    fileState.enter();
                    fileState = fileState;
                    break;
                case "(":
                    e.preventDefault();
                    fileState.write_wrap("(", ")");
                    fileState = fileState;
                    break;
                case "[":
                    e.preventDefault();
                    fileState.write_wrap("[", "]");
                    fileState = fileState;
                    break;
                case "{":
                    e.preventDefault();
                    fileState.write_wrap("{", "}");
                    fileState = fileState;
                    break;
                case ")":
                    e.preventDefault();
                    fileState.write_or_pass(")");
                    fileState = fileState;
                    break;
                case "]":
                    e.preventDefault();
                    fileState.write_or_pass("]");
                    fileState = fileState;
                    break;
                case "}":
                    e.preventDefault();
                    fileState.write_or_pass("}");
                    fileState = fileState;
                    break;
                case '"':
                    e.preventDefault();
                    if (fileState.write_or_pass('"')) {
                        fileState.write_wrap("", '"');
                    }
                    fileState = fileState;
                    break;
            }
        }}
    />

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
        width: 2px;
        background-color: #ecbf0b;
        position: absolute;
        transition: top 0.06s ease-in-out, left 0.06s ease-in-out;
    }

    .measure {
        position: absolute;
        pointer-events: none;
        opacity: 0;
    }
    .input_area {
        position: absolute;
        pointer-events: none;
        opacity: 0;
    }

    .code_reference {
        min-height: var(--line-height);
        max-height: var(--line-height);
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
