import { rotMod, textSize, vec, type Vec } from "./util";

export class TextSettings {
    constructor(public font: string, public size: number) {}
}

export class EditorSettings {
    constructor(public text: TextSettings) {}
}

export class EditorData {
    constructor(public settings: EditorSettings) {}
}

interface PosInfo {
    line: number;
    column: number;
    width: number;
}

class Cursor {
    public savedX: number = 0;

    constructor(
        private state: FileState,
        public pos: number,
        public sel?: number
    ) {
        this.savedX = state.getXY(pos).x;
    }

    move(pos: number, unselect: boolean = true) {
        this.pos = Math.max(0, Math.min(this.state.code.length, pos));
        this.savedX = this.state.getXY(pos).x;
        if (unselect) {
            this.unselect();
        }
    }

    unselect() {
        this.sel = undefined;
    }

    swapSelection() {
        if (this.sel != undefined) {
            let old = this.pos;
            this.move(this.sel);
            this.sel = old;
        }
    }

    sortSelection(rev: boolean = false): boolean {
        if (this.sel != undefined) {
            let cmp = this.pos < this.sel;
            if (cmp == rev) {
                this.swapSelection();
                return true;
            }
            return false;
        }
        return false;
    }
}

export class FileState {
    private _code: string = `{
    "name": "chroma",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "check": "svelte-check --tsconfig ./tsconfig.json"
    },
    "devDependencies": {
        "@sveltejs/vite-plugin-svelte": "^2.0.3",
        "@tsconfig/svelte": "^4.0.1",
        "svelte": "^3.57.0",
        "svelte-check": "^2.10.3",
        "tslib": "^2.5.0",
        "typescript": "^5.0.2",
        "vite": "^4.3.2"
    },
    "dependencies": {
        "vite-plugin-full-reload": "^1.0.5"
    }
}
    `;
    private _recalc_lines: boolean = false;
    private _codeLines: string[] = this._code.split("\n");

    public cursor: Cursor = new Cursor(this, 0);

    constructor() {}

    public get code() {
        return this._code;
    }
    public set code(to: string) {
        this._code = to;
        this._recalc_lines = true;
    }

    public get codeLines() {
        if (this._recalc_lines) {
            this._codeLines = this._code.split("\n");
            this._recalc_lines = false;
        }
        return this._codeLines;
    }

    slice(start: number, end?: number): string {
        return this.code.slice(start, end);
    }

    posInfo(pos: number, settings: TextSettings): PosInfo {
        let p = pos;
        let y = 0;
        for (let line of this.codeLines) {
            if (line.length >= p) {
                return {
                    line: y,
                    column: p,
                    width: textSize(line.slice(0, p), settings).x,
                };
            }
            y += 1;
            p -= line.length + 1;
        }
        return {
            line: 0,
            column: 0,
            width: 0,
        };
    }

    getXY(pos: number): Vec {
        let p = pos;
        let y = 0;
        for (let line of this.codeLines) {
            if (line.length >= p) {
                return {
                    y,
                    x: p,
                };
            }
            y += 1;
            p -= line.length + 1;
        }
        return {
            x: 0,
            y: 0,
        };
    }

    getPos(x: number, y: number): number {
        let p = 0;
        for (let i = 0; i < y; i++) {
            p += this.codeLines[i].length + 1;
        }
        return (p += x);
    }

    deleteSelection() {
        this.cursor.sortSelection();

        if (this.cursor.sel != undefined) {
            this.code =
                this.code.slice(0, this.cursor.pos) +
                this.code.slice(this.cursor.sel);

            this.cursor.unselect();
        }
    }

    getSelection() {
        if (this.cursor.sel == undefined) {
            return "";
        }
        let swapped = this.cursor.sortSelection();

        let s = this.slice(this.cursor.pos, this.cursor.sel);

        if (swapped) {
            this.cursor.swapSelection();
        }
        return s;
    }

    write(s: string) {
        this.deleteSelection();

        this.code =
            this.slice(0, this.cursor.pos) + s + this.slice(this.cursor.pos);

        this.cursor.move(this.cursor.pos + s.length);
    }

