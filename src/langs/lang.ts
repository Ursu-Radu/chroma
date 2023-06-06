export type LangElem =
    | "symbol.language"
    | "symbol.operator"
    | "keyword.control"
    | "keyword.modifier"
    | "keyword.decl"
    | "keyword.operator"
    | "keyword.other"
    | "type"
    | "comment.line"
    | "comment.block"
    | "string.single"
    | "string.double"
    | "string.regex"
    | "string.other"
    | "string.escape"
    | "constant.number"
    | "constant.language"
    | "constant.other"
    | "markup.bold"
    | "markup.underline"
    | "markup.italic"
    | "markup.strikethrough"
    | "variable.param"
    | "variable.language"
    | "variable.function"
    | "variable.other"
    | "invalid.illegal"
    | "invalid.deprecated";

import theme from "../themes/test.json";

class LangElemStyling {
    constructor(
        public color: string = "#ffffff",
        public bold: boolean = false,
        public italic: boolean = false,
        public strikethrough: boolean = false,
        public underline: boolean = false
    ) {}

    getCss(): string {
        let css = `color: ${this.color};`;
        if (this.bold) {
            css += "font-weight: bold;";
        }
        if (this.italic) {
            css += "font-style: italic;";
        }
        if (this.strikethrough) {
            css += "text-decoration: line-through;";
        }
        if (this.underline) {
            css += "text-decoration: underline;";
        }
        return css;
    }
}

export const langElemStyling = (elem: LangElem): LangElemStyling => {
    let style = theme.highlighting[elem ?? "text"];
    return new LangElemStyling(
        style["color"] ?? "#ffffff",
        style["bold"] ?? false,
        style["italic"] ?? false,
        style["strikethrough"] ?? false,
        style["underline"] ?? false
    );
};

export type Pattern = MatchPattern | BlockPattern | IncludePattern;

export type LangMatch = { regex: RegExp; elem: LangElem };

export class MatchPattern {
    constructor(public match: RegExp, public elem: LangElem) {
        this.match = new RegExp(this.match);
    }
}
// jajaja
export class BlockPattern {
    constructor(
        public begin: LangMatch,
        public end: LangMatch,
        public elem: LangElem,
        public patterns: Pattern[]
    ) {
        this.begin.regex = new RegExp(this.begin.regex);
        this.end.regex = new RegExp(this.end.regex);
    }
}

export class IncludePattern {
    constructor(public include: string[] | "@self") {}
}

export class LangDef {
    public patterns: Pattern[] = [];
    public patternMap: { [key: string]: Pattern[] } = {};
    constructor(private name: string, private extensions: string[]) {}

    addPattern(name: string, ...pattern: Pattern[]) {
        this.patterns.push(...pattern);
        this.patternMap[name] = pattern;
    }
}
