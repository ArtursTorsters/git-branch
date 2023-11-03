const vscode = require('vscode');
/**
 * @param {vscode.ExtensionContext} context
 */

const activate = (context) => {

		let disposable = vscode.commands.registerCommand('git-branch.helloWorld', function() {

		const simpleGit = require('simple-git')
		let previousBranch = null

	const detectBranchChange = () => {
			simpleGit().branchLocal((error, summary) => {
				if (error) {
					console.error('branch err', error)
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
	
		//  check every 5s for branch change
		setInterval(detectBranchChange, 5000)


		vscode.window.showInformationMessage('EXTENSION')


	})


	context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
function deactivate() {
return null

}

module.exports = {
	activate,
	deactivate
}
