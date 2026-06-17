// MADR fixtures matching the option set the VS Code extension passes to the parser:
// md2adr { titleCase, stripBackticks, aggressiveCleanup, trackErrors } and
// adr2md { emitYaml, titleCase, sanitizeChosenOption, stripBackticks, aggressiveCleanup }.
// Sourced from the extension's test corpus (apps/vscode-adr-manager/src/test/constants.ts).
import { ArchitecturalDecisionRecord } from "../../src/index";

export const validMarkdownADRs = [
  // madr/master/docs/adr/0000-use-markdown-architectural-decision-records.md
  `# Use Markdown Architectural Decision Records

## Context and Problem Statement

We want to record architectural decisions made in this project.
Which format and structure should these records follow?

## Considered Options

* [MADR](https://adr.github.io/madr/) 2.1.2 – The Markdown Architectural Decision Records
* [Michael Nygard's template](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) – The first incarnation of the term "ADR"
* [Sustainable Architectural Decisions](https://www.infoq.com/articles/sustainable-architectural-design-decisions) – The Y-Statements
* Other templates listed at <https://github.com/joelparkerhenderson/architecture_decision_record>
* Formless – No conventions for file format and structure

## Decision Outcome

Chosen option: "MADR 2.1.2", because

* Implicit assumptions should be made explicit.
  Design documentation is important to enable people understanding the decisions later on.
  See also [A rational design process: How and why to fake it](https://doi.org/10.1109/TSE.1986.6312940).
* The MADR format is lean and fits our development style.
* The MADR structure is comprehensible and facilitates usage & maintenance.
* The MADR project is vivid.
* Version 2.1.2 is the latest one available when starting to document ADRs.
`,

  // madr/master/docs/adr/0006-use-names-as-identifier.md
  `# Use Names as Identifier

## Context and Problem Statement

An option is listed at "Considered Options" and repeated at "Pros and Cons of the Options". Finally, the chosen option is stated at "Decision Outcome".

## Decision Drivers

* Easy to read
* Easy to write
* Avoid copy and paste errors

## Considered Options

* Repeat all option names if they occur
* Assign an identifier to an option, e.g., \`[A] Use gradle as build tool\`

## Decision Outcome

Chosen option: "Assign an identifier to an option", because 1) there is no markdown standard for identifiers, 2) the document is harder to read if there are multiple options.
`,

  // madr/master/docs/adr/0007-do-not-emphasize-line-headings.md
  `# Do Not Emphasize Line Headings

## Context and Problem Statement

MADR contains lines such as \`Chosen option: "[option 1]"\`. Should "Chosen option" be emphasised?

## Decision Drivers

* MADR should be easy to read
* MADR should be easy to write

## Considered Options

* Do not emphasize line headings
* Emphysize line headings

## Decision Outcome

Chosen option: "Do not emphasize line headings", because 1) these headings always are put at the beginning of a line and followed by a colon. Thus, they are already easy to identified as line heading. 2) Readers not familiar with markdown might be confused by stars in the text.
`,

  // madr/master/docs/adr/0008-add-status-field.md
  `# Add Status Field

Technical Story: <https://github.com/adr/madr/issues/2>

## Context and Problem Statement

ADRs have a status. Should this be tracked? And if it should, how should we track it?

## Considered Options

* Use badge
* Use text line
* Use separate heading
* Use table
* Do not add status

## Decision Outcome

Chosen option: "Use text line", because [justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force force | ... | comes out best (see below)].

## Pros and Cons of the Options

### Use badge

#### Examples

* ![grafik](https://user-images.githubusercontent.com/1366654/36786999-ca368324-1c88-11e8-966d-56f25980fd76.png)
* [![status-superseeded](https://img.shields.io/badge/status-superseeded_by_ADR_0001-orange.svg?style=flat-square)](https://github.com/adr/madr/blob/master/docs/adr/0001-use-CC0-as-license.md)

#### Pros/cons

* Good, because plain markdown
* Good, because looks good
* Bad, because hard to read in markdown source
* Bad, because relies on the online service https://shields.io or [local badges have to be generated](https://github.com/badges/shields#using-the-badge-library)
* Bad, because at local usages, many badges have to be generated (superseeded-by-ADR-0006, for each ADR number)
* Bad, because not easy to write

### Use text line

Example: \`Status: Accepted\`

* Good, because plain markdown
* Good, because easy to read
* Good, because easy to write
* Good, because looks OK in both markdown-source (MD) and in rendered versions (HTML, PDF)
* Good, because no dependencies on external tools
* Good, because single line indicates the current state
* Bad, because "Status" line needs to be maintained
* Bad, because uses space at the beginning. When users read MADR, they should directly dive into the context and problem and not into the status

### Use separate heading

Example:  ![grafik](https://user-images.githubusercontent.com/1366654/36787029-f5ea246c-1c88-11e8-9082-8e9531e4fac7.png)

* Good, because plain markdown
* Good, because easy to write
* Bad, because it uses much space: At least three lines: heading, status, separating empty line

### Use table

Example:  ![grafik](https://user-images.githubusercontent.com/1366654/36787043-0339a53e-1c89-11e8-8ebe-fb2a5752448c.png)

* Good, because history can be included
* Good, because multiple entries can be made
* Good, because already implemented in adr-tools fork
* Bad, because not covered by the [CommonMark specification 0.28 (2017-08-01)](http://spec.commonmark.org/0.28/)
* Bad, because hard to read
* Bad, because outdated entries cannot be easily identified
* Bad, because needs more markdown training

### Do not add status

* Good, because MADR is kept lean
* Bad, because users demand state field
* Bad, because not in line with other ADR templates
`,

  // madr/master/docs/adr/0009-support-links-between-adrs-inside-an-adrs.md
  `# Support Links Between ADRs Inside an ADR

Technical Story: https://github.com/adr/madr/issues/9

## Considered Options

* Use tables
* Use heading together with a bullet list directly after status
* Use heading together with a bullet list directly after "Decision Outcome"
* Use heading together with a bullet list at the end
* Don't add links

## Decision Outcome

Chosen option: "Use heading together with a bullet list at the end", because comes out best (see below).

## Pros and Cons of the Options

### Use tables

* Good, because easy to write
* Good, because history is shown (enabled by concept)
* Good, because current adr-tools support (https://github.com/npryce/adr-tools/pull/43) uses tables to describe links.
* Bad, because not supported by the CommonMark spec
* Bad, because unclear whether a link was superseeded by another one
* Bad, because valid links not clear at first sight (there might be outdated links shown)

### Use heading together with a bullet list directly after status

Example:
![grafik](https://user-images.githubusercontent.com/1366654/36787434-6a63e318-1c8a-11e8-8824-4dd7b3d0f2c6.png)

* Good, because easy to write
* Good, because supported by the CommonMark spec
* Bad, because not consistent with the status label (refs https://github.com/adr/madr/issues/2)

### Use heading together with a bullet list directly after "Decision Outcome"

* Good, because easy to write
* Good, because supported by the CommonMark spec
* Good, because the options are first introduced and then the links
* Good, because consistent with position of "Decision Outcome"
* Bad, because reader might get distracted: He might expect explanation of the options instead of links to something else
* Bad, because not consistent with scientific papers, where related work and future work are coming after the discussion of the content.

### Use heading together with a bullet list at the end

* Good, because easy to write
* Good, because supported by the CommonMark spec
* Good, because the options and pros/cons are kept together with the option list.
* Good, because consistent with pattern format

### Don't add links

* Good, because template stays minimal
`,

  // madr/docs/adr/0011-use-asterisk-as-list-marker.md
  `# Use Asterisk as List Marker

## Context and Problem Statement

Lists in markdown can be indicated by \`*\` (asterisk) or \`-\` (hypen).

## Considered Options

* Use an asterisk
* Use a hyphen

## Decision Outcome

Chosen option: "Use an asterisk", because an asterisk does not have a meaning of "good" or "bad", whereas a hypen \`-\` could be read as indicator of something negative (in contrast to \`+\`, which could be more be read as "good").

According to the [Markdown Style Guide](http://www.cirosantilli.com/markdown-style-guide/), an asterisk as list marker is more readble (see [readability profile](http://www.cirosantilli.com/markdown-style-guide/#readability-profile)).
`,
  // An ADR that uses every field
  `# Example ADR

* Status: proposed
* Deciders: Decider
* Date: 2020-12-03

Technical Story: Proposed in Issue [#30](https://github.com/koppor/adr-manager/issues/30)

## Context and Problem Statement

Context and

## Decision Drivers

* ADR-Manager should be lightweight and easy to implement.
* ADR-Manager should be easy to maintain.

## Considered Options

* Don't use any global store
* Only use local storage in combination with Events/Props
* Implement a state manager from scratch.
* Use the Vue-State-Manager Vuex

## Decision Outcome

Chosen option: "Implement a state manager from scratch", because comes out best. The data can additionally be stored in Local Storage but this should be managed by the global store as well.

### Positive Consequences

* New functionality will be easier to add.

### Negative Consequences

* asd

## Pros and Cons of the Options

### Don't use any global store

Just "cascade" updates between Vue-Components via Events and Props.
E.g. each editor tab has a prop (v-model) for the displayed ADR. Whenever the ADR is changed the Sup-Component (currently TheEditor.vue) updates the ADR in each tab.
When a new ADR is created via a toolbar menu, the event needs to cascade down to each related Editor-Component.

* Good, because it's easy to implement. It is currently done that way and requires no further actions.
* Bad, because it's a debugging nightmare.
* Bad, because GUI and functionality is more directly connected. Changes to the GUI often require updating functionality and vice versa.

### Only use local storage in combination with Events/Props

Use local storage (i.e. persistent storage) to store the state and use events (e. g. a global event bus) to communicate changes to the state.

* Good, because it's easy to implement.
* Good, because Most data should be stored in persistent storage anyway.

### Implement a state manager from scratch.

Implement a state manager from scratch as described at https://vuejs.org/v2/guide/state-management.html#Simple-State-Management-from-Scratch.

* Good, because GUI and functionality are split better. Debugging is easier.
* Good, because Dialogs can be moved around between components without having to update props and events every time.

### Use the Vue-State-Manager Vuex

Docs can be found at https://vuex.vuejs.org/.

* Good, because best long-term maintainability.
* Good, because prepares for extensions like 'Undo-Redo'.
* Good, because the development team can gather experience with Vuex.
* Bad, because of more concepts and boilerplate.
* Bad, because does not fit in our project. We assume that ADR-Manager is a small-to-medium project and not a medium-to-large project

## Links

* [This is a link](example.org)
`
];

