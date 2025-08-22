"use strict";
//var message = document.getElementById("textMessage");

let ClientId = "9323653E715B45249BFC91E993230587";
let ReaderKey = "79D7FDE271EA4E9A94C651FE3C674872";
let ConnectionId = "";
let ClientName = "";
let ConnectionStatus = false;
let ReaderStatus = false;

 var connection = new signalR.HubConnectionBuilder()
   .withUrl("http://localhost:5170/Messaging")
   .build();
 var connection = new signalR.HubConnectionBuilder().withUrl("https://sippu.atrbpn.go.id/kiosk-signal/Messaging").build();

connection.on("MyConnectionId", function (messageContent) {
  console.log("My ConnectionId:", messageContent);
  ConnectionId = messageContent;
  connection
    .invoke("Registration", ClientId, ConnectionId)
    .catch(function (err) {
      return console.error(err.toString());
    });
});

connection.on("RegistrationStatus", function (messageContent) {
  console.log("Registration Status :", messageContent);
  if (messageContent == "Success") {
    ConnectionStatus = true;
  }
});

connection.on("ClientConnected", function (messageContent) {
  //console.log('Client Connected :',messageContent);
  var data = jQuery.parseJSON(messageContent);
  if (ConnectionId != data.connection_id) {
    //New Client connected
    console.log("New Client connected :", data.connection_id);
  }
});

connection.on("RecievePong", function (messageContent) {
  console.log('Recieve Pong');
  ReaderStatus = true;
  if (messageContent == "Connected") {
    ReaderStatus = true;
    document.getElementById("status-connection").style.backgroundColor =
      "green";
  } else if (messageContent == "Disconnected") {
    ReaderStatus = false;
    document.getElementById("status-connection").style.backgroundColor = "red";
  }
});

connection.on("GenerateQR", function (message) {
  var imageQr = document.getElementById("imageQR");
  imageQr.src = message;
});

connection.on("ScanMode", function (message) {
  //console.log(message);
  var imageQr = document.getElementById("imageQR");
  imageQr.src = "~/images/scanqr.gif";
});

connection.on("ReceiveWeb", function (user, message) {
  var textMessage = document.getElementById("textMessage");
  textMessage.innerText = message;
});

connection.on("UpdateQR", function (message) {
  //console.log(message);
  if(message == "Closed"){
    var imageQr = document.getElementById("imageQR");
      imageQr.src = "~/images/scanqr.gif";
  }
});

connection
  .start()
  .then(function () {
    console.log("connected");
  })
  .catch(function (err) {
    return console.error(err.toString());
  });
