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

//SESSION MIDDLEWARE
const BandoSess = session({
  secret: "a secret",
  saveUninitialized: false,
  resave: true,
  name: "BandoSess",
  store: store,
  cookie: {
    secure: false,
    httpOnly: true,
    expires: 1000 * 60 * 60 * 24 * 7,
    sameSite: "none",
  },
});

app.use(BandoSess);

io.engine.use(BandoSess);

app.set("view engine", "ejs");
app.set("views", "views");

app.get("/", (req, res) => {
  res.render("home");
});

// CURRENT ORDER AND ORDER HISTORY
const currentOrder = {};
const orderHistory = {};

io.on("connection", (socket) => {
  console.log("connected to socket");
  //GET DATA FROM SESSION
  const sessionData = socket.request.session;

  //GET SESSION ID
  const sessionId = sessionData.id;

  // GET CURRENT ORDER AND ORDER HISTORY FROM SESSION

  console.log(sessionData);
  console.log(sessionId);

  // CHECKING IF DATA EXIST IN SESSION
  orderHistory[sessionId] =
    sessionData.history && sessionData.history.length >= 1
      ? sessionData.history
      : [];
  currentOrder[sessionId] =
    sessionData.current && sessionData.current.length >= 1
      ? sessionData.current
      : [];

  // FUNCTION TO LIST ORDERS
  function getOrderList(array) {
    //CHECK IF PARAMETER IS AN INSTANCE OF AN ARRAY
    if (array instanceof Array) {
      const listOfOrder = array
        .map((order, i) => `${i + 1}. ${order}<br>`)
        .join("");
      return listOfOrder;
    } else {
      return array;
    }
  }
  const introMessage = `
            How can i help you today ?<br>
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
          select 1. Bread and beans<br>
          select 2. Rice and chicken<br>
          select 3. Shawarma and hollandia yogurt<br>
          select 4. Amala and Ewedu<br>
          select 5. Pounded yam and egusi<br>
          select 6. fufu and efo riro<br>
          select 7. Yam and egg<br>
          select 8. Beans and Yam<br>
          select 0. TO GO BACK
        `;
  socket.emit("message", introMessage);

  socket.on("reply", (message) => {
    switch (Number(message)) {
      case 1:
        socket.emit("orders", orderMessage);
        break;
      case 99:
        // CURRENT ORDER WILL BE MOVED TO ORDER HISTORY
        if (currentOrder[sessionId].length >= 1) {
          orderHistory[sessionId] = currentOrder[sessionId];
          socket.emit("message", "Your Order has been placed");
        } else {
          socket.emit(
            "message",
            "You have no pending checkout, place an Order"
          );
        }
        save(sessionData, sessionId);
        socket.emit("message", introMessage);
        break;
      case 98:
        // CHECK IF ORDER HISTORY IS EMPTY AND DISPLAY NO ORDER PLACED
        const checkOrderHistory =
          getOrderList(orderHistory[sessionId]).length >= 1
            ? getOrderList(orderHistory[sessionId])
            : "No Order placed";

        socket.emit("message", checkOrderHistory);
        socket.emit("message", introMessage);
        break;
      case 97:
        // CHECK IF ORDER HISTORY IS EMPTY AND DISPLAY NO ORDER PLACED
        const checkCurrentOrder =
          getOrderList(currentOrder[sessionId]).length >= 1
            ? getOrderList(currentOrder[sessionId])
            : "No Current Order";

        socket.emit("message", checkCurrentOrder);
        socket.emit("message", introMessage);
        break;
      case 0:
        if (
          (!currentOrder[sessionId].length) &&
          (!orderHistory[sessionId].length)
        ) {
          socket.emit("message", "No Order was placed");
          socket.emit("message", introMessage);
        }else{
        currentOrder[sessionId] = [];
        orderHistory[sessionId] = [];
        save(sessionData, sessionId);
        socket.emit("message", "Order Cancelled");
        socket.emit("message", introMessage);
        }
        break;
      default:
        socket.emit("message", `${message} is an invalid input , try again`);
        socket.emit("message", introMessage);
        break;
    }
  });

  socket.on("newOrders", (message) => {
    switch (Number(message)) {
      case 1:
        currentOrder[sessionId].push("Bread and beans");
        save(sessionData, sessionId);
        socket.emit("message", secondIntroMessage);
        break;
      case 2:
        currentOrder[sessionId].push("Rice and chicken");
        save(sessionData, sessionId);
        socket.emit("message", secondIntroMessage);
        break;
      case 3:
        currentOrder[sessionId].push("Shawarma and hollandia yogurt");
        save(sessionData, sessionId);
        socket.emit("message", secondIntroMessage);
        break;
      case 4:
        currentOrder[sessionId].push("Amala and Ewedu");
        save(sessionData, sessionId);
        socket.emit("message", secondIntroMessage);
        break;
      case 5:
        currentOrder[sessionId].push("Pounded yam and egusi");
        save(sessionData, sessionId);
        socket.emit("message", secondIntroMessage);
        break;
      case 6:
        currentOrder[sessionId].push("fufu and efo riro");
        save(sessionData, sessionId);
        socket.emit("message", secondIntroMessage);
        break;
      case 7:
        currentOrder[sessionId].push("Yam and egg");
        save(sessionData, sessionId);
        socket.emit("message", secondIntroMessage);
        break;
      case 8:
        currentOrder[sessionId].push("Beans and Yam");
        save(sessionData, sessionId);
        socket.emit("message", secondIntroMessage);
        break;
      case 0:
        socket.emit("message", introMessage);
        break;
      default:
        socket.emit("message", `${message} is an invalid input , try again`);
        socket.emit("orders", orderMessage);
        break;
    }
  });

  socket.on("disconnect", () => {
    currentOrder[sessionId] = [];
    save(sessionData, sessionId);
    console.log("disconnected");
  });
});

//FUNCTION TO UPDATE SESSION
function save(sessionData, sessionId) {
  sessionData.current = currentOrder[sessionId];
  sessionData.history = orderHistory[sessionId];
  console.log("save", sessionData);
  sessionData.save();
}

server.listen(3003, () => {
  console.log("server is running.......");
});
