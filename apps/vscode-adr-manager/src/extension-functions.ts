import * as vscode from "vscode";
import type { AdrInit, Option, Tag } from "@adr-manager/core";
import { setMadrVersionInMd, setRelevantFilesInMd, setTagsInMd } from "@adr-manager/core";

import { ArchitecturalDecisionRecord } from "./plugins/classes";
import { adrTemplatemarkdownContent, initialMarkdownContent, readmeMarkdownContent } from "./plugins/constants";
import { DEFAULT_MADR_VERSION, parseAdr, serializeAdr, type MadrTemplateVersion } from "./plugins/parser";
import { isListableAdrFile, matchesMadrTitleFormat, naturalCase2snakeCase, splitAdrDirectory } from "./plugins/utils";

/**
 * Returns the workspace folders opened in the current VS Code instance.
 * @returns The current workspace folders of the VS Code instance, or an empty WorkspaceFolder array if there is no folder open
 */
export function getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] {
  if (isWorkspaceOpened()) {
    return vscode.workspace.workspaceFolders!;
  }
  return [];
}

/**
 * Returns the string of the ADR Directory specified by the user in the user/workspace settings.
 * Defaults to "docs/decisions" if the extension received an undefined value.
 * @returns The ADR Directory specified by the user
 */
export function getAdrDirectoryString(): string {
  return vscode.workspace.getConfiguration("adrManager").get("adrDirectory") ?? "docs/decisions";
}

/**
 * Returns true iff the user wants the extension to treat single-root workspaces with only subdirectories like multi-root workspaces.
 * Defaults to true if the extension received an undefined value.
 */
export function treatAsMultiRoot(): boolean {
  return vscode.workspace.getConfiguration("adrManager").get("treatSingleRootAsMultiRoot") ?? true;
}

/**
 * Returns the string of the preferred editor mode specified by the user in the user/workspace setting
 * when adding a new ADR. Defaults to "basic" if the extension received an undefined value.
 * @returns The preferred editor mode when adding a new ADR
 */
export function getAddEditorMode(): string {
  return vscode.workspace.getConfiguration("adrManager.editorMode").get("addAdrEditorMode") ?? "basic";
}

/**
 * Returns the string of the preferred editor mode specified by the user in the user/workspace setting
 * when editing an existing ADR. Defaults to "sufficient" if the extension received an undefined value.
 * @returns The preferred editor mode when editing an existing ADR
 */
export function getViewEditorMode(): string {
  return vscode.workspace.getConfiguration("adrManager.editorMode").get("viewAdrEditorMode") ?? "sufficient";
}

/**
 * Returns true iff the user wants the extension to display diagnostics related to MADR in ADR files.
 * Defaults to true if the extension received an undefined value.
 */
export function isDiagnosticsEnabled(): boolean {
  return vscode.workspace.getConfiguration("adrManager").get("showDiagnostics") ?? true;
}

/**
 * Returns either "basic" or "professional" based on the sufficiency of the MADR template
 * when editing an existing ADR specified by the file URI.
 * @param mdString The Markdown string of the ADR to be edited
 */
export async function determineViewEditorMode(mdString: string): Promise<string> {
  const adr = parseAdr(mdString);
  if (isProfessionalAdr(adr)) {
    return "professional";
  } else {
    return "basic";
  }
}

/**
 * Returns true iff the specified ADR object contains at least one non-empty optional field.
 * @param adr The ADR object to check for grade of detail
 * @returns True iff the specified ADR object has any non-empty optional fields
 */
function isProfessionalAdr(adr: ArchitecturalDecisionRecord) {
  return (
    adr.status ||
    adr.deciders ||
    adr.decisionMakers ||
    adr.consulted ||
    adr.informed ||
    adr.date ||
    adr.technicalStory ||
    adr.decisionDrivers.length ||
    adr.consideredOptions.some((option) => {
      return option.description || option.pros.length || option.neutrals.length || option.cons.length;
    }) ||
    adr.decisionOutcome.positiveConsequences.length ||
    adr.decisionOutcome.negativeConsequences.length ||
    adr.consequences.length ||
    adr.confirmation ||
    adr.links.length ||
    adr.relevantFiles.length ||
    adr.moreInformation
  );
}

