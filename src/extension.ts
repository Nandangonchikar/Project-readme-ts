import * as vscode from 'vscode';
import * as fs from 'fs';
import { ChatGPTAPI } from 'chatgpt';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "helloworld-sample" is now active!');

	const disposableGenerateReadme = vscode.commands.registerCommand('project-readme.generateReadme', async function(resource) {
		vscode.window.showInformationMessage('Generating readme for the document!');
		createContextMenu();
		let text ;
		if(resource && resource.scheme === 'file'){
			const filePath = resource.fsPath;
			console.log(filePath);
			if(fs.existsSync(filePath))
			{
				text = fs.readFileSync(filePath, 'utf8');
			}
		}
		else if(vscode.window.activeTextEditor){
			const document = vscode.window.activeTextEditor.document;
			text = document.getText();
		}

		if (text) {
			try {
				const generatedReadmeData= await generateReadmeAPI(text);
				if (generatedReadmeData) { // if readme is generated successfully then create the readme file
					await createReadmeFile(generatedReadmeData);
					vscode.window.showInformationMessage('Readme generated successfully!');
				}
				else {
					vscode.window.showErrorMessage("API call did not generate any data");
				}
			}
			catch (err) {
				console.log(err);
			}
		}
		else {
			vscode.window.showErrorMessage("No file is selected or open in the editor");
		}

		async function generateReadmeAPI(text: string) {
			// call openAPI to generate readme here retrieve API key from settings.json
			
			const data = await ChatGPTAPIOfficial(text);
			// const data = "This is a sample readme file generated using the project-readme extension";
			return data;
		}
	
		// Create a readme file in the workspace folder and write data to it
		async function createReadmeFile(data: string) {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				vscode.window.showErrorMessage("No workspace folder found.");
				return;
			}
			
			const currentDir = workspaceFolders[0].uri.fsPath;
			const readmePath = vscode.Uri.file(`${currentDir}/readme.md`);
			console.log(readmePath);
			
			try {
				await vscode.workspace.fs.writeFile(readmePath, Buffer.from(data, 'utf8'));
				console.log("Readme file created");
				return readmePath;
			} catch (error) {
				console.error("Error creating readme file:", error);
				vscode.window.showErrorMessage("Failed to create readme file.");
			}
			}
			


		function createContextMenu(){
			//create a context menu for the filed in the workspace
			const menu = vscode.window.createQuickPick();
			menu.items = [
				{ label: 'Generate Readme', description: 'Generate a readme file for the project' },
			];
			menu.onDidChangeSelection(selection => {
			if (selection[0]) {
				vscode.window.showInformationMessage(`You picked ${selection[0].label}`);
			}
			});
			menu.show();
		}

		async function ChatGPTAPIOfficial(text: string) {
			const apiKey = vscode.workspace.getConfiguration().get('project-readme.apiKey') as string;
			if(!apiKey){
				vscode.window.showErrorMessage("API key not found. Please configure API key in using command set API Keys");
				return;
			}
			console.log(`API key is ${apiKey} and data is ${text} `);
			const api = new ChatGPTAPI({
				apiKey: apiKey
			});
			const res = await api.sendMessage('Hello World!');
			return res.text;
		}
	});

// Register the command to open settings for API key configuration
	const disposableConfigureAPIKeys = vscode.commands.registerCommand('project-readme.setAPIKey',  () => {
		// await vscode.commands.executeCommand('workbench.action.openSettings');
		vscode.window.showInputBox({
			prompt: 'Enter your API key',
			placeHolder: 'API key',
			password: false // If the API key should be masked
			}).then(apiKey => {
			if (apiKey !== undefined) {
			saveAPIKey(apiKey);
			}
		});

		//   function to save the API key in the settings.json file
		function saveAPIKey(apiKey: string) {
			const config = vscode.workspace.getConfiguration();
			config.update('project-readme.apiKey', apiKey, true);
			vscode.window.showInformationMessage('API key saved successfully!');
		}
		});

	context.subscriptions.push(disposableGenerateReadme,disposableConfigureAPIKeys);
}
