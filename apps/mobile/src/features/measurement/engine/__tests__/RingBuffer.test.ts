import { RingBuffer } from '../RingBuffer';

describe('RingBuffer', () => {
  it('容量非法时抛错', () => {
    expect(() => new RingBuffer(0)).toThrow(RangeError);
    expect(() => new RingBuffer(-1)).toThrow(RangeError);
  });

  it('未填满时按写入顺序导出', () => {
    const buffer = new RingBuffer(5);
    buffer.pushBatch([1, 2, 3]);

    expect(buffer.size).toBe(3);
    expect(buffer.isFull).toBe(false);
    expect(buffer.toArray()).toEqual([1, 2, 3]);
  });

  it('恰好填满时不回绕', () => {
    const buffer = new RingBuffer(3);
    buffer.pushBatch([1, 2, 3]);

    expect(buffer.isFull).toBe(true);
    expect(buffer.toArray()).toEqual([1, 2, 3]);
  });

  it('溢出后丢弃最旧样本，顺序仍为「旧 → 新」', () => {
    const buffer = new RingBuffer(3);
    buffer.pushBatch([1, 2, 3, 4, 5]);

    expect(buffer.size).toBe(3);
    expect(buffer.toArray()).toEqual([3, 4, 5]);
  });

  it('多次回绕后顺序依然正确', () => {
    const buffer = new RingBuffer(4);
    for (let index = 1; index <= 20; index += 1) buffer.push(index);

    expect(buffer.toArray()).toEqual([17, 18, 19, 20]);
  });

  it('last 返回最新样本', () => {
    const buffer = new RingBuffer(3);
    expect(buffer.last).toBeUndefined();

    buffer.push(7);
    expect(buffer.last).toBe(7);

    buffer.pushBatch([8, 9, 10]);
    expect(buffer.last).toBe(10);
  });

  it('支持 Float32Array 批量写入（BLE 解码后的实际类型）', () => {
    const buffer = new RingBuffer(4);
    buffer.pushBatch(new Float32Array([0.5, -0.5]));

    expect(buffer.size).toBe(2);
    expect(buffer.toArray()[0]).toBeCloseTo(0.5, 5);
  });

  it('toArray 可复用目标数组，避免每帧分配', () => {
    const buffer = new RingBuffer(3);
    buffer.pushBatch([1, 2, 3]);

    const target: number[] = [];
    const first = buffer.toArray(target);
    expect(first).toBe(target);
    expect(target).toEqual([1, 2, 3]);

    buffer.push(4);
    buffer.toArray(target);
    expect(target).toEqual([2, 3, 4]);
  });

  it('复用数组在样本变少时正确截断', () => {
    const buffer = new RingBuffer(5);
    buffer.pushBatch([1, 2, 3, 4, 5]);
    const target = buffer.toArray();
    expect(target).toHaveLength(5);

    buffer.clear();
    buffer.pushBatch([9]);
    buffer.toArray(target);
    expect(target).toEqual([9]);
  });

  it('clear 重置为空', () => {
    const buffer = new RingBuffer(3);
    buffer.pushBatch([1, 2, 3]);
    buffer.clear();

    expect(buffer.size).toBe(0);
    expect(buffer.isFull).toBe(false);
    expect(buffer.toArray()).toEqual([]);
    expect(buffer.last).toBeUndefined();
  });
});