/**
 * Returns the root folder path an ADR belongs to by stripping the `<adrDirectory>/<fileName>`
 * suffix off its full path, or undefined if the path does not end in the ADR Directory.
 * Pure string logic so it can be tested without the vscode module.
 * @param adrFullPath The full (posix) path of the ADR file
 * @param adrDirectory The configured ADR Directory, e.g. "docs/decisions"
 */
export function getRootPathFromAdrPath(adrFullPath: string, adrDirectory: string): string | undefined {
  const segments = splitAdrDirectory(adrDirectory);
  if (segments.length === 0) {
    // ADR Directory is the root folder itself: the ADR sits directly in its root folder.
    const lastSlash = adrFullPath.lastIndexOf("/");
    return lastSlash === -1 ? undefined : adrFullPath.slice(0, lastSlash);
  }
  const marker = `/${segments.join("/")}/`;
  const markerIndex = adrFullPath.lastIndexOf(marker);
  if (markerIndex === -1) {
    return undefined;
  }
  const fileName = adrFullPath.slice(markerIndex + marker.length);
  if (fileName === "" || fileName.includes("/")) {
    return undefined;
  }
  return adrFullPath.slice(0, markerIndex);
}

/**
 * Returns the URI of the root folder the specified ADR belongs to (the folder containing its
 * ADR Directory), which is what its relevant-file paths are relative to. Falls back to the
 * workspace folder containing the file, and returns undefined for an unsaved ADR (empty path).
 * @param adrFullPath The full path of the ADR file, or "" while adding a new ADR
 */
export function getAdrRootUri(adrFullPath: string): vscode.Uri | undefined {
  if (!adrFullPath) {
    return undefined;
  }
  const rootPath = getRootPathFromAdrPath(adrFullPath, getAdrDirectoryString());
  if (rootPath) {
    return vscode.Uri.file(rootPath);
  }
  return vscode.workspace.getWorkspaceFolder(vscode.Uri.file(adrFullPath))?.uri;
}

/**
 * Returns the root folders a relevant-file path may be relative to. For a saved ADR this is
 * its own root folder. For an unsaved ADR (add mode) the destination root is not known yet,
 * so every workspace folder (and every child root folder when a single-root workspace is
 * treated as multi-root) is considered.
 */
async function getRelevantFileRoots(adrFullPath: string): Promise<vscode.Uri[]> {
  const rootUri = getAdrRootUri(adrFullPath);
  if (rootUri) {
    return [rootUri];
  }
  const roots: vscode.Uri[] = [];
  for (const folder of getWorkspaceFolders()) {
    roots.push(folder.uri);
  }
  if (isSingleRootWorkspace() && treatAsMultiRoot() && (await containsOnlyRootFolders(getWorkspaceFolders()[0].uri))) {
    roots.push(...(await getAllChildRootFolders(getWorkspaceFolders()[0].uri)));
  }
  return roots;
}

/**
 * Lists workspace files a user may link to an ADR, as paths relative to the ADR's root folder.
 * node_modules is excluded (findFiles ignores no .gitignore) and the result is capped, so very
 * large workspaces stay responsive.
 * @param adrFullPath The full path of the ADR file, or "" while adding a new ADR
 * @returns Sorted root-relative (posix) file paths, without the ADR file itself
 */
export async function listRelevantFileCandidates(adrFullPath: string): Promise<string[]> {
  const exclude = "**/node_modules/**";
  const maxResults = 20000;
  const rootUri = getAdrRootUri(adrFullPath);
  if (rootUri) {
    const uris = await vscode.workspace.findFiles(new vscode.RelativePattern(rootUri, "**/*"), exclude, maxResults);
    const rootPrefix = rootUri.path.endsWith("/") ? rootUri.path : `${rootUri.path}/`;
    return uris
      .map((uri) => uri.path)
      .filter((path) => path.startsWith(rootPrefix) && path !== adrFullPath)
      .map((path) => path.slice(rootPrefix.length))
      .sort();
  }
  const uris = await vscode.workspace.findFiles("**/*", exclude, maxResults);
  return uris
    .filter((uri) => uri.path !== adrFullPath)
    .map((uri) => vscode.workspace.asRelativePath(uri, false))
    .sort();
}

