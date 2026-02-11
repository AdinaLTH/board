const SERVER_URL = "http://localhost:3000";

fetch(SERVER_URL + "/post/main/1")
  .then((resp) => resp.json())
  .then((data) => {
    data.forEach((ele) => {
      console.log(ele);
      const tr = makeRow(ele);
      document.querySelector(".boardList tbody").appendChild(tr);
    });
  });
