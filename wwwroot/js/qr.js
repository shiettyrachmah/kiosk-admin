"use strict";
//var message = document.getElementById("textMessage");

//document.getElementById("pindaiButton").disabled = false;
//document.getElementById("refreshButton").disabled = false;

let ClientId = "DBF4035E93BC4A6A94206E5732D90C71";
let ReaderKey = "79D7FDE271EA4E9A94C651FE3C674872";
let ConnectionId = "";
let ClientName = "";
let ConnectionStatus = false;
let ReaderStatus = false;
let intervalReadKTP;
let countReadKTP = 0;
let StatusReadKTP = false;

var connection = new signalR.HubConnectionBuilder()
    .withUrl("https://sippu.atrbpn.go.id/kiosk-signal/Messaging").build();

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
    console.log('Recieve Pong :', messageContent);
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

connection.on("ScanMode", function (message) {
    //console.log(message);
    var imageQr = document.getElementById("imageQR");
    imageQr.src = "~/images/scanqr.gif";
});

connection.on("GenerateQR", function (message) {
    //console.log(message);
    var imageQr = document.getElementById("imageQR");
    imageQr.src = message;
});

connection.on("ReceiveWeb", function (user, message) {
    // console.log(user);
    //console.log(message);
    var textMessage = document.getElementById("textMessage");
    textMessage.innerText = message;
});

connection.on("UpdateQR", function (message) {
    console.log(message);
    if (message == "Closed") {
        var imageQr = document.getElementById("imageQR");
        imageQr.src = "~/images/scanqr.gif";
    }
});

connection
    .start()
    .then(function () {
        console.log("connected");
        document.getElementById("pindaiButton").disabled = false;
        //document.getElementById("refreshButton").disabled = false;
    })
    .catch(function (err) {
        return console.error(err.toString());
    });

document
    .getElementById("pindaiButton")
    .addEventListener("click", function (event) {
        StatusReadKTP = false;
        var imageQr = document.getElementById('imageQR');
        imageQr.src = "./images/scanqr.gif";

        var base_url = window.location.origin;
        let formData = {
            id: 1,
        }

        $.ajax({
            type: 'POST',
            url: base_url + '/Home/BeginRead',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(formData),
            success: function (response) {
                console.log('response: ', response);
                let data = JSON.parse(response);
                if (data.status == true) {
                    //readKTP();
                    clearInterval(intervalReadKTP);
                    countReadKTP = 0
                    intervalReadKTP = setInterval(readKTP, 1000);
                }
            },
            error: function (e) {
                console.log(e);
            },
        });

        event.preventDefault();
    });


function readKTP() {
    //console.log('countReadKTP:', countReadKTP);
    if (countReadKTP > 30) {
        console.log('clearInterval');
        clearInterval(intervalReadKTP);
    }

    var base_url = window.location.origin;
    let formData = {
        id: 1,
    }

    $.ajax({
        type: 'POST',
        url: base_url + '/Home/ReadKtp',
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(formData),
        success: function (response) {
            //console.log('response ktp: ', response);
            var obj = JSON.parse(response);
            console.log('response Code: ', obj.code);
            if (obj.code == 201)
                document.getElementById("textMessage").innerHTML = 'Membaca kartu KTP';
            else if (obj.code == 202)
                document.getElementById("textMessage").innerHTML = 'Letakan jari telunjuk kiri atau kanan Anda';
            else if (obj.code == 203)
                document.getElementById("textMessage").innerHTML = 'Proses validasi';
            else if (obj.code == 204 || obj.code == 205)
                document.getElementById("textMessage").innerHTML = 'Letakan Kartu KTP ANda';

            if (obj.code == 504) {
                var data = JSON.parse(obj.data);
                if (data.biodata != null) {
                    clearInterval(intervalReadKTP);
                    if (StatusReadKTP == false) {
                        StatusReadKTP = true;
                        console.log('response biodata: ', data.biodata);
                        const ktpJson = {
                            nik: data.biodata.nik,
                            nama: data.biodata.name,
                            tempat_lahir: data.biodata.placeofbirth,
                            tanggal_lahir: data.biodata.dateofbirth,
                            jenis_kelamin: data.biodata.sex,
                        };
                        const myJSON = JSON.stringify(ktpJson);
                        connection.invoke("DataKtp", myJSON).catch(function (err) {
                            return console.error(err.toString());
                        });
                        document.getElementById("textMessage").innerHTML = "Silahkan scan kode QR untuk verifikasi Sentuh Tanahku!";
                    }
                }
            }
        },
        error: function (e) {
            console.log(e);
        },
    });
    countReadKTP = countReadKTP + 1;
}

// ping reader
//setInterval(pingReader, 5000);
function pingReader() {
    //console.log('Ping');
    connection.invoke("Ping", ReaderKey).catch(function (err) {
        return console.error(err.toString());
    });
}