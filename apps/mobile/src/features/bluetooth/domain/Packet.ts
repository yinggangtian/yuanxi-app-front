import { crc16 } from './crc';

/**
 * 帧结构（设计文档 §5.5.3）：
 *
 * ```text
 * | Header (2B) | Cmd (1B) | Seq (1B) | Len (2B, LE) | Payload (Len B) | CRC16 (2B, LE) |
 * ```
 *
 * CRC 覆盖 Header 之后、CRC 之前的全部字节。
 * 实际字段以硬件组协议文档为准（§10 待确认 2）；本文件是唯一需要随之调整的地方。
 */
export const FRAME_HEADER = [0x5a, 0xa5] as const;
const HEADER_SIZE = 2;
const CMD_SIZE = 1;
const SEQ_SIZE = 1;
const LEN_SIZE = 2;
const CRC_SIZE = 2;
/** Header + Cmd + Seq + Len + CRC */
export const FRAME_OVERHEAD = HEADER_SIZE + CMD_SIZE + SEQ_SIZE + LEN_SIZE + CRC_SIZE;

/** 单帧 payload 上限，防止长度字段被污染时申请超大缓冲。 */
export const MAX_PAYLOAD_SIZE = 512;

export interface Packet {
  cmd: number;
  seq: number;
  payload: Uint8Array;
}

/** 组帧：把命令与负载编码成可直接写入特征值的字节。 */
export function encodePacket(cmd: number, seq: number, payload: Uint8Array = new Uint8Array(0)): Uint8Array {
  if (payload.length > MAX_PAYLOAD_SIZE) {
    throw new RangeError(`payload 超出上限：${payload.length} > ${MAX_PAYLOAD_SIZE}`);
  }

  const frame = new Uint8Array(FRAME_OVERHEAD + payload.length);
  frame[0] = FRAME_HEADER[0];
  frame[1] = FRAME_HEADER[1];
  frame[2] = cmd & 0xff;
  frame[3] = seq & 0xff;
  frame[4] = payload.length & 0xff;
  frame[5] = (payload.length >> 8) & 0xff;
  frame.set(payload, 6);

  const crc = crc16(frame, HEADER_SIZE, 6 + payload.length);
  frame[6 + payload.length] = crc & 0xff;
  frame[7 + payload.length] = (crc >> 8) & 0xff;

  return frame;
}

export interface ParseResult {
  packets: Packet[];
  /** CRC 校验失败的帧数 */
  crcErrors: number;
  /** 依据 seq 连续性推断出的丢包数 */
  droppedPackets: number;
}

/**
 * 分包重组器（设计文档 §5.5.3）。
 *
 * BLE 通知按 MTU 切分，一次回调可能是半帧，也可能是多帧粘连。
 * 本类持有跨回调的残留缓冲，并做 CRC 校验与基于 seq 的丢包检测。
 *
 * 纯 TS、无副作用，可用硬件组提供的真实抓包做 fixture 回归。
 */
export class PacketAssembler {
  private buffer: Uint8Array = new Uint8Array(0);
  private lastSeq: number | null = null;

  /** 已累计的 CRC 错误与丢包数，用于测量结束后评估链路质量。 */
  private crcErrorCount = 0;
  private droppedCount = 0;

  /** 喂入一段原始字节，返回本次能完整解析出的帧。 */
  push(chunk: Uint8Array): ParseResult {
    const merged = new Uint8Array(this.buffer.length + chunk.length);
    merged.set(this.buffer, 0);
    merged.set(chunk, this.buffer.length);

    const packets: Packet[] = [];
    let crcErrors = 0;
    let dropped = 0;
    let offset = 0;

    while (offset < merged.length) {
      // 1. 寻找帧头；丢弃帧头之前的垃圾字节
      const headerIndex = findHeader(merged, offset);
      if (headerIndex < 0) {
        // 末尾可能是帧头的前半字节，保留 1 字节
        offset = Math.max(merged.length - 1, offset);
        break;
      }
      offset = headerIndex;

      // 2. 帧头之后至少要能读出 Cmd/Seq/Len
      if (merged.length - offset < FRAME_OVERHEAD) break;

      const length = (merged[offset + 4] as number) | ((merged[offset + 5] as number) << 8);

      // 长度字段被污染：跳过这个帧头继续找下一个，而不是卡死或申请超大缓冲
      if (length > MAX_PAYLOAD_SIZE) {
        offset += HEADER_SIZE;
        continue;
      }

      const frameEnd = offset + FRAME_OVERHEAD + length;
      // 3. 帧未收全，留待下次回调
      if (frameEnd > merged.length) break;

      const crcOffset = frameEnd - CRC_SIZE;
      const expected = crc16(merged, offset + HEADER_SIZE, crcOffset);
      const actual = (merged[crcOffset] as number) | ((merged[crcOffset + 1] as number) << 8);

      if (expected !== actual) {
        crcErrors += 1;
        this.crcErrorCount += 1;
        // 坏帧：跳过帧头继续寻找，避免因一次误判丢掉后续所有数据
        offset += HEADER_SIZE;
        continue;
      }

      const seq = merged[offset + 3] as number;
      if (this.lastSeq !== null) {
        // seq 为单字节循环计数，差值按 256 取模
        const gap = (seq - this.lastSeq + 256) % 256;
        if (gap > 1) dropped += gap - 1;
      }
      this.lastSeq = seq;

      packets.push({
        cmd: merged[offset + 2] as number,
        seq,
        payload: merged.slice(offset + 6, crcOffset),
      });

      offset = frameEnd;
    }

    this.buffer = merged.slice(offset);
    this.droppedCount += dropped;

    return { packets, crcErrors, droppedPackets: dropped };
  }

  /** 链路质量统计。 */
  get stats(): { crcErrors: number; dropped: number } {
    return { crcErrors: this.crcErrorCount, dropped: this.droppedCount };
  }

  /** 断开重连后必须重置，否则残留半帧会污染新连接的数据。 */
  reset(): void {
    this.buffer = new Uint8Array(0);
    this.lastSeq = null;
  }
}

function findHeader(data: Uint8Array, from: number): number {
  for (let index = from; index < data.length - 1; index += 1) {
    if (data[index] === FRAME_HEADER[0] && data[index + 1] === FRAME_HEADER[1]) return index;
  }
  return -1;
}
