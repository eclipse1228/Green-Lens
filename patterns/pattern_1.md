### 📌 **핵심 개념**

1. **Critical Rendering Path (CRP)**
    - 브라우저가 HTML, CSS, JavaScript 등을 받아서 화면에 표시하는 과정.
    - 이 과정에서 특정 파일(예: CSS, JS)이 모두 로드될 때까지 페이지가 멈추는 경우가 있음.
2. **Critical Request Chain (CRC, 중요 요청 체인)**
    - 웹 페이지를 로드하는 동안 **순차적으로** 발생하는 네트워크 요청들.
    - 특정 파일(예: 큰 JavaScript 파일)이 로드되기 전까지 나머지 콘텐츠도 로딩되지 않는 상황.
    - 요청이 직렬(Sequential)로 연결되면서 페이지가 늦게 뜨고, CPU/GPU도 불필요하게 오래 사용됨.
3. **문제점**
    - 요청이 직렬로 진행되면 전체 페이지 로딩 속도가 느려짐.
    - 불필요한 네트워크 트래픽과 CPU/GPU 사용 증가로 인해 에너지가 낭비됨.
    - 사용자 경험도 저하됨(첫 화면이 늦게 뜨고, 인터랙션이 지연됨).

---

### ✅ **해결 방법**

**“Critical Request Chain을 최대한 줄여라”**

- 중요한 파일이 로드될 때까지 기다리는 구조를 개선해야 함.

# **방법 1: 필요한 파일만 먼저 로드 (Lazy Loading)**

- JavaScript나 CSS 파일을 꼭 필요한 시점에 로드.

보통 아래와 같이 작성하면,

```bash
<script src="main.js"> </script>
```

- **HTML 파싱이 중단됨**→ 브라우저가 이 스크립트를 다운로드하고 실행할 때까지 HTML 렌더링이 멈춤 (Blocking)
- **JS 실행 후 HTML 파싱 계속됨**→ JavaScript 실행이 완료된 후 나머지 HTML을 해석하고 렌더링

**하지만,**

- `defer`  속성

예:

```html
<script src="main.js" defer></script>  <!-- HTML 파싱 후 실행 -->
```

- **HTML 파싱(로드)이 끝난 후 JavaScript 실행**
- **JS 실행 순서가 보장됨** (위에서 아래로 순차 실행)

**`async` 속성 (HTML 파싱과 무관하게 실행)**

예:

```html
<script src="script.js" async></script>
```

- **다운로드가 끝나는 즉시 실행 (HTML 파싱이 멈출 수 있음)**
- **JS 실행 순서가 보장되지 않음** (순서가 뒤죽박죽될 수 있음)

# **방법 2: CSS 및 JavaScript 병렬 로딩**

- 크리티컬한 CSS는 인라인(`<style>`)으로 넣고, 나머지는 나중에 로드.
- JavaScript도 여러 개의 작은 파일로 나누고 병렬로 로드.

### **✅ CSS 병렬 로딩**

**1️⃣ 중요 CSS만 먼저 로드하고 나머지는 나중에 로드 (Critical CSS)**

```html
<style>
  body {
    font-family: Arial, sans-serif;
  }
</style>
<link rel="stylesheet" href="style.css">
```

- **기본 스타일은 `<style>` 태그로 인라인**
- **나머지 CSS 파일(style.css)은 병렬로 로드됨**

**2️⃣ 나중에 CSS를 비동기 로드 (Lazy Loading)**

```html
<link rel="stylesheet" href="style.css" media="print" onload="this.onload=null;this.removeAttribute('media');">
```

- `media="print"`를 지정하면 브라우저는 처음에 로드하지 않음.
- `onload` 이벤트 발생 시 `media` 속성을 제거 → 스타일이 적용됨.**즉, CSS가 백그라운드에서 로드된 후 적용됨**.

### **✅ JavaScript 병렬 로딩 (React/X 방식이 아님)**

### **방법 1: 필요할 때 JavaScript 동적 로드**

```html
<button onclick="loadScript()">Load JS</button>

<script>
  function loadScript() {
    var script = document.createElement("script");
    script.src = "extra.js";
    document.body.appendChild(script);
  }
</script>
```

✅ 버튼을 누를 때만 **extra.js** 파일을 로드하도록 설정

✅ HTML을 파싱하는 동안 불필요한 JavaScript 실행을 막음

---

### **방법 2: defer, async 활용**

```html
<script defer src="main.js"></script>
<script defer src="extra.js"></script>
```

✅ `defer` 속성을 사용해 모든 JavaScript 파일을 **HTML 파싱이 끝난 후 실행**

✅ 여러 개의 JavaScript 파일이 있더라도 **실행 순서를 유지함**

---

### **방법 3: Webpack, ESBuild 번들링 & 코드 스플리팅**

```jsx
import('./largeModule.js').then((module) => {
  module.someFunction();
});
```

✅ **필요할 때만 모듈을 불러와 실행**

✅ **초기 페이지 로딩 속도를 개선**

✅ **React, Vue 같은 프레임워크에서 많이 사용됨**

# **방법 3: Server-side Rendering (SSR) & Static Site Generation (SSG)**

- 프론트엔드에서 모든 걸 렌더링하는 방식 대신, 서버에서 미리 HTML을 만들어 제공하면 로딩 시간이 줄어듦. (nextjs,tymeleaf..)

# **방법 4: CDN 및 캐싱 사용**

- 정적 자원(JS, CSS, 이미지 등)을 CDN(Content Delivery Network)에 올려서 빠르게 로드.
- 브라우저 캐싱을 활용해 재요청을 줄임.

---

### 🌍 **소프트웨어 탄소 영향(SCI)와의 연관성**

SCI (Software Carbon Intensity) = (E * I) + M per R

(Energy * Intensity) + Memory per Request

- 페이지 렌더링 시간이 줄어들면, **E(소비 에너지)** 가 감소.
- 사용자의 네트워크 요청이 줄어들면, **I(네트워크 부하)** 도 감소.
- 페이지 로딩이 최적화되면 CPU/GPU 사용이 줄어들어 **M(메모리 사용)** 도 감소.

---

### 📢 **한 줄 요약**

**웹 개발에서 Critical Request Chain을 줄이면**

1️⃣ 페이지 로딩이 빨라지고

2️⃣ 네트워크 요청이 최적화되며

3️⃣ CPU/GPU 사용이 줄어들어

4️⃣ **더 적은 에너지로 더 효율적인 웹 환경을 만들 수 있다!** 🚀

---