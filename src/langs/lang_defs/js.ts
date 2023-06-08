import { BlockPattern, IncludePattern, LangDef, MatchPattern } from "../lang";

let jsLang = new LangDef("JavaScript", ["js"]);

jsLang.addPattern(
    "comments",
    new MatchPattern(/\/\/.*/, "comment.line"),
    new BlockPattern(
        { regex: /\/\*/, elem: "comment.block" },
        { regex: /\*\//, elem: "comment.block" },
        "comment.block",
        []
    )
);
jsLang.addNonRootPattern(
    "string_escapes",
    new MatchPattern(
        /\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]+\}|[0-2][0-7]{0,2}|3[0-6][0-7]?|37[0-7]?|[4-7][0-7]?|.|$)/,
        "string.escape"
    )
);

jsLang.addPattern(
    "strings",
    new BlockPattern(
        { regex: /"/, elem: "string.double" },
        { regex: /(")|((?:[^\\\n])$)/, elem: "string.double" },
        "string.double",
        [new IncludePattern(["string_escapes"])]
    ),
    new BlockPattern(
        { regex: /'/, elem: "string.single" },
        { regex: /(\')|((?:[^\\\n])$)/, elem: "string.single" },
        "string.single",
        [new IncludePattern(["string_escapes"])]
    ),
    new MatchPattern(
        /\/((?![*+?])(?:[^\r\n\[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+)\/((?:g(?:im?|mi?)?|i(?:gm?|mg?)?|m(?:gi?|ig?)?)?)/,
        "string.regex"
    )
);
jsLang.addPattern(
    "constants",
    new MatchPattern(/\b[A-Z]{2,}\b/, "variable.param")
);
jsLang.addPattern(
    "keywords",
    new MatchPattern(
        /\b(await|do|yield|break|continue|else|finally|case|for|return|throw|catch|default|package|try|while|if|switch|with)\b/,
        "keyword.control"
    ),
    new MatchPattern(
        /\b(const|let|import|var|enum|function|class|interface)\b/,
        "keyword.decl"
    ),

    new MatchPattern(
        /\b(abstract|implements|protected|static|public|export|extends|private)\b/,
        "keyword.modifier"
    ),

    new MatchPattern(/\b(debugger)\b/, "keyword.other"),
    new MatchPattern(
        /\b(typeof|new|in|instanceof|delete)\b/,
        "keyword.operator"
    ),

    new MatchPattern(
        /\b(false|true|null|undefined|object)\b/,
        "constant.language"
    ),

    new MatchPattern(/\b(this|super)\b/, "variable.language")
);
jsLang.addPattern(
    "symbols",
    new MatchPattern(/[()]/, "symbol.language"),
    new MatchPattern(/[[\]]/, "symbol.language"),
    new MatchPattern(/[{}]/, "symbol.language"),

    new MatchPattern(/[,;:.]|=>|->/, "symbol.language"),
    new MatchPattern(/ [<>] |<=|>=/, "symbol.operator"),
    new MatchPattern(/[+\-*/%=!?]/, "symbol.operator"),
    new MatchPattern(/[<>]/, "symbol.language")
);
jsLang.addPattern(
    "types",
    new MatchPattern(
        /(?<![A-Za-z])(string|number|bigint|boolean|symbol|any|void|never|unknown)\b/,
        "type"
    ),
    new MatchPattern(/\b[A-Z][A-Za-z0-9]*\b/, "type")
);
jsLang.addPattern(
    "calls",
    new MatchPattern(/[A-z_]\w*(?=\s*\()/, "variable.function")
);
jsLang.addPattern(
    "numbers",
    new MatchPattern(
        /(?:\d\d*(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+\b)?/,
        "constant.number"
    ),
    new MatchPattern(
        /0(?:[xX][0-9a-fA-F]+|[oO][0-7]+|[bB][01]+)\b/,
        "constant.number"
    )
);

export default jsLang;
