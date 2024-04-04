import "./output.css";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

(() => {
  const selectNode = document.getElementById("peer-select");
  const sender = document.getElementById('sender')
  const receiver = document.getElementById("receiver")

  const offerNode = document.getElementById("offer");
  const createOfferBtn = document.getElementById("create-offer");
  const copyOfferBtn = document.getElementById("copy-offer");
  const iceCanNode = document.getElementById("ice-can");
  const copyIceCanBtn = document.getElementById("copy-ice-can");
  const ansNode = document.getElementById("answer");
  const creatAnsBtn = document.getElementById("create-ans");
  const copyAnsBtn = document.getElementById("copy-answer");
  const addAnsNode = document.getElementById("add-answer");
  const addAnsBtn = document.getElementById("add-answer-btn");
  const addIceCanNode = document.getElementById("remote-ice-can");
  const addIceCanBtn = document.getElementById("add-ice-can");

  const peerConnection = new RTCPeerConnection(servers);
  const dataChannel = peerConnection.createDataChannel("myDataChannel");

  selectNode?.addEventListener("change", handleSelectChange);

  createOfferBtn?.addEventListener("click", handleCreateOffer);
  copyOfferBtn?.addEventListener("click", handleOfferCopy);
  copyIceCanBtn?.addEventListener("click", handleIceCandidatesCopy);
  addAnsBtn?.addEventListener("click", handleAddAnswer);
  creatAnsBtn?.addEventListener("click", handleCreateAnswer);
  copyAnsBtn?.addEventListener("click", handleAnswerCopy);

  peerConnection.onicecandidate = handleIceCandidate;
  peerConnection.oniceconnectionstatechange = handleIceConnectionStateChange;

  function handleSelectChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value

    if(!sender || !receiver) return;

    if(val === "sender"){
      sender.style.display = "flex";
      receiver.style.display = "none"
    }
    else if(val === "receiver"){
      sender.style.display = "none";
      receiver.style.display = "flex"
    }
  }

  async function handleCreateOffer() {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("offer", offer);
    if (offerNode) offerNode.innerText = btoa(JSON.stringify(offer));
  }

  async function handleCreateAnswer() {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log("answer", answer);
    if (ansNode) ansNode.innerText = btoa(JSON.stringify(answer));
  }

  async function handleOfferCopy() {
    const offer = offerNode?.innerText;
    if (offer) await navigator.clipboard.writeText(offer);
  }

  async function handleAnswerCopy() {
    const answer = ansNode?.innerText;
    if (answer) await navigator.clipboard.writeText(answer);
  }

  async function handleIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (event.candidate && iceCanNode) {
      console.log("candidate", event.candidate);
      const child = document.createElement("p");
      child.innerText = btoa(JSON.stringify(event.candidate));
      iceCanNode.append(child);
    }
  }

  function handleIceConnectionStateChange() {
    console.log("connection state", peerConnection.iceConnectionState);
  }

  async function handleIceCandidatesCopy() {
    const candidates: string[] = [];

    iceCanNode?.childNodes.forEach((child) => {
      candidates.push((child as HTMLElement).innerText);
    });

    await navigator.clipboard.writeText(JSON.stringify(candidates));
  }

  async function handleAddAnswer() {}
})();
