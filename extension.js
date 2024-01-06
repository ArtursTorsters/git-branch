const vscode = require('vscode')
const simpleGit = require('simple-git')

//  store the OPENED files in obj
const branchFiles = {}

/**
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
  // dynamic path using simple git
  const git = simpleGit(vscode.workspace.rootPath)
  let disposable = vscode.commands.registerCommand('git-branch.helloWorld', function() {
    let previousBranch = null
//  detect branch
    const detectBranchChange = () => {
      git.branchLocal((error, summary) => {
        const currentBranch = summary && summary.current

        if (error) {
          console.error('ERROR', error)
        } else {
          if (currentBranch) {
            console.log('CURRENT BRANCH:', currentBranch)

            // store files for current branch
            const openedFiles = vscode.workspace.textDocuments.map(doc => doc.fileName);
            branchFiles[currentBranch] = openedFiles;



        //  open and show doc
        const document = await vscode.workspace.openTextDocument(openedFiles);
        vscode.window.showTextDocument(document);


            console.log("OPENED FILES" , openedFiles)

            // Log or perform any other actions based on your requirements
            console.log('FILES FOR THIS BRANCH:', branchFiles[currentBranch]);

            // Notify the user when a branch change occurs
            if (currentBranch !== previousBranch) {
              console.log('BRANCH CHANGED TO:', currentBranch);
              vscode.window.showInformationMessage(`Branch changed to: ${currentBranch}`);

              // trigger
              previousBranch = currentBranch;
            }
          }
        }
      });
    };
    detectBranchChange();

    // Check for branch change at regular intervals
    const interval = () => {
      const timer = 60;
      setInterval(detectBranchChange, timer * 1000);
    };
    interval();

    vscode.window.showInformationMessage('EXTENSION ACTIVE');
  });

  context.subscriptions.push(disposable);

  // Subscribe to the onDidOpenTextDocument event
  // const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
  //   const currentBranch = git.branchLocalSync().current;
  //   if (currentBranch) {
  //     branchFiles[currentBranch] = branchFiles[currentBranch] || [];
  //     branchFiles[currentBranch].push(document.fileName);
  //   }
  //   console.log(`FILE OPENED: ${document.fileName}`);
  // });

  // const closeDisposable = vscode.workspace.onDidCloseTextDocument((document) => {
  //   // Handle file close event if needed
  //   console.log(`FILE CLOSED: ${document.fileName}`);
  // });

  // // Add disposables to the context subscriptions
  // context.subscriptions.push(openDisposable, closeDisposable);
};

function deactivate() {
  return null
}

module.exports = {
  activate,
  deactivate
};
