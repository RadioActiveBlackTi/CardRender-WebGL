Vec4 = {
    fromVec3: function fromVec3(src, dst) {
        dst = dst || new Float32Array(4);
        dst[0] = src[0];
        dst[1] = src[1];
        dst[2] = src[2];
        dst[3] = 1;
        return dst;
    },

    multiplyM4: function multiplyM4(m, v, dst) {
        dst = dst || new Float32Array(4);

        dst[0] = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3];
        dst[1] = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3];
        dst[2] = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3];
        dst[3] = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3];

        return dst;
    },

    toNDC: function toNDC(v, dst) {
        dst = dst || new Float32Array(3);

        var w = v[3] != 0 ? v[3] : 1;
        dst[0] = v[0] / w;
        dst[1] = v[1] / w;
        dst[2] = v[2] / w;
        return dst;
    },
};