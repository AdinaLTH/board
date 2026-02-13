const express = require("express");
const { getConnection, oracledb } = require("./db");
const cors = require("cors");
const app = express();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../client/uploads")));

app.get("/", (req, res) => {
  res.send("OK");
});

// 메인페이지 조회
// app.get("/post/main/:page", async (req, res) => {
//   const page = req.params.page;
//   const sql = `select p.post_id,
//                       c.name as category_name,
//                       p.title,
//                       p.nickname,
//                       p.view_count,
//                       p.net_likes,
//                       to_char(p.created_at, 'MM-DD') as created_at
//               from posts p, categories c
//               where p.category_id = c.category_id
//               order by p.post_id desc
//               offset (:page-1)*10 rows fetch next 20 rows only`;
//   const conn = await getConnection();
//   const { metaData, rows } = await conn.execute(sql, { page });
//   const json = JSON.stringify(rows);
//   res.send(json);
// });

// 개념페이지 조회
// app.get("/post/popular/:page", async (req, res) => {
//   const page = req.params.page;
//   const sql = `select p.post_id,
//                       c.name as category_name,
//                       p.title,
//                       p.nickname,
//                       p.view_count,
//                       p.net_likes,
//                       to_char(p.created_at, 'MM-DD') as created_at
//               from posts p, categories c
//               where p.category_id = c.category_id
//               and net_likes >= 15
//               order by post_id desc
//               offset (:page - 1)*10 rows fetch next 20 rows only`;
//   const conn = await getConnection();
//   const { metaData, rows } = await conn.execute(sql, { page });
//   const json = JSON.stringify(rows);
//   res.send(json);
// });

