import { BlockPattern, IncludePattern, LangDef, MatchPattern } from "../lang";

let lang = new LangDef("rust", ["rs"]);

lang.addPattern("line_comments", new MatchPattern(/\/\/.*/, "comment.line"));
lang.addPattern(
    "block_comments",
    new BlockPattern(
        { regex: /\/\*/, elem: "comment.block" },
        { regex: /\*\//, elem: "comment.block" },
        "comment.block",
        [new IncludePattern(["block_comments"])]
    )
);
lang.addPattern(
    "lifetimes",
    new MatchPattern(/(['])([a-zA-Z_][0-9a-zA-Z_]*)(?!['])\b/, "type")
);
lang.addPattern(
    "strings",
    new BlockPattern(
        { regex: /(b?)(r#*)?(\")/, elem: "string.double" },
        { regex: /(\")(#*)/, elem: "string.double" },
        "string.double",
        [
            new MatchPattern(
                /(\\)(?:(?:(x[0-7][0-7a-fA-F])|(u(\{)[\da-fA-F]{4,6}(\}))|.))/,
                "string.escape"
            ),
        ]
    ),
    new BlockPattern(
        { regex: /(b)?(')/, elem: "string.single" },
        { regex: /'/, elem: "string.single" },
        "string.single",
        []
    )
);
lang.addPattern("constants", new MatchPattern(/\b[A-Z]{2,}\b/, null));
lang.addPattern(
    "keywords",
    new MatchPattern(
        /\b(break|continue|else|for|if|in|loop|match|return|while|async|await|do|yield|try)\b/,
        "keyword.control"
    ),
    new MatchPattern(
        /\b(crate|enum|fn|impl|let|mod|struct|trait|type|use|macro|union)\b/,
        "keyword.decl"
    ),

    new MatchPattern(
        /\b(const|extern|move|mut|pub|ref|static|where|dyn|abstract|become|box|final|override|priv|unsized|virtual)\b/,
        "keyword.modifier"
    ),

    new MatchPattern(/\b(unsafe)\b/, "keyword.other"),
    new MatchPattern(/\b(as|typeof)\b/, "keyword.operator"),

    new MatchPattern(/\b(false|true)\b/, "constant.language"),

    new MatchPattern(/\b(self|Self|super)\b/, "variable.language")
);
lang.addPattern(
    "symbols",
    new MatchPattern(/[()]/, "symbol.language"),
    new MatchPattern(/[[\]]|#\[/, "symbol.language"),
    new MatchPattern(/[{}]/, "symbol.language"),

    new MatchPattern(/[,;:.]|=>|->/, "symbol.language"),
    new MatchPattern(/ [<>] |<=|>=/, "symbol.operator"),
    new MatchPattern(/[+\-*/%&@~=]/, "symbol.operator"),
    new MatchPattern(/[<>]/, "symbol.language")
);
lang.addPattern(
    "types",
    new MatchPattern(
        /(?<![A-Za-z])(f32|f64|i128|i16|i32|i64|i8|isize|u128|u16|u32|u64|u8|usize)\b|bool|char|str/,
        "type"
    ),
    new MatchPattern(/\b[A-Z][A-Za-z0-9]*\b/, "type")
);
lang.addPattern(
    "calls",
    new MatchPattern(/[A-z_]\w*(?=\s*\()/, "variable.function"),
    new MatchPattern(/[A-z_]\w*\s*\!/, "variable.function")
);
lang.addPattern(
    "numbers",
    new MatchPattern(
        /\b\d[\d_]*(\.?)[\d_]*(?:(E)([+-])([\d_]+))?(f32|f64|i128|i16|i32|i64|i8|isize|u128|u16|u32|u64|u8|usize)?\b/,
        "constant.number"
    ),
    new MatchPattern(
        /\b0x[\da-fA-F_]+(i128|i16|i32|i64|i8|isize|u128|u16|u32|u64|u8|usize)?\b/,
        "constant.number"
    ),
    new MatchPattern(
        /\b0o[0-7_]+(i128|i16|i32|i64|i8|isize|u128|u16|u32|u64|u8|usize)?\b/,
        "constant.number"
    ),
    new MatchPattern(
        /\b0b[01_]+(i128|i16|i32|i64|i8|isize|u128|u16|u32|u64|u8|usize)?\b/,
        "constant.number"
    )
);

export default lang;
