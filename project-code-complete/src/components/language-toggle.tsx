import { ChevronDown } from "lucide-react";

import {
  LANG_LABEL,
  LANG_LABEL_EN,
  OTHER_LANGS,
  PRIMARY_LANGS,
  isLang,
  t,
  useLanguage,
  type Lang,
} from "@/lib/i18n";

export function LanguageToggle({
  lang: propLang,
  onChange: propOnChange,
  compact = false,
}: {
  lang?: Lang;
  onChange?: (l: Lang) => void;
  compact?: boolean;
}) {
  const context = useLanguage();
  const activeLang = propLang ?? context.lang;
  const activeOnChange = propOnChange ?? context.setLang;

  const otherSelected = OTHER_LANGS.includes(activeLang);
  const selectValue = otherSelected ? activeLang : "";

  const pick = (next: Lang) => {
    context.setLang(next);
    if (propOnChange) {
      propOnChange(next);
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1 ${
        compact
          ? "rounded-lg bg-sidebar-accent p-1"
          : "rounded-lg border border-border bg-card p-1 shadow-xs"
      }`}
      role="group"
      aria-label={t(activeLang, "language")}
    >
      {PRIMARY_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
            activeLang === l
              ? "bg-brand text-brand-foreground shadow-xs font-bold"
              : compact
                ? "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {LANG_LABEL[l]}
        </button>
      ))}

      <div className="relative">
        <select
          aria-label={t(activeLang, "moreLanguages")}
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            if (isLang(v)) pick(v);
          }}
          className={`appearance-none rounded-md py-1 pl-2.5 pr-7 text-xs font-semibold outline-none transition-colors cursor-pointer ${
            otherSelected
              ? "bg-brand text-brand-foreground font-bold shadow-xs"
              : compact
                ? "bg-transparent text-sidebar-foreground/70 hover:text-sidebar-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <option value="" disabled className="bg-card text-muted-foreground">
            {otherSelected ? LANG_LABEL[activeLang] : t(activeLang, "moreLanguages")}
          </option>
          {OTHER_LANGS.map((l) => (
            <option key={l} value={l} className="bg-card text-foreground">
              {LANG_LABEL[l]} ({LANG_LABEL_EN[l]})
            </option>
          ))}
        </select>
        <ChevronDown
          className={`pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 ${
            otherSelected
              ? "text-brand-foreground"
              : compact
                ? "text-sidebar-foreground/60"
                : "text-muted-foreground"
          }`}
        />
      </div>
    </div>
  );
}
