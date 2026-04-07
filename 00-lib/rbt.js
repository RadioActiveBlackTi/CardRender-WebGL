/**
 * Assume that you already imported both "vec3.js", "quat.js"
 */
let RbtType = Float32Array;
// (x, y, z, w) + (x, y, z) : Quat + Trans

Rbt = {
    quat: function quat(rbt) {
        return rbt.slice(0, 4);
    },

    trans: function trans(rbt) {
        return rbt.slice(4);
    },

    identity: function identity(dst) {
        dst = dst || new RbtType(7);
        dst = [0, 0, 0, 1, 0, 0, 0];
        return dst;
    },

    copy: function copy(src, dst) {
        dst = dst || new RbtType(7);
        dst[0] = src[0];
        dst[1] = src[1];
        dst[2] = src[2];
        dst[3] = src[3];
        dst[4] = src[4];
        dst[5] = src[5];
        dst[6] = src[6];
        return dst;
    },

    compose: function compose(quat, trans, dst) {
        dst = dst || new RbtType(7);
        quat = quat || Quat.identity();
        trans = trans || new Float32Array(3);

        dst[0] = quat[0];
        dst[1] = quat[1];
        dst[2] = quat[2];
        dst[3] = quat[3];

        dst[4] = trans[0];
        dst[5] = trans[1];
        dst[6] = trans[2];

        return dst;
    },

    linFact: function linFact(rbt, dst) {
        dst = dst || new RbtType(7);
        dst = this.compose(this.quat(rbt), null);
        return dst;
    },

    transFact: function transFact(rbt, dst) {
        dst = dst || new RbtType(7);
        dst = this.compose(null, this.trans(rbt));
        return dst;
    },

    inverse: function inverse(rbt, dst) {
        dst = dst || new RbtType(7);
        
        var lin = Quat.inverse(this.quat(rbt));
        var trans = Vec3.scalarMult(-1, Quat.rotate(lin, this.trans(rbt)));

        dst = this.compose(lin, trans);
        return dst;
    },

    multiply: function multiply(a, b, dst) {
        dst = dst || new RbtType(7);

        var lin = Quat.multiply(this.quat(a), this.quat(b));
        var trans = Vec3.add(this.trans(a), Quat.rotate(this.quat(a), this.trans(b)));

        dst = this.compose(lin, trans);
        return dst;
    },

    lerp: function lerp(a, b, alpha, dst) {
        dst = dst || new RbtType(7);

        var trans = Vec3.lerp(this.trans(a), this.trans(b), alpha);
        var lin = Quat.slerp(this.quat(a), this.quat(b), alpha);

        dst = this.compose(lin, trans);
        return dst;
    },

    toM4: function toM4(rbt, dst) {
        // Return is m4
        dst = dst || new Float32Array(16);

        var lin = this.quat(rbt);
        var trans = this.trans(rbt);

        var x = lin[0];
        var y = lin[1];
        var z = lin[2];
        var w = lin[3];

        dst[12] = trans[0];
        dst[13] = trans[1];
        dst[14] = trans[2];
        dst[15] = 1;

        dst[0] = 1 - 2 * y * y - 2 * z * z;
        dst[4] = 2 * x * y - 2 * w * z;
        dst[8] = 2 * x * z + 2 * w * y;
        dst[1] = 2 * x * y + 2 * w * z;
        dst[5] = 1 - 2 * x * x - 2 * z * z;
        dst[9] = 2 * y * z - 2 * w * x;
        dst[2] = 2 * x * z - 2 * w * y;
        dst[6] = 2 * y * z + 2 * w * x;
        dst[10] = 1 - 2 * x * x - 2 * y * y;

        dst[3] = 0;
        dst[7] = 0;
        dst[11] = 0;

        return dst;
    },

    lookAt: function lookAt(position, target, up, dst) {
        dst = dst || new RbtType(7);
    
        // z = normalize(position - target)
        var z = Vec3.normalize(Vec3.sub(position, target));
        // x = normalize(cross(up, z))
        var x = Vec3.normalize(Vec3.cross(up, z));
        // y = cross(z, x)
        var y = Vec3.cross(z, x);
    
        var rotMat = new Float32Array([
            x[0], y[0], z[0],
            x[1], y[1], z[1],
            x[2], y[2], z[2],
        ]);
        var quat = Quat.fromMat3(rotMat);  // quat = [x, y, z, w]

        return this.compose(quat, position, dst);
    },
    

    makeXRotation: function makeXRotation(ang, dst) {
        dst = dst || new RbtType(7);
        dst = this.compose(Quat.makeXRotation(ang), null);
        return dst;
    },

    makeYRotation: function makeYRotation(ang, dst) {
        dst = dst || new RbtType(7);
        dst = this.compose(Quat.makeYRotation(ang), null);
        return dst;
    },

    makeZRotation: function makeZRotation(ang, dst) {
        dst = dst || new RbtType(7);
        dst = this.compose(Quat.makeZRotation(ang), null);
        return dst;
    },
};