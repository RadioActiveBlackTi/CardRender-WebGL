/**
 * Scene Graph Module
 * Assume that all "m4.js", "vec3.js", "quat.js", "rbt.js" are all imported
 */
var TRS = function() {
    this.rbt = Rbt.identity();
    this.scale = [1, 1, 1];
};

TRS.prototype.getMatrix = function(dst) {
    dst = dst || new Float32Array(16);
    var rbt = this.rbt;
    var s = this.scale;

    // compute a matrix from translation, rotation, and scale
    dst = Rbt.toM4(rbt);
    m4.scale(dst, s[0], s[1], s[2], dst);
    return dst;
};
  
var Node = function(trs) {
    this.children = [];
    this.localRbt = Rbt.identity();
    this.worldRbt = Rbt.identity();
    this.localTRS = trs; // If you want to draw this Node, you MUST use localTRS, not localRBT.
};

Node.prototype.setParent = function(parent) {
    // remove us from our parent
    if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
        this.parent.children.splice(ndx, 1);
        }
    }

    // Add us to our new parent
    if (parent) {
        parent.children.push(this);
    }
    this.parent = parent;
};

Node.prototype.updateWorldRbt = function(rbt) {

    if (rbt) {
        // a matrix was passed in so do the math
        this.worldRbt = Rbt.multiply(rbt, this.localRbt);
    } else {
        // no matrix was passed in so just copy.
        Rbt.copy(this.localRbt, this.worldRbt);
    }

    // now process all the children
    var worldRbt = this.worldRbt;
    this.children.forEach(function(child) {
        child.updateWorldRbt(worldRbt);
    });
};

Node.prototype.getWorldMatrix = function(dst) {
    dst = dst || new Float32Array(16);

    if (!this.localTRS) {
        console.log("WARNING: This node is not to be designated to be drawn");
    }
    
    var rbt = this.worldRbt;
    dst = Rbt.toM4(rbt);
    dst = m4.multiply(dst, this.localTRS.getMatrix());
    return dst;
}