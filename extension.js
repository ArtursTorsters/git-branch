const vscode = require('vscode');
const simpleGit = require('simple-git');

// Store files for each branch
const branchFiles = {};
let lastOpenedBranch = null;

// Activate the extension
const activate = (context) => {
  console.log('Extension activated');

  // Detect branch changes
  const detectBranchChange = async () => {
    try {
      console.log('Detecting branch change...');
      const currentBranch = await getCurrentBranch();
      console.log(`Current branch: ${currentBranch}`);

      const config = vscode.workspace.getConfiguration('git-branch');
      const configCurrentBranch = config.get('currentBranch');
      console.log(`Configured branch: ${configCurrentBranch}`);

      if (currentBranch !== configCurrentBranch) {
        console.log(`Updating configuration with current branch: ${currentBranch}`);
        await config.update('currentBranch', currentBranch, vscode.ConfigurationTarget.Workspace);
      }

      if (lastOpenedBranch !== currentBranch) {
        console.log(`Branch changed from ${lastOpenedBranch} to ${currentBranch}`);
        reopenFilesForBranch(currentBranch);
        lastOpenedBranch = currentBranch;
      }
    } catch (error) {
      console.error('Error detecting branch change:', error);
    }
  };

  // Check branch after an interval
  const interval = () => {
    const timer = 2000; // 3 seconds
    console.log(`Setting branch check interval to ${timer / 1000} seconds`);
    setInterval(detectBranchChange, timer);
  };

  // Command to manually trigger branch change detection
  vscode.commands.registerCommand('git-branch.Branch', () => {
    console.log('Command "git-branch.Branch" triggered');
    detectBranchChange();
    interval();
  });

  // Show info when extension is active
  vscode.window.showInformationMessage('Extension to track branches and files is active!');
  console.log('Extension status message shown');

  // Listener for changes in the active text editor
  const editorDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    try {
      if (editor) {
        const currentBranch = await getCurrentBranch();
        const filePath = editor.document.fileName;
        console.log(`Editor changed to file: ${filePath} on branch: ${currentBranch}`);

        if (currentBranch) {
          if (!branchFiles[currentBranch]) {
            branchFiles[currentBranch] = [];
          }

          if (!branchFiles[currentBranch].includes(filePath)) {
            console.log(`Tracking new file ${filePath} for branch ${currentBranch}`);
            branchFiles[currentBranch].push(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Error handling editor change:', error);
    }
  });

  // Listener for changes in the visible text editors
  const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors((editors) => {
    editors.forEach((editor) => {
      try {
        const currentBranch = getCurrentBranchSync();
        const filePath = editor.document.fileName;
        console.log(`Visible editor changed to file: ${filePath} on branch: ${currentBranch}`);

        if (currentBranch) {
          if (!branchFiles[currentBranch]) {
            branchFiles[currentBranch] = [];
          }

          if (!branchFiles[currentBranch].includes(filePath)) {
            console.log(`Tracking new file ${filePath} for branch ${currentBranch}`);
            branchFiles[currentBranch].push(filePath);
          }
        }
      } catch (error) {
        console.error('Error handling visible editors change:', error);
      }
    });
  });

  // Add event listeners to context subscriptions
  context.subscriptions.push(editorDisposable, visibleEditorsDisposable);
};

// Get current branch asynchronously
const getCurrentBranch = async () => {
  console.log('Getting current branch...');
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
  const summary = await git.branchLocal();
  console.log(`Current branch (async): ${summary.current}`);
  return summary.current;
};

// Get current branch synchronously
const getCurrentBranchSync = () => {
  console.log('Getting current branch synchronously...');
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
  const summary = git.branchLocal();
  console.log(`Current branch (sync): ${summary.current}`);
  return summary.current;
};

// Reopen files for a given branch
const reopenFilesForBranch = (branch) => {
  console.log(`Reopening files for branch: ${branch}`);
  const filesToOpen = branchFiles[branch] || [];
  filesToOpen.forEach((filePath) => {
    const isOpen = vscode.workspace.textDocuments.some((doc) => doc.fileName === filePath);
    if (!isOpen) {
      console.log(`Opening file: ${filePath}`);
      vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(
        (doc) => vscode.window.showTextDocument(doc, { preview: false })
      );
    } else {
      console.log(`File ${filePath} is already open`);
    }
  });
};

// Deactivate the extension
const deactivate = () => {
  console.log('Extension deactivated');
  return null;
};

module.exports = {
  activate,
  deactivate,
};
