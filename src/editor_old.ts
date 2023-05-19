import { rotMod, snap } from "./util";

export class TextSettings {
    constructor(public font: string, public size: number) {}
}

export class EditorSettings {
    constructor(public text: TextSettings) {}
}

export class EditorData {
    constructor(public settings: EditorSettings) {}
}

const cmpPos = (
    a: { x: number; y: number },
    b: { x: number; y: number }
): boolean => {
    if (a.y < b.y) {
        return true;
    } else if (a.y > b.y) {
        return false;
    } else {
        return a.x <= b.x;
    }
};

export class Cursor {
    public savedX: number;

    constructor(
        public x: number,
        public y: number,
        public selection?: { x: number; y: number }
    ) {
        this.savedX = x;
    }

    move(x: number, y: number, unselect: boolean = true) {
        this.x = x;
        this.y = y;
        this.savedX = x;
        if (unselect) {
            this.unselect();
        }
    }

    unselect() {
        this.selection = undefined;
    }

    swapSelection() {
        let oldPos = { x: this.x, y: this.y };
        this.move(this.selection.x, this.selection.y);
        this.selection = oldPos;
    }

    sortSelection(rev: boolean = false): boolean {
        if (this.selection != undefined) {
            if (cmpPos({ x: this.x, y: this.y }, this.selection) == rev) {
                this.swapSelection();
                return true;
            }
            return false;
        }
        return false;
    }
}

// export const

export class FileState {
    public codeLines: string[] = [
        "",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "",
    ];
    public cursor = new Cursor(0, 0);

    constructor() {}

    getPlacedCursorPos(x: number, y: number): { x: number; y: number } {
        let newCursor = {
            x,
            y,
        };

        if (this.codeLines[y].length == 0) {
            newCursor.x = 0;
        }

        return newCursor;
    }

    collapseCursor() {
        if (this.cursor.selection == undefined) {
            return;
        }
        if (
            this.cursor.x == this.cursor.selection.x &&
            this.cursor.y == this.cursor.selection.y
        ) {
            this.cursor.selection = undefined;
        }
    }

    deleteSelection() {
        this.cursor.sortSelection();

        if (this.cursor.selection != undefined) {
            let rep =
                this.codeLines[this.cursor.y].slice(0, this.cursor.x) +
                this.codeLines[this.cursor.selection.y].slice(
                    this.cursor.selection.x
                );

            this.codeLines.splice(
                this.cursor.y,
                this.cursor.selection.y - this.cursor.y + 1,
                rep
            );

            this.cursor.unselect();
        }
    }

    getSelection(): string {
        if (this.cursor.selection == undefined) {
            return "";
        }
        let swapped = this.cursor.sortSelection();

        if (this.cursor.y == this.cursor.selection.y) {
            let out = this.codeLines[this.cursor.y].slice(
                this.cursor.x,
                this.cursor.selection.x
            );
            if (swapped) {
                this.cursor.swapSelection();
            }
            return out;
        }

        let out = this.codeLines[this.cursor.y].slice(this.cursor.x);
        for (let i = this.cursor.y + 1; i < this.cursor.selection.y; i++) {
            out += "\n" + this.codeLines[i];
        }
        out +=
            "\n" +
            this.codeLines[this.cursor.selection.y].slice(
                0,
                this.cursor.selection.x
            );
        if (swapped) {
            this.cursor.swapSelection();
        }
        return out;
    }

    write(s: string) {
        if (this.cursor.selection != undefined) {
            this.deleteSelection();
        }

        let lines = s.split("\n");
        let newCursor = {
            x:
                lines.length == 1
                    ? this.cursor.x + lines[0].length
                    : lines[lines.length - 1].length,
            y: this.cursor.y + lines.length - 1,
        };
        lines[0] =
            this.codeLines[this.cursor.y].slice(0, this.cursor.x) + lines[0];
        lines[lines.length - 1] += this.codeLines[this.cursor.y].slice(
            this.cursor.x
        );
        this.codeLines.splice(this.cursor.y, 1, ...lines);
        this.cursor.move(newCursor.x, newCursor.y);
    }

    backspace() {
        if (this.cursor.selection != undefined) {
            this.deleteSelection();
            return;
        }

        if (this.cursor.x == 0) {
            if (this.cursor.y > 0) {
                let newCursor = {
                    x: this.codeLines[this.cursor.y - 1].length,
                    y: this.cursor.y - 1,
                };
                this.codeLines.splice(
                    this.cursor.y - 1,
                    2,
                    this.codeLines[this.cursor.y - 1] +
                        this.codeLines[this.cursor.y]
                );
                this.cursor.move(newCursor.x, newCursor.y);
            }
            return;
        }

        let line = this.codeLines[this.cursor.y];

        const regularBackspace = (amount: number) => {
            this.codeLines[this.cursor.y] =
                line.slice(0, this.cursor.x - amount) +
                line.slice(this.cursor.x);
            this.cursor.x -= amount;
            this.cursor.savedX = this.cursor.x;
        };

        if (line.slice(0, this.cursor.x).trim() == "") {
            let amount = this.cursor.x % 4;
            if (amount == 0) {
                amount = 4;
            }
            regularBackspace(amount);
            return;
        }

        if (
            ["()", "[]", "{}", '""'].includes(
                line.slice(this.cursor.x - 1, this.cursor.x + 1)
            )
        ) {
            this.cursor.move(this.cursor.x + 1, this.cursor.y);
            regularBackspace(2);
        } else {
            regularBackspace(1);
        }
    }

