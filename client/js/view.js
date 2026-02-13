// client/js/view.js
// 본인 컴퓨터의 IP 주소로 변경
const SERVER_URL = "http://192.168.0.32:3000";

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
    // (아까 app.js에서 FILE_PATH도 같이 주도록 수정했으니 data 안에 들어있습니다)
    const response = await fetch(`${SERVER_URL}/api/post/view/${postId}`);
    const data = await response.json();
    console.log("서버에서 받은 데이터:", data);

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

    // 본문 내용 채우기
    const contentDiv = document.getElementById("content");
    contentDiv.innerText = data.CONTENT;

    // ★ [핵심 추가] 이미지가 있으면 본문 맨 위에 표시하기
    if (data.FILE_PATH) {
      // 이미지 태그 생성
      const imgHtml = `
            <div style="margin-bottom: 20px;">
                <img src="${SERVER_URL}${data.FILE_PATH}" 
                     alt="첨부 이미지" 
                     style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            </div>
        `;

      // 본문(contentDiv)의 맨 앞(afterbegin)에 이미지 HTML 삽입
      contentDiv.insertAdjacentHTML("afterbegin", imgHtml);
    }

    // 추천/비추천
    document.getElementById("like_count").innerText = data.LIKE_COUNT || 0;
    document.getElementById("dislike_count").innerText =
      data.DISLIKE_COUNT || 0;
  } catch (error) {
    console.error("에러 발생:", error);
    alert("게시글을 불러오는데 실패했습니다.");
  }

  loadComments();
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

// 1. 댓글 목록 불러오기
// client/js/view.js 의 loadComments 함수 전체 교체

// [수정] 댓글 목록 불러오기 함수
// [수정] 댓글 목록 불러오기 함수 (최종)
async function loadComments() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  try {
    const res = await fetch(`${SERVER_URL}/api/comments/${postId}`);
    const comments = await res.json();

    document.getElementById("comment-total").innerText = comments.length;
    const listDiv = document.getElementById("comment-list");
    listDiv.innerHTML = "";

    comments.forEach((cmt) => {
      // 1. 깊이 계산
      const depthPadding = (cmt.DEPTH - 1) * 20;

      // 2. 답글 아이콘
      const isReply = cmt.DEPTH > 1 ? "reply" : "";
      const replyIcon =
        cmt.DEPTH > 1
          ? `<span style="color:#aaa; margin-right:5px;">└</span>`
          : "";

      // 3. 멘션 처리
      let mention = "";
      if (cmt.PARENT_NICKNAME) {
        mention = `<span style="color: #4da6ff; font-weight:bold; margin-right: 5px;">@${cmt.PARENT_NICKNAME}</span>`;
      }

      // 4. 이모티콘 이미지 태그 생성
      let emoticonHtml = "";
      if (cmt.EMOTICON_URL) {
        // 경로는 img/emoticons 폴더 기준
        emoticonHtml = `<img src="./img/emoticons/${cmt.EMOTICON_URL}" class="cmt-emoticon-img">`;
      }

      // ★ [핵심 추가] 내용이 null이면 빈 문자열로 변경
      // 오라클에서 빈 문자열("")을 NULL로 저장하기 때문에, 화면에 "null"이라고 뜨는 걸 방지함
      const safeContent = cmt.CONTENT === null ? "" : cmt.CONTENT;

      const html = `
                <div class="comment-item ${isReply}" id="cmt-${cmt.COMMENT_ID}" style="margin-left: ${depthPadding}px;">
                    <div class="cmt-meta">
                        <span class="cmt-writer">${replyIcon}${cmt.NICKNAME}</span>
                        <span>${cmt.CREATED_AT}</span>
                    </div>
                    
                    <div class="cmt-content">
                        ${mention}${safeContent}
                        ${emoticonHtml}
                    </div>
                    
                    <div class="cmt-actions">
                        <button class="cmt-btn" onclick="toggleReplyForm(${cmt.COMMENT_ID})">답글</button>
                        <button class="cmt-btn" onclick="deleteComment(${cmt.COMMENT_ID})">삭제</button>
                    </div>

                    <div class="reply-form" id="reply-form-${cmt.COMMENT_ID}">
                        <div class="form-row">
                            <input type="text" class="r-nick form-control" placeholder="닉네임">
                            <input type="password" class="r-pass form-control" placeholder="비밀번호">
                        </div>
                        <div class="form-row">
                            <textarea class="r-content form-control" placeholder="@${cmt.NICKNAME}님에게 답글 남기기" style="height: 60px;"></textarea>
                        </div>
                        <div style="text-align: right;">
                             <button class="btn-submit" onclick="writeComment(${cmt.COMMENT_ID})">등록</button>
                        </div>
                    </div>
                </div>
            `;
      listDiv.innerHTML += html;
    });
  } catch (err) {
    console.error("댓글 로딩 실패", err);
  }
}

