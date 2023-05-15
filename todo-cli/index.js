const { connect } = require("./connectDB.js");
const Todo = require("./Todomodel.js");

const createTodo = async () => {
    try {
        await connect()
        const todo = await Todo.create({
            title: "Second Item",
            dueDate: new Date(),
            completed: false,
        });
        console.log(`create todo.id ${todo.id}`)
    } catch (error) {
        console.error(error);
    }
};

const countItems = async () => {
    try {
        const totalCount = await Todo.count();
        console.log(`Found ${totalCount} items in the table!`);
    }    catch (error) {
         console.error(error);
    }
};
const getAllTodos = async () => {
    try {
        const Todos = await Todo.findAll();
        const todoList = Todos.map(todo => todo.displayableString()).join("\n");
        console.log(todoList);
    } catch (error) {
        console.error(error);
    }
} 

const getSingleTodos = async () => {
    try {
        const Todo = await Todo.findOne({
            where: {
                completed: false
            },
            order: [
                [`id`, `DESC`]
            ]
        });
        console.log(Todo.displayableString());
    } catch (error) {
        console.error(error);
    }
} 

const updateItem = async (id) => {
    try{
        await Todo.update({completed: true , title}, {
            where: {
                id: id
            }
        });
    } catch (error) {
        console.error(error);
    }
}

const deleteItem = async (id) => {
    try{
        const deletedRowCount = await Todo.destroy ({
            where: {
                id: id
            }
        });
        console.log(`Deleted ${deletedRowCount} rows!`);

    } catch (error) {
        console.error(error);
    }
}



(async () => {
    await createTodo();
   await countItems();
  await getAllTodos();
  await getSingleTodos();
  await updateItem(2);
  await deleteItem();
})();



// const Todos = await Todo.findAll({  29-34
   // where: {
  //      completed: false
 //   },
  //  order: [
//        [`id`, `DESC`]
//    ]
//});