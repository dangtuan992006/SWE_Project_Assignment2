import { calculateRefundPoints } from './refund-points';
describe('Hoàn điểm: 1 điểm = 1.000đ, làm tròn lên', () => {
  it.each([
    [50000, 50],
    [50001, 51],
    [50999, 51],
    [1000, 1],
    [1, 1],
    ['1000.01', 2],
    [90000, 90],
  ])('quy đổi %s thành %s điểm', (amount, expected) => {
    expect(calculateRefundPoints(amount)).toBe(expected);
  });
  it.each([0, -1, 'NaN', 'Infinity', '2147483647001'])(
    'chặn số tiền không hợp lệ %s',
    (amount) => {
      expect(() => calculateRefundPoints(amount)).toThrow(RangeError);
    },
  );
  it('không dùng tỷ lệ tích điểm thưởng 10.000đ/điểm để tính điểm hoàn', () => {
    expect(calculateRefundPoints(50000)).toBe(50);
  });
});