/**
 * Checks which of the given relevant-file paths still exist, resolved against the ADR's root.
 * @param paths Root-relative file paths linked in the ADR
 * @param adrFullPath The full path of the ADR file, or "" while adding a new ADR
 */
export async function checkRelevantFilesExistence(
  paths: string[],
  adrFullPath: string
): Promise<Record<string, boolean>> {
  const roots = await getRelevantFileRoots(adrFullPath);
  const status: Record<string, boolean> = {};
  await Promise.all(
    paths.map(async (path) => {
      status[path] = (await findRelevantFileUri(roots, path)) !== undefined;
    })
  );
  return status;
}

/**
 * Opens the given relevant file in a text editor, or shows an error message if it no longer exists.
 * @param path The root-relative path of the linked file
 * @param adrFullPath The full path of the ADR file the link belongs to
 */
export async function openRelevantFile(path: string, adrFullPath: string): Promise<void> {
  const roots = await getRelevantFileRoots(adrFullPath);
  const fileUri = await findRelevantFileUri(roots, path);
  if (fileUri) {
    vscode.window.showTextDocument(await vscode.workspace.openTextDocument(fileUri));
  } else {
    vscode.window.showErrorMessage(`Linked file not found: ${path}`);
  }
}

async function findRelevantFileUri(roots: vscode.Uri[], relativePath: string): Promise<vscode.Uri | undefined> {
  for (const root of roots) {
    const fileUri = vscode.Uri.joinPath(root, relativePath);
    try {
      await vscode.workspace.fs.stat(fileUri);
      return fileUri;
    } catch {
      // not under this root, keep trying the remaining ones
    }
  }
  return undefined;
}

/**
 * Returns true iff there is a folder opened in the current workspace of the VS Code instance.
 * @returns True iff a folder is opened in the current workspace of the VS Code instance
 */
export function isWorkspaceOpened(): boolean {
  return vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0;
}

/**
 * Returns true iff the current workspace is a single-root workspace, i.e. iff there is exactly one root folder opened in the current workspace.
 * @returns True iff there is exactly one root folder opened in the current workspace
 */
export function isSingleRootWorkspace(): boolean {
  return isWorkspaceOpened() && getWorkspaceFolders().length === 1;
}

/**
 * Returns true iff the specified folder only contains other folders, implying that the specified folder is
 * the root folder for many other root folders which may have ADR directories.
 * @param folderUri The URI of a folder
 * @returns True iff the folder only contains other folders, indicating that the specified folder is
 *			the root folder of multiple root folders
 */
export async function containsOnlyRootFolders(folderUri: vscode.Uri): Promise<boolean> {
  const directory = await vscode.workspace.fs.readDirectory(folderUri);
  let folderCount = 0;
  for (const [name, type] of directory) {
    if (type === vscode.FileType.Directory) {
      folderCount++;
    } else if (name !== ".DS_Store") {
      // skip ".DS_Store" files which may cause problems with macOS users
      return false;
    }
  }
  return folderCount > 0;
}

/**
 * Returns an array of URIs of all the child root folders of the specified folder.
 * If the specified folder is not a folder of root folders (i.e. it has files other than folders inside of it),
 * then this returns an empty array.
 * @param rootFolderUri The URI of the highest-level root folder (containing all other child root folders)
 * @returns An array of URIs of all the child root folders within the highest-level root folder, or
 * 			an empty array if the specified folder does not only have other folders inside of it
 */
