export function cleanUpString(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Returns a shortened title with the short description ("- ", " – ", " | ", ", e.g.",
 * " (...)") and any Markdown link syntax stripped off.
 *
 * @param opts.stripBackticks also remove backticks (the VS Code extension's behaviour).
 *   The web app keeps backticks so its round-trip fixtures reparse exactly.
 */
export function createShortTitle(title: string, opts: { stripBackticks?: boolean } = {}): string {
  if (!title) {
    return "";
  }
  let result = title;

  // Strip off short description text in the title.
  let idx = title.indexOf(" - ");
  if (idx > 0) {
    result = title.substring(0, idx);
  } else {
    idx = title.indexOf(" – ");
    if (idx > 0) {
      result = title.substring(0, idx);
    } else {
      idx = title.indexOf(" | ");
      if (idx > 0) {
        result = title.substring(0, idx);
      } else {
        idx = title.indexOf(", e.g.");
        if (idx > 0) {
          result = title.substring(0, idx);
        } else {
          // Handle case "Add ... (similar to https://...)" --> content of braces removed.
          idx = title.indexOf(" (");
          const idxClosing = title.indexOf(")");
          if (idx > 0 && idxClosing === title.length - 1 && (idx = title.lastIndexOf(" ("))) {
            result = title.substring(0, idx);
          }
        }
      }
    }
  }

  // Strip out a Markdown link, e.g. "[MADR](https://...) 2.1.2" --> "MADR 2.1.2".
  const idxOpeningBracket = result.indexOf("[");
  const idxClosingBracket = result.indexOf("]");
  const idxOpeningRoundedBracket = result.indexOf("(");
  const idxClosingRoundedBracket = result.indexOf(")");
  if (
    idxOpeningBracket >= 0 &&
    idxOpeningBracket < idxClosingBracket &&
    idxOpeningRoundedBracket === idxClosingBracket + 1 &&
    idxClosingRoundedBracket > idxOpeningRoundedBracket
  ) {
    result =
      (idxOpeningBracket > 0 ? result.substring(0, idxOpeningBracket) : "") +
      result.substring(idxOpeningBracket + 1, idxClosingBracket) +
      (result.length > idxClosingRoundedBracket + 1 ? result.substring(idxClosingRoundedBracket + 1) : "");
  }

  if (opts.stripBackticks) {
    result = result.replace(/`/g, "");
  }

  return result;
}

/**
 * Converts a snake/kebab-case string into a natural-language-like string.
 * Example: "0001-add-status-field" -> "0001 Add Status Field"
 */
export function snakeCase2naturalCase(snake: string): string {
  return snake.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace("-", " ").replace("_", " "));
}

/**
 * Converts a natural-case string into a kebab-case string (e.g. for a file name).
 * Example: "Add status Field" -> "add-status-field"
 */
export function naturalCase2snakeCase(natural: string): string {
  return natural.trim().toLowerCase().replace(/  +/g, " ").split(" ").join("-");
}

/**
 * Converts a natural-case string into a title-case string, keeping minor words lowercase
 * and known initialisms uppercase. Example: "Add status field" -> "Add Status Field".
 */
export function naturalCase2titleCase(natural: string): string {
  // Minor words left lowercase unless first/last in the string.
  const lowers = [
    "A",
    "An",
    "The",
    "And",
    "But",
    "Or",
    "For",
    "Nor",
    "As",
    "At",
    "By",
    "From",
    "In",
    "Into",
    "Near",
    "Of",
    "On",
    "Onto",
    "To",
    "With"
  ];
  // Initialisms / acronyms left uppercase.
  const uppers = ["ID", "TV", "ADR", "CC0", "MADR"];

  let str = natural.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1));

  for (const lower of lowers) {
    str = str.replace(new RegExp("\\s" + lower + "\\s", "g"), (txt) => txt.toLowerCase());
  }
  for (const upper of uppers) {
    str = str.replace(new RegExp(`\\b${upper}\\b`, "gi"), upper.toUpperCase());
  }
  // Leave plural "s" of uppers lowercase, e.g. "ADRs".
  for (const upper of uppers) {
    str = str.replace(new RegExp(`\\b${upper}s\\b`, "gi"), upper + "s");
  }

  return str.trim();
}

/**
 * Compares two markdown documents ignoring whitespace and bullet style, so files
 * written by hand still count as conforming to the template a writer produces.
 */
export function matchesIgnoringFormatting(left: string, right: string): boolean {
  const normalize = (md: string): string => md.replace(/[ \r\n]/g, "").replace(/- /g, "* ");
  return normalize(left) === normalize(right);
}

/**
 * Option titles are similar iff they are equal after removing whitespace + lower-casing,
 * one normalized title is a prefix of the other, or the chosen option is a sub-title of
 * the option (compared via {@link createShortTitle}).
 */
export function matchOptionTitleMoreRelaxed(
  titleFromOptionList: string,
  titleFromChosenOption: string,
  opts: { stripBackticks?: boolean } = {}
): boolean {
  const trimmedList = titleFromOptionList.replace(/ /g, "").toLowerCase();
  const trimmedChosen = titleFromChosenOption.replace(/ /g, "").toLowerCase();
  return (
    trimmedList === trimmedChosen ||
    trimmedList.startsWith(trimmedChosen) ||
    trimmedChosen.startsWith(trimmedList) ||
    titleFromChosenOption === createShortTitle(titleFromOptionList, opts) ||
    createShortTitle(titleFromOptionList, opts).startsWith(titleFromChosenOption)
  );
}