// ============================================================
// 📌 게시글 목록 통합 조회 API (검색 기능 강화 버전)
// ============================================================
app.get("/api/posts", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const sort = req.query.sort || "latest";
  const type = req.query.type || "all";
  const categoryId = parseInt(req.query.categoryId) || 0;

  // ★ 추가된 파라미터: 검색어와 검색 타입
  const search = req.query.search || "";
  const searchType = req.query.searchType || "all";

  let conn;
  try {
    conn = await getConnection();

    let whereClause = "WHERE p.category_id = c.category_id";
    let binds = {};

    // 1. 카테고리/개념글 필터
    if (type === "best") {
      whereClause += " AND (p.like_count - p.dislike_count) >= 15";
    } else if (type === "category" && categoryId > 0) {
      whereClause += " AND p.category_id = :catId";
      binds.catId = categoryId;
    }

    // 2. ★ 검색 조건 동적 생성 (여기가 핵심!)
    if (search) {
      // 검색어가 있을 때만 실행
      if (searchType === "title") {
        whereClause += " AND p.title LIKE :search";
      } else if (searchType === "nickname") {
        whereClause += " AND p.nickname LIKE :search";
      } else {
        // 전체 검색 (제목 + 내용 + 닉네임)
        whereClause +=
          " AND (p.title LIKE :search OR p.content LIKE :search OR p.nickname LIKE :search)";
      }
      binds.search = `%${search}%`; // 앞뒤로 %를 붙여야 부분 검색이 됨
    }

    // 3. 정렬 (기존 동일)
    let orderClause = "ORDER BY p.post_id DESC";
    if (sort === "oldest") {
      orderClause = "ORDER BY p.post_id ASC";
    } else if (sort === "popular") {
      orderClause =
        "ORDER BY (p.like_count - p.dislike_count) DESC, p.post_id DESC";
    }

    // 4. 전체 개수 (검색 결과에 맞는 개수만 세야 함)
    // (limit, offset 제외한 binds 복사본 사용)
    const countBinds = { ...binds };
    const countSql = `SELECT count(*) as total FROM posts p, categories c ${whereClause}`;
    const countResult = await conn.execute(countSql, countBinds);
    const totalCount = countResult.rows[0].TOTAL;

    // 5. 데이터 조회
    const offset = (page - 1) * limit;
    binds.offset = offset;
    binds.limit = limit;

    const sql = `
      SELECT p.post_id, c.name as category_name, p.title, p.nickname, p.view_count, 
             (p.like_count - p.dislike_count) as net_likes, 
             to_char(p.created_at, 'MM-DD') as created_at
      FROM posts p, categories c
      ${whereClause}
      ${orderClause}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await conn.execute(sql, binds);

    res.json({
      data: result.rows,
      pagination: {
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit: limit,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "조회 실패" });
  } finally {
    if (conn)
      try {
        await conn.close();
      } catch (e) {}
  }
});

// // 글 상세 조회
// app.get("/post/view/:pid", async (req, res) => {
//   const pid = req.params.pid;
//   let conn;
//   try {
//     conn = await getConnection();
//     await conn.execute(
//       `update posts
//                     set view_count = view_count + 1
//                     where post_id = :pid`,
//       { pid: pid },
//       { autoCommit: true },
//     );
//     const sql = `select p.post_id,
//                         c.name as category_name,
//                         p.title,
//                         p.nickname,
//                         p.view_count,
//                         p.content,
//                         p.like_count,
//                         p.dislike_count,
//                         to_char(p.created_at, 'RRRR-MM-DD:HH24:MI:SS') as created_at
//                 from posts p, categories c
//                 where p.category_id = c.category_id
//                 and p.post_id = :pid`;
//     const { metaData, rows } = await conn.execute(sql, { pid });
//     if (rows.length > 0) {
//       // 배열 전체가 아니라 첫 번째 요소(객체)만 보냄
//       res.json(rows[0]);
//     } else {
//       res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "서버 에러 발생" });
//   } finally {
//     // ★ 매우 중요: 썼으면 제자리에! 연결 반드시 닫기
//     if (conn) {
//       try {
//         await conn.close();
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   }
// });
app.get("/api/post/view/:pid", async (req, res) => {
  const pid = parseInt(req.params.pid);
  let conn;
  try {
    conn = await getConnection();

    // 조회수 증가
    await conn.execute(
      `UPDATE POSTS SET VIEW_COUNT = VIEW_COUNT + 1 WHERE POST_ID = :pid`,
      { pid: pid },
      { autoCommit: true },
    );

    // ★ 핵심 변경: LEFT JOIN FILES f ON ...
    // 게시글(p)에 딸린 파일(f)이 있으면 가져오고, 없으면 맙니다.
    // 파일이 여러 개일 경우 가장 최근 것 하나만 가져오도록 정렬 후 1개만 자릅니다.
    const sql = `
      SELECT p.post_id, 
             c.name as category_name, 
             p.title, 
             p.nickname, 
             p.view_count,
             p.content, 
             p.like_count, 
             p.dislike_count, 
             TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
             f.file_path,        -- ★ 파일 경로 추가
             f.original_filename -- ★ 원본 파일명 추가
      FROM POSTS p
      JOIN CATEGORIES c ON p.category_id = c.category_id
      LEFT JOIN FILES f ON p.post_id = f.post_id 
      WHERE p.post_id = :pid
      ORDER BY f.file_id DESC -- 최신 파일 우선
      FETCH FIRST 1 ROWS ONLY
    `;

    const { rows } = await conn.execute(sql, { pid });

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 에러 발생" });
  } finally {
    if (conn)
      try {
        await conn.close();
      } catch (e) {}
  }
});

// ==========================================
// 📌 추천 / 비추천 API
// ==========================================
app.post("/api/post/vote", async (req, res) => {
  const { postId, type } = req.body; // type: 'like' 또는 'dislike'
  let conn;

  try {
    conn = await getConnection();

    // 1. 어떤 컬럼을 올릴지 결정
    const column = type === "like" ? "LIKE_COUNT" : "DISLIKE_COUNT";

    // 2. 카운트 증가 업데이트
    await conn.execute(
      `UPDATE POSTS SET ${column} = ${column} + 1 WHERE POST_ID = :id`,
      [postId],
      { autoCommit: true },
    );

    // 3. 증가된 최신 값 가져와서 돌려주기 (화면 갱신용)
    const result = await conn.execute(
      `SELECT LIKE_COUNT, DISLIKE_COUNT FROM POSTS WHERE POST_ID = :id`,
      [postId],
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "투표 실패" });
  } finally {
    if (conn)
      try {
        await conn.close();
      } catch (e) {}
  }
});

// ==========================================
// 📌 게시글 삭제 API (비밀번호 검증 포함)
// ==========================================
app.post("/api/post/delete", async (req, res) => {
  const { postId, password } = req.body;
  let conn;

  try {
    conn = await getConnection();

    // 1. 비밀번호 확인
    const checkResult = await conn.execute(
      `SELECT PASSWORD FROM POSTS WHERE POST_ID = :id`,
      [postId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "글이 존재하지 않습니다." });
    }

    const dbPassword = checkResult.rows[0].PASSWORD;

    // 2. 비밀번호가 일치하면 삭제
    if (dbPassword === password) {
      await conn.execute(`DELETE FROM POSTS WHERE POST_ID = :id`, [postId], {
        autoCommit: true,
      });
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "비밀번호가 틀렸습니다." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "삭제 에러" });
  } finally {
    if (conn)
      try {
        await conn.close();
      } catch (e) {}
  }
});

