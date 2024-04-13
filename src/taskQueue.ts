import { sleep } from "./utils";

export class SendQueueManager {
  private lowBuffAmount;
  private highBuffAmount;
  private status: "pause" | "ready" = "ready";

  dataChannel: RTCDataChannel;

  constructor(dc: RTCDataChannel, lowBuff: number = 64 * 1024, highBuff: number = 10 * 1024 * 1024) {
    this.lowBuffAmount = lowBuff;
    this.highBuffAmount = highBuff;
    this.dataChannel = dc;
    this.dataChannel.bufferedAmountLowThreshold = this.lowBuffAmount;

    this.dataChannel.addEventListener("bufferedamountlow", () => {
      if (this.status === "pause") {
        this.status = "ready";
        console.log("ready to send data on buff amount", this.dataChannel.bufferedAmount);
      }
    });
  }

  async sendData(payload: string, delay: number = 100): Promise<Boolean> {
    if (this.status === "pause") {
      console.log("cannot send data buff amount is high", this.dataChannel.bufferedAmount);
      return sleep(delay).then(() => false);
    }

    this.dataChannel.send(payload);
    // console.log("sending data with buff amount", this.dataChannel.bufferedAmount);

    if (this.status === "ready" && this.dataChannel.bufferedAmount >= this.highBuffAmount) {
      this.status = "pause";
      console.log("sending paused for buff amount", this.dataChannel.bufferedAmount);
      return false;
    }

    return true;
  }
}
