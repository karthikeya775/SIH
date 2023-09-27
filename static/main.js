const socket = io("/");
const main__chat__window = document.getElementById("main__chat_window");
const videoGrids = document.getElementById("video-grids");
const myVideo = document.createElement("video");
const chat = document.getElementById("chat");
OtherUsername = "";
chat.hidden = true;
myVideo.muted = true;


window.onload = () => {
    $(document).ready(function() {
        $("#getCodeModal").modal("show");
    });
};

var peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3030",
});

let myVideoStream;
const peers = {};
var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

sendmessage = (text) => {
    if (event.key === "Enter" && text.value != "") {
        socket.emit("messagesend", myname + ' : ' + text.value);
        text.value = "";
        main__chat_window.scrollTop = main__chat_window.scrollHeight;
    }
};

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream, myname);

        socket.on("user-connected", (id, username) => {
            console.log("userid:" + id);
            connectToNewUser(id, stream, username);
            socket.emit("tellName", myname);
        });

        socket.on("user-disconnected", (id) => {
            console.log(peers);
            if (peers[id]) peers[id].close();
        });
    });
peer.on("call", (call) => {
    getUserMedia({ video: true, audio: true },
        function(stream) {
            call.answer(stream); // Answer the call with an A/V stream.
            const video = document.createElement("video");
            call.on("stream", function(remoteStream) {
                addVideoStream(video, remoteStream, OtherUsername);
            });
        },
        function(err) {
            console.log("Failed to get local stream", err);
        }
    );
});

peer.on("open", (id) => {
    socket.emit("join-room", roomId, id, myname);
});

socket.on("createMessage", (message) => {
    var ul = document.getElementById("messageadd");
    var li = document.createElement("li");
    li.className = "message";
    li.appendChild(document.createTextNode(message));
    ul.appendChild(li);
});

socket.on("AddName", (username) => {
    OtherUsername = username;
    console.log(username);
});

const RemoveUnusedDivs = () => {
    //
    alldivs = videoGrids.getElementsByTagName("div");
    for (var i = 0; i < alldivs.length; i++) {
        e = alldivs[i].getElementsByTagName("video").length;
        if (e == 0) {
            alldivs[i].remove();
        }
    }
};

const connectToNewUser = (userId, streams, myname) => {
    const call = peer.call(userId, streams);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        //       console.log(userVideoStream);
        addVideoStream(video, userVideoStream, myname);
    });
    call.on("close", () => {
        video.remove();
        RemoveUnusedDivs();
    });
    peers[userId] = call;
};

const cancel = () => {
    $("#getCodeModal").modal("hide");
};

const copy = async() => {
    const roomid = document.getElementById("roomid").innerText;
    await navigator.clipboard.writeText("http://localhost:3030/join/" + roomid);
};
const invitebox = () => {
    $("#getCodeModal").modal("show");
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        document.getElementById("mic").style.color = "red";
    } else {
        document.getElementById("mic").style.color = "white";
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const VideomuteUnmute = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    console.log(getUserMedia);
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        document.getElementById("video").style.color = "red";
    } else {
        document.getElementById("video").style.color = "white";
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};


//latest commented

const screenshare = document.querySelector(".screenshare");
screenshare.addEventListener('click' , screensharecode);
let screen = false;


//latest commented



// function screensharecode() {

// navigator.mediaDevices.getDisplayMedia({cursor:true})
//     .then(screenStream=>{
//       myPeer.current.replaceTrack(stream.getVideoTracks()[0],screenStream.getVideoTracks()[0],stream)
//       userVideo.current.srcObject=screenStream
//       screenStream.getTracks()[0].onended = () =>{
//       myPeer.current.replaceTrack(screenStream.getVideoTracks()[0],stream.getVideoTracks()[0],stream)
//       userVideo.current.srcObject=stream
//       }
//     })

// }


//latest commeneted