// 특정게시판 조회
// app.get("/post/:category/:page", async (req, res) => {
//   const category = req.params.category;
//   const page = req.params.page;
//   const sql = `select p.post_id,
//                       c.name as category_name,
//                       p.title,
//                       p.nickname,
//                       p.view_count,
//                       p.net_likes,
//                       to_char(p.created_at, 'MM-DD') as created_at
//               from posts p, categories c
//               where p.category_id = :category
//               and c.category_id = :category
//               order by post_id desc
//               offset (:page - 1)*10 rows fetch next 20 rows only`;
//   const conn = await getConnection();
//   const { metaData, rows } = await conn.execute(sql, { category, page });
//   const json = JSON.stringify(rows);
//   res.send(json);
// });

// // 글 작성
// app.post("/write", async (req, res) => {
//   console.log(req.body);
//   const conn = await getConnection();
//   const result = await conn.execute(
//     `insert into posts (
//       title,
//       nickname,
//       password,
//       category_id,
//       content
//     ) values (
//       :title,
//       :nickname,
//       :password,
//       :category_id,
//       :content
//     ) returning post_id into :pid`,
//     {
//       pid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
//       title,
//       nickname,
//       password,
//       category_id,
//       content,
//     },
//     { autoCommit: true },
//   );
//   console.log(result);
//   if (result.rowsAffected) {
//     res.json({
//       retCode: "OK",
//       POST_ID: result.outBinds.pid[0],
//       TITLE: title,
//       NICKNAME: nickname,
//       PASSWORD: password,
//       CATEGORY_ID: category_id,
//       CONTENT: content,
//     });
//   } else {
//     res.json({ retCode: "NG" });
//   }
// });

// ==========================================
// 📝 글 작성 API (파일 정보 포함)
// ==========================================
app.post("/api/post/write", async (req, res) => {
  // fileInfo는 프론트엔드에서 업로드 후 받은 정보 객체
  const { title, nickname, password, category_id, content, fileInfo } =
    req.body;

  let conn;
  try {
    conn = await getConnection();

    // 1. 게시글 저장 (POSTS)
    const postResult = await conn.execute(
      `INSERT INTO POSTS (TITLE, NICKNAME, PASSWORD, CATEGORY_ID, CONTENT) 
       VALUES (:title, :nickname, :password, :category_id, :content)
       RETURNING POST_ID INTO :pid`,
      {
        title,
        nickname,
        password,
        category_id,
        content,
        pid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: false }, // ★ 트랜잭션 시작 (파일 저장까지 하고 커밋)
    );

    const newPostId = postResult.outBinds.pid[0];

    // 2. 파일 정보가 있다면 FILES 테이블에 저장
    if (fileInfo) {
      await conn.execute(
        `INSERT INTO FILES (POST_ID, ORIGINAL_FILENAME, STORED_FILENAME, FILE_PATH, FILE_TYPE)
             VALUES (:postId, :orgName, :savedName, :path, :type)`,
        {
          postId: newPostId,
          orgName: fileInfo.originalName,
          savedName: fileInfo.storedName,
          path: fileInfo.filePath,
          type: fileInfo.fileType,
        },
        { autoCommit: false },
      );
    }

    // 3. 둘 다 성공하면 커밋
    await conn.commit();

    res.json({ success: true, POST_ID: newPostId });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback(); // 에러나면 롤백
    res.status(500).json({ success: false, message: "글 작성 실패" });
  } finally {
    if (conn)
      try {
        await conn.close();
      } catch (e) {}
  }
});

// 2. 업로드 폴더 자동 생성
const uploadDir = path.join(__dirname, "../client/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Multer 설정 (파일 저장 규칙)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 한글 깨짐 방지 및 중복 방지 (시간+랜덤숫자.확장자)
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

// ==========================================
// 📷 [1차] 파일 업로드 API (파일만 먼저 서버에 저장)
// ==========================================
// 프론트에서 드래그&드롭 하자마자 이 API를 호출해서 파일을 서버에 저장하고,
// 저장된 파일 정보를 프론트로 돌려줍니다.
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "파일이 없습니다." });

  // 저장된 파일 정보 반환
  res.json({
    success: true,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    filePath: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype,
  });
});

// ==========================================
// 📷 [1차] 파일 업로드 API (파일만 먼저 서버에 저장)
// ==========================================
// 프론트에서 드래그&드롭 하자마자 이 API를 호출해서 파일을 서버에 저장하고,
// 저장된 파일 정보를 프론트로 돌려줍니다.
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "파일이 없습니다." });

  // 저장된 파일 정보 반환
  res.json({
    success: true,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    filePath: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype,
  });
});

