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
const flash = require("connect-flash");
const { error } = require("console");
//const { next } = require("cheerio/lib/api/traversing");
const saltRounds = 10 ;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long",["POST", "PUT", "DELETE"]));
app.use(flash());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
app.set("views", path.join(__dirname, "views"));

app.use(session({
  secret: "secret-key-23456897686543",
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14// a week
  },
  // resave: false,
    // saveUninitialized: true,
}))
app.use(passport.initialize())
app.use(passport.session())

app.use(function(request, response, next) {
  response.locals.messages = request.flash();
  next();
});

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
  const loggedInUser = request.user.id
  const todayTask = await Todos.todayTask(loggedInUser);
  const Overduetask = await Todos.Overduetask(loggedInUser);
  const Latertask = await Todos.Latertask(loggedInUser);
  const CompletionStatus = await Todos.completed(loggedInUser);
  if (request.accepts("html")) {
    response.render("todo", { 
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
  if (request.body.firstName.length == 0) {
    request.flash("error","FirstName can not be empty!")
    return response.redirect("/signup");
  }
  if (request.body.lastName.length == 0) {
    request.flash("error","lastName can not be empty!")
    return response.redirect("/signup");
  }
  if (request.body.email.length == 0) {
    request.flash("error","Email can not be empty!")
    return response.redirect("/signup");
  }
  if (request.body.password.length < 6) {
    request.flash("error","password can not be empty!")
    return response.redirect("/signup");
  }
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
    request.flash("error", "Email already in use , try to sign up with different email");
    return response.redirect("/signup")
  }
})

app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken()})
})

app.post("/session", 
passport.authenticate("local",{
   failureRedirect: "/login"
  }), 
(request,response) => {
  console.log(request.user),
  response.redirect("/todos")
})

app.get("/signout", (request, response , next)=> {
  request.logout((err)  => {
    if (err) { return next(err); }
    response.redirect("/")
  })
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


app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    console.log("creating a todo", request.body);
    console.log(request.user)
    if (!request.body.dueDate) {
      return response.status(400).json({ error: "Due date is required" });
    }
    const { title, dueDate } = request.body;
    if (!title || !dueDate) {
      return response.status(400).json({ error: "Title and Due date are required" });
    }
    try{
      await Todos.addTodos({ 
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id
        //completed: false 
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  });

app.get("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
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
app.put("/todos/:id",connectEnsureLogin.ensureLoggedIn(),  async (request, response) => {
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

app.delete("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
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
