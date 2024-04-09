import "./output.css";
import { ab2str, str2ab } from "./utils";

interface IPayloadInit {
  type: "init";
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface IPayloadMsg {
  type: "msg";
  pos: number;
  data: string;
}

interface IPayloadEnd {
  type: "end";
}

interface IPayloadBegin {
  type: "begin";
}

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
  let selNodeVal = "sender";

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

  // info
  const conNode = document.getElementById("connection-status");

  // connection
  const peerConnection = new RTCPeerConnection(servers);

  peerConnection.onicecandidate = handleIceCandidate;
  peerConnection.oniceconnectionstatechange = handleIceConnectionStateChange;
  peerConnection.ondatachannel = handleOnDataChannel;

  // data channel
  const dataChannel = peerConnection.createDataChannel("dataChannel");
  let receiveChan = null;

  // file system apis
  let file: File;
  let newHandle: FileSystemFileHandle;
  let writableStream: FileSystemWritableFileStream;
  const selFileNode = document.getElementById("select-file");
  const selFileBtn = document.getElementById("select-file-btn");

  selFileBtn?.addEventListener("click", handleSelectFile);

  // methods
  function handleOnDataChannel(ev: RTCDataChannelEvent) {
    receiveChan = ev.channel;
    receiveChan.onopen = handleDataChannelOpen;
    receiveChan.onclose = handleDataChannelClose;
    receiveChan.onerror = handleDataChannelError;
    receiveChan.onmessage = handleDataChannelMsg;
  }

  function handleSelectChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    selNodeVal = val;

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
    if (!conNode) return;
    console.log("connection state", peerConnection.iceConnectionState);
    conNode.textContent = peerConnection.iceConnectionState;
  }

  async function handleSelectFile() {
    const [fileData] = await window.showOpenFilePicker();
    file = await fileData.getFile();

    console.log(file);

    dataChannel.send(
      JSON.stringify({ fileName: file.name, fileSize: file.size, fileType: file.type, type: "init" } as IPayloadInit)
    );
  }

  function handleDataChannelOpen(ev: Event) {
    console.log("channel open", ev);
    if (selNodeVal === "receiver" || !selFileNode) return;

    selFileNode.style.display = "block";
  }

  function handleDataChannelClose(ev: Event) {
    console.log("channel close", ev);
  }

  function handleDataChannelError(ev: Event) {
    console.log("channel error", ev);
  }

  async function uploadData() {
    const chunkSize = 15 * 1024; // bytes
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const buffer = await chunk.arrayBuffer();
      dataChannel.send(JSON.stringify({ type: "msg", pos: offset, data: ab2str(buffer) } as IPayloadMsg));
      offset += chunkSize;
    }

    dataChannel.send(JSON.stringify({ type: "end" } as IPayloadEnd));
    // dataChannel.close();
  }

  async function handleDataChannelMsg(ev: MessageEvent<any>) {
    console.log("channel msg", ev);

    let dataObj: IPayloadInit | IPayloadEnd | IPayloadMsg | IPayloadBegin = JSON.parse(ev.data);

    if (dataObj) {
      switch (dataObj.type) {
        case "init":
          {
            const recvFileBtn = document.getElementById("receive-file-btn");

            if (!recvFileBtn) return;

            recvFileBtn.addEventListener("click", async () => {
              newHandle = await window.showSaveFilePicker({
                suggestedName: dataObj.fileName,
              });
              writableStream = await newHandle.createWritable();
              dataChannel.send(JSON.stringify({ type: "begin" } as IPayloadBegin));
            });

            recvFileBtn.style.display = "block";
          }
          break;
        case "msg":
          {
            const data = str2ab(dataObj.data);
            await writableStream.write({ type: "write", position: dataObj.pos, data: new Blob([data]) });
          }
          break;
        case "end":
          {
            console.log("waiting channel close");
            await writableStream.close();
            console.log("channel closed");
          }
          break;
        case "begin":
          {
            await uploadData();
          }
          break;
        default:
          break;
      }
    }
  }
})();