export async function getAllChildRootFolders(rootFolderUri: vscode.Uri): Promise<vscode.Uri[]> {
  const childRootFolderUris: vscode.Uri[] = [];
  if (await containsOnlyRootFolders(rootFolderUri)) {
    const rootFolderDirectory = await vscode.workspace.fs.readDirectory(rootFolderUri);
    for (const [name, type] of rootFolderDirectory) {
      if (type === vscode.FileType.Directory) {
        childRootFolderUris.push(vscode.Uri.joinPath(rootFolderUri, name));
      }
    }
  }
  return childRootFolderUris;
}

/**
 * Returns an array of strings of all the child root folder names of the specified folder.
 * If the specified folder is not a folder of root folders (i.e. it has files other than folders inside of it),
 * then this returns an empty array.
 * @param rootFolderUri The URI of the highest-level root folder (containing all other child root folders)
 * @returns An array of strings of all the child root folder names within the highest-level root folder, or
 * 			an empty array if the specified folder does not only have other folders inside of it
 */
export async function getAllChildRootFoldersAsStrings(rootFolderUri: vscode.Uri): Promise<string[]> {
  const childRootFolderStrings: string[] = [];
  if (await containsOnlyRootFolders(rootFolderUri)) {
    const rootFolderDirectory = await vscode.workspace.fs.readDirectory(rootFolderUri);
    for (const [name, type] of rootFolderDirectory) {
      if (type === vscode.FileType.Directory) {
        childRootFolderStrings.push(name);
      }
    }
  }
  return childRootFolderStrings;
}

/**
 * Initializes the ADR Directory in the specified root folder.
 * Initialization includes the creation of the ADR Directory, along with filling the directory with boilerplate Markdown files.
 * @param rootFolderUri The URI of the root folder where the ADR Directory should be initialized
 */
export async function initializeAdrDirectory(rootFolderUri: vscode.Uri) {
  if (!(await adrDirectoryExists(rootFolderUri))) {
    const adrFolderUri = vscode.Uri.joinPath(rootFolderUri, getAdrDirectoryString());
    await vscode.workspace.fs.createDirectory(adrFolderUri);
    await fillAdrDirectory(adrFolderUri);
    vscode.window.showInformationMessage("ADR Directory initialized.");
  } else {
    const selection = await vscode.window.showInformationMessage(
      "The ADR Directory already exists. Do you want to fill the directory with boilerplate Markdown files?",
      "Yes",
      "Cancel"
    );
    if (selection === "Yes") {
      const adrFolderUri = vscode.Uri.joinPath(rootFolderUri, getAdrDirectoryString());
      await fillAdrDirectory(adrFolderUri);
      vscode.window.showInformationMessage("ADR Directory initialized.");
    }
  }
}

/**
 * Returns true iff there exists the ADR Directory in the given workspace folder in the current VS Code instance (default: docs/decisions).
 * @param folderUri The URI to the directory in the current workspace
 * @returns True iff there exists the ADR Directory in the given workspace folder in the current VS Code instance
 *
 */
export async function adrDirectoryExists(folderUri: vscode.Uri) {
  if (isWorkspaceOpened()) {
    const subDirectories = splitAdrDirectory(getAdrDirectoryString());
    if (subDirectories.length === 0) {
      return true; // ADR Directory is the root folder itself, which always exists
    }
    let currentUri = folderUri;
    let currentDirectoryFound = true;

    for (let i = 0; i < subDirectories.length; i++) {
      if (currentDirectoryFound) {
        currentDirectoryFound = false;
        const currentDirectory = await vscode.workspace.fs.readDirectory(currentUri);
        for (const [name, type] of currentDirectory) {
          if (type === vscode.FileType.Directory && name === subDirectories[i]) {
            currentDirectoryFound = true;
            if (i === subDirectories.length - 1) {
              return true; // last subdirectory found
            } else {
              break; // check next subdirectory
            }
          }
        }
        currentUri = vscode.Uri.joinPath(currentUri, subDirectories[i]);
      } else {
        return false;
      }
    }
  }

  return false;
}

/**
 * Creates an ADR Directory inside of the specified root folder, if it does not already have an ADR Directory.
 * @param folderUri The root folder URI where the ADR Directory will be created
 */
