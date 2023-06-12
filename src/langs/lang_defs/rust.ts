import {
    BlockPattern,
    IncludePattern,
    LangDef,
    MatchPattern,
} from "../lang_def";

let rustLang = new LangDef("Rust", ["rs"]);

rustLang.addPattern(
    "line_comments",
    new MatchPattern(/\/\/.*/, "comment.line")
);
rustLang.addPattern(
    "block_comments",
    new BlockPattern(
        { regex: /\/\*/, elem: "comment.block" },
        { regex: /\*\//, elem: "comment.block" },
        "comment.block",
        [new IncludePattern(["block_comments"])]
    )
);
rustLang.addPattern(
    "lifetimes",
    new MatchPattern(/(['])([a-zA-Z_][0-9a-zA-Z_]*)(?!['])\b/, "type")
);
rustLang.addPattern(
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
rustLang.addPattern("constants", new MatchPattern(/\b[A-Z]{2,}\b/, null));
rustLang.addPattern(
    "keywords",
    new MatchPattern(
        /\b(break|continue|else|for|if|in|loop|match|return|while|async|await|do|yield|try)\b/,
        "keyword.control"
    ),
    new MatchPattern(
        /\b(const|crate|enum|fn|impl|let|mod|struct|trait|type|use|macro|union)\b/,
        "keyword.decl"
    ),

    new MatchPattern(
        /\b(extern|move|mut|pub|ref|static|where|dyn|abstract|become|box|final|override|priv|unsized|virtual)\b/,
        "keyword.modifier"
    ),

    new MatchPattern(/\b(unsafe)\b/, "keyword.other"),
    new MatchPattern(/\b(as|typeof)\b/, "keyword.operator"),

    new MatchPattern(/\b(false|true)\b/, "constant.language"),

    new MatchPattern(/\b(self|Self|super)\b/, "variable.language")
);
rustLang.addPattern(
    "symbols",
    new MatchPattern(/[()]/, "symbol.language"),
    new MatchPattern(/[[\]]|#\[/, "symbol.language"),
    new MatchPattern(/[{}]/, "symbol.language"),

    new MatchPattern(/[,;:.]|=>|->/, "symbol.language"),
    new MatchPattern(/ [<>] |<=|>=/, "symbol.operator"),
    new MatchPattern(/[+\-*/%&@~=!?]/, "symbol.operator"),
    new MatchPattern(/[<>]/, "symbol.language")
);
rustLang.addPattern(
    "types",
    new MatchPattern(
        /(?<![A-Za-z])(f32|f64|i128|i16|i32|i64|i8|isize|u128|u16|u32|u64|u8|usize|bool|char|str)\b/,
        "type"
    ),
    new MatchPattern(/\b[A-Z][A-Za-z0-9]*\b/, "type")
);
rustLang.addPattern(
    "calls",
    new MatchPattern(/[A-z_]\w*(?=\s*\()/, "variable.function"),
    new MatchPattern(/[A-z_]\w*\s*\!/, "variable.function")
);
rustLang.addPattern(
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

export default rustLang;
