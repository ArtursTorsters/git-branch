const vscode = require('vscode');
/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {

	// branch switch detection command
	vscode.commands.registerCommand('switchBranch', () => {


	})
	



	console.log('Congratulations, your extension "git-branch" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('git-branch.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from git branch!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {
return null

}

module.exports = {
	activate,
	deactivate
}
