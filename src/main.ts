import "./output.css";

(() => {
  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
  };

  const divNode = document.getElementById("ice-candidates");
  const btnNode = document.getElementById("connect-btn");

  if (!divNode || !btnNode) return;

  btnNode.addEventListener("click", createPeerConnnection);

  async function createPeerConnnection() {
    console.log("connecting");
    const peerConnection = new RTCPeerConnection(servers);

    // Create data channel
    const dataChannel = peerConnection.createDataChannel("myDataChannel");

    // Set up event listeners for data channel
    dataChannel.onopen = handleDataChannelOpen;
    dataChannel.onclose = handleDataChannelClose;
    dataChannel.onmessage = handleDataChannelMessage;

    // Set up event listeners for ICE candidates
    peerConnection.onicecandidate = handleICECandidate;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("offer", offer);
  }

  // Event handler for data channel open
  function handleDataChannelOpen(event: Event) {
    console.log("Data channel opened");
  }

  // Event handler for data channel close
  function handleDataChannelClose(event: Event) {
    console.log("Data channel closed");
  }

  // Event handler for receiving messages on data channel
  function handleDataChannelMessage(event: MessageEvent) {
    console.log("Received message:", event.data);
  }

  // Event handler for ICE candidates
  function handleICECandidate(event: RTCPeerConnectionIceEvent) {
    if (event.candidate) {
      // Send ICE candidate to the remote peer (signaling)
      // For simplicity, this step is skipped in this example.
      console.log("candidtades", event.candidate);
    }
  }
})();
