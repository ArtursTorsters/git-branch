const vscode = require('vscode')
const simpleGit = require('simple-git')

/**
 * @param {vscode.ExtensionContext} context
 */

const activate = (context) => {
	//  get path using simple-git
	const git = simpleGit(vscode.workspace.rootPath)
		let disposable = vscode.commands.registerCommand('git-branch.helloWorld', function() {
		let previousBranch = null

	const detectBranchChange = () => {
		git.branchLocal((error, summary) => {
		const currentBranch = summary && summary.current

				if (error) {
					console.error('ERROR', error)
					console.log('current dir', process.cwd())

				} else {
					if(currentBranch){
						console.log('CURRENT BRANCH:', currentBranch )
					}
					if (currentBranch !== previousBranch) {
						console.log('BRANCH CHANGED TO:', currentBranch)
						// trigger
						previousBranch = currentBranch
					}
				}
			})
		}
		detectBranchChange()

		//  check for branch change
		const interval = () => {
			const timer = 10
			console.log("CALLED")
			setInterval(detectBranchChange, timer * 1000)
		}
		interval()

		vscode.window.showInformationMessage('EXTENSION')
	})


	context.subscriptions.push(disposable)

	const arrayFiles = []
    //  onDidOpenTextDocument event
    const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
        console.log(`FILE OPENED: ${document.fileName}`)
    })

    //  onDidCloseTextDocument event
    const closeDisposable = vscode.workspace.onDidCloseTextDocument((document) => {
        console.log(`FILE CLOSED: ${document.fileName}`)
    })

    // Add disposables
    context.subscriptions.push(openDisposable, closeDisposable)


}

// This is called when extension is deactivated
function deactivate() {
return null

}

module.exports = {
	activate,
	deactivate
}