async function createAdrDirectory(folderUri: vscode.Uri) {
  if (await adrDirectoryExists(folderUri)) {
    return;
  }

  const adrDirectoryUri = vscode.Uri.joinPath(folderUri, getAdrDirectoryString());
  await vscode.workspace.fs.createDirectory(adrDirectoryUri);
}

/**
 * Fills the specified directory with README, an ADR template and a sample ADR.
 * @param folderUri The URI of the directory to be filled
 */
export async function fillAdrDirectory(folderUri: vscode.Uri) {
  await createMarkdownFile(folderUri, "0000-use-markdown-architectural-decision-records.md", initialMarkdownContent);
  await createMarkdownFile(folderUri, "README.md", readmeMarkdownContent);
  await createMarkdownFile(folderUri, "adr-template.md", adrTemplatemarkdownContent);
}

/**
 * Creates a Markdown file in the specified URI with the specified name and content.
 * @param folderUri The URI of the folder in which the Markdown file should be created
 * @param name The name of the Markdown file
 * @param content The content of the Markdown file
 */
export async function createMarkdownFile(folderUri: vscode.Uri, name: string, content: string) {
  await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(folderUri, name), new TextEncoder().encode(content));
}

/**
 * Returns an array of the folder names that are open in the current workspace.
 * @returns A string array of all folder names currently opened in the workspace
 */
export function getWorkspaceFolderNames(): string[] {
  const names: string[] = [];
  if (isWorkspaceOpened()) {
    getWorkspaceFolders().forEach((folder) => {
      names.push(folder.name);
    });
  }
  return names;
}

/**
 * Returns an array of potential MADRs in the form of Markdown strings that are located in the root folders of the current workspace.
 * @returns A Promise which resolves in a string array of all potential MADR strings in the whole workspace
 */
export async function getAllMDs(): Promise<
  { adr: string; fullPath: string; relativePath: string; fileName: string }[]
> {
  let mds: { adr: string; fullPath: string; relativePath: string; fileName: string }[] = [];
  if (isWorkspaceOpened()) {
    const workspaceFolders = getWorkspaceFolders();
    if (isSingleRootWorkspace() && treatAsMultiRoot() && (await containsOnlyRootFolders(workspaceFolders[0].uri))) {
      const childRootFolderUris = await getAllChildRootFolders(workspaceFolders[0].uri);
      for (let i = 0; i < childRootFolderUris.length; i++) {
        if (await adrDirectoryExists(childRootFolderUris[i])) {
          mds = [
            ...mds,
            ...(await getMDsFromFolder(vscode.Uri.joinPath(childRootFolderUris[i], getAdrDirectoryString())))
          ];
        }
      }
    } else {
      for (let i = 0; i < workspaceFolders.length; i++) {
        if (await adrDirectoryExists(workspaceFolders[i].uri)) {
          mds = [
            ...mds,
            ...(await getMDsFromFolder(vscode.Uri.joinPath(workspaceFolders[i].uri, getAdrDirectoryString())))
          ];
        }
      }
    }
  }
  return mds;
}

/**
 * Returns the listable Markdown files located directly in the specified folder (see
 * {@link isListableAdrFile}). Conforming files become ADRs; the rest are convertible candidates.
 * @param folderUri The URI of the directory to be scanned
 */
export async function getMDsFromFolder(
  folderUri: vscode.Uri
): Promise<{ adr: string; fullPath: string; relativePath: string; fileName: string }[]> {
  const adrs: { adr: string; fullPath: string; relativePath: string; fileName: string }[] = [];
  const directory = await vscode.workspace.fs.readDirectory(folderUri);
  for (const [name, type] of directory) {
    if (type === vscode.FileType.File && isListableAdrFile(name)) {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folderUri, name));
      adrs.push({
        adr: new TextDecoder().decode(content),
        fullPath: vscode.Uri.joinPath(folderUri, name).path,
        relativePath: getAdrPathRelativeFromRootFolder(vscode.Uri.joinPath(folderUri, name)),
        fileName: name
      });
    }
  }
  return adrs;
}

