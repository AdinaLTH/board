const SERVER_URL = "http://localhost:3000";

// URL에서 id 파라미터 확인 (있으면 수정 모드, 없으면 작성 모드)
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

const isEditMode = postId ? true : false;

// 1. 화면 초기화
window.onload = async () => {
  if (isEditMode) {
    // [수정 모드]
    document.getElementById("page-title").innerText = "글 수정하기";
    document.getElementById("btn-save").innerText = "수정 완료";

    // 기존 데이터 불러와서 채워넣기
    await loadPostData(postId);
  }
};

// 2. 기존 데이터 불러오기 (수정 모드용)
async function loadPostData(id) {
  try {
    const res = await fetch(`${SERVER_URL}/api/post/view/${id}`); // 기존 조회 API 재활용!
    const data = await res.json(); // 주의: 백엔드 수정 전이면 view_count가 올라갈 수 있음 (감수하거나 별도 API 분리)

    // input창들에 값 채우기
    document.getElementById("category").value = getCategoryIdByName(
      data.CATEGORY_NAME,
    ); // 이름->ID 변환 필요 (아래 함수 참고)
    document.getElementById("title").value = data.TITLE;
    document.getElementById("nickname").value = data.NICKNAME;
    document.getElementById("content").value = data.CONTENT;

    // 닉네임은 수정 못하게 막기 (선택사항)
    document.getElementById("nickname").readOnly = true;
    document.getElementById("nickname").style.backgroundColor = "#333";
  } catch (err) {
    console.error("데이터 로드 실패:", err);
    alert("글 정보를 불러오지 못했습니다.");
    history.back();
  }
}

// 3. 등록/수정 버튼 클릭 이벤트
document.getElementById("btn-save").addEventListener("click", async () => {
  const title = document.getElementById("title").value;
  const nickname = document.getElementById("nickname").value;
  const password = document.getElementById("password").value;
  const content = document.getElementById("content").value;
  const categoryId = document.getElementById("category").value;

  // 유효성 검사
  if (!title || !nickname || !password || !content) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  const endpoint = isEditMode ? "/api/post/update" : "/api/post/write";

  // 보낼 데이터
  const payload = {
    title,
    nickname,
    password,
    content,
    category_id: categoryId,
  };

  // 수정 모드일 때는 글 번호도 같이 보내야 함
  if (isEditMode) {
    payload.postId = postId;
  }

  try {
    const res = await fetch(`${SERVER_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (result.success) {
      alert(isEditMode ? "수정되었습니다." : "등록되었습니다.");
      // 상세 페이지로 이동
      const newId = isEditMode ? postId : result.POST_ID;
      location.href = `view.html?id=${newId}`;
    } else {
      // 비밀번호 틀림 등
      alert(result.message || "처리 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류 발생");
  }
});

// [헬퍼 함수] 카테고리 이름으로 ID 찾기 (간단 하드코딩)
// 백엔드에서 category_id를 직접 주면 더 좋지만, 지금 view API는 이름만 줌
function getCategoryIdByName(name) {
  if (name === "잡담") return 1;
  if (name === "질문") return 2;
  if (name === "정보") return 3;
  if (name === "창작") return 4;
  return 1; // 기본값
}
