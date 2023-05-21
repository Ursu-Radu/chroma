import { rotMod, snap, textSize, vec, type Vec } from "./util";

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

export class Cursor {
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

    collapse() {
        if (this.sel != undefined && this.sel == this.pos) {
            this.sel = undefined;
        }
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

    public cursors: Cursor[] = [new Cursor(this, 0)];

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

    fixPos(pos: number): number {
        if (
            pos == this.code.length + 1 &&
            this.code[this.code.length - 1] == "\n"
        ) {
            return pos - 1;
        }
        return pos;
    }

    updateSelection(codeRef: Node) {
        if (this.cursors.length > 0) {
            let sel = getSelection();
            if (sel == null) return;
            if (
                sel.anchorNode != codeRef.firstChild &&
                sel.focusNode != codeRef.firstChild
            )
                return;

            let c = this.cursors[this.cursors.length - 1];
            c.move(this.fixPos(sel.focusOffset));
            c.sel = this.fixPos(sel.anchorOffset);
            c.collapse();

            this.sanitizeCursors();
        }
    }

    sanitizeCursors() {
        if (this.cursors.length > 1) {
            let cursor_info = this.cursors
                .map((c): [Cursor, boolean] => {
                    let swapped = c.sortSelection();
                    if (c.sel == undefined) {
                        c.sel = c.pos;
                    }
                    return [c, swapped];
                })
                .sort((a, b) => a[0].pos - b[0].pos);

            let out = [cursor_info[0]];
            for (let i = 1; i < cursor_info.length; i++) {
                let [c, b] = cursor_info[i];
                let top = out[out.length - 1][0];
                if (top.sel >= c.pos) {
                    top.sel = c.sel;
                } else {
                    out.push([c, b]);
                }
            }

            for (let [c, b] of out) {
                if (b) {
                    c.swapSelection();
                }
                c.collapse();
            }

            this.cursors = out.map(c => c[0]);
        }
    }

    leadingSpaces(line: number): number {
        let space_match = this.codeLines[line].match(/^ */);
        return space_match.length == 0 ? 0 : space_match[0].length;
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

    forEachCursor(
        cb: (c: Cursor, i: number) => number,
        sanitize: boolean = true
    ) {
        this.cursors.forEach((c, i) => {
            this.shiftCursors(i, cb(c, i));
        });
        if (sanitize) {
            this.sanitizeCursors();
        }
    }

    shiftCursors(after: number, amount: number) {
        if (amount != 0) {
            for (let i = after + 1; i < this.cursors.length; i++) {
                let c = this.cursors[i];
                c.pos += amount;
                if (c.sel != undefined) {
                    c.sel += amount;
                }
            }
        }
    }

    deleteSelection(cursor?: Cursor) {
        const inner = (c: Cursor) => {
            c.sortSelection();

            if (c.sel != undefined) {
                let remove = c.sel - c.pos;
                this.code = this.code.slice(0, c.pos) + this.code.slice(c.sel);

                c.unselect();

                return -remove;
            }
            return 0;
        };

        if (cursor == undefined) {
            this.forEachCursor(inner);
        } else {
            inner(cursor);
        }
    }

    getSelection(cursor?: Cursor): string {
        const inner = (c: Cursor) => {
            if (c.sel == undefined) {
                return "";
            }
            let swapped = c.sortSelection();

            let s = this.slice(c.pos, c.sel);

            if (swapped) {
                c.swapSelection();
            }

            return s;
        };

        if (cursor == undefined) {
            let out = [];

            this.forEachCursor(c => {
                out.push(inner(c));
                return 0;
            }, false);

            return out.join("\n");
        } else {
            return inner(cursor);
        }
    }

    getSelRects(
        settings: TextSettings
    ): { line: number; start: number; end: number }[] {
        let out: { line: number; start: number; end: number }[] = [];

        this.forEachCursor(c => {
            if (c.sel == undefined) {
                return 0;
            }
            let s = this.getSelection(c);
            let swapped = c.sortSelection();
            let { x, y } = this.getXY(c.pos);
            if (swapped) {
                c.swapSelection();
            }
            out = out.concat(
                s.split("\n").map((s, i) => {
                    let start =
                        i == 0
                            ? textSize(this.codeLines[y].slice(0, x), settings)
                                  .x
                            : 0;
                    return {
                        line: y + i,
                        start,
                        end: start + textSize(s, settings).x,
                    };
                })
            );

            return 0;
        }, false);

        return out;
    }

    write(s: string, cursor?: Cursor) {
        if (cursor == undefined) {
            this.deleteSelection();

            this.forEachCursor(c => {
                this.code = this.slice(0, c.pos) + s + this.slice(c.pos);

                c.move(c.pos + s.length);

                return s.length;
            });
        } else {
            this.deleteSelection(cursor);

            this.code = this.slice(0, cursor.pos) + s + this.slice(cursor.pos);

            cursor.move(cursor.pos + s.length);
        }
    }

    backspace() {
        this.deleteSelection();

        this.forEachCursor(c => {
            if (c.pos == 0) {
                return 0;
            }

            const remove = (amount: number) => {
                this.code = this.slice(0, c.pos - amount) + this.slice(c.pos);
                c.move(c.pos - amount);
            };

            let { x, y } = this.getXY(c.pos);
            if (x > 0 && this.codeLines[y].slice(0, x).trim() == "") {
                let amount = rotMod(x, 4);
                remove(amount);
                return -amount;
            }

            if (
                ["()", "[]", "{}", '""'].includes(
                    this.slice(c.pos - 1, c.pos + 1)
                )
            ) {
                c.move(c.pos + 1);
                remove(2);
                return -2;
            } else {
                remove(1);
                return -1;
            }
        });
    }

    delete() {
        this.deleteSelection();

        this.forEachCursor(c => {
            if (c.pos == this.code.length) {
                return 0;
            }

            this.code = this.slice(0, c.pos) + this.slice(c.pos + 1);

            return -1;
        });
    }

    unshiftLine() {
        this.forEachCursor(c => {
            const inner = (line: number): number => {
                let spaces = this.leadingSpaces(line);

                let remove = rotMod(spaces, 4);
                if (spaces == 0) {
                    remove = 0;
                }

                let lineStart = this.getPos(0, line);
                this.code =
                    this.slice(0, lineStart) + this.slice(lineStart + remove);

                return remove;
            };
            if (c.sel == undefined) {
                let remove = inner(this.getXY(c.pos).y);
                c.move(c.pos - remove);
                return -remove;
            }

            let swapped = c.sortSelection();

            let start = this.getXY(c.pos).y;
            let end = this.getXY(c.sel).y;

            let shift = 0;
            for (let i = start; i <= end; i++) {
                let move = inner(i);
                shift += move;
                if (i == start) {
                    c.move(c.pos - move, false);
                }
            }
            c.sel -= shift;

            if (swapped) {
                c.swapSelection();
            }

            return -shift;
        });
    }

    shiftLine() {
        this.forEachCursor(c => {
            if (c.sel == undefined) {
                let x = this.getXY(c.pos).x;
                this.write(" ".repeat(4 - (x % 4)));
                return 4 - (x % 4);
            }

            let swapped = c.sortSelection();

            let start = this.getXY(c.pos).y;
            let end = this.getXY(c.sel).y;

            let shift = 0;
            for (let i = start; i <= end; i++) {
                let spaces = this.leadingSpaces(i);

                let line_start = this.getPos(0, i);

                let add = 4 - (spaces % 4);
                // console.log(spaces, add);

                shift += add;

                this.code =
                    this.slice(0, line_start) +
                    " ".repeat(add) +
                    this.slice(line_start);

                if (i == start) {
                    c.move(c.pos + add, false);
                }
            }
            c.sel += shift;

            if (swapped) {
                c.swapSelection();
            }

            return shift;
        });
    }

    enter() {
        this.deleteSelection();
        this.forEachCursor(c => {
            let line = this.codeLines[this.getXY(c.pos).y];
            let space_match = line.match(/^ */);
            let spaces = space_match.length == 0 ? 0 : space_match[0].length;
            let new_spaces = snap(spaces, 4);
            if (["()", "[]", "{}"].includes(this.slice(c.pos - 1, c.pos + 1))) {
                let [a, b] = [
                    "\n" + " ".repeat(new_spaces + 4),
                    "\n" + " ".repeat(new_spaces),
                ];
                this.write_wrap(a, b, c);
                return a.length + b.length;
            } else {
                this.write("\n" + " ".repeat(new_spaces), c);
                return new_spaces + 1;
            }
        });
    }

    write_wrap(a: string, b: string, cursor?: Cursor) {
        let inner = (c: Cursor) => {
            if (c.sel == undefined) {
                this.write(a, c);
                let pos = c.pos;
                this.write(b, c);
                c.move(pos);
                return a.length + b.length;
            }
            let inner = this.getSelection(c);
            this.deleteSelection(c);
            this.write(a, c);
            let sPos = c.pos;
            this.write(inner, c);
            let pos = c.pos;
            this.write(b, c);
            c.move(pos);
            c.sel = sPos;
            return a.length + b.length;
        };

        if (cursor == undefined) {
            this.forEachCursor(inner);
        } else {
            inner(cursor);
        }
    }

    write_or_pass(s: string) {
        this.forEachCursor(c => {
            if (c.sel != undefined) {
                let selLength = this.getSelection(c).length;
                this.deleteSelection(c);
                this.write(s);
                return s.length - selLength;
            }

            if (this.slice(c.pos, c.pos + s.length) == s) {
                c.move(c.pos + s.length);
                return 0;
            }
            this.write(s, c);
            return s.length;
        });
    }

    cursorUp() {
        this.forEachCursor(c => {
            c.sortSelection();
            c.unselect();
            let { y } = this.getXY(c.pos);
            if (y > 0) {
                c.pos = this.getPos(
                    Math.min(c.savedX, this.codeLines[y - 1].length),
                    y - 1
                );
            }
            return 0;
        });
    }

    cursorDown() {
        this.forEachCursor(c => {
            c.sortSelection(true);
            c.unselect();
            let { y } = this.getXY(c.pos);
            if (y < this.codeLines.length - 1) {
                c.pos = this.getPos(
                    Math.min(c.savedX, this.codeLines[y + 1].length),
                    y + 1
                );
            }
            return 0;
        });
    }

    cursorLeft() {
        this.forEachCursor(c => {
            if (c.sel != undefined) {
                c.sortSelection();
                c.unselect();
                return 0;
            }

            c.move(c.pos - 1);
            return 0;
        });
    }

    cursorRight() {
        this.forEachCursor(c => {
            if (c.sel != undefined) {
                c.sortSelection(true);
                c.unselect();
                return 0;
            }

            c.move(c.pos + 1);
            return 0;
        });
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
    Tab: (e: KeyboardEvent) => {
        if (e.shiftKey) {
            fileState.unshiftLine();
        } else {
            fileState.shiftLine();
        }
    },
    Enter: (e: KeyboardEvent) => {
        fileState.enter();
    },
    "(": (e: KeyboardEvent) => {
        fileState.write_wrap("(", ")");
    },
    "[": (e: KeyboardEvent) => {
        fileState.write_wrap("[", "]");
    },
    "{": (e: KeyboardEvent) => {
        fileState.write_wrap("{", "}");
    },
    ")": (e: KeyboardEvent) => {
        fileState.write_or_pass(")");
    },
    "]": (e: KeyboardEvent) => {
        fileState.write_or_pass("]");
    },
    "}": (e: KeyboardEvent) => {
        fileState.write_or_pass("}");
    },
    '"': (e: KeyboardEvent) => {
        fileState.write_wrap('"', '"');
    },
    Alt: (e: KeyboardEvent) => {
        // console.log(getSelection());
    },
});