/**
 * Pairs describing the expected behaviour of the md2adr parser. When given the markdown it should output the ADR.
 */
export const MD_ParsedMADR_Pairs = [
  // madr/docs/adr/0000-use-markdown-architectural-decision-records.md
  {
    md: `# Use Markdown Architectural Decision Records

## Context and Problem Statement

We want to record architectural decisions made in this project.
Which format and structure should these records follow?

## Considered Options

* [MADR](https://adr.github.io/madr/) 2.1.2 – The Markdown Architectural Decision Records
* [Michael Nygard's template](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) – The first incarnation of the term "ADR"
* [Sustainable Architectural Decisions](https://www.infoq.com/articles/sustainable-architectural-design-decisions) – The Y-Statements
* Other templates listed at <https://github.com/joelparkerhenderson/architecture_decision_record>
* Formless – No conventions for file format and structure

## Decision Outcome

Chosen option: "MADR 2.1.2", because

* Implicit assumptions should be made explicit.
  Design documentation is important to enable people understanding the decisions later on.
  See also [A rational design process: How and why to fake it](https://doi.org/10.1109/TSE.1986.6312940).
* The MADR format is lean and fits our development style.
* The MADR structure is comprehensible and facilitates usage & maintenance.
* The MADR project is vivid.
* Version 2.1.2 is the latest one available when starting to document ADRs.
`,
    adr: new ArchitecturalDecisionRecord({
      yaml: "",
      title: "Use Markdown Architectural Decision Records",
      status: "",
      conforming: true,
      parseErrors: [],
      contextAndProblemStatement: `We want to record architectural decisions made in this project.
Which format and structure should these records follow?`,
      decisionDrivers: [],
      consideredOptions: [
        {
          title: "[MADR](https://adr.github.io/madr/) 2.1.2 – The Markdown Architectural Decision Records",
          description: "",
          pros: [] as string[],
          cons: [] as string[]
        },
        {
          title:
            '[Michael Nygard\'s template](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) – The first incarnation of the term "ADR"',
          description: "",
          pros: [] as string[],
          cons: [] as string[]
        },
        {
          title:
            "[Sustainable Architectural Decisions](https://www.infoq.com/articles/sustainable-architectural-design-decisions) – The Y-Statements",
          description: "",
          pros: [] as string[],
          cons: [] as string[]
        },
        {
          title: "Other templates listed at <https://github.com/joelparkerhenderson/architecture_decision_record>",
          description: "",
          pros: [] as string[],
          cons: [] as string[]
        },
        {
          title: "Formless – No conventions for file format and structure",
          description: "",
          pros: [] as string[],
          cons: [] as string[]
        }
      ],
      decisionOutcome: {
        chosenOption: "MADR 2.1.2",
        explanation: `* Implicit assumptions should be made explicit.
  Design documentation is important to enable people understanding the decisions later on.
  See also [A rational design process: How and why to fake it](https://doi.org/10.1109/TSE.1986.6312940).
* The MADR format is lean and fits our development style.
* The MADR structure is comprehensible and facilitates usage & maintenance.
* The MADR project is vivid.
* Version 2.1.2 is the latest one available when starting to document ADRs.`,
        positiveConsequences: [] as string[],
        negativeConsequences: [] as string[]
      }
    })
  },

  // madr/docs/adr/0001-use-CC0-as-license.md
  {
    md: `# Use CC0 as License

## Context and Problem Statement

Everything needs to be licensed, otherwise the default copyright laws apply.
For instance, in Germany that means users may not alter anything without explicitly asking for permission.
For more information see <https://help.github.com/articles/licensing-a-repository/>.

We want to have MADR used without any hassle and that users can just go ahead and write MADRs.

## Considered Options

* [CC0](https://creativecommons.org/share-your-work/public-domain/cc0/)
* No license
* Other open source licenses

## Decision Outcome

Chosen option: "CC0", because this license donates the content to "public domain" and does so as legally as possible.
`,
    adr: new ArchitecturalDecisionRecord({
      yaml: "",
      title: "Use CC0 as License",
      conforming: true,
      parseErrors: [],
      contextAndProblemStatement: `Everything needs to be licensed, otherwise the default copyright laws apply.
For instance, in Germany that means users may not alter anything without explicitly asking for permission.
For more information see <https://help.github.com/articles/licensing-a-repository/>.

We want to have MADR used without any hassle and that users can just go ahead and write MADRs.`,
      consideredOptions: [
        {
          title: "[CC0](https://creativecommons.org/share-your-work/public-domain/cc0/)",
          description: "",
          pros: [],
          cons: []
        },
        {
          title: "No license",
          description: "",
          pros: [],
          cons: []
        },
        {
          title: "Other open source licenses",
          description: "",
          pros: [],
          cons: []
        }
      ],
      decisionOutcome: {
        chosenOption: "CC0",
        explanation: `this license donates the content to "public domain" and does so as legally as possible.`,
        positiveConsequences: [],
        negativeConsequences: []
      }
    })
  },

  // madr/docs/adr/0002-do-not-use-numbers-in-headings.md
  // Misses the '"' around the chose option and the heading 'Context and Problem Statement'
  {
    md: `# Do Not Use Numbers in Headings

## Context and Problem Statement

How to render the first line in an ADR?
ADRs have to take a unique identifier.

## Considered Options

* Use the title only
* Add the ADR number in front of the title (e.g., "# 2. Do Not Use Numbers in Headings")

## Decision Outcome

Chosen option: Use the title only, because

* This is common in other markdown files, too.
  One does not add numbering manually at the markdown files, but tries to get the numbers injected by the rendering framework or CSS.
* Enables renaming of ADRs (before publication) easily
* Allows copy'n'paste of ADRs from other repositories without having to worry about the numbers.
`,
    adr: new ArchitecturalDecisionRecord({
      yaml: "",
      title: "Do Not Use Numbers in Headings",
      conforming: true,
      parseErrors: [],
      contextAndProblemStatement: `How to render the first line in an ADR?
ADRs have to take a unique identifier.`,
      consideredOptions: [
        {
          title: "Use the title only",
          description: "",
          pros: [],
          cons: []
        },
        {
          title: 'Add the ADR number in front of the title (e.g., "# 2. Do Not Use Numbers in Headings")',
          description: "",
          pros: [],
          cons: []
        }
      ],
      decisionOutcome: {
        chosenOption: "Use the title only",
        explanation: `* This is common in other markdown files, too.
  One does not add numbering manually at the markdown files, but tries to get the numbers injected by the rendering framework or CSS.
* Enables renaming of ADRs (before publication) easily
* Allows copy'n'paste of ADRs from other repositories without having to worry about the numbers.`,
        positiveConsequences: [],
        negativeConsequences: []
      }
    })
  },

  // madr/master/docs/adr/0005-use-dashes-in-filenames.md
  {
    md: `# Use Dashes in Filenames

## Context and Problem Statement

What is the pattern of the filename where an ADR is stored?

## Considered Options

* \`NNNN-title-with-dashes.md\` - format used by [adr-tools](https://github.com/npryce/adr-tools)
* \`YYYY-MM-DD Title\` - see https://github.com/joelparkerhenderson/architecture_decision_record#adr-file-name-conventions

## Decision Outcome

Chosen option: \`NNNN-title-with-dashes.md\`, because

* \`NNNN\` provides a unique number, which can be used for referencing in the forms
  * \`ADR-0001\` in plain text and
  * by \`@ADR(1)\` Java code (enabled by [e-adr](https://adr.github.io/e-adr/))
* The creation time of an ADR is of historical interest only, if it gets updated somehow.
  The arguments are similar than the ones by [Does Git have keyword expansion?](https://git.wiki.kernel.org/index.php/GitFaq#Does_Git_have_keyword_expansion.3F)
* Having no spaces in filenames eases working in the command line
* This is exactly the format offered by [adr-tools](https://github.com/npryce/adr-tools)
`,
    adr: new ArchitecturalDecisionRecord({
      yaml: "",
      title: "Use Dashes in Filenames",
      conforming: true,
      parseErrors: [],
      contextAndProblemStatement: `What is the pattern of the filename where an ADR is stored?`,
      consideredOptions: [
        {
          title: "`NNNN-title-with-dashes.md` - format used by [adr-tools](https://github.com/npryce/adr-tools)",
          description: "",
          pros: [],
          cons: []
        },
        {
          title:
            "`YYYY-MM-DD Title` - see https://github.com/joelparkerhenderson/architecture_decision_record#adr-file-name-conventions",
          description: "",
          pros: [],
          cons: []
        }
      ],
      decisionOutcome: {
        chosenOption: "NNNN-title-with-dashes.md",
        explanation: `* \`NNNN\` provides a unique number, which can be used for referencing in the forms
  * \`ADR-0001\` in plain text and
  * by \`@ADR(1)\` Java code (enabled by [e-adr](https://adr.github.io/e-adr/))
* The creation time of an ADR is of historical interest only, if it gets updated somehow.
  The arguments are similar than the ones by [Does Git have keyword expansion?](https://git.wiki.kernel.org/index.php/GitFaq#Does_Git_have_keyword_expansion.3F)
* Having no spaces in filenames eases working in the command line
* This is exactly the format offered by [adr-tools](https://github.com/npryce/adr-tools)`,
        positiveConsequences: [],
        negativeConsequences: []
      }
    })
  },

  // madr/master/docs/adr/0010-support-categories.md
  {
    md: `# Support Categories

## Context and Problem Statement

ADRs are recorded. The number of ADRs grows and the context/topic/scope of ADRs might be different (e.g., frontend, backend)

## Decision Drivers

* Easy to find groups ADRs in hundreds of ADRs
* Easy to group
* Easy to create
* Good finding without external tooling
* Keep newcomers in mind (should be doable in <10 minutes)
* Keep template lean

## Considered Options

* Use labels
* Add \`* Category: CATEGORY\` directly under the heading (similar to https://gist.github.com/FaKeller/2f9c63b6e1d436abb7358b68bf396f57)
* Use YAML frontmatter
* Encode category in filename
* Use subfolders with local ids
* Use subfolders with global ids
* Don't do it.

## Decision Outcome

Chosen option: "Use subfolders with local ids"

## Pros and Cons of the Options

### Use labels

Example:  

Use Angular ![category-frontend](https://img.shields.io/badge/category-frontend-blue.svg?style=flat-square)

\`![category-frontend](https://img.shields.io/badge/category-frontend-blue.svg?style=flat-square)\`

* Good, because full markdown
* Good, because linking to an overview page is possible (using markdown)
* Bad, because not straight-forward to parse
* Bad, because no simple filtering using \`ls\` or Windows Explorer is possible

### Add \`* Category: CATEGORY\` directly under the heading 

* Good, because full markdown
* Good, because linking to an overview page is possible (using markdown)
* Good, because straight-forward to parse
* Bad, because no simple filtering using \`ls\` or Windows Explorer is possible

### Use YAML  frontmatter

Example:

\`\`\`yaml
---
category: frontend
---
\`\`\`

* Good, because nearly straight-forward to parse
* Good, because Jekyll supports it
* Bad, because YAML frontmatter is not part of the [CommonMarc Spec](http://spec.commonmark.org/)
* Bad, because no simple filtering using \`ls\` or Windows Explorer is possible

### Encode category in filename

Example: \`0050--frontend--title-with-dashes.md\`

* Good, because programmatic filtering is possible
* Good, because \`ls -la | grep --category--\` works
* Bad, because plain file list in Windows explorer cannot be filtered
* Bad, because as bad as [TagSpaces](https://www.tagspaces.org/), which stores the tags in the filenames in brackets. E.g., \`demo[demotag secondtag].md\`.

### Use subfolders with local ids

Optionally "to-be-categorized" folder.

One level of subfolder, not nested

#### Examples

* \`docs/adr/smar/0000-secure-entities.md\`
* \`docs/adr/smar/0001-flexible-properties-selection.md\`

#### Pros/cons

* Good, because grouping is done by folders (which are natural for grouping)
* Good, because typos can easily be spotted
* Bad, because there is no unique number identifying an ADR
* Bad, because two indices have to be maintained (adr-log needs to be updated)
* Bad, because e-adr needs to be adapted to \`@ADR("category", number)\` (not that bad)
* Bad, because when category is unknown it is hard to find the right folder
* Bad, because using categories might be hampering newcomers

### Use subfolders with global ids

#### Examples

* \`docs/adr/smar/0005-secure-entities.md\`
* \`docs/adr/smar/0047-flexible-properties-selection.md\`
`,

    adr: new ArchitecturalDecisionRecord({
      yaml: "",
      title: "Support Categories",
      conforming: true,
      parseErrors: [],
      contextAndProblemStatement: `ADRs are recorded. The number of ADRs grows and the context/topic/scope of ADRs might be different (e.g., frontend, backend)`,
      decisionDrivers: [
        "Easy to find groups ADRs in hundreds of ADRs",
        "Easy to group",
        "Easy to create",
        "Good finding without external tooling",
        "Keep newcomers in mind (should be doable in <10 minutes)",
        "Keep template lean"
      ],
      consideredOptions: [
        {
          title: "Use labels",
          description: `Example:  

Use Angular ![category-frontend](https://img.shields.io/badge/category-frontend-blue.svg?style=flat-square)

\`![category-frontend](https://img.shields.io/badge/category-frontend-blue.svg?style=flat-square)\``,
          pros: ["full markdown", "linking to an overview page is possible (using markdown)"],
          cons: ["not straight-forward to parse", "no simple filtering using `ls` or Windows Explorer is possible"]
        },
        {
          title:
            "Add `* Category: CATEGORY` directly under the heading (similar to https://gist.github.com/FaKeller/2f9c63b6e1d436abb7358b68bf396f57)",
          description: "",
          pros: [
            "full markdown",
            "linking to an overview page is possible (using markdown)",
            "straight-forward to parse"
          ],
          cons: ["no simple filtering using `ls` or Windows Explorer is possible"]
        },
        {
          title: "Use YAML frontmatter",
          description: `Example:

\`\`\`yaml
---
category: frontend
---
\`\`\``,
          pros: ["nearly straight-forward to parse", "Jekyll supports it"],
          cons: [
            "YAML frontmatter is not part of the [CommonMarc Spec](http://spec.commonmark.org/)",
            "no simple filtering using `ls` or Windows Explorer is possible"
          ]
        },
        {
          title: "Encode category in filename",
          description: "Example: `0050--frontend--title-with-dashes.md`",
          pros: ["programmatic filtering is possible", "`ls -la | grep --category--` works"],
          cons: [
            "plain file list in Windows explorer cannot be filtered",
            "as bad as [TagSpaces](https://www.tagspaces.org/), which stores the tags in the filenames in brackets. E.g., `demo[demotag secondtag].md`."
          ]
        },
        {
          title: "Use subfolders with local ids",
          description: `Optionally "to-be-categorized" folder.

One level of subfolder, not nested

#### Examples

* \`docs/adr/smar/0000-secure-entities.md\`
* \`docs/adr/smar/0001-flexible-properties-selection.md\`

#### Pros/cons`,
          pros: ["grouping is done by folders (which are natural for grouping)", "typos can easily be spotted"],
          cons: [
            "there is no unique number identifying an ADR",
            "two indices have to be maintained (adr-log needs to be updated)",
            'e-adr needs to be adapted to `@ADR("category", number)` (not that bad)',
            "when category is unknown it is hard to find the right folder",
            "using categories might be hampering newcomers"
          ]
        },
        {
          title: "Use subfolders with global ids",
          description: `#### Examples

* \`docs/adr/smar/0005-secure-entities.md\`
* \`docs/adr/smar/0047-flexible-properties-selection.md\``,
          pros: [],
          cons: []
        },
        {
          title: "Don't do it.",
          description: "",
          pros: [],
          cons: []
        }
      ],
      decisionOutcome: {
        chosenOption: "Use subfolders with local ids",
        explanation: ``,
        positiveConsequences: [],
        negativeConsequences: []
      }
    })
  },

  // Option list misses one option of "Pros and Cons of the Options" (D)
  // Option names have only prefix matching (A <-> As, B <-> Bs)
  {
    md: `# Heading

## Context and Problem Statement

Context

## Considered Options

* A
* Bs
* C

## Decision Outcome

Chosen option: "ABC", because comes out best.

### Positive Consequences

* positive consequence

## Pros and Cons of the Options

### As

A description


### B

B description


### D

D description

`,
    adr: new ArchitecturalDecisionRecord({
      yaml: "",
      title: "Heading",
      conforming: true,
      parseErrors: [],
      contextAndProblemStatement: `Context`,
      consideredOptions: [
        {
          title: "A",
          description: "A description",
          pros: [],
          cons: []
        },
        {
          title: "Bs",
          description: "B description",
          pros: [],
          cons: []
        },
        {
          title: "C",
          description: "",
          pros: [],
          cons: []
        },
        {
          title: "D",
          description: "D description",
          pros: [],
          cons: []
        }
      ],
      decisionOutcome: {
        chosenOption: "ABC",
        explanation: `comes out best.`,
        positiveConsequences: ["positive consequence"],
        negativeConsequences: []
      }
    })
  }
];

