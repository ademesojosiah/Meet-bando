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

const BandoSess = session({
  secret: "a secret",
  saveUninitialized: true,
  resave: true,
  name: "BandoSess",
  store: store,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});
app.use(BandoSess);
io.engine.use(BandoSess);

app.set("view engine", "ejs");
app.set("views", "views");

app.get("/", (req, res) => {
  res.render("home");
});

let orders = [];
io.on("connection", (socket) => {
  console.log("connected to socket");
  const sessionData = socket.request.session;

  function getOrderHistory(array) {}

  const introMessage = `
            Select 1 to Place an order<br>
            Select 99 to checkout order<br>
            Select 98 to see order history<br>
            Select 97 to see current order<br>
            Select 0 to cancel order
        `;

  const secondIntroMessage = `
    You have a pending checkout, would you like to add more orders or checkout?<br>
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
      case 99:
        socket.emit("message");
        break;
      case 98:
        console.log(socket.request.session);
        console.log(socket.request.session.usersOrders);
        orders = sessionData.usersOrders.length > 1 ? sessionData.usersOrders : ' no order has been placed yet';
        socket.emit("message", `${JSON.stringify(orders)}<br>`);
        socket.emit("message", introMessage);
        break;
      case 97:
        socket.emit("message", "you clicked 4");
        break;
      case 0:
        socket.emit("message", "you clicked 4");
        break;
      default:
        socket.emit("message", `${message} is an invalid input , try again`);
        socket.emit("message", introMessage);
        break;
    }
  });

  sessionData.usersOrders = [];

  socket.on("newOrders", (message) => {
    switch (Number(message)) {
      case 1:
        sessionData.usersOrders.push("Bread and beans<br>");
        socket.request.session.save();
        socket.emit("message", secondIntroMessage);
        break;
      case 2:
        sessionData.usersOrders.push("Rice and chicken<br>");
        sessionData.save();
        socket.emit("message", secondIntroMessage);
        break;
      case 3:
        sessionData.usersOrders.push("Shawarma and hollandia yogurt<br>");
        sessionData.save();
        socket.emit("message", secondIntroMessage);
        break;
      case 4:
        sessionData.usersOrders.push("Amala and Ewedu<br>");
        sessionData.save();
        socket.emit("message", secondIntroMessage);
        break;
      case 5:
        sessionData.usersOrders.push("Pounded yam and egusi<br>");
        sessionData.save();
        socket.emit("message", secondIntroMessage);
        break;
      case 6:
        sessionData.usersOrders.push("fufu and efo riro<br>");
        sessionData.save();
        socket.emit("message", secondIntroMessage);
        break;
      case 7:
        sessionData.usersOrders.push("Yam and egg<br>");
        sessionData.save();
        socket.emit("message", secondIntroMessage);
        break;
      case 8:
        sessionData.usersOrders.push("Beans and Yam<br>");
        sessionData.save();
        socket.emit("message", secondIntroMessage);
        break;
      default:
        socket.emit("message", `${message} is an invalid input , try again`);
        socket.emit("message", orderMessage);
        break;
    }
  });

  socket.on("disconnect", () => {
    socket.request.session.save();
    console.log("disconnected");

  });
});

server.listen(3003, () => {
  console.log("server is running.......");
});
