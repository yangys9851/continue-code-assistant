import { FromIdeProtocol } from "..";
import { GetGhTokenArgs, ToIdeFromWebviewOrCoreProtocol } from "../ide";

import type {
  ContinueRcJson,
  FileStatsMap,
  FileType,
  IDE,
  IdeInfo,
  IdeSettings,
  IndexTag,
  Location,
  Problem,
  Range,
  RangeInFile,
  TerminalOptions,
  Thread,
} from "../..";

// Cross-platform utility function to run sync commands
function runSyncCommand(command: string, options?: { cwd?: string; encoding?: BufferEncoding }): string {
  // Check if we're in a Node.js environment
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

  if (!isNode) {
    // Browser or unsupported environment
    console.warn(`Attempted to run sync command in non-Node environment: ${command}`);
    return '';
  }

  // Dynamically import child_process only in Node.js environment
  try {
    const { execSync } = require('child_process');
    return execSync(command, {
      encoding: 'utf-8',
      ...(options || {})
    }).trim();
  } catch (error) {
    console.error(`Error running command: ${command}`, error);
    return '';
  }
}

type Platform = "mac" | "linux" | "windows" | "unknown";

export class MessageIde implements IDE {
  constructor(
    private readonly request: <T extends keyof ToIdeFromWebviewOrCoreProtocol>(
      messageType: T,
      data: ToIdeFromWebviewOrCoreProtocol[T][0],
    ) => Promise<ToIdeFromWebviewOrCoreProtocol[T][1]>,
    private readonly on: <T extends keyof FromIdeProtocol>(
      messageType: T,
      callback: (data: FromIdeProtocol[T][0]) => FromIdeProtocol[T][1],
    ) => void,
  ) {}

  async readSecrets(keys: string[]): Promise<Record<string, string>> {
    return this.request("readSecrets", { keys });
  }

  async writeSecrets(secrets: { [key: string]: string }): Promise<void> {
    return this.request("writeSecrets", { secrets });
  }

  fileExists(fileUri: string): Promise<boolean> {
    return this.request("fileExists", { filepath: fileUri });
  }
  async gotoDefinition(location: Location): Promise<RangeInFile[]> {
    return this.request("gotoDefinition", { location });
  }
  onDidChangeActiveTextEditor(callback: (fileUri: string) => void): void {
    this.on("didChangeActiveTextEditor", (data) => callback(data.filepath));
  }

  getIdeSettings(): Promise<IdeSettings> {
    return this.request("getIdeSettings", undefined);
  }
  getGitHubAuthToken(args: GetGhTokenArgs): Promise<string | undefined> {
    return this.request("getGitHubAuthToken", args);
  }
  getFileStats(files: string[]): Promise<FileStatsMap> {
    return this.request("getFileStats", { files });
  }
  getGitRootPath(dir: string): Promise<string | undefined> {
    return this.request("getGitRootPath", { dir });
  }
  listDir(dir: string): Promise<[string, FileType][]> {
    return this.request("listDir", { dir });
  }

  showToast: IDE["showToast"] = (...params) => {
    return this.request("showToast", params);
  };

  getRepoName(dir: string): Promise<string | undefined> {
    return this.request("getRepoName", { dir });
  }

  getDebugLocals(threadIndex: number): Promise<string> {
    return this.request("getDebugLocals", { threadIndex });
  }

  getTopLevelCallStackSources(
    threadIndex: number,
    stackDepth: number,
  ): Promise<string[]> {
    return this.request("getTopLevelCallStackSources", {
      threadIndex,
      stackDepth,
    });
  }

  getAvailableThreads(): Promise<Thread[]> {
    return this.request("getAvailableThreads", undefined);
  }

  getTags(artifactId: string): Promise<IndexTag[]> {
    return this.request("getTags", artifactId);
  }

  getIdeInfo(): Promise<IdeInfo> {
    return this.request("getIdeInfo", undefined);
  }

  readRangeInFile(filepath: string, range: Range): Promise<string> {
    return this.request("readRangeInFile", { filepath, range });
  }

  isTelemetryEnabled(): Promise<boolean> {
    return this.request("isTelemetryEnabled", undefined);
  }

  getUniqueId(): Promise<string> {
    return this.request("getUniqueId", undefined);
  }

  getWorkspaceConfigs(): Promise<ContinueRcJson[]> {
    return this.request("getWorkspaceConfigs", undefined);
  }

