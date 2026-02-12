// event.js

// [수정] 카테고리 버튼 클릭 이벤트
document.querySelector(".categoryList").addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const type = e.target.getAttribute("data-type");
    const id = e.target.getAttribute("data-id");

    currentState.type = type;
    currentState.categoryId = id ? parseInt(id) : 0;
    currentState.page = 1;

    // ★ 핵심 추가: 카테고리를 이동할 때도 검색어 초기화
    currentState.search = "";
    currentState.searchType = "all";
    document.getElementById("search-input").value = "";

    loadBoardData();
  }
});

// [추가] 정렬(Sort) 드롭다운 변경 시
document.getElementById("sort-select").addEventListener("change", (e) => {
  currentState.sort = e.target.value; // latest, oldest, popular
  currentState.page = 1; // 정렬 바꾸면 1페이지부터 보는 게 국룰
  loadBoardData();
});

// [추가] 보기 개수(Limit) 드롭다운 변경 시
document.getElementById("limit-select").addEventListener("change", (e) => {
  currentState.limit = parseInt(e.target.value); // 20, 40, 10
  currentState.page = 1;
  loadBoardData();
});

/// [수정] '전체글' 버튼 클릭 시 (초기화)
document.getElementById("btn-all").addEventListener("click", () => {
  currentState.type = "all";
  currentState.categoryId = 0;
  currentState.page = 1;

  // ★ 핵심 추가: 검색어 상태와 입력창 초기화
  currentState.search = "";
  currentState.searchType = "all";
  document.getElementById("search-input").value = "";

  loadBoardData();
});

// [수정] '개념글' 버튼 클릭 시
document.getElementById("btn-best").addEventListener("click", () => {
  currentState.type = "best";
  currentState.page = 1;

  // ★ 핵심 추가: 검색어 초기화
  currentState.search = "";
  currentState.searchType = "all";
  document.getElementById("search-input").value = "";

  loadBoardData();
});

// 검색 버튼 클릭 시
document.getElementById("btn-search").addEventListener("click", () => {
  const keyword = document.getElementById("search-input").value;
  currentState.search = keyword;
  currentState.page = 1; // 검색하면 1페이지부터
  loadBoardData();
});

// 엔터키 쳐도 검색되게 하기
document.getElementById("search-input").addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    document.getElementById("btn-search").click();
  }
});

// [검색] 버튼 클릭 시 동작
document.getElementById("btn-search").addEventListener("click", () => {
  runSearch();
});

// [검색] 인풋창에서 엔터키 입력 시 동작
document.getElementById("search-input").addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    runSearch();
  }
});

// 검색 실행 함수 (중복 제거를 위해 분리)
function runSearch() {
  const keyword = document.getElementById("search-input").value;
  const type = document.getElementById("search-type").value; // 제목, 작성자 등 선택값

  // 상태 업데이트
  currentState.search = keyword;
  currentState.searchType = type;
  currentState.page = 1; // 검색하면 무조건 1페이지부터 보여주기

  console.log("검색 실행:", currentState); // 확인용 로그
  loadBoardData();
}