export const yamlMADRs = [
  `---
parent: Decision Records
nav_order: 1
---
# Use Crowdin for translations

## Context and Problem Statement

The JabRef UI is offered in multiple languages. It should be easy for translators to translate the strings.

## Considered Options

* Use [Crowdin](http://crowdin.com/)
* Use [popeye](https://github.com/JabRef/popeye)
* Use [Lingohub](https://lingohub.com/)
* Keep current GitHub flow. See the [Step-by-step guide](https://docs.jabref.org/faq/how-to-translate-the-ui).

## Decision Outcome

Chosen option: "Use Crowdin", because Crowdin is easy to use, integrates in our GitHub workflow, and is free for OSS projects.
`,
  `---
parent: Decision Records
nav_order: 4
---
# Use MariaDB Connector

## Context and Problem Statement

JabRef needs to connect to a MySQL database. See [Shared SQL Database](https://docs.jabref.org/collaborative-work/sqldatabase) for more information.

## Considered Options

* Use MariaDB Connector
* Use MySQL Connector

Other alternatives are listed at [https://stackoverflow.com/a/31312280/873282](https://stackoverflow.com/a/31312280/873282).

## Decision Outcome

Chosen option: "Use MariaDB Connector", because comes out best \(see below\).

## Pros and Cons of the Options

### Use MariaDB Connector

The [MariaDB Connector](https://mariadb.com/kb/en/library/about-mariadb-connector-j/) is a LGPL-licensed JDBC driver to connect to MySQL and MariaDB.

* Good, because can be used as drop-in replacement for MySQL connector

### Use MySQL Connector

The [MySQL Connector](https://www.mysql.com/de/products/connector/) is distributed by Oracle and licensed under GPL-2. Source: [https://downloads.mysql.com/docs/licenses/connector-j-8.0-gpl-en.pdf](https://downloads.mysql.com/docs/licenses/connector-j-8.0-gpl-en.pdf). Oracle added the [Universal FOSS Exception, Version 1.0](https://oss.oracle.com/licenses/universal-foss-exception/) to it, which seems to limit the effects of GPL. More information on the FOSS Exception are available at [https://www.mysql.com/de/about/legal/licensing/foss-exception/](https://www.mysql.com/de/about/legal/licensing/foss-exception/).

* Good, because it stems from the same development team than MySQL
* Bad, because the "Universal FOSS Exception" makes licensing more complicated.
`,
  `---
parent: Decision Records
nav_order: 9
---
# Use Plain JUnit5 for advanced test assertions

## Context and Problem Statement

How to write readable test assertions?
How to write readable test assertions for advanced tests?

## Considered Options

* Plain JUnit5
* Hamcrest
* AssertJ

## Decision Outcome

Chosen option: "Plain JUnit5", because comes out best \(see below\).

### Positive Consequences

* Tests are more readable
* More easy to write tests
* More readable assertions

### Negative Consequences

* More complicated testing leads to more complicated assertions

## Pros and Cons of the Options

### Plain JUnit5

Homepage: <https://junit.org/junit5/docs/current/user-guide/>
JabRef testing guidelines: <https://devdocs.jabref.org/getting-into-the-code/code-howtos#test-cases>

Example:

\`\`\`java
String actual = markdownFormatter.format(source);
assertTrue(actual.contains("Markup<br />"));
assertTrue(actual.contains("<li>list item one</li>"));
assertTrue(actual.contains("<li>list item 2</li>"));
assertTrue(actual.contains("> rest"));
assertFalse(actual.contains("\n"));
\`\`\`

* Good, because Junit5 is "common Java knowledge"
* Bad, because complex assertions tend to get hard to read
* Bad, because no fluent API

### Hamcrest

Homepage: <https://github.com/hamcrest/JavaHamcrest>

* Good, because offers advanced matchers (such as \`contains\`)
* Bad, because not full fluent API
* Bad, because entry barrier is increased

### AssertJ

Homepage: <https://joel-costigliola.github.io/assertj/>

Example:

\`\`\`java
assertThat(markdownFormatter.format(source))
        .contains("Markup<br />")
        .contains("<li>list item one</li>")
        .contains("<li>list item 2</li>")
        .contains("> rest")
        .doesNotContain("\n");
\`\`\`

* Good, because offers fluent assertions
* Good, because allows partial string testing to focus on important parts
* Good, because assertions are more readable
* Bad, because not commonly used
* Bad, because newcomers have to learn an additional language to express test cases
* Bad, because entry barrier is increased
* Bad, because expressions of test cases vary from unit test to unit test

## Links

* German comparison between Hamcrest and AssertJ: <https://www.sigs-datacom.de/uploads/tx_dmjournals/philipp_JS_06_15_gRfN.pdf>`,
  `---
parent: Decision Records
nav_order: 0
---
# Use Markdown Any Decision Records

## Context and Problem Statement

We want to record any decisions made in this project independent whether decisions concern the architecture ("architectural decision record"), the code, or other fields.
Which format and structure should these records follow?

## Considered Options

* [Michael Nygard's template](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) – The first incarnation of the term "ADR"
* [Sustainable Architectural Decisions](https://www.infoq.com/articles/sustainable-architectural-design-decisions) – The Y-Statements
* Other templates listed at <https://github.com/joelparkerhenderson/architecture_decision_record>
* Formless – No conventions for file format and structure

## Decision Outcome

Chosen option: "MADR", because

* Implicit assumptions should be made explicit.
  Design documentation is important to enable people understanding the decisions later on.
  See also [A rational design process: How and why to fake it](https://doi.org/10.1109/TSE.1986.6312940).
* MADR allows for structured capturing of any decision.
* The MADR format is lean and fits our development style.
* The MADR structure is comprehensible and facilitates usage & maintenance.
* The MADR project is vivid.`,
  `---
parent: Decision Records
nav_order: 18
---
# Use regular expression to split multiple-sentence titles

## Context and Problem Statement

Some entry titles are composed of multiple sentences, for example: "Whose Music? A Sociology of Musical Language", therefore, it is necessary to first split the title into sentences and process them individually to ensure proper formatting using '[Sentence Case](https://en.wiktionary.org/wiki/sentence_case)' or '[Title Case](https://en.wiktionary.org/wiki/title_case#English)'

## Considered Options

* [Regular expression](https://docs.oracle.com/javase/tutorial/essential/regex/)
* [OpenNLP](https://opennlp.apache.org/)
* [ICU4J](https://web.archive.org/web/20210413013221/http://site.icu-project.org/home)

## Decision Outcome

Chosen option: "Regular expression", because we can use Java internal classes (Pattern, Matcher) instead of adding additional dependencies

### Positive Consequences

* Less dependencies on third party libraries
* Smaller project size (ICU4J is very large)
* No need for model data (OpenNLP is a machine learning based toolkit and needs a trained model to work properly)

### Negative Consequences

* Regular expressions can never cover every case, therefore, splitting may not be accurate for every title`
];
