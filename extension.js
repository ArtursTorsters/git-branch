const vscode = require('vscode')
const simpleGit = require('simple-git')

// store files
const branchFiles = {}

// track the last opened branch
let lastOpenedBranch = null

//  activate the extension
const activate = (context) => {
  // store known branches
  const branches = []

  // detect branch changes
  const detectBranchChange = async () => {
    try {
      // current branch
      const currentBranch = await getCurrentBranch()
      // if the branch is not in the list - add it
      if (currentBranch && !branches.includes(currentBranch)) {
        branches.push(currentBranch)
        branchFiles[currentBranch] = []
      }

      //if the branch changed
      const configCurrentBranch = vscode.workspace.getConfiguration().get('git-branch.currentBranch')
      if (currentBranch !== configCurrentBranch) {
        vscode.workspace.getConfiguration().update('git-branch.currentBranch', currentBranch, vscode.ConfigurationTarget.Workspace)
      }

      // reopen files only when the branch has changed from the last opened branch
      if (lastOpenedBranch !== currentBranch) {
        reopenFilesForBranch(currentBranch)
        lastOpenedBranch = currentBranch
      }
    } catch (error) {
      console.error(error)
    }
  }
  // check branch after interval
  const interval = () => {
    const timer = 3
    setInterval(detectBranchChange, timer * 1000)
  }

  // command to manually trigger branch change detection
  vscode.commands.registerCommand('git-branch.Branch', () => {
    detectBranchChange()
    interval()
  })

  //info when extension active
  vscode.window.showInformationMessage('Extension to track branches and files is active!')

  // listener for changes in the active text editor
  const editorDisposable = vscode.window.onDidChangeActiveTextEditor(async editor => {
    try {
      if (editor) {
        const currentBranch = await getCurrentBranch()
        const filePath = editor.document.fileName
        // tracking files for the current branch
        if (currentBranch && !branchFiles[currentBranch].includes(filePath)) {
          branchFiles[currentBranch].push(filePath)
        }
      }
    } catch (error) {
      console.error(error)
    }
  })

  // listener for changes in the visible text editors
  const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors(editors => {
    // Update tracking based on currently visible editors
    editors.forEach(editor => {
      try {
        const currentBranch = getCurrentBranchSync()
        const filePath = editor.document.fileName

        // file for the current branch
        if (currentBranch && !branchFiles[currentBranch].includes(filePath)) {
          branchFiles[currentBranch].push(filePath)
        }
      } catch (error) {
        console.error(error)
      }
    })
  })
  //event listeners to the context subscriptions
  context.subscriptions.push(editorDisposable, visibleEditorsDisposable)
}

// branch asynchronously
const getCurrentBranch = async () => {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath)
  const summary = await git.branchLocal()
  return summary.current
}

//branch synchronously
const getCurrentBranchSync = () => {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath)
  const summary = git.branchLocal()
  return summary.current
}

//reopen files for a given branch
const reopenFilesForBranch = (branch) => {
  const filesToOpen = branchFiles[branch] || []
  filesToOpen.forEach(filePath => {
    //if the file is currently open in any editor
    const isOpen = vscode.workspace.textDocuments.some(doc => doc.fileName === filePath)
    // open only if the file is not opened
    if (!isOpen) {
      vscode.workspace.openTextDocument(vscode.Uri.parse(filePath)).then(
        doc => vscode.window.showTextDocument(doc, { preview: false })
      )
    }
  })
}
//  deactivate the extension
const deactivate = () => {
  return null
}
module.exports = {
  activate,
  deactivate,
}
