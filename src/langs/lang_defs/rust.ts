import { BlockPattern, IncludePattern, LangDef, MatchPattern } from "../lang";

let lang = new LangDef("rust", ["rs"]);

lang.addPattern("keywords", new MatchPattern(/for|if|else/, "keyword"));
lang.addPattern(
    "parens",
    new BlockPattern(
        { match: /\(/, elem: "thing" },
        { match: /\)/, elem: "thing" },
        [new IncludePattern("@self")]
    )
);

export default lang;