    backspace() {
        if (this.cursor.sel != undefined) {
            this.deleteSelection();
            return;
        }
        if (this.cursor.pos == 0) {
            return;
        }

        const remove = (amount: number) => {
            this.code =
                this.slice(0, this.cursor.pos - amount) +
                this.slice(this.cursor.pos);
            this.cursor.move(this.cursor.pos - amount);
        };

        let { x, y } = this.getXY(this.cursor.pos);
        if (x > 0 && this.codeLines[y].slice(0, x).trim() == "") {
            remove(rotMod(x, 4));
            return;
        }

        if (
            ["()", "[]", "{}", '""'].includes(
                this.slice(this.cursor.pos - 1, this.cursor.pos + 1)
            )
        ) {
            this.cursor.move(this.cursor.pos + 1);
            remove(2);
        } else {
            remove(1);
        }
    }

    delete() {
        if (this.cursor.sel != undefined) {
            this.deleteSelection();
            return;
        }
        if (this.cursor.pos == this.code.length) {
            return;
        }

        this.code =
            this.slice(0, this.cursor.pos) + this.slice(this.cursor.pos + 1);
    }

    cursorUp() {
        this.cursor.sortSelection();
        this.cursor.unselect();
        let { y } = this.getXY(this.cursor.pos);
        if (y > 0) {
            this.cursor.pos = this.getPos(
                Math.min(this.cursor.savedX, this.codeLines[y - 1].length),
                y - 1
            );
        }
    }

    cursorDown() {
        this.cursor.sortSelection(true);
        this.cursor.unselect();
        let { y } = this.getXY(this.cursor.pos);
        if (y < this.codeLines.length - 1) {
            this.cursor.pos = this.getPos(
                Math.min(this.cursor.savedX, this.codeLines[y + 1].length),
                y + 1
            );
        }
    }

    cursorLeft() {
        if (this.cursor.sel != undefined) {
            this.cursor.sortSelection();
            this.cursor.unselect();
            return;
        }

        this.cursor.move(this.cursor.pos - 1);
    }

    cursorRight() {
        if (this.cursor.sel != undefined) {
            this.cursor.sortSelection(true);
            this.cursor.unselect();
            return;
        }

        this.cursor.move(this.cursor.pos + 1);
    }
}

export const specialKeys = (fileState: FileState) => ({
    Backspace: (e: KeyboardEvent) => {
        fileState.backspace();
    },
    Delete: (e: KeyboardEvent) => {
        fileState.delete();
    },
    ArrowUp: (e: KeyboardEvent) => {
        fileState.cursorUp();
    },
    ArrowDown: (e: KeyboardEvent) => {
        fileState.cursorDown();
    },
    ArrowLeft: (e: KeyboardEvent) => {
        fileState.cursorLeft();
    },
    ArrowRight: (e: KeyboardEvent) => {
        fileState.cursorRight();
    },
    // Tab: (e: KeyboardEvent) => {
    //     if (e.shiftKey) {
    //         fileState.unshiftLine();
    //         fileState = fileState;
    //     } else {
    //         fileState.write(" ".repeat(4 - (fileState.cursor.x % 4)));
    //         fileState = fileState;
    //     }
    // },
    // Enter: (e: KeyboardEvent) => {
    //     fileState.enter();
    // },
    // "(": (e: KeyboardEvent) => {
    //     fileState.write_wrap("(", ")");
    // },
    // "[": (e: KeyboardEvent) => {
    //     fileState.write_wrap("[", "]");
    // },
    // "{": (e: KeyboardEvent) => {
    //     fileState.write_wrap("{", "}");
    // },
    // ")": (e: KeyboardEvent) => {
    //     fileState.write_or_pass(")");
    // },
    // "]": (e: KeyboardEvent) => {
    //     fileState.write_or_pass("]");
    // },
    // "}": (e: KeyboardEvent) => {
    //     fileState.write_or_pass("}");
    // },
    // '"': (e: KeyboardEvent) => {
    //     fileState.write_wrap('"', '"');
    // },
    // Alt: (e: KeyboardEvent) => {
    //     // console.log(getSelection());
    // },
});
