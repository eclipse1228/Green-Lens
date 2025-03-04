// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GreenPatternDiagnostics } from './diagnostics';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Green Pattern extension is now active!');

	// 진단 기능 활성화
    const diagnostics = new GreenPatternDiagnostics();
    diagnostics.activate(context);
    
    context.subscriptions.push(diagnostics);

    // Pattern 1: 스크립트 최적화 정보 표시 명령어 등록
    context.subscriptions.push(
        vscode.commands.registerCommand('greenPattern.showScriptOptimizationInfo', () => {
            vscode.window.showInformationMessage(
                '스크립트 최적화 방법:\n' +
                '1. defer 속성 사용\n' +
                '2. async 속성 사용\n' +
                '3. body 태그 끝에 배치',
                '자세히 알아보기'
            ).then(selection => {
                if (selection === '자세히 알아보기') {
                    vscode.env.openExternal(vscode.Uri.parse(
                        'https://web.dev/optimizing-content-efficiency-loading-third-party-javascript/'
                    ));
                }
            });
        })
    );

    // defer 속성 추가 명령어
    context.subscriptions.push(
        vscode.commands.registerCommand('greenPattern.addDeferAttribute', async (uri: vscode.Uri, range: vscode.Range, scriptText: string) => {
            const edit = new vscode.WorkspaceEdit();
            const newScriptTag = scriptText.replace('<script', '<script defer');
            edit.replace(uri, range, newScriptTag);
            await vscode.workspace.applyEdit(edit);
        })
    );

    // async 속성 추가 명령어
    context.subscriptions.push(
        vscode.commands.registerCommand('greenPattern.addAsyncAttribute', async (uri: vscode.Uri, range: vscode.Range, scriptText: string) => {
            const edit = new vscode.WorkspaceEdit();
            const newScriptTag = scriptText.replace('<script', '<script async');
            edit.replace(uri, range, newScriptTag);
            await vscode.workspace.applyEdit(edit);
        })
    );

    // Pattern 2: div 태그 분석 정보 표시 명령어 등록
    context.subscriptions.push(
        vscode.commands.registerCommand('greenPattern.showDivAnalysis', () => {
            vscode.window.showInformationMessage(
                'DOM 최적화 방법:\n' +
                '1. 불필요한 div 제거\n' +
                '2. CSS Grid/Flexbox 사용\n' +
                '3. 시맨틱 태그 활용 (section, article, nav 등)',
                '자세히 알아보기'
            ).then(selection => {
                if (selection === '자세히 알아보기') {
                    vscode.env.openExternal(vscode.Uri.parse(
                        'https://web.dev/dom-size/'
                    ));
                }
            });
        })
    );

    // Grid 레이아웃으로 변환
    context.subscriptions.push(
        vscode.commands.registerCommand('greenPattern.convertToGrid', async (uri: vscode.Uri, position: vscode.Range) => {
            const edit = new vscode.WorkspaceEdit();
            edit.insert(
                uri,
                new vscode.Position(0, 0),
                `<style>\n.grid-container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 1rem;\n}\n</style>\n`
            );
            await vscode.workspace.applyEdit(edit);
        })
    );

    // Flexbox 레이아웃으로 변환
    context.subscriptions.push(
        vscode.commands.registerCommand('greenPattern.convertToFlex', async (uri: vscode.Uri, position: vscode.Range) => {
            const edit = new vscode.WorkspaceEdit();
            edit.insert(
                uri,
                new vscode.Position(0, 0),
                `<style>\n.flex-container {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n</style>\n`
            );
            await vscode.workspace.applyEdit(edit);
        })
    );

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('green-lens.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from green-lens!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
