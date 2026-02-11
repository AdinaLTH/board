function loadBoardData(endpoint) {
  fetch(SERVER_URL + endpoint)
    .then((resp) => resp.json())
    .then((data) => {
      const tbody = document.querySelector(".boardList tbody");

      // ★ 핵심: 다른 게시판 버튼을 눌렀을 때 기존 글이 밑에 계속 쌓이지 않도록,
      // 새 데이터를 넣기 전에 화면을 한 번 깨끗하게 지워줍니다!
      tbody.innerHTML = "";

      // 데이터가 없을 때의 예외 처리
      if (data.length === 0) {
        tbody.innerHTML =
          "<tr><td colspan='7' style='text-align:center;'>게시글이 없습니다.</td></tr>";
        return;
      }

      data.forEach((ele) => {
        const tr = makeRow(ele);
        tbody.appendChild(tr);
      });
    })
    .catch((error) => console.error("데이터 불러오기 실패:", error));
}

function makeRow(ele = {}) {
  const tr = document.createElement("tr");
  for (let prop of [
    "POST_ID",
    "CATEGORY_NAME",
    "TITLE",
    "NICKNAME",
    "VIEW_COUNT",
    "NET_LIKES",
    "CREATED_AT",
  ]) {
    const td = document.createElement("td");
    td.innerHTML = ele[prop];
    console.log(td);
    tr.appendChild(td);
  }

  // 작업 반환
  return tr;
}
