const vscode = require('vscode')
const simpleGit = require('simple-git')

// Store the OPENED files in an object
const branchFiles = {}


/**
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
  // Dynamic path using simple-git
  const git = simpleGit(vscode.workspace.rootPath)

  // Keep track of the currently opened files
  let openedFiles = []

  let disposable = vscode.commands.registerCommand('git-branch.helloWorld', async function() {
    let previousBranch = null

    // Detect branch
    const detectBranchChange = async () => {
      const summary = await git.branchLocal()
      const currentBranch = summary.current

      if (currentBranch) {
        console.log('CURRENT BRANCH:', currentBranch)

        // Store files for the current branch
        branchFiles[currentBranch] = openedFiles

        // Log or perform any other actions based on your requirements
        console.log('FILES FOR THIS BRANCH:', branchFiles[currentBranch])

        // Notify the user when a branch change occurs
        if (currentBranch !== previousBranch) {
          vscode.window.showInformationMessage(`Branch changed to: ${currentBranch}`)

     // Close files from the previous branch
    //   need to close files that were not opened in the the current branch
    vscode.workspace.textDocuments.forEach(async (document) => {
      const filePath = document.fileName;
    
      if (!openedFiles.includes(filePath) && !filePath.endsWith('.d.ts')) {
        // Close the document
        await vscode.commands.executeCommand('vscode.close', document.uri);
      }
    });
          // Update the currently opened files
          openedFiles = branchFiles[currentBranch]

          // Trigger
          previousBranch = currentBranch
        }
      }
    }

    detectBranchChange()

    // interval
    const interval = () => {
      const timer = 3
      setInterval(detectBranchChange, timer * 1000)
    }
    interval()

    vscode.window.showInformationMessage('EXTENSION ACTIVE')
  })
  // Subscribe to the onDidOpenTextDocument event
  const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
    openedFiles.push(document.fileName)
  })
  // Subscribe to the onDidCloseTextDocument event
  const closeDisposable = vscode.workspace.onDidCloseTextDocument((document) => {
    // Handle file close event if needed
    console.log(`FILE CLOSED: ${document.fileName}`)
  
  })
  // Add disposables to the context subscriptions
  context.subscriptions.push(disposable, openDisposable, closeDisposable)
}

function deactivate() {
  return null
}

module.exports = {
  activate,
  deactivate,
}
