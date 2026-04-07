function xy2uv(pos, minX, maxX, minY, maxY) {
    // WARNING: this function assume that min? and max? are different.
    var x = pos[0];
    var y = pos[1];

    var scaleX = maxX - minX;
    var scaleY = maxY - minY;

    var u = (x - minX) / scaleX;
    var v = (y - minY) / scaleY;

    if (u < 0 || v < 0 || u > 1 || v > 1) {
        console.log("Warning: exceeded uv range: ", x, y, u, v);
    }

    return [u, v];
}

var makeGeometry = {
    makeSquare: function makeSquare(length, z) {
        /**
         * @param {float} length Length of the side of the square
         */
        z = z || 0;
        var side = length / 2;
        var positions = [-side, -side, z,
                        side, -side, z,
                        -side, side, z,
                        side, side, z];
        var texcoords = [0, 0,
                        1, 0,
                        0, 1,
                        1, 1];
        var normals = [0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1];
        var index = [0, 1, 2, 2, 1, 3];

        var arrays = {
            position: { numComponents: 3, data: positions, },
            texcoord: { numComponents: 2, data: texcoords, },
            normal:   { numComponents: 3, data: normals,   },
            indices:  { numComponents: 3, data: index,     },
         };

        return arrays;
    },

    makeSquare2D: function makeSquare(length) {
        /**
         * @param {float} length Length of the side of the square
         */
        var side = length / 2;
        var positions = [-side, -side,
                        side, -side,
                        -side, side,
                        side, side,];
        var texcoords = [0, 0,
                        1, 0,
                        0, 1,
                        1, 1];
        var normals = [0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1];
        var index = [0, 1, 2, 2, 1, 3];

        var arrays = {
            position: { numComponents: 2, data: positions, },
            texcoord: { numComponents: 2, data: texcoords, },
            normal:   { numComponents: 3, data: normals,   },
            indices:  { numComponents: 3, data: index,     },
         };

        return arrays;
    },

    makeTriangle: function makeTriangle(length) {
        /**
         * @param {float} length Length of the side of the triangle
         */
        var positions = [0, length * Math.sqrt(3) / 3, 0,
                        -0.5 * length, -length * Math.sqrt(3) / 6, 0,
                        0.5 * length, -length * Math.sqrt(3) / 6, 0];
        var normals = [0, 0, 1,
                        0, 0, 1,
                        0, 0, 1,];
        var texcoords = [0, 0,
                        1, 0,
                        0.5, Math.sqrt(3) / 2];
        var index = [0, 1, 2];
        
        var arrays = {
            position: { numComponents: 3, data: positions, },
            texcoord: { numComponents: 2, data: texcoords, },
            normal:   { numComponents: 3, data: normals,   },
            indices:  { numComponents: 3, data: index,     },
            };

        return arrays;
    },

    makeCircle: function makeCircle(radius, division) {
        /**
         * @param {float} radius radius of the circle
         * @param {int} division How many Triangles divide to make circle
         */
        var theta = 2 * Math.PI / division;
        var positions = [0, 0, 0, radius, 0, 0];
        var normals = [0, 0, 1, 0, 0, 1];
        var texcoords = [0.5, 0.5, 1, 0.5];
        var index = [];

        for (var ii=0; ii < division - 1; ++ii) {
            var theta_i = theta * (ii + 1);
            positions = positions.concat([radius * Math.cos(theta_i), radius * Math.sin(theta_i), 0]);
            normals = normals.concat([0, 0, 1]);
            texcoords = texcoords.concat([0.5 + 0.5 * Math.cos(theta_i), 0.5 + 0.5 * Math.sin(theta_i)]);
            index = index.concat([ii + 2, 0, ii + 1]);
        }

        index = index.concat([1, 0, division]);

        var arrays = {
            position: { numComponents: 3, data: positions, },
            texcoord: { numComponents: 2, data: texcoords, },
            normal:   { numComponents: 3, data: normals,   },
            indices:  { numComponents: 3, data: index,     },
            };

        return arrays;

    },

    makeCube: function makeCube(length) {
        var side = length / 2;
        var positions = [
            // front
            -side, side, side,
            -side, -side, side,
            side, -side, side,
            side, side, side,

            // back
            side, side, -side,
            side, -side, -side,
            -side, -side, -side,
            -side, side, -side,

            // top
            -side, side, -side,
            -side, side, side,
            side, side, side,
            side, side, -side,

            // bottom
            -side, -side, side,
            -side, -side, -side,
            side, -side, -side,
            side, -side, side,

            // left
            -side, side, -side,
            -side, -side, -side,
            -side, -side, side,
            -side, side, side,
            
            // right
            side, side, side,
            side, -side, side,
            side, -side, -side,
            side, side, -side,
        ];

        var texcoords = [
            0, 1, 0, 0, 1, 0, 1, 1,
            0, 1, 0, 0, 1, 0, 1, 1,
            0, 1, 0, 0, 1, 0, 1, 1,
            0, 1, 0, 0, 1, 0, 1, 1,
            0, 1, 0, 0, 1, 0, 1, 1,
            0, 1, 0, 0, 1, 0, 1, 1,
        ]

        var normals = [
            // front
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            // back
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            // top
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 
            // bottom
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 
            // left
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 
            // right
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 
        ]

        var index = [
            // front
            0, 1, 2, 0, 2, 3,
            // back
            4, 5, 6, 4, 6, 7,
            // top
            8, 9, 10, 8, 10, 11,
            // bottom
            12, 13, 14, 12, 14, 15,
            // left
            16, 17, 18, 16, 18, 19,
            // right
            20, 21, 22, 20, 22, 23,
        ]

        var arrays = {
            position: { numComponents: 3, data: positions, },
            texcoord: { numComponents: 2, data: texcoords, },
            normal:   { numComponents: 3, data: normals,   },
            indices:  { numComponents: 3, data: index,     },
            };

        return arrays;
    },

    makeSphere: function makeSphere(radius, latitudeBands, longitudeBands) {
        /**
         * @param {float} radius 
         * @param {int} latitudeBands
         * @param {int} longitudeBands
         */
    
        const positions = [];
        const normals = [];
        const texcoords = [];
        const indices = [];
    
        for (let latNumber = 0; latNumber <= latitudeBands; ++latNumber) {
            const theta = latNumber * Math.PI / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
    
            for (let longNumber = 0; longNumber <= longitudeBands; ++longNumber) {
                const phi = longNumber * 2 * Math.PI / longitudeBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
    
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;
    
                const u = longNumber / longitudeBands;
                const v = 1 - latNumber / latitudeBands;
    
                positions.push(radius * x);
                positions.push(radius * y);
                positions.push(radius * z);
    
                normals.push(x, y, z); // normalized normal
                texcoords.push(u, v);
            }
        }
    
        for (let latNumber = 0; latNumber < latitudeBands; ++latNumber) {
            for (let longNumber = 0; longNumber < longitudeBands; ++longNumber) {
                const first = latNumber * (longitudeBands + 1) + longNumber;
                const second = first + longitudeBands + 1;
    
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }
    
        const arrays = {
            position: { numComponents: 3, data: positions },
            normal:   { numComponents: 3, data: normals },
            texcoord: { numComponents: 2, data: texcoords },
            indices:  { numComponents: 3, data: indices },
        };
    
        return arrays;
    },

    makeRoundCard: function makeRoundCard(width, height, radius, division) {
        var x = width / 2;
        var y = height / 2;
        var positions = [
                        // Center rectangle
                        -x + radius, y - radius, 0,
                        -x + radius, -y + radius, 0,
                        x - radius, -y + radius, 0,
                        x - radius, y - radius, 0,

                        // Upper rectangle
                        -x + radius, y, 0,
                        x - radius, y, 0,

                        // right rectangle
                        x, y - radius, 0,
                        x, -y + radius, 0,

                        // lower rectangle
                        x - radius, -y, 0,
                        -x + radius, -y, 0,

                        // left rectangle
                        -x, -y + radius, 0,
                        -x, y - radius, 0,
                        ];
        var texcoords = [];
        var normals = [0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    ];
        var tangents = [1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
        ];

        var binormals = [0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
        ];

        var index = [
            // Center rectangle
            0, 1, 2, 3, 0, 2,
            
            // Upper rectangle
            4, 0, 3, 3, 5, 4,

            // Right rectangle
            3, 2, 7, 7, 6, 3,

            // Lower rectangle
            1, 9, 8, 8, 2, 1,

            // Left rectangle
            11, 10, 1, 1, 0, 11,
            ];
        
        // Upper left corner
        for (var ii=0; ii<division; ++ii) {
            if (division==1) {
                index = index.concat([11, 0, 4]);
                continue;
            }
            var idxNext = 4;
            var idxPrev = 11;
            if (ii != division - 1) {
                var theta = Math.PI / 2 / division * (ii + 1);
                positions = positions.concat([-x + radius - radius * Math.cos(theta),
                                             y - radius + radius * Math.sin(theta),
                                              0]);
                normals = normals.concat([0, 0, 1]);
                tangents = tangents.concat([1, 0, 0]);
                binormals = binormals.concat([0, 1, 0]);
                idxNext = positions.length / 3 - 1;
                if (ii != 0) {
                    idxPrev = idxNext - 1;
                }
            }
            else {
                // console.log("division: ", ii);
                idxPrev = positions.length / 3 - 1;
            }
            
            // console.log(idxNext, idxPrev);
            index = index.concat([idxPrev, 0, idxNext]);
        }

        // Upper right corner
        for (var ii=0; ii<division; ++ii) {
            if (division==1) {
                index = index.concat([6, 5, 3]);
                continue;
            }
            var idxNext = 5;
            var idxPrev = 6;
            if (ii != division - 1) {
                var theta = Math.PI / 2 / division * (ii + 1);
                positions = positions.concat([x - radius + radius * Math.cos(theta),
                                             y - radius + radius * Math.sin(theta),
                                              0]);
                normals = normals.concat([0, 0, 1]);
                tangents = tangents.concat([1, 0, 0]);
                binormals = binormals.concat([0, 1, 0]);
                idxNext = positions.length / 3 - 1;
                if (ii != 0) {
                    idxPrev = idxNext - 1;
                }
            }
            else {
                // console.log("division: ", ii);
                idxPrev = positions.length / 3 - 1;
            }
            
            // console.log(idxNext, idxPrev);
            index = index.concat([idxPrev, idxNext, 3]);
        }

        // Lower right corner
        for (var ii=0; ii<division; ++ii) {
            if (division==1) {
                index = index.concat([7, 2, 8]);
                continue;
            }
            var idxNext = 7;
            var idxPrev = 8;
            if (ii != division - 1) {
                var theta = Math.PI / 2 / division * (ii + 1);
                positions = positions.concat([x - radius + radius * Math.sin(theta),
                                             -y + radius - radius * Math.cos(theta),
                                              0]);
                normals = normals.concat([0, 0, 1]);
                tangents = tangents.concat([1, 0, 0]);
                binormals = binormals.concat([0, 1, 0]);
                idxNext = positions.length / 3 - 1;
                if (ii != 0) {
                    idxPrev = idxNext - 1;
                }
            }
            else {
                // console.log("division: ", ii);
                idxPrev = positions.length / 3 - 1;
            }
            
            // console.log(idxNext, idxPrev);
            index = index.concat([idxNext, 2, idxPrev]);
        }

        // Lower left corner
        for (var ii=0; ii<division; ++ii) {
            if (division==1) {
                index = index.concat([10, 9, 1]);
                continue;
            }
            var idxNext = 10;
            var idxPrev = 9;
            if (ii != division - 1) {
                var theta = Math.PI / 2 / division * (ii + 1);
                positions = positions.concat([-x + radius - radius * Math.sin(theta),
                                             -y + radius - radius * Math.cos(theta),
                                              0]);
                normals = normals.concat([0, 0, 1]);
                tangents = tangents.concat([1, 0, 0]);
                binormals = binormals.concat([0, 1, 0]);
                idxNext = positions.length / 3 - 1;
                if (ii != 0) {
                    idxPrev = idxNext - 1;
                }
            }
            else {
                // console.log("division: ", ii);
                idxPrev = positions.length / 3 - 1;
            }
            
            // console.log(idxNext, idxPrev);
            index = index.concat([idxNext, idxPrev, 1]);
        }

        for (var ii=0; ii<positions.length/3; ++ii) {
            var pos = [positions[3*ii], positions[3*ii+1], positions[3*ii+2]];
            var uv = xy2uv(pos, -x, x, -y, y);
            texcoords = texcoords.concat(uv);
        }
        

        var arrays = {
            position: { numComponents: 3, data: positions, },
            texcoord: { numComponents: 2, data: texcoords, },
            tangent:  { numComponents: 3, data: tangents,  },
            binormal: { numComponents: 3, data: binormals  },
            normal:   { numComponents: 3, data: normals,   },
            indices:  { numComponents: 3, data: index,     },
         };


        return arrays;
    },

    makeRoundWall: function makeRoundWall(width, height, radius, thickness, division) {
        var x = width / 2;
        var y = height / 2;
        var z = thickness / 2;
        var positions = [
                        // Upper rectangle
                        -x + radius, y, -z,
                        -x + radius, y, z,
                        x - radius, y, z,
                        x - radius, y, -z,

                        // Right rectangle
                        x, y - radius, z,
                        x, -y + radius, z,
                        x, -y + radius, -z,
                        x, y - radius, -z,

                        // lower rectangle
                        -x + radius, -y, z,
                        -x + radius, -y, -z,
                        x - radius, -y, -z,
                        x - radius, -y, z,

                        // Left rectangle
                        -x, y - radius, -z,
                        -x, -y + radius, -z,
                        -x, -y + radius, z,
                        -x, y - radius, z,


                        ];
        var texcoords = [];
        var normals = [
                        // Upper rectangle
                        0, 1, 0,
                        0, 1, 0,
                        0, 1, 0,
                        0, 1, 0,

                        // Right rectangle
                        1, 0, 0,
                        1, 0, 0,
                        1, 0, 0,
                        1, 0, 0,

                        // Lower rectangle
                        0, -1, 0,
                        0, -1, 0,
                        0, -1, 0,
                        0, -1, 0,

                        // Left rectangle
                        -1, 0, 0,
                        -1, 0, 0,
                        -1, 0, 0,
                        -1, 0, 0,
                    ];

        var index = [
            // Upper rectangle
            0, 1, 2, 2, 3, 0,
            // Right rectangle
            4, 5, 6, 4, 6, 7,
            // Lower rectangle
            8, 9, 10, 8, 10, 11,
            // Left rectangle
            12, 13, 14, 12, 14, 15,

            ];
        
        // Left Upper corner
        for (var ii=0; ii<division; ++ii) {
            if (division==1) {
                index = index.concat([12, 15, 1, 1, 0, 12]);
                continue;
            }
            var idxNextFar = 0;
            var idxNextClose = 1;
            var idxPrevFar = 12;
            var idxPrevClose = 15;

            if (ii != division - 1) {
                var theta = Math.PI / 2 / division * (ii + 1);
                positions = positions.concat([-x + radius - radius * Math.cos(theta),
                                            y - radius + radius * Math.sin(theta),
                                            -z,
                                            -x + radius - radius * Math.cos(theta),
                                            y - radius + radius * Math.sin(theta),
                                            z,
                                            ]);
                normals = normals.concat([-Math.cos(theta), Math.sin(theta), 0,
                                          -Math.cos(theta), Math.sin(theta), 0,]);
                idxNextClose = positions.length / 3 - 1;
                idxNextFar = idxNextClose - 1;
                if (ii != 0) {
                    idxPrevClose = idxNextClose - 2;
                    idxPrevFar = idxNextClose - 3;
                }
            }
            else {
                idxPrevClose = positions.length / 3 - 1;
                idxPrevFar = idxPrevClose - 1;
            }
            
            index = index.concat([idxPrevFar, idxPrevClose, idxNextClose, idxNextClose, idxNextFar, idxPrevFar]);
        }

        // Right Upper corner
        for (var ii=0; ii<division; ++ii) {
            if (division==1) {
                index = index.concat([3, 4, 7, 3, 2, 4,]);
                continue;
            }
            var idxNextFar = 3;
            var idxNextClose = 2;
            var idxPrevFar = 7;
            var idxPrevClose = 4;

            if (ii != division - 1) {
                var theta = Math.PI / 2 / division * (ii + 1);
                positions = positions.concat([x - radius + radius * Math.cos(theta),
                                            y - radius + radius * Math.sin(theta),
                                            -z,
                                            x - radius + radius * Math.cos(theta),
                                            y - radius + radius * Math.sin(theta),
                                            z,
                                            ]);
                normals = normals.concat([Math.cos(theta), Math.sin(theta), 0,
                                          Math.cos(theta), Math.sin(theta), 0,]);
                idxNextClose = positions.length / 3 - 1;
                idxNextFar = idxNextClose - 1;
                if (ii != 0) {
                    idxPrevClose = idxNextClose - 2;
                    idxPrevFar = idxNextClose - 3;
                }
            }
            else {
                idxPrevClose = positions.length / 3 - 1;
                idxPrevFar = idxPrevClose - 1;
            }
            
            index = index.concat([idxNextFar, idxPrevClose, idxPrevFar, idxNextFar, idxNextClose, idxPrevClose]);
        }

        // Right Lower corner
        for (var ii=0; ii<division; ++ii) {
            if (division==1) {
                index = index.concat([11, 10, 6, 11, 6, 5]);
                continue;
            }
            var idxNextFar = 6;
            var idxNextClose = 5;
            var idxPrevFar = 10;
            var idxPrevClose = 11;

            if (ii != division - 1) {
                var theta = Math.PI / 2 / division * (ii + 1);
                positions = positions.concat([x - radius + radius * Math.sin(theta),
                                            -y + radius - radius * Math.cos(theta),
                                            -z,
                                            x - radius + radius * Math.sin(theta),
                                            -y + radius - radius * Math.cos(theta),
                                            z,
                                            ]);
                normals = normals.concat([Math.sin(theta), -Math.cos(theta), 0,
                                          Math.sin(theta), -Math.cos(theta), 0,]);
                idxNextClose = positions.length / 3 - 1;
                idxNextFar = idxNextClose - 1;
                if (ii != 0) {
                    idxPrevClose = idxNextClose - 2;
                    idxPrevFar = idxNextClose - 3;
                }
            }
            else {
                idxPrevClose = positions.length / 3 - 1;
                idxPrevFar = idxPrevClose - 1;
            }
            
            index = index.concat([idxPrevClose, idxPrevFar, idxNextFar, idxPrevClose, idxNextFar, idxNextClose]);
        }

        // Left Lower corner
        for (var ii=0; ii<division; ++ii) {
            if (division==1) {
                index = index.concat([14, 13, 9, 14, 9, 8]);
                continue;
            }
            var idxNextFar = 13;
            var idxNextClose = 14;
            var idxPrevFar = 9;
            var idxPrevClose = 8;

            if (ii != division - 1) {
                var theta = Math.PI / 2 / division * (ii + 1);
                positions = positions.concat([-x + radius - radius * Math.sin(theta),
                                            -y + radius - radius * Math.cos(theta),
                                            -z,
                                            -x + radius - radius * Math.sin(theta),
                                            -y + radius - radius * Math.cos(theta),
                                            z,
                                            ]);
                normals = normals.concat([-Math.sin(theta), -Math.cos(theta), 0,
                                          -Math.sin(theta), -Math.cos(theta), 0,]);
                idxNextClose = positions.length / 3 - 1;
                idxNextFar = idxNextClose - 1;
                if (ii != 0) {
                    idxPrevClose = idxNextClose - 2;
                    idxPrevFar = idxNextClose - 3;
                }
            }
            else {
                idxPrevClose = positions.length / 3 - 1;
                idxPrevFar = idxPrevClose - 1;
            }
            
            index = index.concat([idxNextClose, idxNextFar, idxPrevFar, idxNextClose, idxPrevFar, idxPrevClose]);
        }

        var arrays = {
            position: { numComponents: 3, data: positions, },
            texcoord: { numComponents: 2, data: texcoords, },
            normal:   { numComponents: 3, data: normals,   },
            indices:  { numComponents: 3, data: index,     },
            };
        
        return arrays;
    },
};