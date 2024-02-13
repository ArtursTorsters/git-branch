const vscode = require('vscode')
const simpleGit = require('simple-git')

const branchFiles = {}
let lastOpenedBranch = null

const activate = (context) => {
  const branches = []

  const detectBranchChange = async () => {
    try {
      const currentBranch = await getCurrentBranch()
      if (currentBranch && !branches.includes(currentBranch)) {
        branches.push(currentBranch)
        branchFiles[currentBranch] = []
      }

      const configCurrentBranch = vscode.workspace.getConfiguration().get('git-branch.currentBranch')
      if (currentBranch !== configCurrentBranch) {
        vscode.workspace.getConfiguration().update('git-branch.currentBranch', currentBranch, vscode.ConfigurationTarget.Workspace)
      }

      // branch change
      if (lastOpenedBranch !== currentBranch) {
        console.log(`Branch changed from ${lastOpenedBranch} to ${currentBranch}`)
        reopenFilesForBranch(currentBranch)
        lastOpenedBranch = currentBranch
      }
    } catch (error) {
      console.error(error)
    }
  }

  const interval = () => {
    const timer = 3
    setInterval(detectBranchChange, timer * 1000)
  }

  vscode.commands.registerCommand('git-branch.Branch', () => {
    detectBranchChange()
    interval()
  })

vscode.window.showInformationMessage('Extension to track files is active!')

  const editorDisposable = vscode.window.onDidChangeActiveTextEditor(async editor => {
    try {
      if (editor) {
        const currentBranch = await getCurrentBranch()
        const filePath = editor.document.fileName
        if (currentBranch && !branchFiles[currentBranch].includes(filePath)) {
          console.log(`Tracking file ${filePath} for branch ${currentBranch}`)
          branchFiles[currentBranch].push(filePath)
        }
      }
    } catch (error) {
      console.error(error)
    }
  })

  const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors(editors => {
    editors.forEach(editor => {
      try {
        const currentBranch = getCurrentBranchSync()
        const filePath = editor.document.fileName
        if (currentBranch && !branchFiles[currentBranch].includes(filePath)) {
          branchFiles[currentBranch].push(filePath)
        }
      } catch (error) {
        console.error(error)
      }
    })
  })

  context.subscriptions.push(editorDisposable, visibleEditorsDisposable)
}

 const getCurrentBranch = async () => {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath)
  const summary = await git.branchLocal()
  return summary.current
}

const getCurrentBranchSync = () => {
  const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath)
  const summary = git.branchLocal()
  return summary.current
}

const reopenFilesForBranch = (branch) => {
  const filesToOpen = branchFiles[branch] || []
  filesToOpen.forEach(filePath => {
    const isOpen = vscode.workspace.textDocuments.some(doc => doc.fileName === filePath)
    if (!isOpen) {
      vscode.workspace.openTextDocument(vscode.Uri.parse(filePath)).then(
        doc => vscode.window.showTextDocument(doc, { preview: false }),
        error => console.error(`Error opening file: ${filePath}`, error)
      )
    }
  })
}

const deactivate = () => {
  return null
}

module.exports = {
  activate,
  deactivate,
}