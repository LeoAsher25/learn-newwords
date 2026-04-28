export function generatePracticeOrders(totalWords: number): number[][] {
  if (totalWords <= 0) {
    return [[], [], []];
  }

  const sequential = Array.from({ length: totalWords }, (_, index) => index + 1);
  const oddThenEven = [
    ...sequential.filter((index) => index % 2 === 1),
    ...sequential.filter((index) => index % 2 === 0),
  ];
  const oddDescThenEvenDesc = [
    ...sequential.filter((index) => index % 2 === 1).reverse(),
    ...sequential.filter((index) => index % 2 === 0).reverse(),
  ];

  return [
    sequential,
    oddThenEven,
    oddDescThenEvenDesc,
  ];
}
