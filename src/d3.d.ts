declare module "d3-scale" {
  export function scaleSequential(
    interpolator: (t: number) => string,
  ): {
    domain(d: [number, number]): (value: number) => string;
    (value: number): string;
  };
}

declare module "d3-interpolate" {
  export function interpolateRgbBasis(
    colors: readonly string[],
  ): (t: number) => string;
}
