const vscode = require('vscode');
const simpleGit = require('simple-git');

// Store the OPENED files in an object
const branchFiles = {};

console.log("branchfiles", branchFiles)

/**
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
  // Dynamic path using simple-git
  const git = simpleGit(vscode.workspace.rootPath);

  // Keep track of the currently opened files
  let openedFiles = [];

  let disposable = vscode.commands.registerCommand('git-branch.helloWorld', async function() {
    let previousBranch = null;

    // Detect branch
    const detectBranchChange = async () => {
      const summary = await git.branchLocal();
      const currentBranch = summary.current;

      if (currentBranch) {
        console.log('CURRENT BRANCH:', currentBranch);

        // Store files for the current branch
        branchFiles[currentBranch] = openedFiles;

        // Log or perform any other actions based on your requirements
        console.log('FILES FOR THIS BRANCH:', branchFiles[currentBranch]);

        // Notify the user when a branch change occurs
        if (currentBranch !== previousBranch) {
          console.log('BRANCH CHANGED TO:', currentBranch);
          vscode.window.showInformationMessage(`Branch changed to: ${currentBranch}`);

          // Close files from the previous branch
          openedFiles.forEach(async (filePath) => {
            const document = await vscode.workspace.openTextDocument(filePath);
            vscode.window.showTextDocument(document);
          });

          // Open files for the current branch
          branchFiles[currentBranch].forEach(async (filePath) => {
            const document = await vscode.workspace.openTextDocument(filePath);
            vscode.window.showTextDocument(document);
          });

          // Update the currently opened files
          openedFiles = branchFiles[currentBranch];

          // Trigger
          previousBranch = currentBranch;
        }
      }
    };

    detectBranchChange();

    // Check for branch change at regular intervals
    const interval = () => {
      const timer = 20;
      setInterval(detectBranchChange, timer * 1000);
    };
    interval();

    vscode.window.showInformationMessage('EXTENSION ACTIVE');
  });

  // Subscribe to the onDidOpenTextDocument event
  const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
    openedFiles.push(document.fileName);
    console.log(`FILE OPENED: ${document.fileName}`);
  });

  // Subscribe to the onDidCloseTextDocument event
  const closeDisposable = vscode.workspace.onDidCloseTextDocument((document) => {
    // Handle file close event if needed
    console.log(`FILE CLOSED: ${document.fileName}`);
  });

  // Add disposables to the context subscriptions
  context.subscriptions.push(disposable, openDisposable, closeDisposable);
};

function deactivate() {
  return null;
}

module.exports = {
  activate,
  deactivate,
};
