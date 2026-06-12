import * as vscode from "vscode";
import { getNonce } from "./plugins/utils";
import {
  checkRelevantFilesExistence,
  containsOnlyRootFolders,
  createBasicAdr,
  createProfessionalAdr,
  getAdrDirectoryString,
  getAdrNumberFromUri,
  getAllChildRootFoldersAsStrings,
  getAllMDs,
  getWorkspaceFolderNames,
  getWorkspaceFolders,
  isSingleRootWorkspace,
  listRelevantFileCandidates,
  openRelevantFile,
  saveAdr,
  treatAsMultiRoot
} from "./extension-functions";
import { ArchitecturalDecisionRecord } from "./plugins/classes";
import { detectMadrVersion, parseAdr } from "./plugins/parser";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldVisibility } from "@adr-manager/core";

export class WebPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: WebPanel | undefined;

  public static readonly viewType = "adrManager";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  // Consumed-on-read replay flag: createOrShow always remounts the page, so a pushed
  // "start tour" message would be lost. The webview pulls it via getTourState instead.
  private _startTourOnNextLoad = false;

  /**
   * Creates or shows a panel that displays a webview with the specified view using a string key.
   * @param context The context of the extension (provides the extension URI and global state)
   * @param page A string key for a specific web view page
   */
  public static createOrShow(context: vscode.ExtensionContext, page: string) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (WebPanel.currentPanel) {
      WebPanel.currentPanel._update(page);
      WebPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(WebPanel.viewType, "ADR Manager", column || vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true
    });

    WebPanel.currentPanel = new WebPanel(panel, context, page);
  }

  /**
   * Makes the next main page load start the tour.
   */
  public queueTourStart() {
    this._startTourOnNextLoad = true;
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, page: string) {
    this._panel = panel;
    this._context = context;
    this._extensionUri = context.extensionUri;

    this._update(page);
    this._panel.iconPath = vscode.Uri.joinPath(this._extensionUri, "assets/logo.png");

    this.watchForWorkspaceChanges();
    this.watchForConfigurationChanges();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (e) => {
        switch (e.command) {
          case "main": {
            vscode.commands.executeCommand("vscode-adr-manager.openMainWebView");
            return;
          }
          case "add": {
            vscode.commands.executeCommand("vscode-adr-manager.openAddAdrWebView");
            this._pushFieldVisibility();
            return;
          }
          case "view": {
            const fileUri = vscode.Uri.file(e.data.fullPath);
            await this.viewAdr(fileUri);
            this.fetchAdrs();
            return;
          }
          case "fetchAdrs": {
            this.fetchAdrs();
            return;
          }
          case "getWorkspaceFolders": {
            this.sendWorkspaceFolders();
            return;
          }
          case "getAdrDirectory": {
            this.sendAdrDirectory();
            return;
          }
          case "getTourState": {
            // Only a main page load consumes the queued replay; editor pages just read the flags.
            const forceStart = this._startTourOnNextLoad && this._panel.title === "ADR Manager";
            if (forceStart) {
              this._startTourOnNextLoad = false;
            }
            this._panel.webview.postMessage({
              command: "getTourState",
              seenMainTour: this._context.globalState.get<boolean>("adrManager.hasSeenMainTour") ?? false,
              seenEditorTour: this._context.globalState.get<boolean>("adrManager.hasSeenEditorTour") ?? false,
              forceStart: forceStart
            });
            return;
          }
          case "setTourSeen": {
            const key = e.data.tour === "editor" ? "adrManager.hasSeenEditorTour" : "adrManager.hasSeenMainTour";
            this._context.globalState.update(key, true);
            return;
          }
          case "requestEdit": {
            const fileUri = vscode.Uri.file(e.data.fullPath);
            vscode.window.showTextDocument(await vscode.workspace.openTextDocument(fileUri));
            return;
          }
          case "requestDelete": {
            const selection = await vscode.window.showWarningMessage(
              `Are you sure you want to delete the ADR "${e.data.title}"?`,
              "Yes",
              "Cancel"
            );
            if (selection === "Yes") {
              await vscode.workspace.fs.delete(vscode.Uri.file(e.data.fullPath), {
                useTrash: true
              });
              vscode.window.showInformationMessage("ADR deleted.");
            }
            return;
          }
          case "addOption": {
            const option = await vscode.window.showInputBox({
              prompt: "Enter a concise name for the option:"
            });
            if (option) {
              this._panel.webview.postMessage({ command: "addOption", option: option });
            }
            return;
          }
          case "requestBasicOptionEdit": {
            const newTitle = await vscode.window.showInputBox({
              prompt: "Enter a concise name for the option:",
              value: e.data.currentTitle
            });
            if (newTitle) {
              this._panel.webview.postMessage({
                command: "requestBasicOptionEdit",
                newTitle: newTitle,
                index: e.data.index
              });
            }
            return;
          }
          case "createBasicAdr": {
            createBasicAdr(JSON.parse(e.data));
            return;
          }
          case "createProfessionalAdr": {
            createProfessionalAdr(JSON.parse(e.data));
            return;
          }
          case "saveAdr": {
            const uri = await saveAdr(JSON.parse(e.data).adr);
            this._panel.webview.postMessage({
              command: "saveSuccessful",
              newPath: uri.path
            });
            const open = await vscode.window.showInformationMessage(
              "ADR saved. Do you want to open the Markdown file?",
              "Yes",
              "No"
            );
            if (open === "Yes") {
              vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
            }
            return;
          }
          case "switchAddViewBasicToProfessional": {
            vscode.commands.executeCommand("vscode-adr-manager.openAddAdrWebView", "add-professional");
            // restore data from before the switch
            this._panel.webview.postMessage({ command: "fetchAdrValues", adr: e.data });
            this._pushFieldVisibility();
            return;
          }
          case "switchAddViewProfessionalToBasic": {
            vscode.commands.executeCommand("vscode-adr-manager.openAddAdrWebView", "add-basic");
            // restore data from before the switch
            this._panel.webview.postMessage({ command: "fetchAdrValues", adr: e.data });
            return;
          }
          case "switchViewingViewBasicToProfessional": {
            // mdString argument not needed since the editor mode is specified
            vscode.commands.executeCommand("vscode-adr-manager.openViewAdrWebView", "", "view-professional");
            // restore data from before the switch
            this._panel.webview.postMessage({ command: "fetchAdrValues", adr: e.data });
            this._pushFieldVisibility();
            return;
          }
          case "switchViewingViewProfessionalToBasic": {
            // mdString argument not needed since the editor mode is specified
            vscode.commands.executeCommand("vscode-adr-manager.openViewAdrWebView", "", "view-basic");
            // restore data from before the switch
            this._panel.webview.postMessage({ command: "fetchAdrValues", adr: e.data });
            return;
          }
          case "updateFileStatus": {
            try {
              await vscode.workspace.fs.readFile(vscode.Uri.file(e.data.fullPath));
            } catch {
              vscode.window.showErrorMessage("The ADR file has changed unexpectedly.");
              vscode.commands.executeCommand("vscode-adr-manager.openMainWebView");
            }
            return;
          }
          case "pickRelevantFiles": {
            const currentFiles: string[] = e.data.currentFiles ?? [];
            const candidates = await listRelevantFileCandidates(e.data.fullPath ?? "");
            const candidateSet = new Set(candidates);
            const items: vscode.QuickPickItem[] = candidates.map((path) => ({
              label: path,
              picked: currentFiles.includes(path)
            }));
            // Dead links are offered preselected so unchecking them removes the link.
            for (const path of [...currentFiles].reverse()) {
              if (!candidateSet.has(path)) {
                items.unshift({ label: path, description: "not found in workspace", picked: true });
              }
            }
            const selection = await vscode.window.showQuickPick(items, {
              canPickMany: true,
              matchOnDescription: true,
              title: "Select relevant files",
              placeHolder: "Files this decision affects"
            });
            if (selection) {
              this._panel.webview.postMessage({
                command: "relevantFilesPicked",
                relevantFiles: selection.map((item) => item.label)
              });
            }
            return;
          }
          case "openRelevantFile": {
            await openRelevantFile(e.data.path, e.data.fullPath ?? "");
            return;
          }
          case "checkRelevantFiles": {
            const status = await checkRelevantFilesExistence(e.data.paths ?? [], e.data.fullPath ?? "");
            this._panel.webview.postMessage({ command: "relevantFilesStatus", status: status });
            return;
          }
          case "getFieldVisibility": {
            const saved = this._context.globalState.get<FieldVisibility>("fieldVisibility", {
              ...DEFAULT_FIELD_VISIBILITY
            });
            this._panel.webview.postMessage({ command: "fieldVisibility", fieldVisibility: saved });
            return;
          }
          case "updateFieldVisibility": {
            await this._context.globalState.update("fieldVisibility", e.data);
            return;
          }
        }
      },
      null,
      this._disposables
    );
  }
  /**
   * Opens the Basic MADR template and fills the fields with existing values of the specified ADR.
   * @param fileUri The URI of the ADR file to be viewed
   */
  async viewAdr(fileUri: vscode.Uri) {
    const mdString = new TextDecoder().decode(await vscode.workspace.fs.readFile(fileUri));

    const templateVersion = detectMadrVersion(mdString);
    const adr = parseAdr(mdString, templateVersion);
    await vscode.commands.executeCommand("vscode-adr-manager.openViewAdrWebView", mdString);

    const adrNumber = await getAdrNumberFromUri(fileUri);
    // "view-basic" or "view-professional" as page argument doesn't matter here
    this._updatePanelTitle("view-basic", adrNumber);

    this._panel.webview.postMessage({
      command: "fetchAdrValues",
      adr: JSON.stringify({
        yaml: adr.yaml,
        title: adr.title,
        date: adr.date,
        status: adr.status,
        deciders: adr.deciders,
        technicalStory: adr.technicalStory,
        contextAndProblemStatement: adr.contextAndProblemStatement,
        decisionDrivers: adr.decisionDrivers,
        consideredOptions: adr.consideredOptions,
        decisionOutcome: adr.decisionOutcome,
        links: adr.links,
        relevantFiles: adr.relevantFiles,
        decisionMakers: adr.decisionMakers,
        consulted: adr.consulted,
        informed: adr.informed,
        consequences: adr.consequences,
        confirmation: adr.confirmation,
        moreInformation: adr.moreInformation,
        templateVersion: templateVersion,
        fullPath: fileUri.path
      })
    });
    this._pushFieldVisibility();
  }

  /**
   * This function is called upon closing the web panel, disposing the web panel in the process.
   */
  public dispose() {
    WebPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  /**
   * Reads the saved field-visibility map from globalState and pushes it to the
   * webview as a "fieldVisibility" message.  Called proactively whenever a
   * professional view loads so the webview never has to wait for a round-trip.
   */
  private _pushFieldVisibility(): void {
    const saved = this._context.globalState.get<FieldVisibility>("fieldVisibility", {
      ...DEFAULT_FIELD_VISIBILITY
    });
    this._panel.webview.postMessage({ command: "fieldVisibility", fieldVisibility: saved });
  }

  /**
   * Renders the specified view in the webview using a string key.
   * @param page A string key for a specific web view page
   */
  private _update(page: string) {
    const webview = this._panel.webview;
    this._updatePanelTitle(page);
    const fieldVisibility = this._context.globalState.get<FieldVisibility>("fieldVisibility", {
      ...DEFAULT_FIELD_VISIBILITY
    });
    this._panel.webview.html = this._getHtmlForWebview(webview, page, fieldVisibility);
  }

  /**
   * Updates the title of the webview panel to match the specified view by using a string key.
   * @param page A string key for a specific web view page
   */
  private _updatePanelTitle(page: string, adrNumber?: string) {
    switch (page) {
      case "main": {
        if (this._panel.title !== "ADR Manager") {
          this._panel.title = "ADR Manager";
        }
        return;
      }
      case "add-basic":
      case "add-professional": {
        if (this._panel.title !== "ADR Manager - Add ADR") {
          this._panel.title = "ADR Manager - Add ADR";
        }
        return;
      }
      case "view-basic":
      case "view-professional": {
        // Mode switches re-render without a number and must not reset the numbered title.
        if (adrNumber) {
          this._panel.title = `ADR Manager - View ADR #${adrNumber}`;
        }
        return;
      }
    }
  }

  /**
   * Returns the HTML content that should be rendered by the specified webview.
   * @param webview The webview that renders the HTML content
   * @param page A string key for a specific web view page
   * @returns The HTML content to be rendered by the webview as a string. Note that Vue mounts the div with the
   * 			ID "app" depending on the specified web view page.
   */
  private _getHtmlForWebview(webview: vscode.Webview, page: string, fieldVisibility: FieldVisibility) {
    const SCRIPT_URI = vscode.Uri.joinPath(this._extensionUri, "dist/web", `${page}.js`);
    const SCRIPT_WEB_URI = webview.asWebviewUri(SCRIPT_URI);

    const STYLE_URI = vscode.Uri.joinPath(this._extensionUri, "dist/web", `${page}.css`);
    const STYLE_WEB_URI = webview.asWebviewUri(STYLE_URI);

    // Codicons web URI. The font is copied into dist/web/codicons by the webview build
    // because the packaged VSIX contains no node_modules.
    const CODICONS_WEB_URI = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist/web/codicons", "codicon.css")
    );

    // Use a NONCE to only allow specific scripts to be run
    const NONCE = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${STYLE_WEB_URI}" rel="stylesheet">
				<link href="${CODICONS_WEB_URI}" rel="stylesheet">

			</head>
			<body>
				<div id="app"></div>
				<script NONCE="${NONCE}">
					const vscode = acquireVsCodeApi();
					window.__INITIAL_FIELD_VISIBILITY__ = ${JSON.stringify(fieldVisibility)};
				</script>
				<script NONCE="${NONCE}" src="${SCRIPT_WEB_URI}"></script>
			</body>
			</html>`;
  }

  /**
   * Sets up watchers to notify the webview to re-fetch ADRs upon changing a Markdown file in the workspace.
   */
  private watchForWorkspaceChanges() {
    this.watchForMarkdownChanges();
    vscode.workspace.onDidChangeWorkspaceFolders(
      async () => {
        this.fetchAdrs();
        this.sendWorkspaceFolders();
      },
      null,
      this._disposables
    );
  }

  /**
   * Sets up a watcher that notifies the specified webview panel to update the ADR list
   * every time a change occurs in the workspace regarding Markdown files.
   */
  private watchForMarkdownChanges() {
    const fileWatcher = vscode.workspace.createFileSystemWatcher(`**/*.md`);
    this._disposables.push(fileWatcher);

    fileWatcher.onDidCreate(
      async () => {
        this.fetchAdrs();
        this.sendWorkspaceFolders();
      },
      null,
      this._disposables
    );
    fileWatcher.onDidChange(
      async () => {
        this.fetchAdrs();
        this.sendWorkspaceFolders();
        if (this._panel.title.startsWith("ADR Manager - View ADR")) {
          this._panel.webview.postMessage({ command: "updateFileStatus" });
        }
      },
      null,
      this._disposables
    );
    fileWatcher.onDidDelete(
      async () => {
        this.fetchAdrs();
        this.sendWorkspaceFolders();
        if (this._panel.title.startsWith("ADR Manager - View ADR")) {
          this._panel.webview.postMessage({ command: "updateFileStatus" });
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Sets up watchers to notify the webview to re-fetch ADRs upon changing configuration settings.
   */
  private watchForConfigurationChanges() {
    vscode.workspace.onDidChangeConfiguration(
      async (e) => {
        if (e.affectsConfiguration("adrManager.adrDirectory")) {
          this.fetchAdrs();
          this.sendWorkspaceFolders();
          this.sendAdrDirectory();
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Sends a message to the webview containing the data of all ADRs detected by this extension.
   */
  private async fetchAdrs() {
    // only refetch ADRs if the main webview is currently open
    if (this._panel.title !== "ADR Manager") {
      return;
    }
    const allAdrs: {
      adr: ArchitecturalDecisionRecord;
      fullPath: string;
      relativePath: string;
      fileName: string;
    }[] = [];
    (await getAllMDs()).forEach((md) => {
      allAdrs.push({
        adr: parseAdr(md.adr),
        fullPath: md.fullPath,
        relativePath: md.relativePath,
        fileName: md.fileName
      });
    });
    this._panel.webview.postMessage({ command: "fetchAdrs", adrs: JSON.stringify(allAdrs) });
  }

  /**
   * Sends the current workspace folder names to the webview.
   */
  private async sendWorkspaceFolders() {
    // only need to update if the main webview is currently showing
    if (this._panel.title !== "ADR Manager") {
      return;
    }
    let workspaceFolders = [] as string[];
    if (
      isSingleRootWorkspace() &&
      treatAsMultiRoot() &&
      (await containsOnlyRootFolders(getWorkspaceFolders()[0].uri))
    ) {
      workspaceFolders = await getAllChildRootFoldersAsStrings(getWorkspaceFolders()[0].uri);
    } else {
      workspaceFolders = getWorkspaceFolderNames();
    }
    this._panel.webview.postMessage({
      command: "getWorkspaceFolders",
      workspaceFolders: JSON.stringify(workspaceFolders)
    });
  }

  /**
   * Send the current name of the ADR Directory to the webview.
   */
  private sendAdrDirectory() {
    // only need to update if the main webview is currently showing
    if (this._panel.title !== "ADR Manager") {
      return;
    }

    this._panel.webview.postMessage({ command: "getAdrDirectory", adrDirectory: getAdrDirectoryString() });
  }
}
