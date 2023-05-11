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

export class Cursor {
    public savedX: number;

    constructor(public x: number, public y: number) {
        this.savedX = x;
    }

    move(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.savedX = x;
    }
}

export class FileState {
    public codeLines: string[] = ["", "", ""];
    public cursor = new Cursor(0, 0);

    constructor() {}

    write(s: string) {
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
        } else {
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
            } else {
                if (
                    ["()", "[]", "{}"].includes(
                        line.slice(this.cursor.x - 1, this.cursor.x + 1)
                    )
                ) {
                    this.cursor.move(this.cursor.x + 1, this.cursor.y);
                    regularBackspace(2);
                } else {
                    regularBackspace(1);
                }
            }
        }
    }

    cursorUp() {
        if (this.cursor.y > 0) {
            this.cursor.y -= 1;
            this.cursor.x = Math.min(
                this.cursor.savedX,
                this.codeLines[this.cursor.y].length
            );
        }
    }
    cursorDown() {
        if (this.cursor.y < this.codeLines.length - 1) {
            this.cursor.y += 1;
            this.cursor.x = Math.min(
                this.cursor.savedX,
                this.codeLines[this.cursor.y].length
            );
        }
    }
    cursorLeft() {
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
        if (this.cursor.x == this.codeLines[this.cursor.y].length) {
            if (this.cursor.y < this.codeLines.length - 1) {
                this.cursor.move(0, this.cursor.y + 1);
            }
        } else {
            this.cursor.move(this.cursor.x + 1, this.cursor.y);
        }
    }

    unshiftLine() {
        let space_match = this.codeLines[this.cursor.y].match(/^ */);
        let spaces = space_match.length == 0 ? 0 : space_match[0].length;

        let remove = rotMod(spaces, 4);
        if (spaces == 0) {
            remove = 0;
        }

        this.codeLines[this.cursor.y] =
            " ".repeat(spaces - remove) +
            this.codeLines[this.cursor.y].slice(spaces);

        this.cursor.move(this.cursor.x - remove, this.cursor.y);
    }

    enter() {
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
        this.write(a);
        let [x, y] = [this.cursor.x, this.cursor.y];
        this.write(b);
        this.cursor.move(x, y);
    }

    write_or_pass(s: string): boolean {
        let line = this.codeLines[this.cursor.y];
        if (line.slice(this.cursor.x, this.cursor.x + s.length) == s) {
            this.cursor.move(this.cursor.x + s.length, this.cursor.y);
            return false;
        }
        this.write(s);
        return true;
    }
}
