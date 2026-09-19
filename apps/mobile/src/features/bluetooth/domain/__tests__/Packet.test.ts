import { encodePacket, FRAME_OVERHEAD, MAX_PAYLOAD_SIZE, PacketAssembler } from '../Packet';

const CMD_SAMPLES = 0x10;

describe('encodePacket', () => {
  it('帧长 = 固定开销 + payload 长度', () => {
    const frame = encodePacket(CMD_SAMPLES, 0, Uint8Array.from([1, 2, 3]));
    expect(frame.length).toBe(FRAME_OVERHEAD + 3);
  });

  it('写入帧头、命令与序号', () => {
    const frame = encodePacket(0x21, 0x07);
    expect(frame[0]).toBe(0x5a);
    expect(frame[1]).toBe(0xa5);
    expect(frame[2]).toBe(0x21);
    expect(frame[3]).toBe(0x07);
  });

  it('payload 超限时抛错，而不是静默截断', () => {
    expect(() => encodePacket(CMD_SAMPLES, 0, new Uint8Array(MAX_PAYLOAD_SIZE + 1))).toThrow(
      RangeError,
    );
  });
});

describe('PacketAssembler 分包重组（§5.5.3）', () => {
  it('完整单帧可直接解析', () => {
    const assembler = new PacketAssembler();
    const result = assembler.push(encodePacket(CMD_SAMPLES, 0, Uint8Array.from([0xaa, 0xbb])));

    expect(result.packets).toHaveLength(1);
    expect(result.packets[0]!.cmd).toBe(CMD_SAMPLES);
    expect(Array.from(result.packets[0]!.payload)).toEqual([0xaa, 0xbb]);
    expect(result.crcErrors).toBe(0);
  });

  it('半帧拆到两次回调仍能重组', () => {
    const assembler = new PacketAssembler();
    const frame = encodePacket(CMD_SAMPLES, 0, Uint8Array.from([1, 2, 3, 4]));
    const cut = 5;

    expect(assembler.push(frame.slice(0, cut)).packets).toHaveLength(0);

    const result = assembler.push(frame.slice(cut));
    expect(result.packets).toHaveLength(1);
    expect(Array.from(result.packets[0]!.payload)).toEqual([1, 2, 3, 4]);
  });

  it('逐字节喂入也能重组（最坏 MTU 情况）', () => {
    const assembler = new PacketAssembler();
    const frame = encodePacket(CMD_SAMPLES, 3, Uint8Array.from([9, 8, 7]));

    let parsed = 0;
    for (const byte of frame) {
      parsed += assembler.push(Uint8Array.from([byte])).packets.length;
    }
    expect(parsed).toBe(1);
  });

  it('多帧粘连一次性解析', () => {
    const assembler = new PacketAssembler();
    const a = encodePacket(CMD_SAMPLES, 0, Uint8Array.from([1]));
    const b = encodePacket(CMD_SAMPLES, 1, Uint8Array.from([2]));
    const merged = Uint8Array.from([...a, ...b]);

    const result = assembler.push(merged);
    expect(result.packets).toHaveLength(2);
    expect(result.packets[1]!.seq).toBe(1);
  });

  it('帧头之前的垃圾字节被丢弃', () => {
    const assembler = new PacketAssembler();
    const frame = encodePacket(CMD_SAMPLES, 0, Uint8Array.from([1]));
    const noisy = Uint8Array.from([0xff, 0x00, 0x13, ...frame]);

    expect(assembler.push(noisy).packets).toHaveLength(1);
  });

  it('CRC 错误的帧被计数并跳过，后续帧仍可解析', () => {
    const assembler = new PacketAssembler();
    const bad = encodePacket(CMD_SAMPLES, 0, Uint8Array.from([1, 2]));
    bad[6] = (bad[6] as number) ^ 0xff; // 篡改 payload

    const good = encodePacket(CMD_SAMPLES, 1, Uint8Array.from([3, 4]));
    const result = assembler.push(Uint8Array.from([...bad, ...good]));

    expect(result.crcErrors).toBeGreaterThanOrEqual(1);
    expect(result.packets).toHaveLength(1);
    expect(Array.from(result.packets[0]!.payload)).toEqual([3, 4]);
  });

  it('依据 seq 连续性推断丢包数', () => {
    const assembler = new PacketAssembler();
    assembler.push(encodePacket(CMD_SAMPLES, 0));
    // seq 跳到 3 → 丢了 1 和 2
    const result = assembler.push(encodePacket(CMD_SAMPLES, 3));

    expect(result.droppedPackets).toBe(2);
    expect(assembler.stats.dropped).toBe(2);
  });

  it('seq 单字节回绕（255 → 0）不误判为丢包', () => {
    const assembler = new PacketAssembler();
    assembler.push(encodePacket(CMD_SAMPLES, 255));
    const result = assembler.push(encodePacket(CMD_SAMPLES, 0));

    expect(result.droppedPackets).toBe(0);
  });

  it('长度字段被污染时不卡死，继续寻找后续帧', () => {
    const assembler = new PacketAssembler();
    const corrupted = encodePacket(CMD_SAMPLES, 0, Uint8Array.from([1]));
    // 把 Len 改成超大值
    corrupted[4] = 0xff;
    corrupted[5] = 0xff;

    const good = encodePacket(CMD_SAMPLES, 1, Uint8Array.from([5]));
    const result = assembler.push(Uint8Array.from([...corrupted, ...good]));

    expect(result.packets).toHaveLength(1);
    expect(Array.from(result.packets[0]!.payload)).toEqual([5]);
  });

  it('reset 清空残留半帧，避免污染重连后的数据', () => {
    const assembler = new PacketAssembler();
    const frame = encodePacket(CMD_SAMPLES, 0, Uint8Array.from([1, 2, 3, 4]));
    assembler.push(frame.slice(0, 5));

    assembler.reset();

    // 断链后重连，重新发送完整帧应能正常解析
    const result = assembler.push(frame);
    expect(result.packets).toHaveLength(1);
  });

  it('空输入安全', () => {
    const assembler = new PacketAssembler();
    expect(assembler.push(new Uint8Array(0)).packets).toEqual([]);
  });
});
