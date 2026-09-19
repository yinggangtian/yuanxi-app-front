/**
 * 定长环形缓冲（设计文档 §5.6）。
 *
 * 用于保存最近 N 秒的波形窗口。使用 Float32Array 预分配，
 * 采样期间**不产生任何新分配**，避免 200Hz 下频繁 GC 影响帧率。
 */
export class RingBuffer {
  private readonly data: Float32Array;
  /** 下一个写入位置 */
  private writeIndex = 0;
  /** 已写入的样本总数（不回绕），用于判断是否已填满 */
  private written = 0;

  constructor(readonly capacity: number) {
    if (capacity <= 0) throw new RangeError('capacity 必须为正数');
    this.data = new Float32Array(capacity);
  }

  /** 当前有效样本数。 */
  get size(): number {
    return Math.min(this.written, this.capacity);
  }

  get isFull(): boolean {
    return this.written >= this.capacity;
  }

  /** 写入单个样本。 */
  push(value: number): void {
    this.data[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    this.written += 1;
  }

  /** 批量写入（BLE 每 40ms 一批，走这个路径）。 */
  pushBatch(values: ArrayLike<number>): void {
    for (let index = 0; index < values.length; index += 1) {
      this.push(values[index] as number);
    }
  }

  /**
   * 按时间顺序导出全部有效样本（最旧 → 最新）。
   *
   * @param target 可选的复用数组；传入可避免每帧分配新数组。
   */
  toArray(target?: number[]): number[] {
    const size = this.size;
    const result = target ?? new Array<number>(size);
    result.length = size;

    // 未填满时数据从 0 开始；填满后最旧样本在 writeIndex 处
    const start = this.isFull ? this.writeIndex : 0;
    for (let index = 0; index < size; index += 1) {
      result[index] = this.data[(start + index) % this.capacity] as number;
    }
    return result;
  }

  /** 最新样本；缓冲为空时返回 undefined。 */
  get last(): number | undefined {
    if (this.written === 0) return undefined;
    return this.data[(this.writeIndex - 1 + this.capacity) % this.capacity];
  }

  clear(): void {
    this.writeIndex = 0;
    this.written = 0;
    this.data.fill(0);
  }
}
