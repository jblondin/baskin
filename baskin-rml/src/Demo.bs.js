// Generated by BUCKLESCRIPT VERSION 6.0.3, PLEASE EDIT WITH CARE
'use strict';

var $$Array = require("bs-platform/lib/js/array.js");
var Caml_array = require("bs-platform/lib/js/caml_array.js");
var Caml_int32 = require("bs-platform/lib/js/caml_int32.js");
var Pervasives = require("bs-platform/lib/js/pervasives.js");

function default_complex_camera(param) {
  return /* record */[
          /* image_dims : record */[
            /* x */1024,
            /* y */1024
          ],
          /* zoom */0.3,
          /* center : record */[
            /* x */-0.5,
            /* y */0.0
          ]
        ];
}

function scene_to_image(camera, scene_coord) {
  return /* record */[
          /* x */((scene_coord[/* x */0] - camera[/* center */2][/* x */0]) * camera[/* zoom */1] + 0.5) * camera[/* image_dims */0][/* x */0],
          /* y */((scene_coord[/* y */1] - camera[/* center */2][/* y */1]) * camera[/* zoom */1] + 0.5) * camera[/* image_dims */0][/* y */1]
        ];
}

function image_to_scene(camera, image_coord) {
  return /* record */[
          /* x */(image_coord[/* x */0] / camera[/* image_dims */0][/* x */0] - 0.5) / camera[/* zoom */1] + camera[/* center */2][/* x */0],
          /* y */(image_coord[/* y */1] / camera[/* image_dims */0][/* y */1] - 0.5) / camera[/* zoom */1] + camera[/* center */2][/* y */1]
        ];
}

function conj(c) {
  return /* record */[
          /* x */c[/* x */0],
          /* y */-1.0 * c[/* y */1]
        ];
}

function mul(l, r) {
  return /* record */[
          /* x */l[/* x */0] * r[/* x */0] - l[/* y */1] * r[/* y */1],
          /* y */l[/* x */0] * r[/* y */1] + l[/* y */1] * r[/* x */0]
        ];
}

function plus(l, r) {
  return /* record */[
          /* x */l[/* x */0] + r[/* x */0],
          /* y */l[/* y */1] + r[/* y */1]
        ];
}

function ln2(param) {
  return Math.log(2.0);
}

function log2(x) {
  return Math.log(x) / Math.log(2.0);
}

function default_mandelbrot(param) {
  return /* record */[
          /* camera : record */[
            /* image_dims : record */[
              /* x */1024,
              /* y */1024
            ],
            /* zoom */0.3,
            /* center : record */[
              /* x */-0.5,
              /* y */0.0
            ]
          ],
          /* n_iters */1000,
          /* escape_threshold */100.0
        ];
}

function generate(generator) {
  var idims = generator[/* camera */0][/* image_dims */0];
  var arr = Caml_array.caml_make_vect(Caml_int32.imul(idims[/* x */0], idims[/* y */1]), 0.0);
  for(var x = 0 ,x_finish = idims[/* x */0] - 1 | 0; x <= x_finish; ++x){
    for(var y = 0 ,y_finish = idims[/* y */1] - 1 | 0; y <= y_finish; ++y){
      var c = image_to_scene(generator[/* camera */0], /* record */[
            /* x */x,
            /* y */y
          ]);
      var z = /* record */[
        /* x */0.0,
        /* y */0.0
      ];
      var idx = Caml_int32.imul(y, idims[/* x */0]) + x | 0;
      var $$break = false;
      var i = 0;
      while(!$$break) {
        z = plus(mul(z, z), c);
        var conj_z = conj(z);
        var escape_value = z[/* x */0] * conj_z[/* x */0] - z[/* y */1] * conj_z[/* y */1];
        if (escape_value > generator[/* escape_threshold */2]) {
          Caml_array.caml_array_set(arr, idx, i + (1.0 - log2(log2(escape_value) / 2.0)));
          $$break = true;
        } else {
          i = i + 1 | 0;
          if (i >= generator[/* n_iters */1]) {
            $$break = true;
          }
          
        }
      };
    }
  }
  return arr;
}

function default_gray_filter(param) {
  return /* record */[
          /* multiplier */2.0,
          /* power */0.5
        ];
}

function filter(arr, filter$1) {
  var match = $$Array.fold_left((function (acc, value) {
          var max = acc[1];
          var min = acc[0];
          var match = value < min;
          var match$1 = value > max;
          return /* tuple */[
                  match ? value : min,
                  match$1 ? value : max
                ];
        }), /* tuple */[
        Pervasives.infinity,
        Pervasives.neg_infinity
      ], arr);
  var range = match[1] - match[0];
  return $$Array.map((function (value) {
                return Math.pow(filter$1[/* multiplier */0] * value / range, filter$1[/* power */1]);
              }), arr);
}

function quantize(arr) {
  return $$Array.map((function (value) {
                var match = value > 1.0;
                var tmp;
                if (match) {
                  tmp = 255.0;
                } else {
                  var match$1 = value < 0.0;
                  tmp = match$1 ? 0.0 : value * 255.0;
                }
                return tmp | 0;
              }), arr);
}

var img = quantize(filter(generate(/* record */[
              /* camera : record */[
                /* image_dims : record */[
                  /* x */1024,
                  /* y */1024
                ],
                /* zoom */0.3,
                /* center : record */[
                  /* x */-0.5,
                  /* y */0.0
                ]
              ],
              /* n_iters */100,
              /* escape_threshold */100.0
            ]), /* record */[
          /* multiplier */1.0,
          /* power */0.1
        ]));

exports.default_complex_camera = default_complex_camera;
exports.scene_to_image = scene_to_image;
exports.image_to_scene = image_to_scene;
exports.conj = conj;
exports.mul = mul;
exports.plus = plus;
exports.ln2 = ln2;
exports.log2 = log2;
exports.default_mandelbrot = default_mandelbrot;
exports.generate = generate;
exports.default_gray_filter = default_gray_filter;
exports.filter = filter;
exports.quantize = quantize;
exports.img = img;
/* img Not a pure module */
