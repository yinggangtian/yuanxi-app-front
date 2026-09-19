import { crc16, verifyCrc16 } from '../crc';

/** 追加小端 CRC，构造一帧合法数据。 */
function withCrc(bytes: number[]): Uint8Array {
  const body = Uint8Array.from(bytes);
  const crc = crc16(body);
  return Uint8Array.from([...bytes, crc & 0xff, (crc >> 8) & 0xff]);
}

describe('CRC-16/MODBUS', () => {
  it('匹配标准测试向量 "123456789" → 0x4B37', () => {
    const input = Uint8Array.from('123456789', (char) => char.charCodeAt(0));
    expect(crc16(input)).toBe(0x4b37);
  });

  it('空输入返回初值 0xFFFF', () => {
    expect(crc16(new Uint8Array(0))).toBe(0xffff);
  });

  it('单字节 0x00 → 0x40BF', () => {
    expect(crc16(Uint8Array.from([0x00]))).toBe(0x40bf);
  });

  it('支持按区间计算，便于跳过帧头', () => {
    const data = Uint8Array.from([0xaa, 0xbb, ...'123456789'.split('').map((c) => c.charCodeAt(0))]);
    expect(crc16(data, 2)).toBe(0x4b37);
  });
});

describe('verifyCrc16', () => {
  it('正确的帧通过校验', () => {
    expect(verifyCrc16(withCrc([0x01, 0x02, 0x03]))).toBe(true);
  });

  it('任何一位翻转都会被发现', () => {
    const frame = withCrc([0x01, 0x02, 0x03]);
    frame[1] = (frame[1] as number) ^ 0x01;
    expect(verifyCrc16(frame)).toBe(false);
  });

  it('CRC 字节被篡改时失败', () => {
    const frame = withCrc([0x01, 0x02, 0x03]);
    frame[frame.length - 1] = (frame[frame.length - 1] as number) ^ 0xff;
    expect(verifyCrc16(frame)).toBe(false);
  });

  it('过短的帧直接判为非法', () => {
    expect(verifyCrc16(Uint8Array.from([0x01, 0x02]))).toBe(false);
  });
});
