const todoList = require("../todo");
const {
  all,
  markAsComplete,
  add,
  overdue,
  dueToday,
  dueLater,
  toDisplayableList,
} = todoList();
describe("Task checker ", () => {
  beforeAll(() => {
    add({
      title: "Pay rent",
      dueDate: new Date().toISOString().slice(0, 10),
      completed: false,
    });
  });
  const todaydate = new Date();
  test("Testing the adding element", () => {
    let initial = all.length
    add({
      title: "Pay rent1",
      dueDate: todaydate.toISOString().slice(0, 10),
      completed: false,
    });
    expect(all.length).toBe(initial+1);
  });
  test("MarkComplete check", () => {
    expect(all[0].completed).toBe(false);
    markAsComplete(0);
    expect(all[0].completed).toBe(true);
  });
  test("should have overdue list", () => {
    let a = overdue();
    let initial = a.length
    add({
      title: "overdue check",
      dueDate: new Date(new Date().setDate(todaydate.getDate() - 1))
        .toISOString()
        .split("T")[0],
      completed: false,
    });
    a = overdue();
    expect(a.length).toBe(initial+1);
  });
  test("todo due it later check", () => {
    let todaydate = new Date();
    let a = dueLater()
    let initial = a.length
    add({
      title: "due later check",
      dueDate: new Date(new Date().setDate(todaydate.getDate() + 1))
        .toISOString()
        .split("T")[0],
      completed: false,
    });
    a = dueLater();
    expect(a.length).toBe(initial + 1);
  });
  test("Today work to do", () => {
    let a = dueToday();
    // here we test toDisplayableList function
    expect(toDisplayableList(a)).toBe(
      "[x] Pay rent \n[ ] Pay rent1 "
    );
  });
  test('Is element added????', () => {
    let initial = {title: "Add me",
    dueDate: new Date(new Date().setDate(todaydate.getDate() + 1))
    .toISOString()
    .split("T")[0],
    completed: false}
    add(initial)
    expect(all.includes(initial)).toBe(true)
  })
});

const db = require("../models");

describe("Todolist Test Suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  test("Should add new todo", async () => {
    const todoItemsCount = await db.Todo.count();
    await db.Todo.addTask({
      title: "Test todo",
      completed: false,
      dueDate: new Date(),
    });
    const newTodoItemsCount = await db.Todo.count();
    expect(newTodoItemsCount).toBe(todoItemsCount + 1);
  });
});