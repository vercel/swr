import { createTokenizer as createTokenizerJapanese } from "@orama/tokenizers/japanese";
import { createTokenizer as createTokenizerMandarin } from "@orama/tokenizers/mandarin";
import { createFromSource } from "fumadocs-core/search/server";
import { translations } from "@/geistdocs";
import { source } from "@/lib/geistdocs/source";

const localeMap: {
  [key: string]: {
    language?: string;
    components?: {
      tokenizer:
        | ReturnType<typeof createTokenizerMandarin>
        | ReturnType<typeof createTokenizerJapanese>;
    };
    search?: {
      threshold: number;
      tolerance: number;
    };
  };
} = Object.fromEntries(
  Object.entries(translations).map(([locale, translation]) => [
    locale,
    { language: translation.displayName.toLowerCase() },
  ])
);

if ("cn" in translations) {
  localeMap.cn = {
    components: {
      tokenizer: createTokenizerMandarin(),
    },
    search: {
      threshold: 0,
      tolerance: 0,
    },
  };
}

if ("jp" in translations) {
  localeMap.jp = {
    components: {
      tokenizer: createTokenizerJapanese(),
    },
    search: {
      threshold: 0,
      tolerance: 0,
    },
  };
}

export const { GET } = createFromSource(source, { localeMap });
