const vscode = require('vscode')
const simpleGit = require('simple-git')

/**
 * @param {vscode.ExtensionContext} context
 */

const activate = (context) => {
	const git = simpleGit('../../../../../Users/admin/Desktop/code/git-branch')
    console.log('Extension activated!')
		let disposable = vscode.commands.registerCommand('git-branch.helloWorld', function() {
		let previousBranch = null
w
	const detectBranchChange = () => {
		console.log('current dir', process.cwd())

				git.branchLocal((error, summary) => {
				if (error) {
				console.log('current dir', process.cwd())
					console.error('ERRRRRROR', error)
					console.log('current dir', process.cwd())

				} else {
					const currentBranch = summary.current
					if(currentBranch){
						console.log('CURRENT BRANCH', currentBranch )
					}
					if (currentBranch !== previousBranch) {
						console.log('Branch changed to:', currentBranch)
						// trigger
						previousBranch = currentBranch
					}
				}
			})
		}
		detectBranchChange()

		//  check every 1min for branch change
		const interval = () => {
			const timer = 120;
			console.log("CALLED")
			setInterval(detectBranchChange, timer * 1000);
		}
		interval()

		vscode.window.showInformationMessage('EXTENSION')
	})


	context.subscriptions.push(disposable)
}

// This is called when extension is deactivated
function deactivate() {
return null

}

module.exports = {
	activate,
	deactivate
}
