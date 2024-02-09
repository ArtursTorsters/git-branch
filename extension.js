const vscode = require('vscode');
const simpleGit = require('simple-git');

const branchFiles = {};
let lastOpenedBranch = null;

function activate(context) {
  const branches = [];

  let disposable = vscode.commands.registerCommand('git-branch.helloWorld', async function () {
    const detectBranchChange = async () => {
      const currentBranch = await getCurrentBranch();
      if (currentBranch) {
        console.log('CURRENT BRANCH:', currentBranch);
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

    detectBranchChange();

    const interval = () => {
      const timer = 10;
      setInterval(detectBranchChange, timer * 1000);
    };
    interval();

    vscode.window.showInformationMessage('Extension to track branches and files is active!');
  });

  const editorDisposable = vscode.window.onDidChangeActiveTextEditor(async editor => {
    if (editor) {
      const currentBranch = await getCurrentBranch();
      if (currentBranch) {
        const filePath = editor.document.fileName;
        if (!branchFiles[currentBranch].includes(filePath)) {
          branchFiles[currentBranch].push(filePath);
        }
      }
    }
  });

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

  context.subscriptions.push(disposable, editorDisposable, visibleEditorsDisposable);
}

async function getCurrentBranch() {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
  const summary = await git.branchLocal();
  return summary.current;
}

function getCurrentBranchSync() {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
  const summary = git.branchLocalSync();
  return summary.current;
}

function reopenFilesForBranch(branch) {
  const filesToOpen = branchFiles[branch];
  if (filesToOpen) {
    filesToOpen.forEach(filePath => {
      vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(
        doc => {
          vscode.window.showTextDocument(doc, { preview: false });
        },
        error => {
          console.error(`Error opening file: ${filePath}`, error);
        }
      );
    });
  }
}

function deactivate() {
  // Dispose of resources or clean up here
  return null;
}

module.exports = {
  activate,
  deactivate,
};