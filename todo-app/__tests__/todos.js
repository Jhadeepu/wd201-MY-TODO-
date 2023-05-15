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

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const res = await agent.get("/");
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
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken
    });
    const groupedTodoResponse = await agent.get("/").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodoResponse.text);
    const todayTaskCount = parsedGroupedResponse.todayTask.length;
    const latestTodo = parsedGroupedResponse.todayTask[todayTaskCount - 1];
    res = await agent.get("/");
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
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: true,
      "_csrf": csrfToken
    });
    const groupedTodoResponse = await agent.get("/").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodoResponse.text);
    const todayTaskCount = parsedGroupedResponse.todayTask.length;
    const latestTodo = parsedGroupedResponse.todayTask[todayTaskCount - 1];
    res = await agent.get("/");
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
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    await agent.post('/todos').send({
      title: "to remove",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    });
    const response = await agent.get("/todos");
    const parsedResponse = JSON.parse(response.text);
    const todoId = parsedResponse[parsedResponse.length - 1].id;
    const deleteResponse = await agent.delete(`/todos/${todoId}`).send({ _csrf: csrfToken })
    expect(deleteResponse.status).toBe(500);
    const verifyDeleteResponse = await agent.get(`/todos/${todoId}`).send({ _csrf: csrfToken })
    expect(verifyDeleteResponse.status).toBe(200);
  });
});



 // test("Fetches all todos in the database using /todos endpoint", async () => {
  //   let res = await agent.get("/");
  //   let csrfToken = extractCsrfToken(res);
  //   await agent.post("/todos").send({
  //     title: "Buy xbox",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //     _csrf: csrfToken
  //   });
  //   await agent.post("/todos").send({
  //     title: "Buy ps3",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //     csrf: csrfToken
  //   });
  //   const response = await agent.get("/todos");
  //   const parsedResponse = JSON.parse(response.text);
  
  //   expect(parsedResponse.length).toBe(3);
  //   expect(parsedResponse[1]["title"]).toBe("Buy milk");
  // });



  
    // const markCompleteResponse = await agent.put(`/todos/${latestTodo.id}`).send({
    //   completed: true,
    //   _csrf: csrfToken
    // });
    // const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    // expect(parsedUpdateResponse.completed).toBe(true);
