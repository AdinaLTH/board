const express = require("express");
const { getConnection, oracledb } = require("./db");
const cors = require("cors");
const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("OK");
});

// 메인페이지 조회
app.get("/post/main/:page", async (req, res) => {
  const page = req.params.page;
  const sql = `select p.post_id, 
                      c.name as category_name, 
                      p.title, 
                      p.nickname, 
                      p.view_count, 
                      p.net_likes, 
                      to_char(p.created_at, 'MM-DD') as created_at
              from posts p, categories c
              where p.category_id = c.category_id
              order by p.post_id desc
              offset (:page-1)*10 rows fetch next 20 rows only`;
  const conn = await getConnection();
  const { metaData, rows } = await conn.execute(sql, { page });
  const json = JSON.stringify(rows);
  res.send(json);
});

// 개념페이지 조회
app.get("/post/popular/:page", async (req, res) => {
  const page = req.params.page;
  const sql = `select p.post_id, 
                      c.name as category_name, 
                      p.title, 
                      p.nickname, 
                      p.view_count, 
                      p.net_likes, 
                      p.created_at
              from posts p, categories c
              where p.category_id = c.category_id
              and net_likes >= 15
              order by post_id desc
              offset (:page - 1)*10 rows fetch next 20 rows only`;
  const conn = await getConnection();
  const { metaData, rows } = await conn.execute(sql, { page });
  const json = JSON.stringify(rows);
  res.send(json);
});

// 특정게시판 조회
app.get("/post/:category/:page", async (req, res) => {
  const category = req.params.category;
  const page = req.params.page;
  const sql = `select p.post_id, 
                      c.name as category_name, 
                      p.title, 
                      p.nickname, 
                      p.view_count, 
                      p.net_likes, 
                      p.created_at
              from posts p, categories c
              where p.category_id = :category
              and c.category_id = :category
              order by post_id desc
              offset (:page - 1)*10 rows fetch next 20 rows only`;
  const conn = await getConnection();
  const { metaData, rows } = await conn.execute(sql, { category, page });
  const json = JSON.stringify(rows);
  res.send(json);
});

// 글 상세 조회
// 글 작성
app.post("/write", async (req, res) => {
  console.log(req.body);
  const conn = await getConnection();
  const result = await conn.execute(
    `insert into posts (
      title,
      nickname,
      password,
      category_id,
      content
    ) values (
      :title,
      :nickname,
      :password,
      :category_id,
      :content
    ) returning post_id into :pid`,
    {
      pid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      title,
      nickname,
      password,
      category_id,
      content,
    },
    { autoCommit: true },
  );
  console.log(result);
  if (result.rowsAffected) {
    res.json({
      retCode: "OK",
      POST_ID: result.outBinds.pid[0],
      TITLE: title,
      NICKNAME: nickname,
      PASSWORD: password,
      CATEGORY_ID: category_id,
      CONTENT: content,
    });
  } else {
    res.json({ retCode: "NG" });
  }
});
// 글 수정
app.post("/update", async (req, res) => {});
// 글 삭제
//app.post("/delete");

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
