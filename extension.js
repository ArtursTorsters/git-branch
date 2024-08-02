const vscode = require('vscode');
const simpleGit = require('simple-git');

// Track files for each branch
const branchFiles = {};
let lastOpenedBranch = null;

// Activate the extension
const activate = (context) => {
  console.log('Extension activated');

  // Detect branch changes
  const detectBranchChange = async () => {
    try {
      const currentBranch = await getCurrentBranch();
      const config = vscode.workspace.getConfiguration('git-branch');
      const configCurrentBranch = config.get('currentBranch');

      if (currentBranch !== configCurrentBranch) {
        await config.update('currentBranch', currentBranch, vscode.ConfigurationTarget.Workspace);
        console.log(`Updated configuration to branch: ${currentBranch}`);
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

  // Interval to check branch change
  const interval = () => setInterval(detectBranchChange, 3000);

  // Command to manually trigger branch change detection
  vscode.commands.registerCommand('git-branch.Branch', () => {
    detectBranchChange();
    interval();
  });

  // Show information message
  vscode.window.showInformationMessage('Extension to track branches and files is active!');
  console.log('Extension status message shown');

  // Shared logic for tracking files
  const trackFile = async (filePath) => {
    const currentBranch = await getCurrentBranch();
    if (currentBranch) {
      if (!branchFiles[currentBranch]) {
        branchFiles[currentBranch] = [];
      }
      if (!branchFiles[currentBranch].includes(filePath)) {
        branchFiles[currentBranch].push(filePath);
      }
    }
  };

  // Listener for changes in active text editor
  const editorDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (editor) {
      trackFile(editor.document.fileName).catch(console.error);
    }
  });

  // Listener for changes in visible text editors
  const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors((editors) => {
    editors.forEach(editor => {
      trackFile(editor.document.fileName).catch(console.error);
    });
  });

  // Add event listeners to context subscriptions
  context.subscriptions.push(editorDisposable, visibleEditorsDisposable);
};

// Get current branch asynchronously
const getCurrentBranch = async () => {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
  const { current } = await git.branchLocal();
  return current;
};

// Reopen files for a given branch
const reopenFilesForBranch = (branch) => {
  const filesToOpen = branchFiles[branch] || [];
  filesToOpen.forEach(filePath => {
    const isOpen = vscode.workspace.textDocuments.some(doc => doc.fileName === filePath);
    if (!isOpen) {
      vscode.workspace.openTextDocument(vscode.Uri.file(filePath))
        .then(doc => vscode.window.showTextDocument(doc, { preview: false }))
        .catch(err => console.error(`Error opening file ${filePath}:`, err));
    } else {
      console.log(`File ${filePath} is already open`);
    }
  });

  // Close files that are open but not in the current branch
  vscode.workspace.textDocuments.forEach(doc => {
    if (!filesToOpen.includes(doc.fileName)) {
      vscode.window.showTextDocument(doc, { preview: false }).then(editor => {
        editor.hide(); // Close the document
      });
    }
  });
};

// Deactivate the extension
const deactivate = () => {
  console.log('Extension deactivated');
};

module.exports = {
  activate,
  deactivate,
};
