import "./output.css";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

(() => {
  // selector
  const selectNode = document.getElementById("peer-select");
  const sender = document.getElementById("sender");
  const receiver = document.getElementById("receiver");

  selectNode?.addEventListener("change", handleSelectChange);

  // sender
  const offerNode = document.getElementById("offer");
  const createOfferBtn = document.getElementById("create-offer-btn");
  const copyOfferBtn = document.getElementById("copy-offer-btn");
  const acceptAnsNode = document.getElementById("accept-answer");
  const acceptAnsBtn = document.getElementById("accept-answer-btn");

  createOfferBtn?.addEventListener("click", handleCreateOffer);
  copyOfferBtn?.addEventListener("click", handleOfferCopy);
  acceptAnsBtn?.addEventListener("click", handleAcceptAnswer);

  // receiver
  const acceptOfferBtn = document.getElementById("accept-offer-btn");
  const acceptOfferNode = document.getElementById("accept-offer");
  const ansNode = document.getElementById("answer");
  const copyAnsBtn = document.getElementById("copy-answer-btn");

  acceptOfferBtn?.addEventListener("click", handleAcceptOffer);
  copyAnsBtn?.addEventListener("click", handleAnswerCopy);

  // ice candidates
  const iceCanNode = document.getElementById("ice-can");
  const copyIceCanBtn = document.getElementById("copy-ice-can-btn");
  const remoteIceCanNode = document.getElementById("remote-ice-can");
  const remodeIceCanBtn = document.getElementById("add-remote-ice-can-btn");

  copyIceCanBtn?.addEventListener("click", handleIceCandidatesCopy);
  remodeIceCanBtn?.addEventListener("click", handleAddIceCandidates);

  const peerConnection = new RTCPeerConnection(servers);
  const dataChannel = peerConnection.createDataChannel("myDataChannel");

  dataChannel.addEventListener("open", () => console.log("data is transferrable"));

  peerConnection.onicecandidate = handleIceCandidate;
  peerConnection.oniceconnectionstatechange = handleIceConnectionStateChange;

  function handleSelectChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;

    if (!sender || !receiver) return;

    if (val === "sender") {
      sender.style.display = "flex";
      receiver.style.display = "none";
    } else if (val === "receiver") {
      sender.style.display = "none";
      receiver.style.display = "flex";
    }
  }

  async function handleCreateOffer() {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("offer", offer);
    if (offerNode) offerNode.innerText = btoa(JSON.stringify(offer));
  }

  async function handleAcceptOffer() {
    if (!acceptOfferNode) return;

    const offer = JSON.parse(atob(acceptOfferNode.textContent ?? "")) as RTCSessionDescriptionInit;
    console.log("offer in receiver", offer);

    await peerConnection.setRemoteDescription(offer);

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

  async function handleAcceptAnswer() {
    if (!acceptAnsNode) return;

    const answer = JSON.parse(atob(acceptAnsNode.textContent ?? "")) as RTCSessionDescriptionInit;
    await peerConnection.setRemoteDescription(answer);
  }

  async function handleIceCandidatesCopy() {
    const candidates: string[] = [];

    iceCanNode?.childNodes.forEach((child) => {
      candidates.push((child as HTMLElement).innerText);
    });

    await navigator.clipboard.writeText(JSON.stringify(candidates));
  }

  async function handleAddIceCandidates() {
    if (!remoteIceCanNode) return;

    const candidates = JSON.parse(remoteIceCanNode.textContent ?? "") as string[];

    candidates.map(async (can) => {
      await peerConnection.addIceCandidate(JSON.parse(atob(can)));
    });
  }

  function handleIceConnectionStateChange() {
    console.log("connection state", peerConnection.iceConnectionState);
  }
})();
