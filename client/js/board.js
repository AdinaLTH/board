// client/js/board.js

const SERVER_URL = "http://localhost:3000";

// ★ 상태 변수에 search와 searchType 추가
let currentState = {
  page: 1,
  limit: 20,
  sort: "latest",
  type: "all",
  categoryId: 0,
  search: "", // 검색어
  searchType: "all", // 검색 조건 (제목, 작성자 등)
};

async function loadBoardData() {
  try {
    // ★ 핵심: 서버로 보낼 때 search와 searchType을 쿼리 스트링에 꼭 넣어야 함!
    const query = `?page=${currentState.page}&limit=${currentState.limit}&sort=${currentState.sort}&type=${currentState.type}&categoryId=${currentState.categoryId}&search=${currentState.search}&searchType=${currentState.searchType}`;

    console.log("요청 URL:", query); // F12 콘솔에서 확인용

    const response = await fetch(`${SERVER_URL}/api/posts${query}`);
    const result = await response.json();

    // ... (아래 내용은 기존과 동일) ...
    const tbody = document.querySelector(".boardList tbody");
    tbody.innerHTML = "";

    if (!result.data || result.data.length === 0) {
      tbody.innerHTML =
        "<tr><td colspan='7' style='text-align:center;'>검색 결과가 없습니다.</td></tr>";
      document.getElementById("pagination").innerHTML = "";
      return;
    }

    result.data.forEach((ele) => {
      const tr = makeRow(ele);
      tbody.appendChild(tr);
    });

    renderPagination(result.pagination);
  } catch (error) {
    console.error("게시글 로딩 실패:", error);
  }
}

// ... makeRow, renderPagination 함수 등은 기존 그대로 유지 ...

// 4. 페이지 번호 버튼 그리는 함수
function renderPagination(pagination) {
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML = "";

  const { totalPages, currentPage } = pagination;

  // [1] << (맨 처음) 버튼
  const firstBtn = document.createElement("button");
  firstBtn.innerText = "<<";
  firstBtn.onclick = () => {
    currentState.page = 1;
    loadBoardData();
  };
  firstBtn.disabled = currentPage === 1; // 1페이지면 비활성화
  paginationDiv.appendChild(firstBtn);

  // [2] < (이전) 버튼
  const prevBtn = document.createElement("button");
  prevBtn.innerText = "<";
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentState.page = currentPage - 1;
      loadBoardData();
    }
  };
  prevBtn.disabled = currentPage === 1;
  paginationDiv.appendChild(prevBtn);

  // [3] 숫자 버튼들 (현재 페이지 기준으로 앞뒤 2개씩만 보여주기 등 로직 추가 가능)
  // 지금은 심플하게 전체 다 보여줍니다.
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPage) {
      btn.classList.add("active"); // CSS에서 색칠할 클래스
      btn.style.backgroundColor = "#007bff"; // 임시 스타일
      btn.style.borderColor = "#007bff";
    }

    btn.onclick = () => {
      currentState.page = i;
      loadBoardData();
    };
    paginationDiv.appendChild(btn);
  }

  // [4] > (다음) 버튼
  const nextBtn = document.createElement("button");
  nextBtn.innerText = ">";
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentState.page = currentPage + 1;
      loadBoardData();
    }
  };
  nextBtn.disabled = currentPage === totalPages;
  paginationDiv.appendChild(nextBtn);

  // [5] >> (맨 끝) 버튼
  const lastBtn = document.createElement("button");
  lastBtn.innerText = ">>";
  lastBtn.onclick = () => {
    currentState.page = totalPages;
    loadBoardData();
  };
  lastBtn.disabled = currentPage === totalPages;
  paginationDiv.appendChild(lastBtn);
}

// 5. 테이블 행(TR) 만드는 함수 (기존과 동일하지만 데이터 필드명 확인 필요)
function makeRow(ele = {}) {
  const tr = document.createElement("tr");
  const columns = [
    "POST_ID",
    "CATEGORY_NAME",
    "TITLE",
    "NICKNAME",
    "VIEW_COUNT",
    "NET_LIKES",
    "CREATED_AT",
  ];

  for (let prop of columns) {
    const td = document.createElement("td");
    if (prop === "TITLE") {
      const link = document.createElement("a");
      link.href = `view.html?id=${ele.POST_ID}`;
      link.innerText = ele[prop];
      link.style.color = "inherit";
      link.style.textDecoration = "none";
      link.style.fontWeight = "bold";
      td.appendChild(link);
    } else {
      td.innerText = ele[prop] !== undefined ? ele[prop] : ""; // undefined 방지
    }
    tr.appendChild(td);
  }
  return tr;
}

// board.js 맨 아래에 추가

async function loadSidebar() {
  // 1. 최근 글 5개 가져오기 (limit=5, sort=latest)
  const recentRes = await fetch(
    `${SERVER_URL}/api/posts?page=1&limit=5&sort=latest`,
  );
  const recentData = await recentRes.json();

  // HTML에 뿌리기
  const recentUl = document.getElementById("recent-posts");
  recentUl.innerHTML = "";
  recentData.data.forEach((post) => {
    recentUl.innerHTML += `<li><a href="view.html?id=${post.POST_ID}">${post.TITLE}</a></li>`;
  });

  // 2. 개념글 5개 가져오기 (limit=5, type=best)
  const bestRes = await fetch(
    `${SERVER_URL}/api/posts?page=1&limit=5&type=best`,
  );
  const bestData = await bestRes.json();

  const bestUl = document.getElementById("side-best-posts");
  bestUl.innerHTML = "";
  bestData.data.forEach((post) => {
    bestUl.innerHTML += `<li><a href="view.html?id=${post.POST_ID}">${post.TITLE}</a></li>`;
  });
}
// [추가] 사이드바 데이터 불러오기
async function loadSidebar() {
  try {
    // 1. 최근 글 5개 가져오기
    const recentRes = await fetch(
      `${SERVER_URL}/api/posts?page=1&limit=5&sort=latest`,
    );
    const recentData = await recentRes.json();

    const recentUl = document.getElementById("recent-posts");
    recentUl.innerHTML = "";

    if (recentData.data && recentData.data.length > 0) {
      recentData.data.forEach((post) => {
        // 제목이 너무 길면 자르기 (...)
        let title =
          post.TITLE.length > 15
            ? post.TITLE.substring(0, 15) + "..."
            : post.TITLE;
        recentUl.innerHTML += `<li><a href="view.html?id=${post.POST_ID}">📄 ${title}</a></li>`;
      });
    } else {
      recentUl.innerHTML = "<li>글이 없습니다.</li>";
    }

    // 2. 개념글 5개 가져오기
    const bestRes = await fetch(
      `${SERVER_URL}/api/posts?page=1&limit=5&type=best`,
    );
    const bestData = await bestRes.json();

    const bestUl = document.getElementById("side-best-posts");
    bestUl.innerHTML = "";

    if (bestData.data && bestData.data.length > 0) {
      bestData.data.forEach((post) => {
        let title =
          post.TITLE.length > 15
            ? post.TITLE.substring(0, 15) + "..."
            : post.TITLE;
        bestUl.innerHTML += `<li><a href="view.html?id=${post.POST_ID}">🏆 ${title}</a></li>`;
      });
    } else {
      bestUl.innerHTML = "<li>개념글이 없습니다.</li>";
    }
  } catch (err) {
    console.error("사이드바 로딩 실패:", err);
  }
}
