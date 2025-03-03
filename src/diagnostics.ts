// VSCode API와 HTML 파서 라이브러리를 가져옵니다
import * as vscode from 'vscode';
import { parse, HTMLElement } from 'node-html-parser';

// HTML 스크립트 태그 관련 진단을 처리하는 클래스입니다
export class GreenPatternDiagnostics {
    // VSCode의 진단 정보를 저장하는 컬렉션입니다(스크립트 태그 분석, 진단정보관리)
    private diagnosticCollection: vscode.DiagnosticCollection;
    // body 태그 내 스크립트 위치를 확인하기 위한 임계값입니다
    private static readonly EARLY_BODY_LINE_THRESHOLD = 10;

    // 클래스 생성자: 진단 컬렉션을 초기화합니다
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('green-lens');
    }

    // 확장 기능을 활성화하는 메서드입니다
    public activate(context: vscode.ExtensionContext) {
        // 현재 열린 편집기에 대한 진단을 실행합니다
        if (vscode.window.activeTextEditor) {
            this.refreshDiagnostics(vscode.window.activeTextEditor.document);
        }

        // 편집기가 변경될 때마다 진단을 실행합니다 
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.refreshDiagnostics(editor.document);
                }
            })
        );

        // 문서 내용이 변경될 때마다 진단을 실행합니다 
        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(e => this.refreshDiagnostics(e.document))
        );

        // 코드 액션 제공자를 등록합니다(이벤트 등록)
        context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider('html', new ScriptTagActionProvider(), {
                providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
            })
        );

        // 코드 렌즈 제공자를 등록합니다(이벤트 등록)
        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider('html', new ScriptTagLensProvider())
        );

    }

    // 진단을 새로 고치는 메서드입니다
    private refreshDiagnostics(document: vscode.TextDocument): void {
        // HTML 파일만 처리합니다
        if (document.languageId !== 'html') {
            return;
        }

        // 진단 결과를 저장할 배열입니다
        const diagnostics: vscode.Diagnostic[] = [];
        // 문서의 전체 내용을 가져옵니다
        const content = document.getText();
        // HTML을 파싱합니다
        const root = parse(content);
        
        // head 태그 내의 스크립트를 검사합니다
        const headScripts = root.querySelector('head')?.querySelectorAll('script') || [];
        headScripts.forEach((script: HTMLElement) => {
            this.checkScriptTag(script, document, diagnostics, 'head');
        });

        // body 태그 내의 스크립트를 검사합니다
        const bodyScripts = root.querySelector('body')?.querySelectorAll('script') || [];
        bodyScripts.forEach((script: HTMLElement, index: number) => {
            const scriptLine = this.getElementLine(document, script);
            if (scriptLine !== -1 && scriptLine < GreenPatternDiagnostics.EARLY_BODY_LINE_THRESHOLD) {
                this.checkScriptTag(script, document, diagnostics, 'early-body');
            }
        });

        // 진단 결과를 설정합니다
        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    // 스크립트 태그를 검사하는 메서드입니다
    private checkScriptTag(script: HTMLElement, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[], location: 'head' | 'early-body'): void {
        // 스크립트의 src 속성과 defer, async 속성을 확인합니다
        const src = script.getAttribute('src');
        const hasDefer = script.hasAttribute('defer');
        const hasAsync = script.hasAttribute('async');
        
        // src가 있고 defer나 async가 없는 경우 경고를 생성합니다
        if (src && !hasDefer && !hasAsync) {
            const position = this.findScriptPosition(document, script.toString());
            if (position) {
                const message = location === 'head' 
                    ? 'head 태그 내의 스크립트는 HTML 파싱을 차단할 수 있습니다. defer나 async 속성 사용을 고려해보세요.'
                    : 'body 태그 초반의 스크립트는 렌더링을 지연시킬 수 있습니다. defer나 async 속성을 추가하거나 body 끝으로 이동을 고려해보세요.';

                // 진단 객체를 생성하고 추가합니다
                const diagnostic = new vscode.Diagnostic(
                    position,
                    message,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.code = 'green-lens-script-blocking';
                diagnostic.source = 'Green lens'; // 사용자에게 보여질 진단 제공자의 이름 
                diagnostics.push(diagnostic);
            }
        }
    }

    // HTML 요소의 라인 번호를 찾는 메서드입니다
    private getElementLine(document: vscode.TextDocument, element: HTMLElement): number {
        const text = document.getText();
        const index = text.indexOf(element.toString());
        if (index === -1) return -1;
        return document.positionAt(index).line;
    }

    // 스크립트 태그의 위치를 찾는 메서드입니다
    private findScriptPosition(document: vscode.TextDocument, scriptText: string): vscode.Range | undefined {
        const text = document.getText();
        const index = text.indexOf(scriptText);
        
        if (index !== -1) {
            const startPos = document.positionAt(index);
            const endPos = document.positionAt(index + scriptText.length);
            return new vscode.Range(startPos, endPos);
        }
        
        return undefined;
    }

    // 리소스를 해제하는 메서드입니다
    /* 
    vscode 확장이 비활성화 되거나 종료될 때 호출된다. 메모리 누수 방지
    */
    public dispose() {
        this.diagnosticCollection.dispose();
    }
}

// 사용자가 진단 문제에 마우스 오버 시: provideCodeActions 호출 
// 스크립트 태그 관련 코드 액션을 제공하는 클래스입니다
class ScriptTagActionProvider implements vscode.CodeActionProvider {
    // 코드 액션을 제공하는 메서드입니다 // 클래스 메서드 이지만,  VSCODE가 자동으로 호출합니다. 마우스를 올릴때
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];
        
        // 스크립트 블로킹 관련 진단에 대한 수정 작업을 생성합니다
        context.diagnostics
        // 진단 목록에서 'green-lens-script-blocking' 코드를 가진 진단만 필터링
            .filter(diagnostic => diagnostic.code === 'green-lens-script-blocking')
            .forEach(diagnostic => {
                // defer 속성을 추가하는 코드 액션을 생성합니다
                const addDefer = new vscode.CodeAction(
                    'defer 속성 추가', //  사용자에게 보여질 액션 이름
                    vscode.CodeActionKind.QuickFix //  빠른 수정 유형의 액션임을 표시
                );

                // 워크스페이스 편집 객체 생성
                addDefer.edit = new vscode.WorkspaceEdit();
                // 현재 스크립트 태그 텍스트 가져오기
                const scriptTag = document.getText(diagnostic.range);
                // 스크립트 태그에 defer 속성 추가
                const newScriptTag = scriptTag.replace('<script', '<script defer');
                // 편집 내용을 워크스페이스에 적용
                addDefer.edit.replace(document.uri, diagnostic.range, newScriptTag);
                // 생성된 액션을 목록에 추가
                actions.push(addDefer);

                // async 속성을 추가하는 코드 액션을 생성합니다
                const addAsync = new vscode.CodeAction(
                    'async 속성 추가',
                    vscode.CodeActionKind.QuickFix
                );
                addAsync.edit = new vscode.WorkspaceEdit();
                const newAsyncTag = scriptTag.replace('<script', '<script async');
                addAsync.edit.replace(document.uri, diagnostic.range, newAsyncTag);
                actions.push(addAsync);
            });

        return actions;
    }
}

// 스크립트 태그에 대한 코드 렌즈를 제공하는 클래스입니다
class ScriptTagLensProvider implements vscode.CodeLensProvider {
    // 코드 렌즈를 제공하는 메서드입니다
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const root = parse(text);
        
        // 모든 스크립트 태그를 검사합니다
        const scripts = root.querySelectorAll('script');
        scripts.forEach((script: HTMLElement) => {
            const src = script.getAttribute('src');
            // src가 있고 defer나 async가 없는 스크립트에 대해 코드 렌즈를 생성합니다
            if (src && !script.hasAttribute('defer') && !script.hasAttribute('async')) {
                const scriptText = script.toString();
                const index = text.indexOf(scriptText);
                if (index !== -1) {
                    const position = new vscode.Range(
                        document.positionAt(index),
                        document.positionAt(index + scriptText.length)
                    );
                    
                    // 스크립트 최적화 정보를 보여주는 코드 렌즈를 추가합니다
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
