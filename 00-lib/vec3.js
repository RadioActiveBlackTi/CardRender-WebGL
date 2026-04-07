var Vec3 = {
    cross: function cross(a, b, dst) {
        dst = dst || new Float32Array(3);
        dst[0] = a[1] * b[2] - a[2] * b[1];
        dst[1] = a[2] * b[0] - a[0] * b[2];
        dst[2] = a[0] * b[1] - a[1] * b[0];
        return dst;
    },

    dot: function dot(a, b) {
        var result = 0;
        for (var i=0; i<3; ++i) {
            result += a[i] * b[i];
        }
        return result;
    },

    scalarMult: function scalarMultiply(w, a, dst) {
        dst = dst || new Float32Array(3);
        for (var i=0; i<3; ++i) {
            dst[i] = w * a[i];
        }
        return dst;
    },

    add: function add(a, b, dst) {
        dst = dst || new Float32Array(3);
        for (var i=0; i<3; ++i) {
            dst[i] = a[i] + b[i];
        }
        return dst;
    },

    sub: function sub(a, b, dst) {
        dst = dst || new Float32Array(3);
        for (var i=0; i<3; ++i) {
            dst[i] = a[i] - b[i];
        }
        return dst;
    },

    lerp: function lerp(a, b, alpha, dst) {
        dst = dst || new Float32Array(3);
        for (var i=0; i<3; ++i) {
            dst[i] = (1 - alpha) * a[i] + alpha * b[i];
        }
        return dst;
    },

    norm2: function norm2(a) {
        return this.dot(a, a);
    },

    normalize: function normalize(a, dst) {
        dst = dst || new Float32Array(3);
        var norm = Math.sqrt(this.norm2(a));
        for (var i=0; i<3; ++i) {
            dst[i] = norm > 1e-6 ? a[i] / norm : a[i];
        }
        return dst;
    }
};