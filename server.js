const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: {} });
const session = require("express-session");
const mongoose = require("mongoose");
const MongoDBStore = require("connect-mongodb-session")(session);
require("dotenv").config();

const store = new MongoDBStore({
  uri: process.env.MONGO,
  collection: "mySessions",
});

// Catch errors
store.on("error", function (error) {
  console.log(error);
});


const BandoSess =   session({
    secret: "a secret",
    saveUninitialized: true,
    resave: false,
    name: "BandoSess",
    store: store,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 100 * 60 * 60 * 24,
    },
  })
app.use(BandoSess);
io.engine.use(BandoSess);


app.set("view engine", "ejs");
app.set("views", "views");

app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/", (req, res) => {
  req.session.name = "jojo";
  req.session.friendName = "fuad";
  res.json();
});

io.on("connection", (socket) => {
    console.log("connected to socket");

    const introMessage = `
            Select 1 to Place an order<br>
            Select 99 to checkout order<br>
            Select 98 to see order history<br>
            Select 97 to see current order<br>
            Select 0 to cancel order
        `;

    const orderMessage = `
           1. Bread and beans<br>
           2. Rice and chicken<br>
           3. Shawarma and hollandia yogurt<br>
           4. Amala and Ewedu<br>
           5. Pounded yam and egusi<br>
           6. fufu and efo riro<br>
           7. Yam and egg<br>
           8. Beans and Yam
        `;
    socket.emit("message", introMessage);

    socket.on("reply", (message) => {
      switch (Number(message)) {
        case 1:
          socket.emit("orders", orderMessage);
          break;
        case 2:
          socket.emit("message", "you clicked 2");
          break;
        case 3:
          socket.emit("message", "you clicked 3");
          break;
        case 4:
          socket.emit("message", "you clicked 4");
          break;
        default:
          socket.emit(
            "message",
            `Bros shey ${JSON.stringify(socket.request.session)} they there?`
          );
          socket.emit("message", introMessage);
          break;
      }
    });

    socket.on("disconnect", () => {
      console.log("disconnected");
    });
  });


server.listen(3003, () => {
  console.log("server is running.......");
});
