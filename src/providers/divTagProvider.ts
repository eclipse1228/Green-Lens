import * as vscode from 'vscode';
import { parse, HTMLElement } from 'node-html-parser';

/**
 * DivTagLensProvider 클래스
 * HTML 문서의 첫 번째 div 태그에 코드 개선 제안을 제공하는 CodeLens 구현
 */

export class DivTagLensProvider implements vscode.CodeLensProvider {
    // CodeLens 이벤트 이미터 추가
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    /**
     * CodeLens 제공자 구현
     * @param document 분석할 텍스트 문서
     * @returns CodeLens 배열
     */
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        
        // HTML이 아닌 문서는 처리하지 않음
        if (document.languageId !== 'html') {
            return [];
        }

        const text = document.getText();
        const root = parse(text);
        
        // body 태그 내의 첫 번째 div 찾기
        const body = root.querySelector('body');
        if (body) {
            // 첫 번째 div만 찾기
            const firstDiv = body.querySelector('div');
            if (firstDiv) {
                const elementText = firstDiv.toString();
                const index = text.indexOf(elementText);
                if (index !== -1) {
                    const position = new vscode.Range(
                        document.positionAt(index),
                        document.positionAt(index + elementText.length)  // 전체 div 태그 길이만큼 범위 지정
                    );

                    // div 구조 검사 제안
                    codeLenses.push(new vscode.CodeLens(position, {
                        title: ' 불필요한 div가 있는지 확인하세요',
                        command: 'greenPattern.showDivAnalysis'
                    }));
                }
            }
        }
        return codeLenses;
    }
}

/**
 * div 태그의 중첩 수준을 검사하고 진단 정보를 생성
 */
export function checkDivNesting(element: HTMLElement, level: number, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]): void {
    if (element.tagName?.toLowerCase() === 'div') {
        level++;
        if (level >= 3) {
            const elementText = element.toString();
            const index = document.getText().indexOf(elementText);
            if (index !== -1) {
                const position = new vscode.Range(
                    document.positionAt(index),
                    document.positionAt(index + elementText.length)
                );
                const diagnostic = new vscode.Diagnostic(
                    position,
                    'div 태그가 너무 많이 중첩되어 있습니다. CSS Grid나 Flexbox 사용을 고려해보세요.',
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.code = 'green-pattern-div-nesting';
                diagnostic.source = 'Green Pattern';
                diagnostics.push(diagnostic);
            }
        }
    }

    element.childNodes.forEach(child => {
        if (child instanceof HTMLElement) {
            checkDivNesting(child, level, document, diagnostics);
        }
    });
}

/**
 * 문서 내에서 HTML 요소의 위치를 찾아 Range 객체로 반환
 */
export function findElementPosition(document: vscode.TextDocument, elementText: string): vscode.Range | undefined {
    const text = document.getText();
    const index = text.indexOf(elementText);
    
    if (index !== -1) {
        const startPos = document.positionAt(index);
        const endPos = document.positionAt(index + elementText.length);
        return new vscode.Range(startPos, endPos);
    }
    
    return undefined;
}
