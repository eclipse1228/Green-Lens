import * as vscode from 'vscode';
import { parse } from 'node-html-parser';
import { ScriptTagActionProvider, ScriptTagLensProvider, checkScriptTag } from './providers/scriptTagProvider';
import { DivTagLensProvider, checkDivNesting } from './providers/divTagProvider';

export class GreenPatternDiagnostics {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private static readonly EARLY_BODY_LINE_THRESHOLD = 10;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('green-lens');
    }

    public activate(context: vscode.ExtensionContext) {
        if (vscode.window.activeTextEditor) {
            this.refreshDiagnostics(vscode.window.activeTextEditor.document);
        }

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.refreshDiagnostics(editor.document);
                }
            })
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(e => this.refreshDiagnostics(e.document))
        );

        // 코드 액션 제공자 등록
        context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider('html', new ScriptTagActionProvider(), {
                providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
            })
        );

        // 코드 렌즈 제공자 등록
        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider('html', new ScriptTagLensProvider())
        );

        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider('html', new DivTagLensProvider())
        );
    }

    private refreshDiagnostics(document: vscode.TextDocument): void {
        if (document.languageId !== 'html') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const content = document.getText();
        const root = parse(content);
        
        // head 태그 내의 스크립트를 검사
        const head = root.querySelector('head');
        if (head) {
            head.querySelectorAll('script').forEach(script => {
                checkScriptTag(script, document, diagnostics, 'head');
            });
        }

        // body 태그 내의 스크립트와 div를 검사
        const body = root.querySelector('body');
        if (body) {
            // 초반 스크립트 태그 검사
            const earlyScripts = body.querySelectorAll('script');
            earlyScripts.forEach(script => {
                const line = this.getElementLine(document, script);
                if (line <= GreenPatternDiagnostics.EARLY_BODY_LINE_THRESHOLD) {
                    checkScriptTag(script, document, diagnostics, 'early-body');
                }
            });

            // div 태그 분석
            const allDivs = body.querySelectorAll('div');
            const numberOfDivs = allDivs.length;

            if (numberOfDivs > 0) {
                const firstDiv = allDivs[0];
                const position = this.findElementPosition(document, firstDiv.toString());
                if (position) {
                    const diagnostic = new vscode.Diagnostic(
                        position,
                        `현재 ${numberOfDivs}개의 div가 존재합니다. 불필요한 div를 제거해서 Dom 사이즈를 줄여보세요.`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostic.code = 'green-pattern-div-count';
                    diagnostic.source = 'Green Pattern';
                    diagnostics.push(diagnostic);
                }
            }

            // div 중첩 레벨 검사
            checkDivNesting(body, 0, document, diagnostics);
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private getElementLine(document: vscode.TextDocument, element: any): number {
        const text = document.getText();
        const index = text.indexOf(element.toString());
        return document.positionAt(index).line;
    }

    private findElementPosition(document: vscode.TextDocument, elementText: string): vscode.Range | undefined {
        const text = document.getText();
        const index = text.indexOf(elementText);
        
        if (index !== -1) {
            const startPos = document.positionAt(index);
            const endPos = document.positionAt(index + elementText.length);
            return new vscode.Range(startPos, endPos);
        }
        
        return undefined;
    }

    public dispose() {
        this.diagnosticCollection.dispose();
    }
}
