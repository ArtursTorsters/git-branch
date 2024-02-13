const vscode = require('vscode')
const simpleGit = require('simple-git')

// Dictionary to store files opened in each branch
const branchFiles = {}

// Variable to track the last opened branch
let lastOpenedBranch = null

const activate = (context) => {
  const branches = []

  let disposable = vscode.commands.registerCommand('git-branch.Branch', async function () {
    const detectBranchChange = async () => {
      try {
        const currentBranch = await getCurrentBranch()
        if (currentBranch) {
          if (!branches.includes(currentBranch)) {
            branches.push(currentBranch)
            branchFiles[currentBranch] = []
          }

          if (currentBranch !== vscode.workspace.getConfiguration().get('git-branch.currentBranch')) {
            vscode.workspace.getConfiguration().update('git-branch.currentBranch', currentBranch, vscode.ConfigurationTarget.Workspace)
          }

          if (lastOpenedBranch !== currentBranch) {
            console.log(`Branch changed from ${lastOpenedBranch} to ${currentBranch}`)
            reopenFilesForBranch(currentBranch)
            lastOpenedBranch = currentBranch
          }
        }
      } catch (error) {
        console.error('Error detecting branch change:', error)
      }
    }

    detectBranchChange()

    const interval = () => {
      const timer = 2
      setInterval(detectBranchChange, timer * 1000)
    }
    interval()
    console.log('Extension to track branches and files is active!')
  })

  const editorDisposable = vscode.window.onDidChangeActiveTextEditor(async editor => {
    try {
      if (editor) {
        const currentBranch = await getCurrentBranch()
        if (currentBranch) {
          const filePath = editor.document.fileName
          if (!branchFiles[currentBranch].includes(filePath)) {
            console.log(`Tracking file ${filePath} for branch ${currentBranch}`)
            branchFiles[currentBranch].push(filePath)
          }
        }
      }
    } catch (error) {
      console.error('Error handling active text editor change:', error)
    }
  })

  const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors(editors => {
    editors.forEach(editor => {
      try {
        const currentBranch = getCurrentBranchSync()
        if (currentBranch) {
          const filePath = editor.document.fileName
          if (!branchFiles[currentBranch].includes(filePath)) {
            console.log(`Tracking file ${filePath} for branch ${currentBranch}`)
            branchFiles[currentBranch].push(filePath)
          }
        }
      } catch (error) {
        console.error('Error handling visible text editors change:', error)
      }
    })
  })

  context.subscriptions.push(disposable, editorDisposable, visibleEditorsDisposable)
}



// Function to get the current branch asynchronously
async function getCurrentBranch() {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath)
  const summary = await git.branchLocal()
  return summary.current
}

// Function to get the current branch synchronously
function getCurrentBranchSync() {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath)
  const summary = git.branchLocal()
  return summary.current
}

// Function to reopen files for a given branch
function reopenFilesForBranch(branch) {
  const filesToOpen = branchFiles[branch]
  if (filesToOpen) {
    filesToOpen.forEach(filePath => {
      // Check if the file is currently open in any editor
      const isOpen = vscode.workspace.textDocuments.some(doc => doc.fileName === filePath)

      // Reopen the file only if it's not currently open
      if (!isOpen) {
        vscode.workspace.openTextDocument(vscode.Uri.parse(filePath)).then(
          doc => {
            vscode.window.showTextDocument(doc, { preview: false })
          },
          error => {
            console.error(`Error opening file: ${filePath}`, error)
          }
        )
      }
    })
  }
}
// Function to deactivate the extension
function deactivate() {
  return null
}

module.exports = {
  activate,
  deactivate,
}