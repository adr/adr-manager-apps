/**
 * Thin re-export of the shared MADR parser. The web app uses the default (web) behaviour
 * of md2adr/adr2md, so no option flags are needed here.
 */
export {
    md2adr,
    adr2md,
    snakeCase2naturalCase,
    naturalCase2snakeCase,
    matchOptionTitleMoreRelaxed
} from "@adr-manager/core";
