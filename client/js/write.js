// 본인 컴퓨터의 IP 주소로 변경
const SERVER_URL = "http://192.168.0.32:3000";

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
    fileInfo: uploadedFileInfo,
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

// ★ 파일 정보를 담아둘 변수
let uploadedFileInfo = null;

// ==========================================
// 📷 드래그 앤 드롭 이벤트 처리 (강화판)
// ==========================================
const dropZone = document.querySelector(".file-drop-zone");

// 1. 브라우저 전체의 기본 동작(파일 열기) 막기 ★ 중요!
// (이게 없으면 박스 밖에 놓쳤을 때 페이지가 넘어가버림)
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  window.addEventListener(eventName, preventDefaults, false);
  dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// 2. 박스 안에 들어왔을 때 효과 주기 (Highlight)
["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, highlight, false);
});

// 3. 박스 밖으로 나갔거나 파일을 놨을 때 효과 끄기 (Unhighlight)
["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropZone.style.backgroundColor = "#2a2a2a";
  dropZone.style.borderColor = "#007bff";
  dropZone.style.transform = "scale(1.02)"; // 살짝 커지는 효과
  dropZone.style.transition = "all 0.2s";
}

function unhighlight(e) {
  dropZone.style.backgroundColor = ""; // 원래대로
  dropZone.style.borderColor = "";
  dropZone.style.transform = "scale(1)";
}

// 4. 파일을 떨어뜨렸을 때 (진짜 업로드 로직)
dropZone.addEventListener("drop", async (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length === 0) return;

  console.log("파일 감지됨:", files[0].name); // 확인용 로그

  // 파일 업로드 함수 호출
  await uploadFileToServer(files[0]);
});

// 5. (옵션) 클릭해서 업로드하기 기능 추가
// HTML 어딘가에 <input type="file" id="fileInput" hidden> 이 있어야 함.
// 없다면 dropZone 클릭 시 아무 일도 안 일어나게 두거나, 동적으로 생성해서 처리.
dropZone.addEventListener("click", () => {
  let input = document.createElement("input");
  input.type = "file";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) await uploadFileToServer(file);
  };
  input.click();
});

// ★ 서버로 파일 보내기 (기존 코드 유지)
async function uploadFileToServer(file) {
  // ... (이 부분은 아까 드린 코드 그대로 쓰시면 됩니다) ...
  const formData = new FormData();
  formData.append("file", file);

  try {
    // 로딩 표시 (사용자 안심시키기)
    dropZone.innerHTML = "<p>⏳ 업로드 중...</p>";

    const res = await fetch(`${SERVER_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    const json = await res.json();

    if (json.success) {
      uploadedFileInfo = json;

      // 이미지면 미리보기, 아니면 파일명 표시
      if (json.fileType.startsWith("image")) {
        dropZone.innerHTML = `
                    <img src="${SERVER_URL}${json.filePath}" style="max-height: 100%; max-width: 100%; border-radius: 5px; object-fit: contain;">
                `;
      } else {
        dropZone.innerHTML = `<p>✅ 파일 준비 완료: ${json.originalName}</p>`;
      }
      dropZone.style.padding = "10px"; // 이미지 꽉 차게 패딩 조절
    } else {
      dropZone.innerHTML = "<p>❌ 업로드 실패. 다시 시도해주세요.</p>";
      alert("업로드 실패");
    }
  } catch (err) {
    console.error(err);
    dropZone.innerHTML = "<p>❌ 에러 발생</p>";
    alert("업로드 중 에러 발생");
  }
}

// ==========================================
// 📝 등록 버튼 클릭 이벤트 수정
// ==========================================
document.getElementById("btn-save").addEventListener("click", async () => {
  // ... (기존 값 가져오는 코드들: title, nickname 등) ...
  const title = document.getElementById("title").value;
  const nickname = document.getElementById("nickname").value;
  const password = document.getElementById("password").value;
  const content = document.getElementById("content").value;
  const categoryId = document.getElementById("category").value;

  if (!title || !nickname || !password || !content) {
    alert("내용을 입력해주세요.");
    return;
  }

  // Payload에 파일 정보 추가!
  const payload = {
    title,
    nickname,
    password,
    content,
    category_id: categoryId,
    fileInfo: uploadedFileInfo, // ★ 여기에 파일 정보 담아서 보냄
  };

  // ... (이후 fetch 호출 로직은 기존과 동일) ...
  // ... body: JSON.stringify(payload) ...
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