/**
 * Creates a new ArchitecturalDecision object with the minimum required fields (basic ADR) and
 * saves the ADR as a Markdown file in the ADR Directory.
 * @param fields The fields of the new short ADR
 */
export function createBasicAdr(fields: {
  yaml: string;
  title: string;
  contextAndProblemStatement: string;
  consideredOptions: ReadonlyArray<Partial<Option>>;
  chosenOption: string;
  explanation: string;
  relevantFiles?: string[];
  templateVersion?: MadrTemplateVersion;
  tags?: Tag[];
}) {
  const newAdr = getAdrObjectFromFields({
    yaml: fields.yaml,
    title: fields.title,
    contextAndProblemStatement: fields.contextAndProblemStatement,
    consideredOptions: fields.consideredOptions,
    decisionOutcome: {
      chosenOption: fields.chosenOption,
      explanation: fields.explanation
    }
  });

  const version = fields.templateVersion ?? DEFAULT_MADR_VERSION;
  const newMD = setAdrMetadataInMd(serializeAdr(newAdr, version), version, {
    relevantFiles: fields.relevantFiles,
    tags: fields.tags
  });
  saveMarkdownToAdrDirectory(newMD, newAdr.title);
}

/**
 * Creates a new ArchitecturalDecision object with all fields the user has filled out using the professional template and
 * saves the ADR as a Markdown file in the ADR Directory.
 * @param fields The fields of the new ADR
 */
export function createProfessionalAdr(fields: AdrInit & { templateVersion?: MadrTemplateVersion; tags?: Tag[] }) {
  const newAdr = getAdrObjectFromFields(fields);

  const version = fields.templateVersion ?? DEFAULT_MADR_VERSION;
  const newMD = setAdrMetadataInMd(serializeAdr(newAdr, version), version, {
    relevantFiles: newAdr.relevantFiles,
    tags: fields.tags
  });
  saveMarkdownToAdrDirectory(newMD, newAdr.title);
}

/**
 * Saves any changes made to an ADR in the corresponding file, overwriting existing data.
 * The file is rewritten in the requested template version, which is how switching the
 * version selector in the editor converts an existing document.
 * @param fields The fields of the edited ADR
 */
export async function saveAdr(
  fields: AdrInit & { fullPath: string; templateVersion?: MadrTemplateVersion; tags?: Tag[]; assignNumber?: boolean }
): Promise<vscode.Uri> {
  const fileUri = vscode.Uri.file(fields.fullPath);
  const adr = parseAdr(new TextDecoder().decode(await vscode.workspace.fs.readFile(fileUri)));
  adr.update({
    yaml: fields.yaml,
    title: fields.title,
    date: fields.date,
    status: fields.status,
    deciders: fields.deciders,
    technicalStory: fields.technicalStory,
    contextAndProblemStatement: fields.contextAndProblemStatement,
    decisionDrivers: fields.decisionDrivers,
    consideredOptions: fields.consideredOptions,
    decisionOutcome: fields.decisionOutcome ? { ...adr.decisionOutcome, ...fields.decisionOutcome } : undefined,
    links: fields.links,
    relevantFiles: fields.relevantFiles,
    decisionMakers: fields.decisionMakers,
    consulted: fields.consulted,
    informed: fields.informed,
    confirmation: fields.confirmation,
    consequences: fields.consequences,
    moreInformation: fields.moreInformation
  });
  const newUri = await getSaveUri(fileUri, adr.title, fields.assignNumber ?? false);
  await vscode.workspace.fs.rename(fileUri, newUri);
  const version = fields.templateVersion ?? DEFAULT_MADR_VERSION;
  const newMD = setAdrMetadataInMd(serializeAdr(adr, version), version, {
    relevantFiles: adr.relevantFiles,
    tags: fields.tags
  });
  await vscode.workspace.fs.writeFile(newUri, new TextEncoder().encode(newMD));
  return newUri;
}

