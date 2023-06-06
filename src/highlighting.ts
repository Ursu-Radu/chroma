import {
    IncludePattern,
    BlockPattern,
    type LangDef,
    type LangElem,
    type Pattern,
    MatchPattern,
    type LangMatch,
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

    function* matchGen(
        patterns: Pattern[]
    ): Generator<[LangMatch, LeafPattern], void, unknown> {
        for (let p of patterns) {
            if (p instanceof IncludePattern) {
                if (p.include == "@self") {
                    yield* matchGen(lang.patterns);
                } else {
                    let includes: Pattern[] = [];
                    for (let i of p.include) {
                        if (lang.patternMap[i] != undefined) {
                            includes.push(...lang.patternMap[i]);
                        }
                    }
                    yield* matchGen(includes);
                }
            } else {
                if (p instanceof MatchPattern) {
                    yield [{ regex: p.match, elem: p.elem }, p];
                } else {
                    yield [p.begin, p];
                }
            }
        }
    }
    let stack: BlockPattern[] = [];

    let elems: SyntaxElement[] = [];
    const pushElem = (elem: SyntaxElement) => {
        if (elems.length == 0) {
            elems.push(elem);
            return;
        }
        if (elems[elems.length - 1].elem == elem.elem) {
            elems[elems.length - 1].text += elem.text;
            return;
        }
        elems.push(elem);
    };

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

        for (let [m, p] of matchGen(patterns)) {
            let match: SyntaxMatch = [code.match(m.regex), m.elem];
            setNearest(match, p, false);
            if (nearest != null && nearest.index == 0) {
                break;
            }
        }
        if (stack.length > 0) {
            let top = stack[stack.length - 1];
            let match: SyntaxMatch = [code.match(top.end.regex), top.end.elem];
            setNearest(match, top, true);
        }

        let defaultElem =
            stack.length > 0 ? stack[stack.length - 1].elem : null;

        if (nearest == null) {
            pushElem(new SyntaxElement(defaultElem, code));
            code = "";
        } else {
            if (nearest.index > 0) {
                pushElem(
                    new SyntaxElement(defaultElem, code.slice(0, nearest.index))
                );
            }
            pushElem(
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
