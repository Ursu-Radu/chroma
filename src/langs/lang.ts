export type LangElem = "keyword" | "thing";

export const langElemColor = (elem: LangElem) => {
    switch (elem) {
        case "keyword":
            return "#ff0000";
        case "thing":
            return "#00ffff";
    }
    return "#ffffff";
};

export type Pattern = MatchPattern | BlockPattern | IncludePattern;

export class MatchPattern {
    constructor(public match: RegExp, public elem: LangElem) {
        this.match = new RegExp(this.match);
    }
}

export class BlockPattern {
    constructor(
        public begin: { match: RegExp; elem?: LangElem },
        public end: { match: RegExp; elem?: LangElem },
        public patterns: Pattern[]
    ) {
        this.begin.match = new RegExp(this.begin.match);
        this.end.match = new RegExp(this.end.match);
    }
}

export class IncludePattern {
    constructor(public include: string[] | "@self") {}
}

export class LangDef {
    public patterns: Pattern[] = [];
    public patternMap: { [key: string]: Pattern } = {};
    constructor(private name: string, private extensions: string[]) {}

    addPattern(name: string, pattern: Pattern) {
        this.patterns.push(pattern);
        this.patternMap[name] = pattern;
    }
}