function setAdrMetadataInMd(
  md: string,
  version: MadrTemplateVersion,
  fields: { relevantFiles?: string[]; tags?: Tag[] }
): string {
  const withRelevantFiles = setRelevantFilesInMd(md, fields.relevantFiles ?? []);
  const withTags = fields.tags ? setTagsInMd(withRelevantFiles, fields.tags) : withRelevantFiles;
  // A basic ADR is indistinguishable between versions, so pin the chosen one (read back on load).
  return setMadrVersionInMd(withTags, version);
}

/**
 * Returns a new ADR object with the specified fields, cleaned up the way the
 * extension expects (empty list entries dropped).
 * @param fields The fields of the ADR object
 * @returns A new ADR object with the specified fields
 */
export function getAdrObjectFromFields(fields: AdrInit): ArchitecturalDecisionRecord {
  const newAdr = new ArchitecturalDecisionRecord(fields);
  newAdr.cleanUp({ aggressive: true });
  return newAdr;
}

/**
 * Returns the file name an ADR should have once its title changes. A leading MADR number prefix
 * (NNNN- or NNNN_) is preserved; a file without one (an unnumbered ADR, or a Markdown file being
 * converted) has its whole base name replaced. Pure string logic so the rename is unit-testable.
 */
export function renameAdrFileName(fileName: string, newTitle: string): string {
  const numberPrefix = fileName.match(/^\d{4}[-_]/)?.[0] ?? "";
  return `${numberPrefix}${naturalCase2snakeCase(newTitle)}.md`;
}

/**
 * Returns the file name an ADR should be saved under. Like {@link renameAdrFileName}, except an
 * unnumbered file is given `assignedNumber` (used when converting a Markdown file into an ADR so it
 * becomes referenceable). A file that already carries a number keeps it. Pure string logic.
 */
export function adrFileNameForSave(fileName: string, title: string, assignedNumber: number | undefined): string {
  if (assignedNumber !== undefined && !/^\d{4}[-_]/.test(fileName)) {
    return `${String(assignedNumber).padStart(4, "0")}-${naturalCase2snakeCase(title)}.md`;
  }
  return renameAdrFileName(fileName, title);
}

/**
 * Returns the URI an ADR should be saved to (see {@link adrFileNameForSave}). A converted file
 * (assignNumber) with no MADR number prefix is given the next free number in its folder, promoting
 * it to a referenceable ADR; a title change to an already-named file just rewrites the title slug.
 */
async function getSaveUri(fileUri: vscode.Uri, title: string, assignNumber: boolean): Promise<vscode.Uri> {
  const lastSlash = fileUri.path.lastIndexOf("/");
  const directory = fileUri.path.substring(0, lastSlash + 1);
  const assignedNumber = assignNumber ? (await getHighestAdrNumberInFolder(vscode.Uri.file(directory))) + 1 : undefined;
  return vscode.Uri.file(directory + adrFileNameForSave(fileUri.path.substring(lastSlash + 1), title, assignedNumber));
}

/**
 * Saves the specified Markdown string in the ADR Directory specified by the user
 * @param md The content of the Markdown file as a string
 * @param title The title of the ADR
 */
