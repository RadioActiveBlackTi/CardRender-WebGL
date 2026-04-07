var Card = function(depth) {
    this.superNode = new Node();
    this.cardRBTNode = new Node();
    this.animationRBTNode = new Node();
    this.frontRBTNode = new Node();
    this.frontNode = new Node();
    this.backRBTNode = new Node();
    this.backNode = new Node();
    this.wallRBTNode = new Node();
    this.wallNode = new Node();

    this.cardRBTNode.setParent(this.superNode);
    this.animationRBTNode.setParent(this.cardRBTNode);
    this.frontRBTNode.setParent(this.animationRBTNode);
    this.backRBTNode.setParent(this.animationRBTNode);
    this.wallRBTNode.setParent(this.animationRBTNode);
    this.frontNode.setParent(this.frontRBTNode);
    this.backNode.setParent(this.backRBTNode);
    this.wallNode.setParent(this.wallRBTNode);

    this.frontRBTNode.localRbt = Rbt.compose(null, [0, 0, depth]);
    this.backRBTNode.localRbt = Rbt.compose(Quat.makeYRotation(Math.PI), [0, 0, -depth]);
    this.wallRBTNode.localRbt = Rbt.identity();

    this.frontNode.localTRS = new TRS();
    this.backNode.localTRS = new TRS();
    this.wallNode.localTRS = new TRS();
};

Card.prototype.setParent = function(parent) {
    this.superNode.setParent(parent);
};

function makeUniforms(color, lightPos1, lightPos2) {
    var lightPos1 = lightPos1 || [0, 0, 0];
    var lightPos2 = lightPos2 || [0, 0, 0];
    var uniforms = {
        u_color: color,
        u_matrix: m4.identity(),
        u_lightWorldPos1: lightPos1,
        u_cameraWorldPos: [0, 0, 0],
        u_world: m4.identity(),
        u_viewInverse: m4.identity(),
        u_worldInverseTranspose: m4.identity(),
      };

    return uniforms;
}