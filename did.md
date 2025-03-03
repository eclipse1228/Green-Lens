# 이미 진행한 사항
1. VS Code Extension 기본 구조 알아보기
프로젝트 생성

VS Code에서 공식적으로 제공하는 Yeoman Generator (yo code)를 이용하면, 템플릿 구조로 확장프로그램을 빠르게 시작할 수 있습니다.
npm i -g yo generator-code 명령어를 통해 설치한 후, yo code를 실행하면 새 확장프로그램 템플릿을 만들 수 있습니다.
구조 이해
생성된 폴더를 보면 크게 다음과 같은 파일들이 핵심입니다:

package.json: 확장프로그램 메타데이터, 의존성, 명령(Command), 설정(Contribution) 등이 정의됩니다.
extension.ts 또는 extension.js: 확장프로그램의 주 로직이 담기는 엔트리 포인트.
vsc-extension-quickstart.md: 생성 직후 함께 제공되는, 초보자 안내용 문서 (있을 경우).
핵심 함수

activate(context: vscode.ExtensionContext) 함수: VS Code가 이 확장프로그램을 로드할 때 호출되는 함수. 여기에서 필요한 이벤트 등록, 초기화 작업이 이뤄집니다.
deactivate() 함수: 확장프로그램이 비활성화되거나 종료될 때 호출됩니다. 일반적으로 정리 작업(clean-up) 시 활용됩니다.

이미 생성했음.