// [수정] 댓글/답글 작성 함수
async function writeComment(parentCommentId = null) {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  let nick, pass, content;

  // 1. 데이터 가져오기 (답글 폼 vs 메인 폼)
  if (parentCommentId) {
    const form = document.getElementById(`reply-form-${parentCommentId}`);
    nick = form.querySelector(".r-nick").value;
    pass = form.querySelector(".r-pass").value;
    content = form.querySelector(".r-content").value;
  } else {
    nick = document.getElementById("cmt-nick").value;
    pass = document.getElementById("cmt-pass").value;
    content = document.getElementById("cmt-content").value;
  }

  // 2. 유효성 검사 (닉네임, 비번 필수)
  if (!nick || !pass) {
    alert("닉네임과 비밀번호를 입력해주세요.");
    return;
  }

  // 3. 내용 검사 (중요!)
  if (parentCommentId) {
    // 답글은 이모티콘 기능이 없으니 내용 필수
    if (!content) {
      alert("답글 내용을 입력해주세요.");
      return;
    }
  } else {
    // 메인 댓글은 '내용'과 '이모티콘' 둘 중 하나라도 있으면 OK
    if (!content && !selectedEmoticon) {
      alert("내용을 입력하거나 이모티콘을 선택해주세요.");
      return;
    }
  }

  try {
    const res = await fetch(`${SERVER_URL}/api/comments/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        parentCommentId,
        nickname: nick,
        password: pass,
        content,
        // ★ 핵심: 메인 댓글일 때만 선택된 이모티콘 정보를 같이 보냄
        emoticon: parentCommentId ? null : selectedEmoticon,
      }),
    });

    const json = await res.json();

    if (json.success) {
      // 4. 성공 시 초기화 작업
      if (!parentCommentId) {
        document.getElementById("cmt-content").value = "";

        // ★ 이모티콘 선택 상태 초기화
        selectedEmoticon = null;
        document.getElementById("emoticon-picker").style.display = "none"; // 창 닫기
        document.querySelector(".btn-emoji").classList.remove("active"); // 버튼 색 빼기

        // 모든 이미지의 선택 표시(파란 테두리) 제거
        const allEmoticons = document.querySelectorAll(".emoticon-item");
        allEmoticons.forEach((el) => el.classList.remove("selected"));
      }

      loadComments(); // 목록 새로고침
    } else {
      alert("작성 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류");
  }
}

// 3. 답글 폼 열고 닫기 (토글)
function toggleReplyForm(commentId) {
  const form = document.getElementById(`reply-form-${commentId}`);
  if (form.style.display === "block") {
    form.style.display = "none";
  } else {
    // (선택) 다른 열려있는 폼들 다 닫기
    document
      .querySelectorAll(".reply-form")
      .forEach((f) => (f.style.display = "none"));
    form.style.display = "block";
  }
}

// 4. 댓글 삭제
async function deleteComment(commentId) {
  const password = prompt("댓글 비밀번호를 입력하세요");
  if (!password) return;

  try {
    const res = await fetch(`${SERVER_URL}/api/comments/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, password }),
    });
    const json = await res.json();

    if (json.success) {
      alert("삭제되었습니다.");
      loadComments();
    } else {
      alert(json.message || "비밀번호가 틀립니다.");
    }
  } catch (err) {
    console.error(err);
  }
}
// client/js/view.js

// ==========================================
// 😀 이모티콘 관련 로직 (맨 아래 추가)
// ==========================================

// 1. 사용할 이모티콘 파일명 목록 (실제 파일명과 일치해야 함!)
const emoticonList = [
  "con1.png",
  "con2.png",
  "con3.png",
  "con4.png",
  "con5.png",
  "con6.png",
  // "con4.png", ... (더 있으면 추가)
];

let selectedEmoticon = null; // 현재 선택한 이모티콘

// 2. 이모티콘 팔레트 열기/닫기
function toggleEmoticonPicker() {
  const picker = document.getElementById("emoticon-picker");
  const btn = document.querySelector(".btn-emoji");

  if (picker.style.display === "none") {
    picker.style.display = "grid"; // 열기
    btn.classList.add("active"); // 버튼 파란색으로
    renderEmoticonPicker(); // 이미지 그리기
  } else {
    picker.style.display = "none"; // 닫기
    btn.classList.remove("active");
  }
}

// 3. 팔레트에 이미지 그려주기
function renderEmoticonPicker() {
  const picker = document.getElementById("emoticon-picker");
  picker.innerHTML = ""; // 초기화

  emoticonList.forEach((filename) => {
    const img = document.createElement("img");
    img.src = `./img/emoticons/${filename}`;
    img.className = "emoticon-item";

    // 이미 선택된 거면 강조 표시
    if (selectedEmoticon === filename) {
      img.classList.add("selected");
    }

    // 클릭 이벤트: 선택 또는 해제
    img.onclick = () => {
      // 이미 선택된 걸 또 누르면 해제 (토글)
      if (selectedEmoticon === filename) {
        selectedEmoticon = null;
        img.classList.remove("selected");
      } else {
        // 다른 거 선택했으면 기존 선택 지우고 새로 선택
        document
          .querySelectorAll(".emoticon-item")
          .forEach((el) => el.classList.remove("selected"));
        selectedEmoticon = filename;
        img.classList.add("selected");
      }
    };

    picker.appendChild(img);
  });
}