  async getDiff(includeUnstaged: boolean) {
    return await this.request("getDiff", { includeUnstaged });
  }

  async getClipboardContent(): Promise<{ text: string; copiedAt: string }> {
    return {
      text: "",
      copiedAt: new Date().toISOString(),
    };
  }

  async getTerminalContents() {
    return await this.request("getTerminalContents", undefined);
  }

  async getWorkspaceDirs(): Promise<string[]> {
    return await this.request("getWorkspaceDirs", undefined);
  }

  async showLines(
    fileUri: string,
    startLine: number,
    endLine: number,
  ): Promise<void> {
    return await this.request("showLines", {
      filepath: fileUri,
      startLine,
      endLine,
    });
  }

  async writeFile(fileUri: string, contents: string): Promise<void> {
    await this.request("writeFile", { path: fileUri, contents });
  }

  async showVirtualFile(title: string, contents: string): Promise<void> {
    await this.request("showVirtualFile", { name: title, content: contents });
  }

  async openFile(fileUri: string): Promise<void> {
    await this.request("openFile", { path: fileUri });
  }

  async openUrl(url: string): Promise<void> {
    await this.request("openUrl", url);
  }

  async runCommand(command: string, options?: TerminalOptions): Promise<void> {
    await this.request("runCommand", { command, options });
  }

  async saveFile(fileUri: string): Promise<void> {
    await this.request("saveFile", { filepath: fileUri });
  }
  async readFile(fileUri: string): Promise<string> {
    return await this.request("readFile", { filepath: fileUri });
  }

  getOpenFiles(): Promise<string[]> {
    return this.request("getOpenFiles", undefined);
  }

  getCurrentFile() {
    return this.request("getCurrentFile", undefined);
  }

  getPinnedFiles(): Promise<string[]> {
    return this.request("getPinnedFiles", undefined);
  }

  getSearchResults(query: string): Promise<string> {
    return this.request("getSearchResults", { query });
  }

  getProblems(fileUri: string): Promise<Problem[]> {
    return this.request("getProblems", { filepath: fileUri });
  }

  subprocess(command: string, cwd?: string): Promise<[string, string]> {
    return this.request("subprocess", { command, cwd });
  }

  async getBranch(dir: string): Promise<string> {
    return this.request("getBranch", { dir });
  }
  getGitUsername(): Promise<string | undefined> {
    try {
      // Map NodeJS platform to our custom Platform type
      const platform: Platform =
        process.platform === 'win32' ? 'windows' :
          process.platform === 'darwin' ? 'mac' :
            process.platform === 'linux' ? 'linux' : 'linux';

      // Try to get global Git username
      const username = runSyncCommand('git config --global user.name', { encoding: 'utf-8' }).trim();

      console.log('Git Username:', username);
      return Promise.resolve(username || undefined);
    } catch (globalError) {
      try {
        // If global config fails, try local repository config
        const platform: Platform =
          process.platform === 'win32' ? 'windows' :
            process.platform === 'darwin' ? 'mac' :
              process.platform === 'linux' ? 'linux' : 'linux';

        const localUsername = runSyncCommand('git config user.name', { encoding: 'utf-8' }).trim();

        console.log('Local Git Username:', localUsername);
        return Promise.resolve(localUsername || undefined);
      } catch (localError) {
        console.error('Failed to get Git username:', localError);
        return Promise.resolve(undefined);
      }
    }
  }

  getPlatform(): Promise<Platform> {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('win')) return Promise.resolve('windows');
      if (userAgent.includes('mac')) return Promise.resolve('mac');
      if (userAgent.includes('linux')) return Promise.resolve('linux');
      return Promise.resolve('unknown');
    }

    // Node.js environment
    try {
      const platform = runSyncCommand('uname').toLowerCase();
      switch (platform) {
        case 'darwin': return Promise.resolve('mac');
        case 'linux': return Promise.resolve('linux');
        default:
          // Fallback for Windows or other platforms
          const os = require('os');
          const platformName = os.platform();
          switch (platformName) {
            case 'win32': return Promise.resolve('windows');
            case 'darwin': return Promise.resolve('mac');
            case 'linux': return Promise.resolve('linux');
            default: return Promise.resolve('unknown');
          }
      }
    } catch (error) {
      console.warn('Could not determine platform:', error);
      return Promise.resolve('unknown');
    }
  }
}
