# 기획
VSCode 확장프로그램: green code pattern insight Extention 을 만들겁니다.

해당 자료는 GreenSoftware 재단의  Avoid chaining critical requests | Green Software Patterns 에 올라온 web 개발과 관련된 13가지 규칙에 
근거해서 만들겁니다.

vscode 확장프로그램을 통해 바꾸라고 강요할 순 없습니다.
다만, "이런 방법은 어때?"라는 방식으로 추천해줄 수 있습니다. 왜냐하면, 개발자가 여러가지 고려야할 사항이 충분히 많기 때문입니다.

# 패턴
## A. Diagnostics 활용

- **진단 규칙**
    1. `<script src="...">` 태그가 문서 초반( `<head>` 또는 `<body>` 상단 )에 있고, `defer`나 `async`가 없는 경우
        - **메시지**: “스크립트가 HTML 파싱을 차단할 수 있습니다. `defer`나 `async`를 고려해보세요.”
        - 근데, 문서 ‘초반’은 어디로?? 정해야하나?
            - head 안에 script가 있거나,
            - body 매우 초반에 script 태그가 있거나,
            - body 의 끝이 아니라 중간에 script 태그가 있음
    2. 동적 로드(예: `import()`)가 가능한 대형 라이브러리(React, Chart.js 등)를 한 번에 로드하는 경우
        - **메시지**: “이 라이브러리는 페이지 초기 로딩을 지연시킬 수 있습니다. 필요할 때만 로드하는 방식을 검토하세요.”
- **구현 아이디어**
    - 정규식 / AST 파서로 `<script>` 태그 위치 및 속성 체크
    - JS 파일에서 `import X from 'bigLib'` 형태가 감지되면, “코드 스플리팅/동적 로드 고려” 경고.
    - [vscode-error-lens](https://github.com/usernamehw/vscode-error-lens) 의 모양 처럼 색을 칠하고, 코드 옆에 경고 메시지를 넣는다.
    
    ## B. Code Lens

- **예시**: 스크립트 라인 위에 “Green Suggestion: Use `defer` or `async`?” 라는 작은 링크를 표시
- 클릭 시 팝업(메시지 박스) or 문서 링크:
    
    > "이 스크립트가 페이지 로딩을 막을 수 있습니다. defer/async를 사용하면 HTML 파싱이 차단되지 않습니다. [더 자세히 보기]"

저는 일단, A,B 둘 다 해보고 싶습니다.

# 계획


## 분석 로직 
1. 인사이트가 필요한 코드를 찾아야합니다.
    - **JavaScript/TypeScript**: Babel, TypeScript Compiler API 등을 이용해 AST(추상 구문 트리) 기반 분석.
1. 분석(Analysis) 단계
    AST(추상 구문 트리)를 이용해 JavaScript/TypeScript 코드를 파싱하거나, 정규식 기반 분석(간단 케이스) 등을 적용
    “Critical Request Chain” 가능성이 있는 부분을 찾아냄
    예: <script src="main.js">를 찾고, async / defer가 누락되었는지 확인


## UI 표시 로직
2. UI를 통해 보여줘야한다.
    1. **Diagnostics 활용 (에디터 내 경고/오류 표시)**
        
        VS Code의 `vscode` 라이브러리에서 제공되는 `Diagnostic`및 `DiagnosticCollection`을 사용하면, 특정 위치(라인, 컬럼 범위)에 경고·오류 등을 표시할 수 있습니다.
        
        - 예: “이 부분에선 더 에너지 효율적인 API 사용 권장” 등의 경고 표시.
    2. **Code Lens**
        
        코드의 특정 위치 위에 작은 텍스트(링크 같은 형태)로 추가 정보를 노출. 클릭하면 더 자세한 설명을 보여주거나, 자동 리팩토링 기능을 제공할 수도 있습니다.


## 테스트 (로그출력)
test.html (분석 예시로 사용할 html)

    ----

