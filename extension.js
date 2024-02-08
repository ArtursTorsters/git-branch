const vscode = require('vscode');
const simpleGit = require('simple-git');

// Store branches and associated files in objects
const branchFiles = {};

/**
 * Activate the extension.
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
  // Dynamic path using simple-git
  const git = simpleGit(vscode.workspace.rootPath);

  // Keep track of the currently opened files for each branch
  const branches = [];

  // Register the command to start the extension
  let disposable = vscode.commands.registerCommand('git-branch.helloWorld', async function () {
    let previousBranch = null;

    // Detect branch change
    const detectBranchChange = async () => {
      const summary = await git.branchLocal();
      const currentBranch = summary.current;

      if (currentBranch) {
        // Log the current branch
        console.log('CURRENT BRANCH:', currentBranch);

        // Check if the branch is already being tracked
        if (!branches.includes(currentBranch)) {
          branches.push(currentBranch);
          branchFiles[currentBranch] = [];
        }

        // Log or perform any other actions based on your requirements
        console.log('FILES FOR THIS BRANCH:', branchFiles[currentBranch]);

        // Notify the user when a branch change occurs
        if (currentBranch !== previousBranch) {
          vscode.window.showInformationMessage(`Branch changed to: ${currentBranch}`);

          // Close files from the previous branch that are not in the current branch
          await closeFilesNotInBranch(previousBranch, currentBranch);

          // Update the currently opened files for the current branch
          branchFiles[currentBranch] = getOpenedFiles();
          
          // Trigger
          previousBranch = currentBranch;
        }
      }
    };

    // Detect branch change on activation
    detectBranchChange();

    // Set up interval for periodic branch change detection
    const interval = () => {
      const timer = 10;
      setInterval(detectBranchChange, timer * 1000);
    };
    interval();

    vscode.window.showInformationMessage('EXTENSION ACTIVE');
  });

// Subscribe to the onDidChangeActiveTextEditor event
const editorDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
  if (editor) {
    // Track the opened file for the current branch
    const currentBranch = getCurrentBranch();
    if (currentBranch) {
      // Check if the file is already in the array before adding it
      const filePath = editor.document.fileName;
      if (!branchFiles[currentBranch].includes(filePath)) {
        branchFiles[currentBranch].push(filePath);
      }
    }
  }
});

// Subscribe to the onDidCloseTextDocument event
const closeDisposable = vscode.workspace.onDidCloseTextDocument(document => {
  // Handle file close event if needed
  const currentBranch = getCurrentBranch();
  if (currentBranch) {
    // Remove the closed file from the array
    branchFiles[currentBranch] = branchFiles[currentBranch].filter(filePath => filePath !== document.fileName);
  }
});

// Add disposables to the context subscriptions
context.subscriptions.push(disposable, editorDisposable, closeDisposable);





}

// Close files that were opened in the previous branch but not in the current branch.
async function closeFilesNotInBranch(previousBranch, currentBranch) {
  if (previousBranch && branchFiles[previousBranch]) {
    const filesToClose = branchFiles[previousBranch].filter(filePath => !branchFiles[currentBranch].includes(filePath));

    for (const filePath of filesToClose) {
      const document = vscode.workspace.textDocuments.find(doc => doc.fileName === filePath);
      if (document) {
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    }
  }
}

// Get the current branch synchronously.
function getCurrentBranch() {
  const git = simpleGit(vscode.workspace.rootPath);
  const summary = git.branchLocalSync();
  return summary.current;
}

// Get the currently opened files.
function getOpenedFiles() {
  return vscode.window.visibleTextEditors.map(editor => editor.document.fileName);
}

function deactivate() {
  return null;
}

module.exports = {
  activate,
  deactivate,
};
