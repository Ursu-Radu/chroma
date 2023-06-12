import {
    BlockPattern,
    IncludePattern,
    LangDef,
    MatchPattern,
} from "../lang_def";

let jsonLang = new LangDef("JSON", ["json"]);

jsonLang.addPattern(
    "strings",
    new BlockPattern(
        { regex: /"/, elem: "string.double" },
        { regex: /"/, elem: "string.double" },
        "string.double",
        [
            new MatchPattern(
                /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|["\\\/bfnrt])/,
                "string.escape"
            ),
        ]
    )
);
jsonLang.addPattern(
    "constants",
    new MatchPattern(/\b[A-Z]{2,}\b/, "variable.param")
);
jsonLang.addPattern(
    "keywords",
    new MatchPattern(/\b(false|true|null)\b/, "constant.language")
);
jsonLang.addPattern(
    "symbols",
    new MatchPattern(/[()]/, "symbol.language"),
    new MatchPattern(/[[\]]/, "symbol.language"),
    new MatchPattern(/[{}]/, "symbol.language"),

    new MatchPattern(/[,:]/, "symbol.language")
);
jsonLang.addPattern(
    "numbers",
    new MatchPattern(
        /[+-]?\d+(?:(?:\.\d*)?(?:[eE][+-]?\d+)?)?\b/,
        "constant.number"
    ),
    new MatchPattern(/0[xX][0-9a-fA-F]+\b/, "constant.number")
);

export default jsonLang;