async function saveMarkdownToAdrDirectory(md: string, title: string) {
  if (!isWorkspaceOpened()) {
    vscode.window.showErrorMessage("Please open a workspace folder to initialize ADR Directory");
  } else {
    if (isSingleRootWorkspace()) {
      if (treatAsMultiRoot() && (await containsOnlyRootFolders(getWorkspaceFolders()[0].uri))) {
        const childRootFolder = await vscode.window.showQuickPick(
          getAllChildRootFoldersAsStrings(getWorkspaceFolders()[0].uri),
          { title: "Choose the folder to save the ADR to:" }
        );
        if (childRootFolder) {
          const childRootFolderUri = vscode.Uri.joinPath(getWorkspaceFolders()[0].uri, childRootFolder);
          if (!(await adrDirectoryExists(childRootFolderUri))) {
            await createAdrDirectory(childRootFolderUri);
          }
          const fileName = `${String((await getHighestAdrNumber(childRootFolderUri)) + 1).padStart(
            4,
            "0"
          )}-${naturalCase2snakeCase(title)}.md`;
          const fileUri = vscode.Uri.joinPath(
            getWorkspaceFolders()[0].uri,
            childRootFolder,
            getAdrDirectoryString(),
            fileName
          );
          await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(md));
          // This module has no ExtensionContext, the command route supplies it.
          vscode.commands.executeCommand("vscode-adr-manager.openMainWebView");
          const open = await vscode.window.showInformationMessage(
            "ADR created. Do you want to open the Markdown file?",
            "Yes",
            "Cancel"
          );
          if (open === "Yes") {
            vscode.window.showTextDocument(await vscode.workspace.openTextDocument(fileUri));
          }
        }
      } else {
        // "Real" single-root workspace
        if (!(await adrDirectoryExists(getWorkspaceFolders()[0].uri))) {
          await createAdrDirectory(getWorkspaceFolders()[0].uri);
        }
        const fileName = `${String((await getHighestAdrNumber(getWorkspaceFolders()[0].uri)) + 1).padStart(
          4,
          "0"
        )}-${naturalCase2snakeCase(title)}.md`;
        const fileUri = vscode.Uri.joinPath(getWorkspaceFolders()[0].uri, getAdrDirectoryString(), fileName);
        await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(md));
        const open = await vscode.window.showInformationMessage(
          "ADR created successfully. Do you want to open the Markdown file?",
          "Yes",
          "Cancel"
        );
        if (open === "Yes") {
          vscode.window.showTextDocument(await vscode.workspace.openTextDocument(fileUri));
        }
      }
    } else {
      // Multi-root workspace
      const destinationFolder = await vscode.window.showWorkspaceFolderPick();
      if (destinationFolder) {
        if (!(await adrDirectoryExists(destinationFolder.uri))) {
          await createAdrDirectory(destinationFolder.uri);
        }
        const fileName = `${String((await getHighestAdrNumber(destinationFolder.uri)) + 1).padStart(
          4,
          "0"
        )}-${naturalCase2snakeCase(title)}.md`;
        const fileUri = vscode.Uri.joinPath(destinationFolder.uri, getAdrDirectoryString(), fileName);
        await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(md));
        const open = await vscode.window.showInformationMessage(
          "ADR created. Do you want to open the Markdown file?",
          "Yes",
          "Cancel"
        );
        if (open === "Yes") {
          vscode.window.showTextDocument(await vscode.workspace.openTextDocument(fileUri));
        }
      }
    }
  }
}

/**
 * Returns the highest ADR number of the ADR Directory of the specified root folder, or -1 if there are no ADRs.
 */
async function getHighestAdrNumber(folderUri: vscode.Uri): Promise<number> {
  return getHighestAdrNumberInFolder(vscode.Uri.joinPath(folderUri, getAdrDirectoryString()));
}

/**
 * Returns the highest ADR number among the numbered ADRs directly in the given folder, or -1 if
 * there are none. Unlike {@link getHighestAdrNumber} the folder is the ADR Directory itself.
 */
async function getHighestAdrNumberInFolder(adrFolderUri: vscode.Uri): Promise<number> {
  const allAdrs = await getMDsFromFolder(adrFolderUri);
  const titleNumbers = allAdrs
    .filter((md) => matchesMadrTitleFormat(md.fileName))
    .map((md) => Number.parseInt(md.fileName.substring(0, 4)));
  return titleNumbers.sort((a, b) => a - b)[titleNumbers.length - 1] ?? -1;
}

/**
 * Returns the path of a specified ADR relative to a specified root folder.
 * This function returns a correct path iff the specified ADR is located in the
 * specified root folder or in one of its subdirectories.
 *
 * @param adrUri The URI of the file contained in the rootFolder or in one of its subfolders
 * @returns The path of the file relative to the root folder as a string
 */
function getAdrPathRelativeFromRootFolder(adrUri: vscode.Uri): string {
  const filePath = adrUri.path;
  for (const folder of getWorkspaceFolders()) {
    if (filePath.match(folder.uri.path)) {
      return filePath.replace(folder.uri.path.substring(0, folder.uri.path.lastIndexOf("/") + 1), "");
    }
  }

  return filePath;
}
