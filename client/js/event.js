// event.js

// 1. 부모 요소인 categoryList를 찾아서 클릭 이벤트를 단 딱 1번만 겁니다.
document.querySelector(".categoryList").addEventListener("click", (e) => {
  // 2. 부모 영역 아무 곳이나 클릭할 수 있으니, 클릭된 놈(e.target)이 '버튼'일 때만 실행하게 막아줍니다.
  if (e.target.tagName === "BUTTON") {
    // 3. 클릭된 버튼에 숨겨둔 data-url 값을 꺼내옵니다.
    const url = e.target.getAttribute("data-url");

    // 4. url이 존재한다면, 서버에 데이터를 요청합니다!
    if (url) {
      console.log(`🚀 ${e.target.innerText} 버튼 클릭! 요청 주소: ${url}`);

      // 기존에 만들어둔 fetch 함수를 여기서 호출합니다.
      // (아래 함수는 다음 단계에서 sample.js에 만들어 볼 겁니다)
      loadBoardData(url);
    }
  }
});
