/* eslint-disable no-unused-vars */
const express = require("express");
const csrf = require("tiny-csrf");
const app = express();
const { Todos, User } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require(`path`);

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const { error } = require("console");
const saltRounds = 10 ;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long",["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: "secret-key-23456897686543",
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14// a week
  }
}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy ({
  usernameField: "email",
  passwordField: "password"
}, (username,password,done) => {
  User.findOne({ where:{ email: username }})
    .then(async(user) => {
      const result = await bcrypt.compare(password, user.password)
      if (result) {
        return done(null, user)
      } else {
        return done("Invalid Password")
      }
    }).catch((error) => {
      return done(error)
    })
}))

passport.serializeUser((user, done) => {
  console.log("serializing user in session", user.id)
  done(null, user.id)
  // .then(user => {
  //   done(null, user)
  // })
  // .catch(error => {
  //   done(error, null)
  // })
})

passport.deserializeUser((id, done) => {
  User.findByPk(id)
  .then(user => {
    done(null, user)
  })
  .catch(error => {
    done(error, null)
  })
})


app.get("/", async (request, response) => {
    response.render("index", { 
    title: "Todo application",
      csrfToken: request.csrfToken() 
    });
});

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (request,response) => {
  const todayTask = await Todos.todayTask();
  const Overduetask = await Todos.Overduetask();
  const Latertask = await Todos.Latertask();
  const CompletionStatus = await Todos.completed();
  if (request.accepts("html")) {
    response.render("todos", { 
      todayTask, 
      Overduetask, 
      Latertask , 
      CompletionStatus,
      csrfToken: request.csrfToken() 
    });
  } else {
    response.json({ 
      todayTask,
       Overduetask,
        Latertask,
         CompletionStatus });
  }
})

app.get("/signup" , (request,response) => {
  response.render("signup", { title: "Signup", csrfToken: request.csrfToken() });

})

app.post("/users" , async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds)
  console.log(hashedPwd)
  console.log("Firstname", request.body.firstName)
  try{
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd
    })
    request.login(user, (err) => {
      if(err) {
        console.log(err)
      }
      response.redirect("/todos")
    })
  } catch (error) {
    console.log(error);
  }

})

app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken()})
})

app.post("/session", passport.authenticate("local",{ failureRedirect: "/login"}) , (request,response) => {
  console.log(request.user),
  response.redirect("/todos")

})

app.get("/todos", async (request, response) => {
  console.log("Todo list");
  try {
    const todos = await Todos.findAll();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: "Unable to retrieve todos" });
  }
});


app.post("/todos", async (request, response) => {
    console.log("creating a todo", request.body);
    if (!request.body.dueDate) {
      return response.status(400).json({ error: "Due date is required" });
    }
    const { title, dueDate } = request.body;
    if (!title || !dueDate) {
      return response.status(400).json({ error: "Title and Due date are required" });
    }
    try{
      await Todos.addTodos({ 
        title,
        dueDate,
        completed: false 
      });
      return response.redirect("/");
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  });

app.get("/todos/:id", async (request, response) => {
  console.log("We have to update a todo with ID:", request.params.id);
  const todo = await Todos.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(true);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(500).json(error);
  }
});
app.put("/todos/:id", async (request, response) => {
    console.log("We have to update a todo with ID:", request.params.id);
    const todo = await Todos.findByPk(request.params.id);
    const { completed } = request.body;
    try {
      const updatedTodo = await todo.setCompletionStatus(completed);
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  });

app.delete("/todos/:id", async (request, response) => {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try {
    await Todos.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(500).json(error);
  }
});

module.exports = app;