// ==========================================
// 📌 글 수정 API (UPDATE) - 비밀번호 검증 필수!
// ==========================================
app.post("/api/post/update", async (req, res) => {
  // 1. 요청 데이터 받기
  const { postId, title, content, password, category_id } = req.body;

  let conn;
  try {
    conn = await getConnection();

    // ★ 안전장치: 숫자는 확실하게 숫자로 변환 (parseInt)
    // "42" -> 42
    const safePostId = parseInt(postId);
    const safeCategoryId = parseInt(category_id);

    const result = await conn.execute(
      `UPDATE POSTS 
       SET TITLE = :title, 
           CONTENT = :content,
           CATEGORY_ID = :category_id
       WHERE POST_ID = :postId 
       AND PASSWORD = :password`,
      {
        title,
        content,
        category_id: safeCategoryId, // 변환된 숫자 넣기
        postId: safePostId, // 변환된 숫자 넣기
        password,
      },
      { autoCommit: true },
    );

    if (result.rowsAffected > 0) {
      res.json({ success: true });
    } else {
      // 수정된 행이 0개라면? -> ID가 없거나, 비밀번호가 틀린 것
      res.json({
        success: false,
        message: "비밀번호가 틀리거나 글이 없습니다.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "서버 오류" });
  } finally {
    if (conn)
      try {
        await conn.close();
      } catch (e) {}
  }
});

// ==========================================
// 💬 댓글 목록 조회 (계층형 쿼리 적용)
// ==========================================
app.get("/api/comments/:postId", async (req, res) => {
  const postId = parseInt(req.params.postId);
  let conn;
  try {
    conn = await getConnection();

    const sql = `
      SELECT COMMENT_ID, 
             PARENT_COMMENT_ID, 
             NICKNAME, 
             CONTENT, 
             TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI') as CREATED_AT,
             LEVEL as DEPTH,
             PRIOR NICKNAME as PARENT_NICKNAME,
             EMOTICON_URL  -- ★ 여기 추가!
      FROM COMMENTS
      WHERE POST_ID = :postId
      START WITH PARENT_COMMENT_ID IS NULL
      CONNECT BY PRIOR COMMENT_ID = PARENT_COMMENT_ID
      ORDER SIBLINGS BY CREATED_AT ASC
    `;

    const result = await conn.execute(sql, { postId });
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "댓글 조회 실패" });
  } finally {
    if (conn)
      try {
        await conn.close();
      } catch (e) {}
  }
});

// ==========================================
// 💬 댓글 작성 API (원댓글 & 답글 공용)
// ==========================================
// server/app.js

// [수정] 댓글 작성 API (이모티콘 지원)
app.post("/api/comments/write", async (req, res) => {
  // emoticon 값 추가로 받기
  const { postId, parentCommentId, nickname, password, content, emoticon } =
    req.body;

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `INSERT INTO COMMENTS (POST_ID, PARENT_COMMENT_ID, NICKNAME, PASSWORD, CONTENT, EMOTICON_URL)
       VALUES (:postId, :parentCommentId, :nickname, :password, :content, :emoticon)`,
      {
        postId,
        parentCommentId: parentCommentId || null,
        nickname,
        password,
        // 내용이 없으면(이모티콘만 보낼 때) 빈 문자열 처리
        content: content || "",
        // 이모티콘 URL 저장 (없으면 null)
        emoticon: emoticon || null,
      },
      { autoCommit: true },
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "댓글 작성 실패" });
  } finally {
    if (conn)
      try {
        await conn.close();
      } catch (e) {}
  }
});

// ==========================================
// 💬 댓글 삭제 API
// ==========================================
app.post("/api/comments/delete", async (req, res) => {
  const { commentId, password } = req.body;
  let conn;
  try {
    conn = await getConnection();

    // 1. 비밀번호 확인
    const check = await conn.execute(
      `SELECT PASSWORD FROM COMMENTS WHERE COMMENT_ID = :id`,
      [commentId],
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: "댓글이 없습니다." });
    }

    if (check.rows[0].PASSWORD !== password) {
      return res.json({ success: false, message: "비밀번호 불일치" });
    }

    // 2. 삭제
    // (ON DELETE CASCADE가 걸려있으면 자식 댓글도 같이 삭제될 수 있음 - 정책에 따라 다름)
    await conn.execute(
      `DELETE FROM COMMENTS WHERE COMMENT_ID = :id`,
      [commentId],
      { autoCommit: true },
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "삭제 중 오류 발생" });
  } finally {
    if (conn)
      try {
        await conn.close();
      } catch (e) {}
  }
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
