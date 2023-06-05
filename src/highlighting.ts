import {
    IncludePattern,
    BlockPattern,
    type LangDef,
    type LangElem,
    type Pattern,
    MatchPattern,
} from "./langs/lang";

class SyntaxElement {
    constructor(public elem: LangElem, public text: string) {}
}

// function* foo(index) {
//     while (index < 2) {
//         yield index;
//         index++;
//     }
// }
// const iterator = foo(0);

// console.log(iterator.next().value);
// // Expected output: 0

// console.log(iterator.next().value);

export const highlightCode = (code: string, lang: LangDef): SyntaxElement[] => {
    type LeafPattern = BlockPattern | MatchPattern;

    function* patternGen(
        patterns: Pattern[]
    ): Generator<LeafPattern, void, unknown> {
        for (let p of patterns) {
            if (p instanceof IncludePattern) {
                if (p.include == "@self") {
                    yield* patternGen(lang.patterns);
                } else {
                    let includes = [];
                    for (let i of p.include) {
                        if (lang.patternMap[i] != undefined) {
                            includes.push(lang.patternMap[i]);
                        }
                    }
                    yield* patternGen(includes);
                }
            } else {
                yield p;
            }
        }
    }
    let stack: BlockPattern[] = [];

    let elems: SyntaxElement[] = [];

    while (code.length > 0) {
        let patterns =
            stack.length > 0 ? stack[stack.length - 1].patterns : lang.patterns;

        let nearest: {
            elem: LangElem;
            index: number;
            length: number;
            popStack: boolean;
            pattern: LeafPattern;
        } = null;

        type SyntaxMatch = [RegExpMatchArray, LangElem];
        const setNearest = (
            match: SyntaxMatch,
            pattern: LeafPattern,
            popStack: boolean
        ) => {
            if (
                match[0] != null &&
                (nearest == null || match[0].index < nearest.index)
            ) {
                nearest = {
                    elem: match[1],
                    index: match[0].index,
                    length: match[0][0].length,
                    popStack,
                    pattern,
                };
            }
        };

        for (let p of patternGen(patterns)) {
            let match: [RegExpMatchArray, LangElem] =
                p instanceof MatchPattern
                    ? [code.match(p.match), p.elem]
                    : [code.match(p.begin.match), p.begin.elem];
            setNearest(match, p, false);
            if (nearest != null && nearest.index == 0) {
                break;
            }
        }
        if (stack.length > 0) {
            let top = stack[stack.length - 1];
            let match: [RegExpMatchArray, LangElem] = [
                code.match(top.end.match),
                top.end.elem,
            ];
            setNearest(match, top, true);
        }

        if (nearest == null) {
            elems.push(new SyntaxElement(null, code));
            code = "";
        } else {
            if (nearest.index > 0) {
                elems.push(
                    new SyntaxElement(null, code.slice(0, nearest.index))
                );
            }
            elems.push(
                new SyntaxElement(
                    nearest.elem,
                    code.slice(nearest.index, nearest.index + nearest.length)
                )
            );
            code = code.slice(nearest.index + nearest.length);
            if (nearest.popStack) {
                stack.pop();
            } else if (nearest.pattern instanceof BlockPattern) {
                stack.push(nearest.pattern);
            }
        }
    }
    return elems;
};
