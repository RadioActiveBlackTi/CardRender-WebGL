/**
 *  Assume That you already imported "Vec3.js"
 */
let QuatType = Float32Array;

var Quat = {
      multiply: function multiply(q1, q2, dst) {
        dst = dst || new QuatType(4);
        var axis = Vec3.scalarMult(q1[3], q2.slice(0, 3));
        axis = Vec3.add(Vec3.scalarMult(q2[3], q1.slice(0, 3)), axis);
        axis = Vec3.add(Vec3.cross(q1.slice(0, 3), q2.slice(0, 3)), axis);
        
        var rot = q1[3] * q2[3] - Vec3.dot(q1.slice(0, 3), q2.slice(0, 3));
        
        dst[0] = axis[0];
        dst[1] = axis[1];
        dst[2] = axis[2];
        dst[3] = rot;
        return dst;
      },
      
      inverse: function inverse(q, dst) {
        dst = dst || new QuatType(4);
        dst[0] = -q[0];
        dst[1] = -q[1];
        dst[2] = -q[2];
        dst[3] = q[3];
        return dst;
      },

      scalarMult: function scalarMult(w, q, dst) {
        dst = dst || new QuatType(4);
        for (var i; i<4; i++) {
            dst[i] = w * q[i];
        }
        return dst;
      },

      identity: function identity(dst) {
        dst = dst || new QuatType(4);
        dst = [0, 0, 0, 1];
        return dst;
      },

      rotate: function rotate(q, v, dst) {
        // q is expected to be Quaternion, v is expected to be Vec3
        // RETURN IS Vec3
        dst = dst || new Float32Array(3);
        var vq = [v[0], v[1], v[2], 0];
        var res = this.multiply(q, vq);
        res = this.multiply(res, this.inverse(q));
        
        dst = [res[0], res[1], res[2]];
        // console.log(dst);
        return dst;
      },

      norm2: function norm2(q) {
        return this.dot(q, q);
      },

      power: function power(q, alpha, dst) {
        dst = dst || new Float32Array(4);

        var axis = q.slice(0, 3);
        var cosFact = q[3];
        var sinFact = Math.sqrt(Vec3.norm2(q.slice(0, 2)));
        var phi = Math.atan2(sinFact, cosFact);

        if (Math.abs(sinFact) > 0) {
            axis = Vec3.scalarMult(axis, 1 / sinFact);
        }
        else {
            axis = [1, 0, 0];
        }

        axis = Vec3.scalarMult(Math.sin(phi * alpha), axis);
        dst[0] = axis[0];
        dst[1] = axis[1];
        dst[2] = axis[2];
        dst[3] = Math.cos(phi * alpha);

        return axis;

      },

      slerp: function slerp(q1, q2, alpha, dst) {
        dst = dst || new QuatType(4);
        dst = this.multiply(q1, this.inverse(q2));
        if (dst[3] < 0) dst = this.scalarMult(-1, dst);
        dst = this.power(dst, alpha);
        dst = this.multiply(dst, q1);
        return dst;
      },

      makeXRotation: function makeXRotation(ang, dst) {
        dst = dst || new QuatType(4);
        dst[0] = Math.sin(ang / 2);
        dst[3] = Math.cos(ang / 2);
        return dst;
      },

      makeYRotation: function makeYRotation(ang, dst) {
        dst = dst || new QuatType(4);
        dst[1] = Math.sin(ang / 2);
        dst[3] = Math.cos(ang / 2);
        return dst;
      },

      makeZRotation: function makeZRotation(ang, dst) {
        dst = dst || new QuatType(4);
        dst[2] = Math.sin(ang / 2);
        dst[3] = Math.cos(ang / 2);
        return dst;
      },

      compose: function compose(axis, ang, dst) {
        // Axis should be Vec3
        dst = dst || new QuatType(4);
        var axisFact = Vec3.scalarMult(Math.sin(ang / 2), axis);
        var angFact = Math.cos(ang / 2);
        dst[0] = axisFact[0];
        dst[1] = axisFact[1];
        dst[2] = axisFact[2];
        dst[3] = angFact;
        return dst;
      },

      fromAxisAngle: function fromAxisAngle(axis, angle, dst) {
        // Axis should be Vec3 with norm2 == 1
        dst = dst || new QuatType(4);
        dst[0] = axis[0];
        dst[1] = axis[1];
        dst[2] = axis[2];
        dst[3] = angle;
        return dst;
      },

    fromMat3: function fromMat3(m) {
        // m: Float32Array(9) or JS Array[9] — column-major 3x3
        let trace = m[0] + m[4] + m[8];
        let out = new Float32Array(4); // [x, y, z, w]
    
        if (trace > 0) {
            let s = 0.5 / Math.sqrt(trace + 1.0);
            out[3] = 0.25 / s;
            out[0] = (m[7] - m[5]) * s;
            out[1] = (m[2] - m[6]) * s;
            out[2] = (m[3] - m[1]) * s;
        } else {
            if (m[0] > m[4] && m[0] > m[8]) {
                let s = 2.0 * Math.sqrt(1.0 + m[0] - m[4] - m[8]);
                out[3] = (m[7] - m[5]) / s;
                out[0] = 0.25 * s;
                out[1] = (m[1] + m[3]) / s;
                out[2] = (m[2] + m[6]) / s;
            } else if (m[4] > m[8]) {
                let s = 2.0 * Math.sqrt(1.0 + m[4] - m[0] - m[8]);
                out[3] = (m[2] - m[6]) / s;
                out[0] = (m[1] + m[3]) / s;
                out[1] = 0.25 * s;
                out[2] = (m[5] + m[7]) / s;
            } else {
                let s = 2.0 * Math.sqrt(1.0 + m[8] - m[0] - m[4]);
                out[3] = (m[3] - m[1]) / s;
                out[0] = (m[2] + m[6]) / s;
                out[1] = (m[5] + m[7]) / s;
                out[2] = 0.25 * s;
            }
        }
    
        return out;
    },

    normalize: function normalize(q, dst) {
      dst = dst || new QuatType(4);
      const norm = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
      if (norm < 1e-6) {
        dst = [0, 0, 0, 1];
      }
      else {
        dst[0] = q[0] / norm;
        dst[1] = q[1] / norm;
        dst[2] = q[2] / norm;
        dst[3] = q[3] / norm; 
      }

      return dst;
    },

};