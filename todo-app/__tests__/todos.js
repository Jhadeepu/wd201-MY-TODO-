/* eslint-disable no-undef */
const request = require("supertest");
var Cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
let server, agent;
function extractCsrfToken(res) {
  var $ = Cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};
describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => { });
    agent = request.agent(server);
  });
  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up", async () => {
    let res = await agent.get("/signup")
    const csrfToken = extractCsrfToken(res)
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@gmail.com.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302)
  })

  test("Sign out",async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const agent = request.agent(server)
    await login(agent, "user.a@gmail.com", "12345678")
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken
    });
    expect(response.statusCode).toBe(302);
  });

  

  test("Marks a todo item as complete", async () => {
    const agent = request.agent(server)
     await login(agent, "user.a@gmail.com", "12345678")
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken
    });
    const groupedTodoResponse = await agent.get("/todos").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodoResponse.text);
    const todayTaskCount = parsedGroupedResponse.todayTask.length;
    const latestTodo = parsedGroupedResponse.todayTask[todayTaskCount - 1];
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    const markCompleteResponse = await agent.put(`/todos/${latestTodo.id}`)
      .send({
        completed: true,
        _csrf: csrfToken
      });
    const parsedCompleteResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedCompleteResponse.completed).toBe(true);
  });
 
  test("Marks a todo item as incomplete", async () => {
    const agent = request.agent(server)
     await login(agent, "user.a@gmail.com", "12345678")
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: true,
      "_csrf": csrfToken
    });
    const groupedTodoResponse = await agent.get("/todos").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodoResponse.text);
    const todayTaskCount = parsedGroupedResponse.todayTask.length;
    const latestTodo = parsedGroupedResponse.todayTask[todayTaskCount - 1];
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    const markIncompleteResponse = await agent.put(`/todos/${latestTodo.id}`)
      .send({
        completed: false,
        _csrf: csrfToken
      });
    const parsedIncompleteResponse = JSON.parse(markIncompleteResponse.text);
    expect(parsedIncompleteResponse.completed).toBe(false);
  });
  
  
  test("Deletes a todo using /todos/:id endpoint", async () => {
    const agent = request.agent(server)
     await login(agent, "user.a@gmail.com", "12345678")
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "to remove",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    });
    const response = await agent.get("/todos").
      set("Accept", "application/json");
    const parsedResponse = JSON.parse(response.text);
    expect(parsedResponse.dueToday).toBeDefined();
    const dueTodaycount = parsedResponse.dueToday.length
    const latestTodo = parsedResponse.dueToday[dueTodaycount - 1]

    res = await agent.get("/todos")
    csrfToken = extractCsrfToken(res);

    const deleted = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    })
    expect(deleted.status).toBe(200);
  });


});


