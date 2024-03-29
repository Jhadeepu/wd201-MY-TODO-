/* eslint-disable no-unused-vars */
const express = require("express");
const csrf = require("tiny-csrf");
const app = express();
const { Todos, User } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require(`path`);

const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");
const Sequelize = require("sequelize");


const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const flash = require("connect-flash");
const { error } = require("console");

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
    maxAge: 1000 * 60 * 60 * 24
  },
   resave: false,
   saveUninitialized: true,
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
        return done(null , false , {message:"Invalid Password"})
      }
    }).catch(() => {
      return done(null , false , {message:"user not exist"})
    })
}))

passport.serializeUser((user, done) => {
  console.log("serializing user in session", user.id)
  done(null, user.id)
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
app.get("/", (request, response, next) => {
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }

  response.render("index", { 
    title: "Todo application",
    csrfToken: request.csrfToken() 
  });
});

app.get("/login", (request, response, next) => {
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }

  response.render("login", { 
    title: "Login", 
    csrfToken: request.csrfToken()
  });
});

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const userName = request.user.firstName + " " + request.user.lastName;
  const loggedInUser = request.user.id;
  const todayTask = await Todos.todayTask(loggedInUser);
  const Overduetask = await Todos.Overduetask(loggedInUser);
  const Latertask = await Todos.Latertask(loggedInUser);
  const CompletionStatus = await Todos.completed(loggedInUser);

  if (request.accepts("html")) {
    response.render("todo", {
      userName,
      todayTask,
      Overduetask,
      Latertask,
      CompletionStatus,
      csrfToken: request.csrfToken(),
      user: request.user
    });
  } else {
    response.json({
      userName,
      todayTask,
      Overduetask,
      Latertask,
      CompletionStatus,
    });
  }});

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
    request.flash("error","password should be a minimum of 6 characters long!")
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
   failureRedirect: "/login",
   failureFlash: true,
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
  app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    console.log("Todo list");
    try {
      const loggedInUser = request.user.id;
      const completedTodos = await Todos.findAll({ where: { userId: loggedInUser, completed: true } });

      //const todos = await Todos.findAll({ where: { userId: loggedInUser } });
      return response.json(Todos);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ error: "Unable to retrieve todos" });
    }
  });
  

app.post("/todos",connectEnsureLogin.ensureLoggedIn(),async function (request, response) {
    if (request.body.title.length == 0) {
      request.flash("error", "Title shouldn't be empty!");
      return response.redirect("/todos");
    }
    if (request.body.title.length < 4) {
      request.flash("error", "Title atleast 4 characters");
      return response.redirect("/todos");
    }
    if (request.body.dueDate.length == 0) {
      request.flash("error", "Duedate shouldn't be empty!");
      return response.redirect("/todos");
    }
    console.log(request.user);
    try {
      await Todos.addTodos({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  });

  app.put("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    console.log("We have to update a todo with ID:", request.params.id);
    try {
      const todo = await Todos.findByPk(request.params.id);
  
      if (!todo) {
        return response.status(404).json({ error: "Todo not found" });
      }
      const authenticatedUserId = request.user.id;
      if (todo.userId !== authenticatedUserId) {
        return response
          .status(403)
          .json({ error: "You are not authorized to update this todo" });
      }
  
      const { completed } = request.body;
      const updatedTodo = await todo.update({ completed });
  
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  });
  
app.delete("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try {
    await Todos.remove(request.params.id, request.user.id);
    const deleted = await Todos.findByPk(request.params.id);
    if(deleted) {
      return response.json({ success: false})
    }else{
    return response.json({ success: true });
  }} catch (error) {
    console.log();
    return response.status(500).json(error);
  }
});

module.exports = app;