// function screensharecode() {
//     navigator.mediaDevices.getDisplayMedia({ cursor: true })
//         .then(screenStream => {
//             myPeer.current.replaceTrack(stream.getVideoTracks()[0], screenStream.getVideoTracks()[0], stream)
//             myVideo.srcObject = screenStream; // Update myVideo with the shared screen
//             screenStream.getTracks()[0].onended = () => {
//                 myPeer.current.replaceTrack(screenStream.getVideoTracks()[0], stream.getVideoTracks()[0], stream)
//                 myVideo.srcObject = stream; // Revert back to user's video
//             }
//         })
// }




//latest commented


let screenshareActive = false;

function screensharecode() {
    if (!screenshareActive) {
        navigator.mediaDevices.getDisplayMedia({ cursor: true })
            .then(screenStream => {
                myPeer.current.replaceTrack(stream.getVideoTracks()[0], screenStream.getVideoTracks()[0], stream)
                myVideo.srcObject = screenStream; // Update myVideo with the shared screen
                screenStream.getTracks()[0].onended = () => {
                    myPeer.current.replaceTrack(screenStream.getVideoTracks()[0], stream.getVideoTracks()[0], stream)
                    myVideo.srcObject = stream; // Revert back to user's video
                }
                screenshareActive = true;
            })
    } else {
        // Revert back to user's video
        myPeer.current.replaceTrack(myVideo.srcObject.getVideoTracks()[0], stream.getVideoTracks()[0], stream)
        myVideo.srcObject = stream;
        screenshareActive = false;
    }
}















const stopsharing = () => {
  const html = `
  <i class="fas fa-times-circle"></i>
    <span>Stop Sharing</span>
  `
  document.querySelector('.screenshare').innerHTML = html;
}

// latest commmented

// const stopSharing = () => {
//     navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//     }).then((stream) => {
//         myVideoStream = stream;
//         myVideo.srcObject = stream; // Update myVideo with user's video
//         const stopButton = document.querySelector(".stop-sharing");
//         stopButton.style.display = "none"; // Hide the stop sharing button
//     });
// }


const sharing = () => {
  const html = `
  <i class="fas fa-desktop"></i>
  <span>Share Screen</span>
  `
  document.querySelector('.screenshare').innerHTML = html;
}

//latest commenetd



// const showchat = () => {
//     if (chat.hidden == false) {
//         chat.hidden = true;
//     } else {
//         chat.hidden = false;
//     }
// };
const showchat = () => {
    chat.hidden = !chat.hidden;
    if (!chat.hidden) {
        document.getElementById("message_input").focus(); // Automatically focus on the input field when showing chat
    }
};

// const addVideoStream = (videoEl, stream, name) => {
//     videoEl.srcObject = stream;
//     videoEl.addEventListener("loadedmetadata", () => {
//         videoEl.play();
//     });
//     const h1 = document.createElement("h1");
//     const h1name = document.createTextNode(name);
//     h1.appendChild(h1name);
//     const videoGrid = document.createElement("div");
//     videoGrid.classList.add("video-grid");
//     videoGrid.appendChild(h1);
//     videoGrids.appendChild(videoGrid);
//     videoGrid.append(videoEl);
//     RemoveUnusedDivs();
//     let totalUsers = document.getElementsByTagName("video").length;
//     if (totalUsers > 1) {
//         for (let index = 0; index < totalUsers; index++) {
//             document.getElementsByTagName("video")[index].style.width =
//                 100 / totalUsers + "%";
//         }
//     }
// };

const addVideoStream = (videoEl, stream, name) => {
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
    });
    const h1 = document.createElement("h1");
    const h1name = document.createTextNode(name);
    h1.appendChild(h1name);
    const videoGrid = document.createElement("div");
    videoGrid.classList.add("video-grid");
    videoGrid.appendChild(h1);
    videoGrids.appendChild(videoGrid);

    if (screenshareActive) {
        // If screenshare is active, replace the video with screenshare
        myPeer.current.replaceTrack(stream.getVideoTracks()[0], videoEl.srcObject.getVideoTracks()[0], videoEl.srcObject);
        videoEl.srcObject = stream;
    }

    videoGrid.append(videoEl);
    RemoveUnusedDivs();
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width =
                100 / totalUsers + "%";
        }
    }
};

