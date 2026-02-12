// client/js/view.js
const SERVER_URL = "http://localhost:3000";

window.onload = async () => {
  // 1. URL에서 id 값 추출 (?id=1)
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  if (!postId) {
    alert("잘못된 접근입니다.");
    location.href = "mainPage.html";
    return;
  }

  try {
    // 2. 백엔드에 데이터 요청
    const response = await fetch(`${SERVER_URL}/api/post/view/${postId}`);
    const data = await response.json();

    if (response.status === 404) {
      alert("삭제되거나 없는 게시글입니다.");
      location.href = "mainPage.html";
      return;
    }

    // 3. HTML 요소에 데이터 꽂아넣기
    document.getElementById("category_name").innerText = data.CATEGORY_NAME;
    document.getElementById("post_title").innerText = data.TITLE;
    document.getElementById("nickname").innerText = data.NICKNAME;
    document.getElementById("created_at").innerText = data.CREATED_AT;
    document.getElementById("view_count").innerText = data.VIEW_COUNT;
    document.getElementById("content").innerText = data.CONTENT;

    // 추천/비추천
    document.getElementById("like_count").innerText = data.LIKE_COUNT || 0;
    document.getElementById("dislike_count").innerText =
      data.DISLIKE_COUNT || 0;
  } catch (error) {
    console.error("에러 발생:", error);
    alert("게시글을 불러오는데 실패했습니다.");
  }
};
// ==========================================
// 👍 추천 / 비추천 버튼 클릭 이벤트
// ==========================================
const likeBtn = document.querySelector(".btn-like");
const dislikeBtn = document.querySelector(".btn-dislike");

// 추천 버튼
likeBtn.onclick = () => sendVote("like");
// 비추천 버튼
dislikeBtn.onclick = () => sendVote("dislike");

async function sendVote(type) {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  try {
    const res = await fetch(`${SERVER_URL}/api/post/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, type }),
    });
    const json = await res.json();

    if (json.success) {
      // 화면 숫자 즉시 갱신
      document.getElementById("like_count").innerText = json.data.LIKE_COUNT;
      document.getElementById("dislike_count").innerText =
        json.data.DISLIKE_COUNT;
      alert(type === "like" ? "추천했습니다!" : "비추천했습니다.");
    } else {
      alert("오류가 발생했습니다.");
    }
  } catch (err) {
    console.error(err);
    alert("서버 통신 실패");
  }
}
// ==========================================
// 🗑️ 삭제 버튼 클릭 이벤트
// ==========================================
document.getElementById("btn-delete").onclick = async () => {
  const password = prompt("글 비밀번호를 입력하세요");
  if (!password) return;

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  try {
    const res = await fetch(`${SERVER_URL}/api/post/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, password }),
    });
    const json = await res.json();

    if (json.success) {
      alert("삭제되었습니다.");
      location.href = "mainPage.html"; // 목록으로 이동
    } else {
      alert(json.message); // "비밀번호가 틀렸습니다" 등
    }
  } catch (err) {
    console.error(err);
    alert("삭제 요청 실패");
  }
};

// ✏️ 수정 버튼 클릭 이벤트
document.getElementById("btn-edit").onclick = () => {
  // 현재 글 ID를 가지고 write.html로 이동!
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  location.href = `write.html?id=${postId}`;
};
