const Koa = require("koa");
const cors = require("koa-cors");
const Router = require("koa-router");
const mysql = require("mysql2/promise");
const bodyParser = require("koa-bodyparser");
const app = new Koa();
const router = new Router();

// 创建数据库连接池
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "170707",
  // 先不指定数据库，后面创建
});

// 创建数据库和表（在服务器启动时执行一次）
(async () => {
  try {
    // 创建数据库 （如果不存在）
    await pool.query("CREATE DATABASE IF NOT EXISTS fighting_heart");
    // 切换到数据库
    await pool.query("USE fighting_heart");
    // 创建表（如果不存在）
    await pool.query(
      "CREATE TABLE IF NOT EXISTS lists (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255),description VARCHAR(255))"
    );
    console.log("数据库和表创建成功");
  } catch (error) {
    console.error("Error creating database or table:", error);
  }
})();

//查询所有数据
router.get("/api/data", async (ctx) => {
  try {
    const [rows] = await pool.query("SELECT * FROM lists");
    ctx.body = rows;
  } catch (error) {
    ctx.body = { error: "查询数据失败" };
  }
});

// 添加数据
router.post("/api/data", async (ctx) => {
  const { name, description } = ctx.request.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO lists (name,description) VALUES (?,?)",
      [name, description]
    );
    ctx.body = { id: result.insertId };
  } catch {
    ctx.body = { error: "添加出错" };
  }
});

//更新数据
router.put("/api/data/:id", async (ctx) => {
  const id = ctx.params.id;
  const { name, description } = ctx.request.body;
  try {
    await pool.query("UPDATE lists SET name=?,description = ? WHERE id=?", [
      name,
      description,
      id,
    ]);
    ctx.body = { message: "更新成功" };
  } catch (error) {
    ctx.body = { error: "更新出错" };
  }
});

//删除数据
router.delete("/api/data/:id", async (ctx) => {
  const id = ctx.params.id;
  try {
    await pool.query("DELETE FROM lists WHERE id = ?", id);
    ctx.body = { message: "删除成功" };
  } catch (error) {
    ctx.body = { error: "删除出错" };
  }
});

//后端解决不同源问题
app.use(
  cors({
    origin: (ctx) => {
      // 允许来自任何源的请求（仅用于测试目的，不建议在生产环境中使用）
      // return "*";
      // 或者只允许特定的源
      return ctx.header.origin === "http://127.0.0.1:5173"
        ? "http://127.0.0.1:5173"
        : false;
    },
    credentials: true,
  })
);
app.use(bodyParser()); //解决传参不解析的问题造成请求错误
app.use(router.allowedMethods());
app.use(router.routes());
const port = 3001;

app.listen(port, () => {
  console.log("node服务已启动");
});
