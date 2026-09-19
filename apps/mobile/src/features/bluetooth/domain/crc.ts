/**
 * CRC-16/MODBUS 校验（设计文档 §5.5.3）。
 *
 * 多项式 0xA001（0x8005 反射），初值 0xFFFF，输入/输出均反射，无异或输出。
 * 最终协议参数以硬件组文档为准（§10 待确认 2）；若硬件采用其它变体，
 * 只需替换本文件，帧结构与上层解析不受影响。
 */
const POLYNOMIAL = 0xa001;
const INITIAL = 0xffff;

/** 预计算查表，避免每字节 8 次位运算 —— 200Hz 采样下解析开销要尽量低。 */
const TABLE: Uint16Array = (() => {
  const table = new Uint16Array(256);
  for (let byte = 0; byte < 256; byte += 1) {
    let crc = byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ POLYNOMIAL : crc >>> 1;
    }
    table[byte] = crc;
  }
  return table;
})();

/** 计算一段字节的 CRC16。 */
export function crc16(data: Uint8Array, start = 0, end = data.length): number {
  let crc = INITIAL;
  for (let index = start; index < end; index += 1) {
    const tableIndex = (crc ^ (data[index] as number)) & 0xff;
    crc = (crc >>> 8) ^ (TABLE[tableIndex] as number);
  }
  return crc & 0xffff;
}

/** 校验一段数据末尾两字节（小端）的 CRC 是否正确。 */
export function verifyCrc16(frame: Uint8Array): boolean {
  if (frame.length < 3) return false;
  const payloadEnd = frame.length - 2;
  const expected = crc16(frame, 0, payloadEnd);
  const actual = (frame[payloadEnd] as number) | ((frame[payloadEnd + 1] as number) << 8);
  return expected === actual;
}
