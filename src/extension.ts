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

    // 스크립트 최적화 정보 표시 명령어 등록
    context.subscriptions.push(
        vscode.commands.registerCommand('greenPattern.showScriptOptimizationInfo', () => {
            vscode.window.showInformationMessage(
                '스크립트 최적화 방법:\n' +
                '1. defer: 문서 파싱 완료 후 실행\n' +
                '2. async: 다운로드 완료 즉시 실행\n' +
                '3. body 끝부분으로 이동: 렌더링 차단 방지',
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