    delete() {
        if (this.cursor.selection != undefined) {
            this.deleteSelection();
            return;
        }

        if (this.cursor.x == this.codeLines[this.cursor.y].length) {
            if (this.cursor.y < this.codeLines.length - 1) {
                this.codeLines.splice(
                    this.cursor.y,
                    2,
                    this.codeLines[this.cursor.y] +
                        this.codeLines[this.cursor.y + 1]
                );
            }
            return;
        }
        let line = this.codeLines[this.cursor.y];

        this.codeLines[this.cursor.y] =
            line.slice(0, this.cursor.x) + line.slice(this.cursor.x + 1);
    }

    cursorUp() {
        this.cursor.sortSelection();
        this.cursor.unselect();
        if (this.cursor.y > 0) {
            this.cursor.y -= 1;
            this.cursor.x = Math.min(
                this.cursor.savedX,
                this.codeLines[this.cursor.y].length
            );
        }
    }
    cursorDown() {
        this.cursor.sortSelection(true);
        this.cursor.unselect();
        if (this.cursor.y < this.codeLines.length - 1) {
            this.cursor.y += 1;
            this.cursor.x = Math.min(
                this.cursor.savedX,
                this.codeLines[this.cursor.y].length
            );
        }
    }
    cursorLeft() {
        if (this.cursor.selection != undefined) {
            this.cursor.sortSelection();
            this.cursor.unselect();
            return;
        }
        if (this.cursor.x == 0) {
            if (this.cursor.y > 0) {
                this.cursor.move(
                    this.codeLines[this.cursor.y - 1].length,
                    this.cursor.y - 1
                );
            }
        } else {
            this.cursor.move(this.cursor.x - 1, this.cursor.y);
        }
    }
    cursorRight() {
        if (this.cursor.selection != undefined) {
            this.cursor.sortSelection(true);
            this.cursor.unselect();
            return;
        }
        if (this.cursor.x == this.codeLines[this.cursor.y].length) {
            if (this.cursor.y < this.codeLines.length - 1) {
                this.cursor.move(0, this.cursor.y + 1);
            }
        } else {
            this.cursor.move(this.cursor.x + 1, this.cursor.y);
        }
    }

    unshiftLine() {
        const inner = (line: number): number => {
            let space_match = this.codeLines[line].match(/^ */);
            let spaces = space_match.length == 0 ? 0 : space_match[0].length;

            let remove = rotMod(spaces, 4);
            if (spaces == 0) {
                remove = 0;
            }

            this.codeLines[line] =
                " ".repeat(spaces - remove) +
                this.codeLines[line].slice(spaces);

            return remove;
        };
        if (this.cursor.selection == undefined) {
            this.cursor.move(
                Math.max(0, this.cursor.x - inner(this.cursor.y)),
                this.cursor.y
            );
            return;
        }

        let start = Math.min(this.cursor.y, this.cursor.selection.y);
        let end = Math.max(this.cursor.y, this.cursor.selection.y);
        for (let i = start; i <= end; i++) {
            let moveX = inner(i);
            if (i == this.cursor.y) {
                this.cursor.move(
                    Math.max(0, this.cursor.x - moveX),
                    this.cursor.y,
                    false
                );
            }
            if (i == this.cursor.selection.y) {
                this.cursor.selection.x = Math.max(
                    0,
                    this.cursor.selection.x - moveX
                );
            }
        }
    }

    enter() {
        if (this.cursor.selection != undefined) {
            this.deleteSelection();
        }

        let line = this.codeLines[this.cursor.y];

        let space_match = line.match(/^ */);
        let spaces = space_match.length == 0 ? 0 : space_match[0].length;

        let new_spaces = snap(spaces, 4);

        if (
            ["()", "[]", "{}"].includes(
                line.slice(this.cursor.x - 1, this.cursor.x + 1)
            )
        ) {
            this.write_wrap(
                "\n" + " ".repeat(new_spaces + 4),
                "\n" + " ".repeat(new_spaces)
            );
        } else {
            this.write("\n" + " ".repeat(new_spaces));
        }
    }

    write_wrap(a: string, b: string) {
        if (this.cursor.selection == undefined) {
            this.write(a);
            let [x, y] = [this.cursor.x, this.cursor.y];
            this.write(b);
            this.cursor.move(x, y);
            return;
        }
        let inner = this.getSelection();
        this.deleteSelection();
        this.write(a);
        let [sx, sy] = [this.cursor.x, this.cursor.y];
        this.write(inner);
        let [x, y] = [this.cursor.x, this.cursor.y];
        this.write(b);
        this.cursor.move(x, y);
        this.cursor.selection = { x: sx, y: sy };
    }

    write_or_pass(s: string): boolean {
        if (this.cursor.selection != undefined) {
            this.deleteSelection();
            this.write(s);
            return;
        }

        let line = this.codeLines[this.cursor.y];
        if (line.slice(this.cursor.x, this.cursor.x + s.length) == s) {
            this.cursor.move(this.cursor.x + s.length, this.cursor.y);
            return false;
        }
        this.write(s);
        return true;
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
            fileState = fileState;
        } else {
            fileState.write(" ".repeat(4 - (fileState.cursor.x % 4)));
            fileState = fileState;
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
