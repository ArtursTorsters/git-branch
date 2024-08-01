const vscode = require('vscode');
const simpleGit = require('simple-git');

// Store files
const branchFiles = {};
// Track the last opened branch
let lastOpenedBranch = null;

// Activate the extension
const activate = (context) => {
  // Store known branches
  const branches = [];

  // Detect branch changes
  const detectBranchChange = async () => {
    try {
      const currentBranch = await getCurrentBranch();
      console.log('Current Branch:', currentBranch);

      // If the branch is not in the list - add it
      if (currentBranch && !branches.includes(currentBranch)) {
        branches.push(currentBranch);
        branchFiles[currentBranch] = [];
        console.log('New branch detected and added:', currentBranch);
      }

      // Check and update the branch configuration
      const configCurrentBranch = vscode.workspace.getConfiguration().get('git-branch.currentBranch');
      console.log('Config Current Branch:', configCurrentBranch);

      if (currentBranch !== configCurrentBranch) {
        await vscode.workspace.getConfiguration().update('git-branch.currentBranch', currentBranch, vscode.ConfigurationTarget.Workspace);
        console.log('Branch configuration updated to:', currentBranch);
      }

      // Reopen files only when the branch has changed from the last opened branch
      if (lastOpenedBranch !== currentBranch) {
        console.log('Branch has changed from', lastOpenedBranch, 'to', currentBranch);
        reopenFilesForBranch(currentBranch);
        lastOpenedBranch = currentBranch;
      }
    } catch (error) {
      console.error('Error detecting branch change:', error);
    }
  };

  // Check branch after interval
  const interval = () => {
    const timer = 3; // Interval in seconds
    setInterval(detectBranchChange, timer * 1000);
  };

  // Command to manually trigger branch change detection
  vscode.commands.registerCommand('git-branch.Branch', () => {
    detectBranchChange();
    interval();
  });

  // Info when extension is active
  vscode.window.showInformationMessage('Extension to track branches and files is active!');

  // Listener for changes in the active text editor
  const editorDisposable = vscode.window.onDidChangeActiveTextEditor(async editor => {
    try {
      if (editor) {
        const currentBranch = await getCurrentBranch();
        const filePath = editor.document.fileName;
        console.log('Active editor changed:', filePath);

        // Track files for the current branch
        if (currentBranch && !branchFiles[currentBranch].includes(filePath)) {
          branchFiles[currentBranch].push(filePath);
          console.log('File added to branch files:', currentBranch, filePath);
        }
      }
    } catch (error) {
      console.error('Error in onDidChangeActiveTextEditor:', error);
    }
  });

  // Listener for changes in the visible text editors
  const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors(async editors => {
    try {
      const currentBranch = await getCurrentBranch();
      editors.forEach(editor => {
        const filePath = editor.document.fileName;
        console.log('Visible editor changed:', filePath);

        // Track files for the current branch
        if (currentBranch && !branchFiles[currentBranch].includes(filePath)) {
          branchFiles[currentBranch].push(filePath);
          console.log('File added to branch files:', currentBranch, filePath);
        }
      });
    } catch (error) {
      console.error('Error in onDidChangeVisibleTextEditors:', error);
    }
  });

  // Event listeners to the context subscriptions
  context.subscriptions.push(editorDisposable, visibleEditorsDisposable);
};

// Get current branch asynchronously
const getCurrentBranch = async () => {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
  const summary = await git.branchLocal();
  console.log('Git branch summary:', summary);
  return summary.current;
};

// Reopen files for a given branch
const reopenFilesForBranch = (branch) => {
  const filesToOpen = branchFiles[branch] || [];
  console.log('Files to reopen for branch', branch, ':', filesToOpen);

  filesToOpen.forEach(filePath => {
    const isOpen = vscode.workspace.textDocuments.some(doc => doc.fileName === filePath);
    console.log('Is file open:', filePath, isOpen);

    if (!isOpen) {
      vscode.workspace.openTextDocument(vscode.Uri.parse(filePath)).then(
        doc => vscode.window.showTextDocument(doc, { preview: false })
      );
    }
  });
};

// Deactivate the extension
const deactivate = () => {
  return null;
};

module.exports = {
  activate,
  deactivate,
};
