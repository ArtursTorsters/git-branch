const vscode = require('vscode');
const simpleGit = require('simple-git');

// Dictionary to store files opened in each branch
const branchFiles = {};

// Variable to track the last opened branch
let lastOpenedBranch = null;

function activate(context) {
  // Array to store known branches
  const branches = [];

  // Command to initialize and track branch changes
  let disposable = vscode.commands.registerCommand('git-branch.helloWorld', async function () {
    // Function to detect branch changes
    const detectBranchChange = async () => {
      // Get the current branch
      const currentBranch = await getCurrentBranch();
      if (currentBranch) {
        console.log('CURRENT BRANCH:', currentBranch);

        // If the branch is not in the list, add it and initialize its file tracking
        if (!branches.includes(currentBranch)) {
          branches.push(currentBranch);
          branchFiles[currentBranch] = [];
        }

        // Check if the branch has changed
        if (currentBranch !== vscode.workspace.getConfiguration().get('git-branch.currentBranch')) {
          vscode.workspace.getConfiguration().update('git-branch.currentBranch', currentBranch, vscode.ConfigurationTarget.Workspace);
        }

        console.log('FILES FOR THIS BRANCH:', branchFiles[currentBranch]);

        // Reopen files only when the branch has changed from the last opened branch
        if (lastOpenedBranch !== currentBranch) {
          reopenFilesForBranch(currentBranch);
          lastOpenedBranch = currentBranch; // Update the last opened branch
        }
      }
    };

    // Call the function to detect branch changes
    detectBranchChange();

    // Set up an interval to check for branch changes periodically
    const interval = () => {
      const timer = 10; // Time in seconds
      setInterval(detectBranchChange, timer * 1000);
    };
    interval();

    // Show information message when the extension is active
    vscode.window.showInformationMessage('Extension to track branches and files is active!');
  });

  // Event listener for changes in the active text editor
  const editorDisposable = vscode.window.onDidChangeActiveTextEditor(async editor => {
    if (editor) {
      // Get the current branch
      const currentBranch = await getCurrentBranch();
      if (currentBranch) {
        const filePath = editor.document.fileName;

        // Track the file for the current branch
        if (!branchFiles[currentBranch].includes(filePath)) {
          branchFiles[currentBranch].push(filePath);
        }
      }
    }
  });

  // Event listener for changes in the visible text editors
  const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors(editors => {
    // Update tracking based on currently visible editors
    editors.forEach(editor => {
      const currentBranch = getCurrentBranchSync();
      if (currentBranch) {
        const filePath = editor.document.fileName;
        if (!branchFiles[currentBranch].includes(filePath)) {
          branchFiles[currentBranch].push(filePath);
        }
      }
    });
  });

  // Add the event listeners to the context subscriptions
  context.subscriptions.push(disposable, editorDisposable, visibleEditorsDisposable);
}

// Function to get the current branch asynchronously
async function getCurrentBranch() {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
  const summary = await git.branchLocal();
  return summary.current;
}

// Function to get the current branch synchronously
function getCurrentBranchSync() {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
  const summary = git.branchLocalSync();
  return summary.current;
}

// Function to reopen files for a given branch
function reopenFilesForBranch(branch) {
  const filesToOpen = branchFiles[branch];
  if (filesToOpen) {
    filesToOpen.forEach(filePath => {
      // Check if the file is currently open in any editor
      const isOpen = vscode.workspace.textDocuments.some(doc => doc.fileName === filePath);

      // Reopen the file only if it's not currently open
      if (!isOpen) {
        vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(
          doc => {
            vscode.window.showTextDocument(doc, { preview: false });
          },
          error => {
            console.error(`Error opening file: ${filePath}`, error);
          }
        );
      }
    });
  }
}


// Function to deactivate the extension
function deactivate() {
  // Dispose of resources or clean up here
  return null;
}

// Export the activation and deactivation functions
module.exports = {
  activate,
  deactivate,
};
