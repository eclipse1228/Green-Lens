import * as vscode from 'vscode';
import { parse, HTMLElement } from 'node-html-parser';

export class ScriptTagActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];
        
        context.diagnostics
            .filter(diagnostic => diagnostic.code === 'green-lens-script-blocking')
            .forEach(diagnostic => {
                const addDefer = new vscode.CodeAction(
                    'defer 속성 추가',
                    vscode.CodeActionKind.QuickFix
                );

                addDefer.edit = new vscode.WorkspaceEdit();
                const scriptTag = document.getText(diagnostic.range);
                const newScriptTag = scriptTag.replace('<script', '<script defer');
                addDefer.edit.replace(document.uri, diagnostic.range, newScriptTag);
                actions.push(addDefer);

                const addAsync = new vscode.CodeAction(
                    'async 속성 추가',
                    vscode.CodeActionKind.QuickFix
                );
                addAsync.edit = new vscode.WorkspaceEdit();
                const newAsyncScriptTag = scriptTag.replace('<script', '<script async');
                addAsync.edit.replace(document.uri, diagnostic.range, newAsyncScriptTag);
                actions.push(addAsync);
            });

        return actions;
    }
}

export class ScriptTagLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const root = parse(text);
        
        const scripts = root.querySelectorAll('script');
        scripts.forEach((script: HTMLElement) => {
            const src = script.getAttribute('src');
            if (src && !script.hasAttribute('defer') && !script.hasAttribute('async')) {
                const scriptText = script.toString();
                const index = text.indexOf(scriptText);
                if (index !== -1) {
                    const position = new vscode.Range(
                        document.positionAt(index),
                        document.positionAt(index + scriptText.length)
                    );
                    
                    codeLenses.push(new vscode.CodeLens(position, {
                        title: '📝 스크립트 최적화 방법 보기',
                        command: 'greenPattern.showScriptOptimizationInfo'
                    }));
                }
            }
        });
        
        return codeLenses;
    }
}

export function checkScriptTag(script: HTMLElement, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[], location: 'head' | 'early-body'): void {
    const src = script.getAttribute('src');
    const hasDefer = script.hasAttribute('defer');
    const hasAsync = script.hasAttribute('async');

    if (src && !hasDefer && !hasAsync) {
        const position = findScriptPosition(document, script.toString());
        if (position) {
            const message = location === 'head'
                ? 'head 태그 내의 스크립트는 HTML 파싱을 차단할 수 있습니다. defer나 async 속성 사용을 고려해보세요.'
                : 'body 태그 초반의 스크립트는 렌더링을 지연시킬 수 있습니다. defer나 async 속성을 추가하거나 body 끝으로 이동을 고려해보세요.';

            const diagnostic = new vscode.Diagnostic(
                position,
                message,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.code = 'green-lens-script-blocking';
            diagnostic.source = 'Green lens';
            diagnostics.push(diagnostic);
        }
    }
}

function findScriptPosition(document: vscode.TextDocument, scriptText: string): vscode.Range | undefined {
    const text = document.getText();
    const index = text.indexOf(scriptText);
    
    if (index !== -1) {
        const startPos = document.positionAt(index);
        const endPos = document.positionAt(index + scriptText.length);
        return new vscode.Range(startPos, endPos);
    }
    
    return undefined;
}