interface Xy {
    x: number,
    y: number,
}

type Complex = Xy;

interface Camera<SceneCoord, ImageCoord> {
    dims: Xy;

    sceneToImage(sceneCoord: SceneCoord): ImageCoord;
    imageToScene(imageCoord: ImageCoord): SceneCoord;
}

class ComplexCamera implements Camera<Complex, Xy> {
    constructor(public dims: Xy, public zoom: number, public center: Complex) { }
    static default(): ComplexCamera {
        return new ComplexCamera({ x: 1024, y: 1024 }, 0.3, { x: -0.5, y: 0.0 });
    }

    sceneToImage(sceneCoord: Complex): Xy {
        return {
            x: ((sceneCoord.x - this.center.x) * this.zoom + 0.5) * this.dims.x,
            y: ((sceneCoord.y - this.center.y) * this.zoom + 0.5) * this.dims.y,
        };
    }
    imageToScene(imageCoord: Xy): Complex {
        return {
            x: (imageCoord.x / this.dims.x - 0.5) / this.zoom + this.center.x,
            y: (imageCoord.y / this.dims.y - 0.5) / this.zoom + this.center.y,
        };
    }
}

interface FractalGenerator<Output> {
    generate(): Output;
}

function conj(complex: Complex): Complex {
    return {
        x: complex.x,
        y: -complex.y,
    };
}
function mul(left: Complex, right: Complex): Complex {
    return {
        x: (left.x * right.x - left.y * right.y),
        y: (left.x * right.y + left.y * right.x),
    };
}
function plus(left: Complex, right: Complex): Complex {
    return {
        x: left.x + right.x,
        y: left.y + right.y,
    };
}
function log2(value: number): number {
    return Math.log(value) / Math.LN2;
}

class Mandelbrot implements FractalGenerator<Float64Array> {
    constructor(
        public camera: ComplexCamera,
        public n_iters: number,
        public escape_threshold: number
    ) { }
    static default(): Mandelbrot {
        return new Mandelbrot(ComplexCamera.default(), 1000, 100.0);
    }

    generate(): Float64Array {
        let arr = new Float64Array(this.camera.dims.x * this.camera.dims.y);
        // let buffer = Buffer.allocUnsafe(this.camera.dims.x * this.camera.dims.y);

        for (let x = 0; x < this.camera.dims.x; x++) {
            for (let y = 0; y < this.camera.dims.y; y++) {
                const c = this.camera.imageToScene({ x: x, y: y });
                let z = { x: 0, y: 0 };
                let idx = y * this.camera.dims.x + x; // row-major
                let escaped = false;
                for (let i = 0; i < this.n_iters; i++) {
                    z = plus(mul(z, z), c);
                    const conj_z = conj(z);
                    const escape_value = z.x * conj_z.x - z.y * conj_z.y;
                    if (escape_value > this.escape_threshold) {
                        escaped = true;
                        arr[idx] = i + (1 - log2(log2(escape_value) / 2));
                        break;
                    }
                }
                if (!escaped) {
                    arr[idx] = 0;
                }
            }
        }

        return arr;
    }
}

interface Filter<In, Out> {
    filter(input: In): Out;
}

class GrayExponentialFilter implements Filter<Float64Array, Float64Array> {
    constructor(public multiplier: number, public power: number) { }
    static default(): GrayExponentialFilter {
        return new GrayExponentialFilter(2.0, 0.5);
    }

    filter(input: Float64Array): Float64Array {
        const [min, max] = input.reduce(
            (accum, value) => {
                let [min, max] = accum;
                return [value < min ? value : min, value > max ? value : max];
            },
            [Infinity, -Infinity]
        );
        let range = max - min;

        for (let i = 0; i < input.length; i++) {
            input[i] = Math.pow((this.multiplier * input[i] / range), this.power)
        }
        return input;
    }
}

class Quantization8 implements Filter<Float64Array, Uint8Array> {
    constructor() { }

    filter(input: Float64Array): Uint8Array {
        let output = new Uint8Array(input.length);
        for (let i = 0; i < input.length; i++) {
            let val = input[i];
            output[i] = (val > 1.0 ? 255 : (val < 0.0 ? 0 : val * 255));
        }
        return output;
    }
}

function generate(n_iters: number): Buffer {
    let hist = new Mandelbrot(ComplexCamera.default(), n_iters, 100.0).generate();
    let hist_filtered = new GrayExponentialFilter(1.0, 0.1).filter(hist);
    let hist_quantized = new Quantization8().filter(hist_filtered);
    return Buffer.from(hist_quantized);
}

setTimeout(() => {
    const sharp = require('sharp');
    let img = generate(1000);
    sharp(img, { raw: { width: 1024, height: 1024, channels: 1 }})
        .toFile('test.png', (err, info) => {
            if (err) throw err;
            console.log("Write info:");
            console.log(info);
        })
}, 0);
