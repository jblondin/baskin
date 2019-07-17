var ComplexCamera = /** @class */ (function () {
    function ComplexCamera(dims, zoom, center) {
        this.dims = dims;
        this.zoom = zoom;
        this.center = center;
    }
    ComplexCamera["default"] = function () {
        return new ComplexCamera({ x: 1024, y: 1024 }, 0.3, { x: -0.5, y: 0.0 });
    };
    ComplexCamera.prototype.sceneToImage = function (sceneCoord) {
        return {
            x: ((sceneCoord.x - this.center.x) * this.zoom + 0.5) * this.dims.x,
            y: ((sceneCoord.y - this.center.y) * this.zoom + 0.5) * this.dims.y
        };
    };
    ComplexCamera.prototype.imageToScene = function (imageCoord) {
        return {
            x: (imageCoord.x / this.dims.x - 0.5) / this.zoom + this.center.x,
            y: (imageCoord.y / this.dims.y - 0.5) / this.zoom + this.center.y
        };
    };
    return ComplexCamera;
}());
function conj(complex) {
    return {
        x: complex.x,
        y: -complex.y
    };
}
function mul(left, right) {
    return {
        x: (left.x * right.x - left.y * right.y),
        y: (left.x * right.y + left.y * right.x)
    };
}
function plus(left, right) {
    return {
        x: left.x + right.x,
        y: left.y + right.y
    };
}
function log2(value) {
    return Math.log(value) / Math.LN2;
}
var Mandelbrot = /** @class */ (function () {
    function Mandelbrot(camera, n_iters, escape_threshold) {
        this.camera = camera;
        this.n_iters = n_iters;
        this.escape_threshold = escape_threshold;
    }
    Mandelbrot["default"] = function () {
        return new Mandelbrot(ComplexCamera["default"](), 1000, 100.0);
    };
    Mandelbrot.prototype.generate = function () {
        var arr = new Float64Array(this.camera.dims.x * this.camera.dims.y);
        // let buffer = Buffer.allocUnsafe(this.camera.dims.x * this.camera.dims.y);
        for (var x = 0; x < this.camera.dims.x; x++) {
            for (var y = 0; y < this.camera.dims.y; y++) {
                var c = this.camera.imageToScene({ x: x, y: y });
                var z = { x: 0, y: 0 };
                var idx = y * this.camera.dims.x + x; // row-major
                var escaped = false;
                for (var i = 0; i < this.n_iters; i++) {
                    z = plus(mul(z, z), c);
                    var conj_z = conj(z);
                    var escape_value = z.x * conj_z.x - z.y * conj_z.y;
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
    };
    return Mandelbrot;
}());
var GrayExponentialFilter = /** @class */ (function () {
    function GrayExponentialFilter(multiplier, power) {
        this.multiplier = multiplier;
        this.power = power;
    }
    GrayExponentialFilter["default"] = function () {
        return new GrayExponentialFilter(2.0, 0.5);
    };
    GrayExponentialFilter.prototype.filter = function (input) {
        var _a = input.reduce(function (accum, value) {
            var min = accum[0], max = accum[1];
            return [value < min ? value : min, value > max ? value : max];
        }, [Infinity, -Infinity]), min = _a[0], max = _a[1];
        var range = max - min;
        for (var i = 0; i < input.length; i++) {
            input[i] = Math.pow((this.multiplier * input[i] / range), this.power);
        }
        return input;
    };
    return GrayExponentialFilter;
}());
var Quantization8 = /** @class */ (function () {
    function Quantization8() {
    }
    Quantization8.prototype.filter = function (input) {
        var output = new Uint8Array(input.length);
        for (var i = 0; i < input.length; i++) {
            var val = input[i];
            output[i] = (val > 1.0 ? 255 : (val < 0.0 ? 0 : val * 255));
        }
        return output;
    };
    return Quantization8;
}());
function generate(n_iters) {
    var hist = new Mandelbrot(ComplexCamera["default"](), n_iters, 100.0).generate();
    var hist_filtered = new GrayExponentialFilter(1.0, 0.1).filter(hist);
    var hist_quantized = new Quantization8().filter(hist_filtered);
    return Buffer.from(hist_quantized);
}
setTimeout(function () {
    var sharp = require('sharp');
    var img = generate(1000);
    sharp(img, { raw: { width: 1024, height: 1024, channels: 1 } })
        .toFile('test.png', function (err, info) {
        if (err)
            throw err;
        console.log("Write info:");
        console.log(info);
    });
}, 0);
