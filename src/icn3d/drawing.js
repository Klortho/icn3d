    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createSphere = function (atom, defaultRadius, forceDefault, scale, bHighlight) {
        var mesh;

        if(defaultRadius === undefined) defaultRadius = 0.8;
        if(forceDefault === undefined) forceDefault = false;
        if(scale === undefined) scale = 1.0;

        if(bHighlight === 2) {
          if(scale > 0.9) { // sphere
            scale = 1.5;
          }
          else if(scale < 0.5) { // dot
            scale = 1.0;
            }
          var color = this.highlightColor;

          mesh = new THREE.Mesh(this.sphereGeometry, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
        }
        else if(bHighlight === 1) {
          mesh = new THREE.Mesh(this.sphereGeometry, this.matShader);
        }
        else {
          var color = atom.color;

          mesh = new THREE.Mesh(this.sphereGeometry, new THREE.MeshPhongMaterial({ overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
        }

        mesh.scale.x = mesh.scale.y = mesh.scale.z = forceDefault ? defaultRadius : (this.vdwRadii[atom.elem] || defaultRadius) * (scale ? scale : 1);
        mesh.position.copy(atom.coord);
        this.mdl.add(mesh);
        if(bHighlight === 1 || bHighlight === 2) {
            this.prevHighlightObjects.push(mesh);
        }
        else {
            this.objects.push(mesh);
        }
    };

    // used for highlight
    iCn3D.prototype.createBox = function (atom, defaultRadius, forceDefault, scale, color, bHighlight) {
        var mesh;

        if(defaultRadius === undefined) defaultRadius = 0.8;
        if(forceDefault === undefined) forceDefault = false;
        if(scale === undefined) scale = 0.8;

        if(bHighlight) {
            if(color === undefined) color = this.highlightColor;

              mesh = new THREE.Mesh(this.boxGeometry, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
        }
        else {
            if(color === undefined) color = atom.color;

              mesh = new THREE.Mesh(this.boxGeometry, new THREE.MeshPhongMaterial({ overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
        }

        mesh.scale.x = mesh.scale.y = mesh.scale.z = forceDefault ? defaultRadius : (this.vdwRadii[atom.elem] || defaultRadius) * (scale ? scale : 1);
        mesh.position.copy(atom.coord);
        this.mdl.add(mesh);

        if(bHighlight) {
            this.prevHighlightObjects.push(mesh);
        }
        else {
            this.objects.push(mesh);
        }
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createCylinder = function (p0, p1, radius, color, bHighlight) {
        var mesh;
        if(bHighlight === 1) {
//            if(this.maxD < 50) {
                mesh = new THREE.Mesh(this.cylinderGeometryOutline, this.matShader);

                mesh.position.copy(p0).add(p1).multiplyScalar(0.5);
                mesh.matrixAutoUpdate = false;
                mesh.lookAt(p0);
                mesh.updateMatrix();

                mesh.matrix.multiply(new THREE.Matrix4().makeScale(radius, radius, p0.distanceTo(p1))).multiply(new THREE.Matrix4().makeRotationX(Math.PI * 0.5));

/*
            }
            else {
                var radius = this.coilWidth * 0.5;
                var radiusSegments = 8; // save memory
                var closed = false;
                var p = [p0, p1];

                var geometry = new THREE.TubeGeometry(
                    new THREE.SplineCurve3(p), // path
                    p.length, // segments
                    radius,
                    radiusSegments,
                    closed
                );

                mesh = new THREE.Mesh(geometry, this.matShader);
            }
*/

            this.mdl.add(mesh);

            this.prevHighlightObjects.push(mesh);
        }
        else {
            if(bHighlight === 2) {
              mesh = new THREE.Mesh(this.cylinderGeometry, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));

              radius *= 1.5;
            }
            else {
              mesh = new THREE.Mesh(this.cylinderGeometry, new THREE.MeshPhongMaterial({ overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
            }

            mesh.position.copy(p0).add(p1).multiplyScalar(0.5);
            mesh.matrixAutoUpdate = false;
            mesh.lookAt(p0);
            mesh.updateMatrix();

            mesh.matrix.multiply(new THREE.Matrix4().makeScale(radius, radius, p0.distanceTo(p1))).multiply(new THREE.Matrix4().makeRotationX(Math.PI * 0.5));
            this.mdl.add(mesh);
            if(bHighlight === 2) {
                this.prevHighlightObjects.push(mesh);
            }
            else {
                this.objects.push(mesh);
            }
        }
    };

    // from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createRepresentationSub = function (atoms, f0, f01) {
        var me = this;

        //var ged = new THREE.Geometry();
        var clbondArray = [];
        for (var i in atoms) {
            var atom0 = atoms[i];
            f0 && f0(atom0);
            for (var j in atom0.bonds) {
                var atom1 = this.atoms[atom0.bonds[j]];
                if (atom1 === undefined || atom1.serial < atom0.serial) continue;
                if (atom1.chain === atom0.chain && ((atom1.resi === atom0.resi) || (atom0.name === 'C' && atom1.name === 'N') || (atom0.name === 'O3\'' && atom1.name === 'P') || (atom0.name === 'SG' && atom1.name === 'SG'))) {
                    f01 && f01(atom0, atom1);
                } else {
                    //ged.vertices.push(atom0.coord);
                    //ged.vertices.push(atom1.coord);
                    clbondArray.push([atom0.coord, atom1.coord]);
                }
            }
        }
        //if (ged.vertices.length && this.bShowCrossResidueBond) {
        if (clbondArray.length > 0 && this.bShowCrossResidueBond) {
            //ged.computeLineDistances();
            //this.mdl.add(new THREE.Line(ged, new THREE.LineDashedMaterial({ linewidth: this.linewidth, color: this.defaultBondColor, dashSize: 0.3, gapSize: 0.15 }), THREE.LinePieces));
            var color = new THREE.Color(0x00FF00);

            for(var i = 0, il = clbondArray.length; i < il; ++i) {
                me.createCylinder(clbondArray[i][0], clbondArray[i][1], this.cylinderRadius, color, 0);
            }
        }
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createSphereRepresentation = function (atoms, defaultRadius, forceDefault, scale, bHighlight) {
        var me = this;
        this.createRepresentationSub(atoms, function (atom0) {
            me.createSphere(atom0, defaultRadius, forceDefault, scale, bHighlight);
        });
    };

    iCn3D.prototype.createBoxRepresentation_P_CA = function (atoms, scale, bHighlight) {
        var me = this;
        this.createRepresentationSub(atoms, function (atom0) {
            if(atom0.name === 'CA' || atom0.name === 'P') {
                me.createBox(atom0, undefined, undefined, scale, undefined, bHighlight);
            }
        });
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createStickRepresentation = function (atoms, atomR, bondR, scale, bHighlight, bSchematic) {
        var me = this;
        var factor = (bSchematic !== undefined && bSchematic) ? atomR / me.cylinderRadius : 1;

        if(bHighlight !== 2) {
            this.createRepresentationSub(atoms, function (atom0) {
                me.createSphere(atom0, atomR, !scale, scale, bHighlight);
            }, function (atom0, atom1) {
                var mp = atom0.coord.clone().add(atom1.coord).multiplyScalar(0.5);
                var pair = atom0.serial + '_' + atom1.serial;

                if(me.doublebonds.hasOwnProperty(pair)) { // show double bond
                    var a0, a1, a2;
                    if(atom0.bonds.length > atom1.bonds.length && atom0.bonds.length > 1) {
                        a0 = atom0.serial;
                        a1 = atom0.bonds[0];
                        a2 = atom0.bonds[1];
                    }
                    //else {
                    else if(atom1.bonds.length > 1) {
                        a0 = atom1.serial;
                        a1 = atom1.bonds[0];
                        a2 = atom1.bonds[1];
                    }
                    else {
                        return;
                    }

                    var v1 = me.atoms[a0].coord.clone();
                    v1.sub(me.atoms[a1].coord);
                    var v2 = me.atoms[a0].coord.clone();
                    v2.sub(me.atoms[a2].coord);

                    v1.cross(v2);

                    var v0 = atom1.coord.clone();
                    v0.sub(atom0.coord);

                    v0.cross(v1).normalize().multiplyScalar(0.2 * factor);

                    if (atom0.color === atom1.color) {
                        me.createCylinder(atom0.coord.clone().add(v0), atom1.coord.clone().add(v0), me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);
                        me.createCylinder(atom0.coord.clone().sub(v0), atom1.coord.clone().sub(v0), me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);
                    } else {
                        me.createCylinder(atom0.coord.clone().add(v0), mp.clone().add(v0), me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);
                        me.createCylinder(atom1.coord.clone().add(v0), mp.clone().add(v0), me.cylinderRadius * factor * 0.3, atom1.color, bHighlight);

                        me.createCylinder(atom0.coord.clone().sub(v0), mp.clone().sub(v0), me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);
                        me.createCylinder(atom1.coord.clone().sub(v0), mp.clone().sub(v0), me.cylinderRadius * factor * 0.3, atom1.color, bHighlight);
                    }
                }
                else if(me.aromaticbonds.hasOwnProperty(pair)) { // show aromatic bond
                    var a0, a1, a2;
                    if(atom0.bonds.length > atom1.bonds.length && atom0.bonds.length > 1) {
                        a0 = atom0.serial;
                        a1 = atom0.bonds[0];
                        a2 = atom0.bonds[1];
                    }
                    else if(atom1.bonds.length > 1) {
                        a0 = atom1.serial;
                        a1 = atom1.bonds[0];
                        a2 = atom1.bonds[1];
                    }
                    else {
                        return;
                    }

                    var v1 = me.atoms[a0].coord.clone();
                    v1.sub(me.atoms[a1].coord);
                    var v2 = me.atoms[a0].coord.clone();
                    v2.sub(me.atoms[a2].coord);

                    v1.cross(v2);

                    var v0 = atom1.coord.clone();
                    v0.sub(atom0.coord);

                    v0.cross(v1).normalize().multiplyScalar(0.2 * factor);

                    // find an aromatic neighbor
                    var aromaticNeighbor = 0;
                    for(var i = 0, il = atom0.bondOrder.length; i < il; ++i) {
                        if(atom0.bondOrder[i] === '1.5' && atom0.bonds[i] !== atom1.serial) {
                            aromaticNeighbor = atom0.bonds[i];
                        }
                    }

                    var dashed = "add";
                    if(aromaticNeighbor === 0 ) { // no neighbor found, atom order does not matter
                        dashed = "add";
                    }
                    else {
                        // calculate the angle between atom1, atom0add, atomNeighbor and the angle atom1, atom0sub, atomNeighbor
                        var atom0add = atom0.coord.clone().add(v0);
                        var atom0sub = atom0.coord.clone().sub(v0);

                        var a = atom1.coord.clone().sub(atom0add).normalize();
                        var b = me.atoms[aromaticNeighbor].coord.clone().sub(atom0add).normalize();

                        var c = atom1.coord.clone().sub(atom0sub).normalize();
                        var d = me.atoms[aromaticNeighbor].coord.clone().sub(atom0sub).normalize();

                        var angleadd = Math.acos(a.dot(b));
                        var anglesub = Math.acos(c.dot(d));

                        if(angleadd < anglesub) {
                            dashed = 'sub';
                        }
                        else {
                            dashed = 'add';
                        }
                    }

                    if (atom0.color === atom1.color) {
                        var base, step;
                        if(dashed === 'add') {
                            me.createCylinder(atom0.coord.clone().sub(v0), atom1.coord.clone().sub(v0), me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);

                            base = atom0.coord.clone().add(v0);
                            step = atom1.coord.clone().add(v0).sub(base).multiplyScalar(1.0/11);
                        }
                        else {
                            me.createCylinder(atom0.coord.clone().add(v0), atom1.coord.clone().add(v0), me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);

                            base = atom0.coord.clone().sub(v0);
                            step = atom1.coord.clone().sub(v0).sub(base).multiplyScalar(1.0/11);
                        }

                        for(var i = 0; i <= 10; ++i) {
                            if(i % 2 == 0) {
                                var pos1 = base.clone().add(step.clone().multiplyScalar(i));
                                var pos2 = base.clone().add(step.clone().multiplyScalar(i + 1));
                                me.createCylinder(pos1, pos2, me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);
                            }
                        }

                    } else {
                        var base, step;
                        if(dashed === 'add') {
                            me.createCylinder(atom0.coord.clone().sub(v0), mp.clone().sub(v0), me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);
                            me.createCylinder(atom1.coord.clone().sub(v0), mp.clone().sub(v0), me.cylinderRadius * factor * 0.3, atom1.color, bHighlight);

                            base = atom0.coord.clone().add(v0);
                            step = atom1.coord.clone().add(v0).sub(base).multiplyScalar(1.0/11);
                        }
                        else {
                            me.createCylinder(atom0.coord.clone().add(v0), mp.clone().add(v0), me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);
                            me.createCylinder(atom1.coord.clone().add(v0), mp.clone().add(v0), me.cylinderRadius * factor * 0.3, atom1.color, bHighlight);

                            base = atom0.coord.clone().sub(v0);
                            step = atom1.coord.clone().sub(v0).sub(base).multiplyScalar(1.0/11);
                        }

                        for(var i = 0; i <= 10; ++i) {
                            if(i % 2 == 0) {
                                var pos1 = base.clone().add(step.clone().multiplyScalar(i));
                                var pos2 = base.clone().add(step.clone().multiplyScalar(i + 1));
                                if(i < 5) {
                                    me.createCylinder(pos1, pos2, me.cylinderRadius * factor * 0.3, atom0.color, bHighlight);
                                }
                                else {
                                    me.createCylinder(pos1, pos2, me.cylinderRadius * factor * 0.3, atom1.color, bHighlight);
                                }
                            }
                        }
                    }
                }
                else if(me.triplebonds.hasOwnProperty(pair)) { // show triple bond
                    var random = new THREE.Vector3(Math.random(),Math.random(),Math.random());
                    var v = atom1.coord.clone();
                    v.sub(atom0.coord);

                    var c = random.clone();
                    c.cross(v).normalize().multiplyScalar(0.3 * factor);

                    if (atom0.color === atom1.color) {
                        me.createCylinder(atom0.coord, atom1.coord, me.cylinderRadius * factor * 0.2, atom0.color, bHighlight);
                        me.createCylinder(atom0.coord.clone().add(c), atom1.coord.clone().add(c), me.cylinderRadius * factor * 0.2, atom0.color, bHighlight);
                        me.createCylinder(atom0.coord.clone().sub(c), atom1.coord.clone().sub(c), me.cylinderRadius * factor * 0.2, atom0.color, bHighlight);
                    } else {
                        me.createCylinder(atom0.coord, mp, me.cylinderRadius * factor * 0.2, atom0.color, bHighlight);
                        me.createCylinder(atom1.coord, mp, me.cylinderRadius * factor * 0.2, atom1.color, bHighlight);

                        me.createCylinder(atom0.coord.clone().add(c), mp.clone().add(c), me.cylinderRadius * factor * 0.2, atom0.color, bHighlight);
                        me.createCylinder(atom1.coord.clone().add(c), mp.clone().add(c), me.cylinderRadius * factor * 0.2, atom1.color, bHighlight);

                        me.createCylinder(atom0.coord.clone().sub(c), mp.clone().sub(c), me.cylinderRadius * factor * 0.2, atom0.color, bHighlight);
                        me.createCylinder(atom1.coord.clone().sub(c), mp.clone().sub(c), me.cylinderRadius * factor * 0.2, atom1.color, bHighlight);
                    }
                }
                else {
                    if (atom0.color === atom1.color) {
                        me.createCylinder(atom0.coord, atom1.coord, bondR, atom0.color, bHighlight);
                    } else {
                        me.createCylinder(atom0.coord, mp, bondR, atom0.color, bHighlight);
                        me.createCylinder(atom1.coord, mp, bondR, atom1.color, bHighlight);
                    }
                }
            });
        }
        else if(bHighlight === 2) {
            this.createBoxRepresentation_P_CA(atoms, 1.2, bHighlight);
        }
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createLineRepresentation = function (atoms, bHighlight) {
        var me = this;
        var geo = new THREE.Geometry();
        this.createRepresentationSub(atoms, undefined, function (atom0, atom1) {
            if (atom0.color === atom1.color) {
                geo.vertices.push(atom0.coord);
                geo.vertices.push(atom1.coord);
                geo.colors.push(atom0.color);
                geo.colors.push(atom1.color);
            } else {
                var mp = atom0.coord.clone().add(atom1.coord).multiplyScalar(0.5);
                geo.vertices.push(atom0.coord);
                geo.vertices.push(mp);
                geo.vertices.push(atom1.coord);
                geo.vertices.push(mp);
                geo.colors.push(atom0.color);
                geo.colors.push(atom0.color);
                geo.colors.push(atom1.color);
                geo.colors.push(atom1.color);
            }
        });

        if(bHighlight !== 2) {
            var line;
            if(bHighlight === 1) {
                // outline didn't work for lines
                //line = new THREE.Mesh(geo, this.matShader);
            }
            else {
                line = new THREE.Line(geo, new THREE.LineBasicMaterial({ linewidth: this.linewidth, vertexColors: true }), THREE.LinePieces);
            }

            this.mdl.add(line);

            if(bHighlight === 1) {
                this.prevHighlightObjects.push(line);
            }
            else {
                this.objects.push(line);
            }
        }
        else if(bHighlight === 2) {
            this.createBoxRepresentation_P_CA(atoms, 0.8, bHighlight);
        }
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.subdivide = function (_points, _colors, DIV, bShowArray, bHighlight) { // Catmull-Rom subdivision
        var ret = [];
        var pos = [];
        var color = [];

        var points = new Array(); // Smoothing test
        points.push(_points[0]);
        for (var i = 1, lim = _points.length - 1; i < lim; ++i) {
            var p0 = _points[i], p1 = _points[i + 1];
            points.push(p0.smoothen ? p0.clone().add(p1).multiplyScalar(0.5) : p0);
        }
        points.push(_points[_points.length - 1]);

        var savedPoints = [];
        var savedPos = [];
        var savedColor = [];
        for (var i = -1, size = points.length, DIVINV = 1 / DIV; i <= size - 3; ++i) {
            var p0 = points[i === -1 ? 0 : i];
            var p1 = points[i + 1], p2 = points[i + 2];
            var p3 = points[i === size - 3 ? size - 1 : i + 3];
            var v0 = p2.clone().sub(p0).multiplyScalar(0.5);
            var v1 = p3.clone().sub(p1).multiplyScalar(0.5);

            //if(i > -1 && bHighlight && bShowArray !== undefined && bShowArray[i + 1]) {
            if(i > -1 && (bShowArray === undefined || bShowArray[i + 1]) ) {
                // get from previous i for the first half of residue
                ret = ret.concat(savedPoints);
                pos = pos.concat(savedPos);
                color = color.concat(savedColor);
            }

            savedPoints = [];
            savedPos = [];
            savedColor = [];

            for (var j = 0; j < DIV; ++j) {
                var t = DIVINV * j;
                var x = p1.x + t * v0.x
                         + t * t * (-3 * p1.x + 3 * p2.x - 2 * v0.x - v1.x)
                         + t * t * t * (2 * p1.x - 2 * p2.x + v0.x + v1.x);
                var y = p1.y + t * v0.y
                         + t * t * (-3 * p1.y + 3 * p2.y - 2 * v0.y - v1.y)
                         + t * t * t * (2 * p1.y - 2 * p2.y + v0.y + v1.y);
                var z = p1.z + t * v0.z
                         + t * t * (-3 * p1.z + 3 * p2.z - 2 * v0.z - v1.z)
                         + t * t * t * (2 * p1.z - 2 * p2.z + v0.z + v1.z);
                if(!bShowArray) {
                    ret.push(new THREE.Vector3(x, y, z));
                    pos.push(i + 1);
                    color.push(_colors[i+1]);
                }
                else {
                    if(bShowArray[i + 1]) {
                        if(j <= parseInt((DIV) / 2) ) {
                            ret.push(new THREE.Vector3(x, y, z));
                            pos.push(bShowArray[i + 1]);
                            color.push(_colors[i+1]);
                        }
                    }

                    if(bShowArray[i + 2]) {
                        if(j > parseInt((DIV) / 2) ) {
                            savedPoints.push(new THREE.Vector3(x, y, z));
                            savedPos.push(bShowArray[i + 2]);
                            savedColor.push(_colors[i+2]);
                        }
                    }
                } // end else
            }

        }

        if(!bShowArray || bShowArray[i + 1]) {
            //if(bHighlight) {
                ret = ret.concat(savedPoints);
                pos = pos.concat(savedPos);
                color = color.concat(savedColor);
            //}

            ret.push(points[points.length - 1]);
            pos.push(points.length - 1);
            color.push(_colors[points.length - 1]);
        }

        savedPoints = [];
        savedPos = [];
        savedColor = [];
        points = [];

        points_positions = [];

        points_positions.push(ret);
        points_positions.push(pos);
        points_positions.push(color);

        return points_positions;
    };

    iCn3D.prototype.createCurveSubArrow = function (p, width, colors, div, bHighlight, bRibbon, num, positionIndex, pointsCA, prevCOArray, bShowArray) {
        var divPoints = [], positions = [];

        divPoints.push(p);
        positions.push(positionIndex);

        this.prepareStrand(divPoints, positions, width, colors, div, undefined, bHighlight, bRibbon, num, pointsCA, prevCOArray, false, bShowArray);

        divPoints = [];
        positions = [];
    };

    // modified from iview (http://star.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createCurveSub = function (_points, width, colors, div, bHighlight, bRibbon, bNoSmoothen, bShowArray, positions) {
        if (_points.length === 0) return;
        div = div || 5;
        var points;
        if(!bNoSmoothen) {
			var points_colors = this.subdivide(_points, colors, div, bShowArray, bHighlight);
            points = points_colors[0];
            colors = points_colors[2];
        }
        else {
            points = _points;
        }
        if (points.length === 0) return;

        if(bHighlight === 1) {
            var radius = this.coilWidth / 2;
            //var radiusSegments = 8;
            var radiusSegments = 4; // save memory
            var closed = false;

            if(points.length > 1) {
                if(positions !== undefined) {
                    var currPos, prevPos;
                    var currPoints = [];
                    for(var i = 0, il = points.length; i < il; ++i) {
                        currPos = positions[i];

                        if( (currPos !== prevPos && currPos !== prevPos + 1 && prevPos !== undefined) || (i === il -1) ) {
                            // first tube
                            var geometry0 = new THREE.TubeGeometry(
                                new THREE.SplineCurve3(currPoints), // path
                                currPoints.length, // segments
                                radius,
                                radiusSegments,
                                closed
                            );

                            mesh = new THREE.Mesh(geometry0, this.matShader);
                            this.mdl.add(mesh);

                            this.prevHighlightObjects.push(mesh);

                            geometry0 = null;

                            currPoints = [];
                        }

                        currPoints.push(points[i]);

                        prevPos = currPos;
                    }

                    currPoints = [];
                }
                else {
                    var geometry0 = new THREE.TubeGeometry(
                        new THREE.SplineCurve3(points), // path
                        points.length, // segments
                        radius,
                        radiusSegments,
                        closed
                    );

                    mesh = new THREE.Mesh(geometry0, this.matShader);
                    this.mdl.add(mesh);

                    this.prevHighlightObjects.push(mesh);

                    geometry0 = null;
                }
            }
        }
        else {
            var geo = new THREE.Geometry();

            if(bHighlight === 2 && bRibbon) {
                for (var i = 0, divInv = 1 / div; i < points.length; ++i) {
                    // shift the highlight a little bit to avoid the overlap with ribbon
                    points[i].addScalar(0.6); // this.thickness is 0.4
                    geo.vertices.push(points[i]);
                    //geo.colors.push(new THREE.Color(colors[i === 0 ? 0 : Math.round((i - 1) * divInv)]));
                    geo.colors.push(new THREE.Color(colors[i]));
                }
            }
            else {
                for (var i = 0, divInv = 1 / div; i < points.length; ++i) {
                    geo.vertices.push(points[i]);
                    //geo.colors.push(new THREE.Color(colors[i === 0 ? 0 : Math.round((i - 1) * divInv)]));
                    geo.colors.push(new THREE.Color(colors[i]));
                }
            }

            var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ linewidth: width, vertexColors: true }), THREE.LineStrip);
            this.mdl.add(line);
            if(bHighlight === 2) {
                this.prevHighlightObjects.push(line);
            }
            else {
                this.objects.push(line);
            }
        }

        points = null;
    };

    iCn3D.prototype.createLines = function(lines) { // show extra lines, not used for picking, so no this.objects
       if(lines !== undefined) {
         for(var name in lines) {
             var lineArray = lines[name];
             for(var i = 0, il = lineArray.length; i < il; ++i) {
               var line = lineArray[i];

               var p1 = line.position1;
               var p2 = line.position2;

               var colorHex;
               if(line.color) { // #FF0000
                  var color = /^\#([0-9a-f]{6})$/i.exec( line.color );
                  colorHex = parseInt( color[ 1 ], 16 );
               }
               else {
                  colorHex = 0xffff00;
               }

               var dashed = (line.dashed) ? line.dashed : false;
               var dashSize = 0.3;

               this.mdl.add(this.createSingleLine( p1, p2, colorHex, dashed, dashSize ));
             }
         }
       }

       // do not add the artificial lines to raycasting objects
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createCylinderCurve = function (atoms, atomName, radius, bLines, bHighlight) {
        var start = null;
        var currentChain, currentResi;
        var i;
        var points = [], colors = [], radii = [];
        for (i in atoms) {
            var atom = atoms[i];
            if (atom.het) continue;
            if (atom.name !== atomName) continue;

            if (start !== null && currentChain === atom.chain && currentResi + 1 === atom.resi) {
                var middleCoord = start.coord.clone().add(atom.coord).multiplyScalar(0.5);

                if(!bHighlight) {
                    if(bLines) {
                        var line = this.createSingleLine( start.coord, middleCoord, start.color, false);
                        this.mdl.add(line);
                        this.objects.push(line);
                        line = this.createSingleLine( middleCoord, atom.coord, atom.color, false);
                        this.mdl.add(line);
                        this.objects.push(line);
                    }
                    else {
                        this.createCylinder(start.coord, middleCoord, radius, start.color);
                        this.createCylinder(middleCoord, atom.coord, radius, atom.color);
                        this.createSphere(atom, radius, true, 1);
                    }
                }
                else if(bHighlight === 1) {
                    this.createCylinder(start.coord, middleCoord, radius, start.color, bHighlight);
                    this.createCylinder(middleCoord, atom.coord, radius, atom.color, bHighlight);
                    this.createSphere(atom, radius, true, 1, bHighlight);
                }
            }

            start = atom;
            currentChain = atom.chain;
            currentResi = atom.resi;

            if(bHighlight === 2) this.createBox(atom, undefined, undefined, undefined, undefined, bHighlight);
        }
        if (start !== null && currentChain === atom.chain && currentResi + 1 === atom.resi) {
            var middleCoord = start.coord.add(atom.coord).multiplyScalar(0.5);
            if(!bHighlight) {
                if(bLines) {
                    var line = this.createSingleLine( start.coord, middleCoord, start.color, false);
                    this.mdl.add(line);
                    this.objects.push(line);
                    line = this.createSingleLine( middleCoord, atom.coord, atom.color, false);
                    this.mdl.add(line);
                    this.objects.push(line);
                }
                else {
                    this.createCylinder(start.coord, middleCoord, radius, start.color);
                    this.createCylinder(middleCoord, atom.coord, radius, atom.color);
                }
            }
            else if(bHighlight === 1) {
                this.createCylinder(start.coord, middleCoord, radius, start.color, bHighlight);
                this.createCylinder(middleCoord, atom.coord, radius, atom.color, bHighlight);
                this.createSphere(atom, radius, true, 1, bHighlight);
            }
        }
    };

    iCn3D.prototype.prepareStrand = function(divPoints, positions, width, colors, div, thickness, bHighlight, bRibbon, num, pointsCA, prevCOArray, bStrip, bShowArray) {
        if(pointsCA.length === 1) {
            return;
        }

        var colorsLastTwo = [];
        colorsLastTwo.push(colors[colors.length - 2]);
        colorsLastTwo.push(colors[colors.length - 1]);

        div = div || this.axisDIV;
        var numM1Inv2 = 2 / (num - 1);
        var delta, lastCAIndex, lastPrevCOIndex, v;

        var points = {}, colorsTmp = [];
        for(var i = 0, il = positions.length; i < il; ++i) points[i] = [];

        // smooth C-alpha
        var points_colors = this.subdivide(pointsCA, colors, div);
        var pointsCASmooth = points_colors[0]; // get all smoothen points, do not use 'bShowArray'
        //colors = points_colors[2];

        if(pointsCASmooth.length === 1) {
            return;
        }

        // draw the sheet without the last residue
        // use the sheet coord for n-2 residues
        var colorsTmp = [];
        for (var i = 0, il = pointsCA.length - 2; i < il; ++i) {
            for(var index = 0, indexl = positions.length; index < indexl; ++index) {
                points[index].push(divPoints[index][i]);
            }
            colorsTmp.push(colors[i]);
        }
        colorsTmp.push(colors[i]);

        // assign the sheet coord from C-alpha for the 2nd to the last residue of the sheet
        for(var i = 0, il = positions.length; i < il; ++i) {
            delta = -1 + numM1Inv2 * positions[i];
            lastCAIndex = pointsCASmooth.length - 1 - div;
            lastPrevCOIndex = pointsCA.length - 2;
            v = new THREE.Vector3(pointsCASmooth[lastCAIndex].x + prevCOArray[lastPrevCOIndex].x * delta, pointsCASmooth[lastCAIndex].y + prevCOArray[lastPrevCOIndex].y * delta, pointsCASmooth[lastCAIndex].z + prevCOArray[lastPrevCOIndex].z * delta);
            points[i].push(v);
        }

        var posIndex = [];
        var results;
        for(var i = 0, il = positions.length; i < il; ++i) {
            results = this.subdivide(points[i], colorsTmp, div, bShowArray, bHighlight);
            points[i] = results[0];
            colors = results[2];
            if(i === 0) {
                posIndex = results[1];
            }
        }

        if(bStrip) {
            //this.createStrip(points[0], points[1], colorsTmp, div, thickness, bHighlight, true, undefined, posIndex);
            this.createStrip(points[0], points[1], colors, div, thickness, bHighlight, true, undefined, posIndex);
        }
        else {
            //this.createCurveSub(points[0], width, colorsTmp, div, bHighlight, bRibbon, true, undefined, posIndex);
            this.createCurveSub(points[0], width, colors, div, bHighlight, bRibbon, true, undefined, posIndex);
        }

        // refresh memory
        for(var i in points) {
            for(var j = 0, jl = points[i].length; j < jl; ++j) {
                points[i][j] = null;
            }
            points[i] = [];
        }

        // draw the arrow
        colorsTmp = [];

        posIndex = [];
        for(var index = 0, indexl = positions.length; index < indexl; ++index) {
            points[index] = [];

            for (var i = div * (pointsCA.length - 2), il = div * (pointsCA.length - 1); bShowArray[parseInt(i/div)] && i < il; i = i + div) {
                var pos = parseInt(i/div);
                for (var j = 0; j < div; ++j) {
                    var delta = -1 + numM1Inv2 * positions[index];
                    var scale = 1.8; // scale of the arrow width
                    delta = delta * scale * (div - j) / div;
                    var oriIndex = parseInt(i/div);

                    var v = new THREE.Vector3(pointsCASmooth[i+j].x + prevCOArray[oriIndex].x * delta, pointsCASmooth[i+j].y + prevCOArray[oriIndex].y * delta, pointsCASmooth[i+j].z + prevCOArray[oriIndex].z * delta);
                    v.smoothen = true;
                    points[index].push(v);
                    colorsTmp.push(colorsLastTwo[0]);
                    if(index === 0) posIndex.push(pos);
                }
            }

            // last residue
            // make the arrow end with 0
            var delta = 0;
            var lastCAIndex = pointsCASmooth.length - 1;
            var lastPrevCOIndex = pointsCA.length - 1;

            //if(bShowArray[lastPrevCOIndex]) {
                var v = new THREE.Vector3(pointsCASmooth[lastCAIndex].x + prevCOArray[lastPrevCOIndex].x * delta, pointsCASmooth[lastCAIndex].y + prevCOArray[lastPrevCOIndex].y * delta, pointsCASmooth[lastCAIndex].z + prevCOArray[lastPrevCOIndex].z * delta);
                v.smoothen = true;
                points[index].push(v);
                colorsTmp.push(colorsLastTwo[1]);
                if(index === 0) posIndex.push(lastCAIndex);
            //}
        }

        pointsCASmooth = [];

        //colorsTmp.push(colors[colors.length - 2]);
        //colorsTmp.push(colors[colors.length - 1]);

        if(bStrip) {
            this.createStrip(points[0], points[1], colorsTmp, div, thickness, bHighlight, true, undefined, posIndex);
        }
        else {
            this.createCurveSub(points[0], width, colorsTmp, div, bHighlight, bRibbon, true, undefined, posIndex);
        }

        for(var i in points) {
            for(var j = 0, jl = points[i].length; j < jl; ++j) {
                points[i][j] = null;
            }
            points[i] = [];
        }

        points = {};
    };

    iCn3D.prototype.createStripArrow = function (p0, p1, colors, div, thickness, bHighlight, num, start, end, pointsCA, prevCOArray, bShowArray) {
        var divPoints = [], positions = [];

        divPoints.push(p0);
        divPoints.push(p1);
        positions.push(start);
        positions.push(end);

        this.prepareStrand(divPoints, positions, undefined, colors, div, thickness, bHighlight, undefined, num, pointsCA, prevCOArray, true, bShowArray);

        divPoints = [];
        positions = [];
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createStrip = function (p0, p1, colors, div, thickness, bHighlight, bNoSmoothen, bShowArray, positions) {
        if (p0.length < 2) return;
        div = div || this.axisDIV;
        if(!bNoSmoothen) {
			var points_colors0 = this.subdivide(p0, colors, div, bShowArray, bHighlight);
			var points_colors1 = this.subdivide(p1, colors, div, bShowArray, bHighlight);
            p0 = points_colors0[0];
            p1 = points_colors1[0];
            colors = points_colors0[2];
        }
        if (p0.length < 2) return;

        if(bHighlight === 1) {
            //mesh = new THREE.Mesh(geo, this.matShader);

            var radius = this.coilWidth / 2;
            //var radiusSegments = 8;
            var radiusSegments = 4; // save memory
            var closed = false;

            if(positions !== undefined) {
                var currPos, prevPos;
                var currP0 = [], currP1 = [];

                for(var i = 0, il = p0.length; i < il; ++i) {
                    currPos = positions[i];

                    if((currPos !== prevPos && currPos !== prevPos + 1 && prevPos !== undefined) || (i === il -1) ) {
                        // first tube
                        var geometry0 = new THREE.TubeGeometry(
                            new THREE.SplineCurve3(currP0), // path
                            currP0.length, // segments
                            radius,
                            radiusSegments,
                            closed
                        );

                        mesh = new THREE.Mesh(geometry0, this.matShader);
                        this.mdl.add(mesh);

                        this.prevHighlightObjects.push(mesh);

                        geometry0 = null;

                        // second tube
                        var geometry1 = new THREE.TubeGeometry(
                            new THREE.SplineCurve3(currP1), // path
                            currP1.length, // segments
                            radius,
                            radiusSegments,
                            closed
                        );

                        mesh = new THREE.Mesh(geometry1, this.matShader);
                        this.mdl.add(mesh);

                        this.prevHighlightObjects.push(mesh);

                        geometry1 = null;

                        currP0 = [];
                        currP1 = [];
                    }

                    currP0.push(p0[i]);
                    currP1.push(p1[i]);

                    prevPos = currPos;
                }

                currP0 = [];
                currP1 = [];
            }
            else {
                // first tube
                var geometry0 = new THREE.TubeGeometry(
                    new THREE.SplineCurve3(p0), // path
                    p0.length, // segments
                    radius,
                    radiusSegments,
                    closed
                );

                mesh = new THREE.Mesh(geometry0, this.matShader);
                this.mdl.add(mesh);

                this.prevHighlightObjects.push(mesh);

                geometry0 = null;

                // second tube
                var geometry1 = new THREE.TubeGeometry(
                    new THREE.SplineCurve3(p1), // path
                    p1.length, // segments
                    radius,
                    radiusSegments,
                    closed
                );

                mesh = new THREE.Mesh(geometry1, this.matShader);
                this.mdl.add(mesh);

                this.prevHighlightObjects.push(mesh);

                geometry1 = null;
            }
        }
        else {
            var geo = new THREE.Geometry();
            var vs = geo.vertices, fs = geo.faces;
            var axis, p0v, p1v, a0v, a1v;
            for (var i = 0, lim = p0.length; i < lim; ++i) {
                vs.push(p0v = p0[i]); // 0
                vs.push(p0v); // 1
                vs.push(p1v = p1[i]); // 2
                vs.push(p1v); // 3
                if (i < lim - 1) {
                    axis = p1[i].clone().sub(p0[i]).cross(p0[i + 1].clone().sub(p0[i])).normalize().multiplyScalar(thickness);
                }
                vs.push(a0v = p0[i].clone().add(axis)); // 4
                vs.push(a0v); // 5
                vs.push(a1v = p1[i].clone().add(axis)); // 6
                vs.push(a1v); // 7
            }
            var faces = [[0, 2, -6, -8], [-4, -2, 6, 4], [7, 3, -5, -1], [-3, -7, 1, 5]];

            for (var i = 1, lim = p0.length, divInv = 1 / div; i < lim; ++i) {
                var offset = 8 * i;
                //var color = new THREE.Color(colors[Math.round((i - 1) * divInv)]);
                var color = new THREE.Color(colors[i - 1]);
                for (var j = 0; j < 4; ++j) {
                    fs.push(new THREE.Face3(offset + faces[j][0], offset + faces[j][1], offset + faces[j][2], undefined, color));
                    fs.push(new THREE.Face3(offset + faces[j][3], offset + faces[j][0], offset + faces[j][2], undefined, color));
                }
            }
            var vsize = vs.length - 8; // Cap
            for (var i = 0; i < 4; ++i) {
                vs.push(vs[i * 2]);
                vs.push(vs[vsize + i * 2]);
            };
            vsize += 8;
            fs.push(new THREE.Face3(vsize, vsize + 2, vsize + 6, undefined, fs[0].color));
            fs.push(new THREE.Face3(vsize + 4, vsize, vsize + 6, undefined, fs[0].color));
            fs.push(new THREE.Face3(vsize + 1, vsize + 5, vsize + 7, undefined, fs[fs.length - 3].color));
            fs.push(new THREE.Face3(vsize + 3, vsize + 1, vsize + 7, undefined, fs[fs.length - 3].color));
            geo.computeFaceNormals();
            geo.computeVertexNormals(false);

            var mesh;

            if(bHighlight === 2) {
              mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));

              this.mdl.add(mesh);
              this.prevHighlightObjects.push(mesh);
            }
            else {
              mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));

              this.mdl.add(mesh);
              this.objects.push(mesh);
            }
        }

        p0 = null;
        p1 = null;
    };

    // significantly modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createStrand = function (atoms, num, div, fill, coilWidth, helixSheetWidth, doNotSmoothen, thickness, bHighlight) {
        var bRibbon = fill ? true: false;

        // when highlight, the input atoms may only include part of sheet or helix
        // include the whole sheet or helix when highlighting
        var atomsAdjust = {};

        //if( (bHighlight === 1 || bHighlight === 2) && !this.bAllAtoms) {
        if( !this.bAllAtoms) {
            var currChain, currResi, currAtom, prevChain, prevResi, prevAtom;
            var firstAtom, lastAtom;
            var index = 0, length = Object.keys(atoms).length;

            atomsAdjust = this.cloneHash(atoms);
            for(var serial in atoms) {
              currChain = atoms[serial].structure + '_' + atoms[serial].chain;
              currResi = parseInt(atoms[serial].resi);
              currAtom = atoms[serial];

              if(prevChain === undefined) firstAtom = atoms[serial];

              if( (currChain !== prevChain && prevChain !== undefined) || (currResi !== prevResi && currResi !== prevResi + 1 && prevResi !== undefined)
                      || index === length - 1) {
                if( (currChain !== prevChain && prevChain !== undefined) || (currResi !== prevResi && currResi !== prevResi + 1 && prevResi !== undefined) ) {
                    lastAtom = prevAtom;
                }
                else if(index === length - 1) {
                    lastAtom = currAtom;
                }

                // fill the beginning
                var beginResi = firstAtom.resi;
                if(firstAtom.ss !== 'coil' && !(firstAtom.ssbegin) ) {
                    for(var i = firstAtom.resi - 1; i > 0; --i) {
                        var residueid = firstAtom.structure + '_' + firstAtom.chain + '_' + i;
                        if(!this.residues.hasOwnProperty(residueid)) break;

                        var atom = this.getFirstAtomObj(this.residues[residueid]);

                        if(atom.ss === firstAtom.ss && atom.ssbegin) {
                            beginResi = atom.resi;
                            break;
                        }
                    }

                    for(var i = beginResi; i < firstAtom.resi; ++i) {
                        var residueid = firstAtom.structure + '_' + firstAtom.chain + '_' + i;
                        atomsAdjust = this.unionHash(atomsAdjust, this.hash2Atoms(this.residues[residueid]));
                    }
                }

                // add one extra residue for coils between strands/helix
                if(this.picking === 3 && bHighlight === 1 && firstAtom.ss === 'coil') {
                        var residueid = firstAtom.structure + '_' + firstAtom.chain + '_' + (firstAtom.resi - 1);
                        if(this.residues.hasOwnProperty(residueid)) {
                            atomsAdjust = this.unionHash(atomsAdjust, this.hash2Atoms(this.residues[residueid]));
                            atoms = this.unionHash(atoms, this.hash2Atoms(this.residues[residueid]));
                        }
                }

                // fill the end
                var endResi = lastAtom.resi;
                // when a coil connects to a sheet and the last residue of coil is highlighted, the first sheet residue is set as atom.notshow. This residue should not be shown.
                if(lastAtom.ss !== 'coil' && !(lastAtom.ssend) && !(lastAtom.notshow)) {
                    var endChainResi = this.getLastAtomObj(this.chains[lastAtom.structure + '_' + lastAtom.chain]).resi;
                    for(var i = lastAtom.resi + 1; i <= endChainResi; ++i) {
                        var residueid = lastAtom.structure + '_' + lastAtom.chain + '_' + i;
                        if(!this.residues.hasOwnProperty(residueid)) break;

                        var atom = this.getFirstAtomObj(this.residues[residueid]);

                        if(atom.ss === lastAtom.ss && atom.ssend) {
                            endResi = atom.resi;
                            break;
                        }
                    }

                    for(var i = lastAtom.resi + 1; i <= endResi; ++i) {
                        var residueid = lastAtom.structure + '_' + lastAtom.chain + '_' + i;
                        atomsAdjust = this.unionHash(atomsAdjust, this.hash2Atoms(this.residues[residueid]));
                    }
                }

                // add one extra residue for coils between strands/helix
                if(this.picking === 3 && bHighlight === 1 && lastAtom.ss === 'coil') {
                        var residueid = lastAtom.structure + '_' + lastAtom.chain + '_' + (lastAtom.resi + 1);
                        if(this.residues.hasOwnProperty(residueid)) {
                            atomsAdjust = this.unionHash(atomsAdjust, this.hash2Atoms(this.residues[residueid]));
                            atoms = this.unionHash(atoms, this.hash2Atoms(this.residues[residueid]));
                        }
                }

                // reset notshow
                if(lastAtom.notshow) lastAtom.notshow = undefined;

                firstAtom = currAtom;
              }

              prevChain = currChain;
              prevResi = currResi;
              prevAtom = currAtom;

              ++index;
            }
        }
        else {
            atomsAdjust = atoms;
        }

        if(bHighlight === 2) {
            if(fill) {
                fill = false;
                num = null;
                div = null;
                coilWidth = null;
                helixSheetWidth = null;
                thickness = undefined;
            }
            else {
                fill = true;
                num = 2;
                div = undefined;
                coilWidth = undefined;
                helixSheetWidth = undefined;
                thickness = this.thickness;
            }
        }

        num = num || this.strandDIV;
        div = div || this.axisDIV;
        coilWidth = coilWidth || this.coilWidth;
        doNotSmoothen = doNotSmoothen || false;
        helixSheetWidth = helixSheetWidth || this.helixSheetWidth;
        var points = {}; for (var k = 0; k < num; ++k) points[k] = [];
        var pointsCA = [];
        var prevCOArray = [];
        var bShowArray = [];
        var colors = [];
        var currentChain, currentResi, currentCA = null, currentO = null, currentColor = null, prevCoorCA = null, prevCoorO = null, prevColor = null;
        var prevCO = null, ss = null, ssend = false, atomid = null, prevAtomid = null, prevResi = null;
        var strandWidth, bSheetSegment = false, bHelixSegment = false;
        var atom, tubeAtoms = {};

        // test the first 30 atoms to see whether only C-alpha is available
        //if(!this.bCalphaOnly) {
          this.bCalphaOnly = false;

          var index = 0, testLength = 30;
          var bOtherAtoms = false;
          for(var i in atomsAdjust) {
            if(index < testLength) {
              if(atomsAdjust[i].name !== 'CA') {
                bOtherAtoms = true;
                break;
              }
            }
            else {
              break;
            }

            ++index;
          }

          if(!bOtherAtoms) {
            this.bCalphaOnly = true;
          }
        //}

        // when highlight, draw whole beta sheet and use bShowArray to show the highlight part
        var residueHash = {};
        for(var i in atomsAdjust) {
            var atom = atomsAdjust[i];

            residueid = atom.structure + '_' + atom.chain + '_' + atom.resi;
            residueHash[residueid] = 1;
        }
        var totalResidueCount = Object.keys(residueHash).length;

        var drawnResidueCount = 0;
        var highlightResiduesCount = 0;
        for (var i in atomsAdjust) {
            atom = atomsAdjust[i];
            var atomOxygen = undefined;
            if ((atom.name === 'O' || atom.name === 'CA') && !atom.het) {
                    // "CA" has to appear before "O"

                    if (atom.name === 'CA') {
                        if ( atoms.hasOwnProperty(i) && (atom.ss === 'coil' || atom.ssend || atom.ssbegin) ) {
                            tubeAtoms[i] = atom;
                        }

                        currentCA = atom.coord;
                        currentColor = atom.color;
                    }

                    if (atom.name === 'O' || (this.bCalphaOnly && atom.name === 'CA')) {
                        if(atom.name === 'O') {
                            currentO = atom.coord;
                        }
                        // smoothen each coil, helix and sheet separately. The joint residue has to be included both in the previous and next segment
                        var bSameChain = true;
                        if (currentChain !== atom.chain || currentResi + 1 !== atom.resi) {
                            bSameChain = false;
                        }

                        if(atom.ssend && atom.ss === 'sheet') {
                            bSheetSegment = true;
                        }
                        else if(atom.ssend && atom.ss === 'helix') {
                            bHelixSegment = true;
                        }

                        // assign the previous residue
                        if(prevCoorO) {
                            if(bHighlight === 1 || bHighlight === 2) {
                                colors.push(this.highlightColor);
                            }
                            else {
                                colors.push(prevColor);
                            }

                            if(ss !== 'coil' && atom.ss === 'coil') {
                                strandWidth = coilWidth;
                            }
                            else if(ssend && atom.ssbegin) { // a transition between two ss
                                strandWidth = coilWidth;
                            }
                            else {
                                strandWidth = (ss === 'coil') ? coilWidth : helixSheetWidth;
                            }

                            var O;
                            if(atom.name === 'O') {
                                O = prevCoorO.clone();
                                if(prevCoorCA !== null && prevCoorCA !== undefined) {
                                    O.sub(prevCoorCA);
                                }
                                else {
                                    prevCoorCA = prevCoorO.clone();
                                    O = new THREE.Vector3(Math.random(),Math.random(),Math.random());
                                }
                            }
                            else if(this.bCalphaOnly && atom.name === 'CA') {
                                O = new THREE.Vector3(Math.random(),Math.random(),Math.random());
                            }

                            O.normalize(); // can be omitted for performance
                            O.multiplyScalar(strandWidth);
                            if (prevCO !== null && O.dot(prevCO) < 0) O.negate();
                            prevCO = O;

                            for (var j = 0, numM1Inv2 = 2 / (num - 1); j < num; ++j) {
                                var delta = -1 + numM1Inv2 * j;
                                var v = new THREE.Vector3(prevCoorCA.x + prevCO.x * delta, prevCoorCA.y + prevCO.y * delta, prevCoorCA.z + prevCO.z * delta);
                                if (!doNotSmoothen && ss === 'sheet') v.smoothen = true;
                                points[j].push(v);
                            }

                            pointsCA.push(prevCoorCA);
                            prevCOArray.push(prevCO);

                            if(atoms.hasOwnProperty(prevAtomid)) {
                                bShowArray.push(prevResi);
                                ++highlightResiduesCount;
                            }
                            else {
                                bShowArray.push(0);
                            }

                            ++drawnResidueCount;
                        }

                        if ((atom.ssbegin || atom.ssend || (drawnResidueCount === totalResidueCount - 1) ) && points[0].length > 0 && bSameChain) {
                            // assign the current joint residue to the previous segment
                            if(bHighlight === 1 || bHighlight === 2) {
                                colors.push(this.highlightColor);
                            }
                            else {
                                colors.push(atom.color);
                            }

                            if(atom.ssend && atom.ss === 'sheet') { // current residue is the end of ss and is the end of arrow
                                strandWidth = 0; // make the arrow end sharp
                            }
                            else if(ss === 'coil' && atom.ssbegin) {
                                strandWidth = coilWidth;
                            }
                            else if(ssend && atom.ssbegin) { // current residue is the start of ss and  the previous residue is the end of ss, then use coil
                                strandWidth = coilWidth;
                            }
                            else { // use the ss from the previous residue
                                strandWidth = (atom.ss === 'coil') ? coilWidth : helixSheetWidth;
                            }

                            var O;
                            if(atom.name === 'O') {
                                O = currentO.clone();
                                O.sub(currentCA);
                            }
                            else if(this.bCalphaOnly && atom.name === 'CA') {
                                O = new THREE.Vector3(Math.random(),Math.random(),Math.random());
                            }

                            O.normalize(); // can be omitted for performance
                            O.multiplyScalar(strandWidth);
                            if (prevCO !== null && O.dot(prevCO) < 0) O.negate();
                            prevCO = O;

                            for (var j = 0, numM1Inv2 = 2 / (num - 1); j < num; ++j) {
                                var delta = -1 + numM1Inv2 * j;
                                var v = new THREE.Vector3(currentCA.x + prevCO.x * delta, currentCA.y + prevCO.y * delta, currentCA.z + prevCO.z * delta);
                                if (!doNotSmoothen && ss === 'sheet') v.smoothen = true;
                                points[j].push(v);
                            }

                            atomid = atom.serial;

                            pointsCA.push(currentCA);
                            prevCOArray.push(prevCO);

                            // when a coil connects to a sheet and the last residue of coild is highlighted, the first sheet residue is set as atom.highlightStyle. This residue should not be shown.
                            //if(atoms.hasOwnProperty(atomid) && (bHighlight === 1 && !atom.notshow) ) {
                            if(atoms.hasOwnProperty(atomid)) {
                                bShowArray.push(atom.resi);
                            }
                            else {
                                bShowArray.push(0);
                            }

                            // draw the current segment
                            for (var j = 0; !fill && j < num; ++j) {
                                if(bSheetSegment) {
                                    this.createCurveSubArrow(points[j], 1, colors, div, bHighlight, bRibbon, num, j, pointsCA, prevCOArray, bShowArray);
                                }
                                else {
                                    this.createCurveSub(points[j], 1, colors, div, bHighlight, bRibbon, false, bShowArray);
                                }
                            }
                            if (fill) {
                                if(bSheetSegment) {
                                    var start = 0, end = num - 1;
                                    this.createStripArrow(points[0], points[num - 1], colors, div, thickness, bHighlight, num, start, end, pointsCA, prevCOArray, bShowArray);
                                }
                                // else {
                                else if(bHelixSegment) {
                                    this.createStrip(points[0], points[num - 1], colors, div, thickness, bHighlight, false, bShowArray);
                                }
                                else {
                                    if(bHighlight === 2) { // draw coils only when highlighted. if not highlighted, coils will be drawn as tubes separately
                                        this.createStrip(points[0], points[num - 1], colors, div, thickness, bHighlight, false, bShowArray);
                                    }
                                }
                            }
                            for (var k = 0; k < num; ++k) points[k] = [];

                            colors = [];
                            pointsCA = [];
                            prevCOArray = [];
                            bShowArray = [];
                            bSheetSegment = false;
                            bHelixSegment = false;
                        } // end if (atom.ssbegin || atom.ssend)

                        // end of a chain
                        if ((currentChain !== atom.chain || currentResi + 1 !== atom.resi) && points[0].length > 0) {
                            for (var j = 0; !fill && j < num; ++j) {
                                if(bSheetSegment) {
                                    this.createCurveSubArrow(points[j], 1, colors, div, bHighlight, bRibbon, num, j, pointsCA, prevCOArray, bShowArray);
                                }
                                else if(bHelixSegment) {
                                    this.createCurveSub(points[j], 1, colors, div, bHighlight, bRibbon, false, bShowArray);
                                }
                            }
                            if (fill) {
                                if(bSheetSegment) {
                                    var start = 0, end = num - 1;
                                    this.createStripArrow(points[0], points[num - 1], colors, div, thickness, bHighlight, num, start, end, pointsCA, prevCOArray, bShowArray);
                                }
                                else if(bHelixSegment) {
                                    this.createStrip(points[0], points[num - 1], colors, div, thickness, bHighlight, false, bShowArray);
                                }
                            }

                            for (var k = 0; k < num; ++k) points[k] = [];
                            colors = [];
                            pointsCA = [];
                            prevCOArray = [];
                            bShowArray = [];
                            bSheetSegment = false;
                            bHelixSegment = false;
                        }

                        currentChain = atom.chain;
                        currentResi = atom.resi;
                        ss = atom.ss;
                        ssend = atom.ssend;
                        prevAtomid = atom.serial;
                        prevResi = atom.resi;

                        // only update when atom.name === 'O'
                        prevCoorCA = currentCA;
                        prevCoorO = atom.coord;
                        prevColor = currentColor;
                    } // end if (atom.name === 'O' || (this.bCalphaOnly && atom.name === 'CA') ) {
            } // end if ((atom.name === 'O' || atom.name === 'CA') && !atom.het) {
        } // end for

        this.createTube(tubeAtoms, 'CA', 0.3, bHighlight);

        tubeAtoms = {};
        points = {};
    };

    iCn3D.prototype.createStrandBrick = function (brick, color, thickness, bHighlight) {
        var num = this.strandDIV;
        var div = this.axisDIV;
        var doNotSmoothen = false;
        var helixSheetWidth = this.helixSheetWidth;

        if(bHighlight === 2) {
            thickness *= 1.5;
            helixSheetWidth *= 1.5;
        }

        var points = {}; for (var k = 0; k < num; ++k) points[k] = [];
        var colors = [];
        var prevCO = null, ss = null;
        for (var i = 0; i < 2; ++i) {
            var currentCA = brick.coords[i];

            colors.push(new THREE.Color(color));

            var O = new THREE.Vector3(brick.coords[2].x, brick.coords[2].y, brick.coords[2].z);
            O.normalize();

            O.multiplyScalar(helixSheetWidth);
            if (prevCO !== null && O.dot(prevCO) < 0) O.negate();
            prevCO = O;
            for (var j = 0, numM1Inv2 = 2 / (num - 1); j < num; ++j) {
                var delta = -1 + numM1Inv2 * j;
                var v = new THREE.Vector3(currentCA.x + prevCO.x * delta, currentCA.y + prevCO.y * delta, currentCA.z + prevCO.z * delta);
                if (!doNotSmoothen) v.smoothen = true;
                points[j].push(v);
            }
        }
        this.createStrip(points[0], points[num - 1], colors, div, thickness, bHighlight);
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createTubeSub = function (_points, colors, radii, bHighlight) {
        if (_points.length < 2) return;
        var circleDiv = this.tubeDIV, axisDiv = this.axisDIV;
        var circleDivInv = 1 / circleDiv, axisDivInv = 1 / axisDiv;
        var geo = new THREE.Geometry();
        var points_colors = this.subdivide(_points, colors, axisDiv);
        var points = points_colors[0];
        colors = points_colors[2];

        var prevAxis1 = new THREE.Vector3(), prevAxis2;
        for (var i = 0, lim = points.length; i < lim; ++i) {
            var r, idx = (i - 1) * axisDivInv;
            if (i === 0) r = radii[0];
            else {
                if (idx % 1 === 0) r = radii[idx];
                else {
                    var floored = Math.floor(idx);
                    var tmp = idx - floored;
                    r = radii[floored] * tmp + radii[floored + 1] * (1 - tmp);
                }
            }
            var delta, axis1, axis2;
            if (i < lim - 1) {
                delta = points[i].clone().sub(points[i + 1]);
                axis1 = new THREE.Vector3(0, -delta.z, delta.y).normalize().multiplyScalar(r);
                axis2 = delta.clone().cross(axis1).normalize().multiplyScalar(r);
                //      var dir = 1, offset = 0;
                if (prevAxis1.dot(axis1) < 0) {
                    axis1.negate(); axis2.negate();  //dir = -1;//offset = 2 * Math.PI / axisDiv;
                }
                prevAxis1 = axis1; prevAxis2 = axis2;
            } else {
                axis1 = prevAxis1; axis2 = prevAxis2;
            }
            for (var j = 0; j < circleDiv; ++j) {
                var angle = 2 * Math.PI * circleDivInv * j; //* dir  + offset;
                geo.vertices.push(points[i].clone().add(axis1.clone().multiplyScalar(Math.cos(angle))).add(axis2.clone().multiplyScalar(Math.sin(angle))));
            }
        }
        var offset = 0;
        for (var i = 0, lim = points.length - 1; i < lim; ++i) {
            //var c = new THREE.Color(colors[Math.round((i - 1) * axisDivInv)]);
            var c = new THREE.Color(colors[i]);

            var reg = 0;
            var r1 = geo.vertices[offset].clone().sub(geo.vertices[offset + circleDiv]).lengthSq();
            var r2 = geo.vertices[offset].clone().sub(geo.vertices[offset + circleDiv + 1]).lengthSq();
            if (r1 > r2) { r1 = r2; reg = 1; };
            for (var j = 0; j < circleDiv; ++j) {
                geo.faces.push(new THREE.Face3(offset + j, offset + (j + reg) % circleDiv + circleDiv, offset + (j + 1) % circleDiv, undefined, c));
                geo.faces.push(new THREE.Face3(offset + (j + 1) % circleDiv, offset + (j + reg) % circleDiv + circleDiv, offset + (j + reg + 1) % circleDiv + circleDiv, undefined, c));
            }
            offset += circleDiv;
        }
        geo.computeFaceNormals();
        geo.computeVertexNormals(false);

        var mesh;
        if(bHighlight === 2) {
          mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));
        }
        else if(bHighlight === 1) {
          mesh = new THREE.Mesh(geo, this.matShader);
        }
        else {
          mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));
        }

        this.mdl.add(mesh);
        if(bHighlight === 1 || bHighlight === 2) {
            this.prevHighlightObjects.push(mesh);
        }
        else {
            this.objects.push(mesh);
        }
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createTube = function (atoms, atomName, radius, bHighlight) {
        var points = [], colors = [], radii = [];
        var currentChain, currentResi;
        var index = 0;
        for (var i in atoms) {
            var atom = atoms[i];
            if ((atom.name === atomName) && !atom.het) {
                if (index > 0 && (currentChain !== atom.chain || currentResi + 1 !== atom.resi) ) {
                    if(bHighlight !== 2) this.createTubeSub(points, colors, radii, bHighlight);
                    points = []; colors = []; radii = [];
                }
                points.push(atom.coord);

                radii.push(radius || (atom.b > 0 ? atom.b * 0.01 : 0.3));
                colors.push(atom.color);

                currentChain = atom.chain;
                currentResi = atom.resi;

                var scale = 1.2;
                if(bHighlight === 2 && !atom.ssbegin) {
                    this.createBox(atom, undefined, undefined, scale, undefined, bHighlight);
                }

                ++index;
            }
        }
        if(bHighlight !== 2) this.createTubeSub(points, colors, radii, bHighlight);
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createCylinderHelix = function (atoms, radius, bHighlight) {
        var start = null;
        var currentChain, currentResi;
        var others = {}, beta = {};
        var i;
        for (i in atoms) {
            var atom = atoms[i];
            if (atom.het) continue;
            if ((atom.ss !== 'helix' && atom.ss !== 'sheet') || atom.ssend || atom.ssbegin) others[atom.serial] = atom;
            if (atom.ss === 'sheet') beta[atom.serial] = atom;
            if (atom.name !== 'CA') continue;
            if (atom.ss === 'helix' && atom.ssend) {
                if (start !== null && currentChain === atom.chain && currentResi < atom.resi) {
                    if(bHighlight === 1 || bHighlight === 2) {
                        this.createCylinder(start.coord, atom.coord, radius, this.highlightColor, bHighlight);
                    }
                    else {
                        this.createCylinder(start.coord, atom.coord, radius, atom.color);
                    }
                }

                start = null;
            }

            if (start === null && atom.ss === 'helix' && atom.ssbegin) {
                start = atom;

                currentChain = atom.chain;
                currentResi = atom.resi;
            }
        }

        if(bHighlight === 1 || bHighlight === 2) {
            if(Object.keys(others).length > 0) this.createTube(others, 'CA', 0.3, bHighlight);
            if(Object.keys(beta).length > 0) this.createStrand(beta, undefined, undefined, true, 0, this.helixSheetWidth, false, this.thickness * 2, bHighlight);
        }
        else {
            if(Object.keys(others).length > 0) this.createTube(others, 'CA', 0.3);
            if(Object.keys(beta).length > 0) this.createStrand(beta, undefined, undefined, true, 0, this.helixSheetWidth, false, this.thickness * 2);
        }
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createSurfaceRepresentation = function (atoms, type, wireframe, opacity) {
        var geo;

        var extent = this.getExtent(atoms);

        // surface from 3Dmol
        var distance = 5; // consider atom 5 angstrom from the selected atoms

        var extendedAtoms = [];

        if(this.bConsiderNeighbors) {
            extendedAtoms = Object.keys(this.unionHash(atoms, this.getAtomsWithinAtom(this.atoms, atoms, distance)));
        }
        else {
            extendedAtoms = Object.keys(atoms);
        }

        var ps = $3Dmol.SetupSurface({
            extent: extent,
            allatoms: this.atoms,
            atomsToShow: Object.keys(atoms),
            extendedAtoms: extendedAtoms,
            type: type
        });

        var verts = ps.vertices;
        var faces = ps.faces;

        var me = this;

        geo = new THREE.Geometry();
        geo.vertices = verts.map(function (v) {
            var r = new THREE.Vector3(v.x, v.y, v.z);
            r.atomid = v.atomid;
            return r;
        });
        geo.faces = faces.map(function (f) {
            return new THREE.Face3(f.a, f.b, f.c);
        });

        // remove the reference
        ps = null;
        verts = null;
        faces = null;

        geo.computeFaceNormals();
        geo.computeVertexNormals(false);

        geo.colorsNeedUpdate = true;

        geo.faces.forEach(function (f) {
            f.vertexColors = ['a', 'b', 'c' ].map(function (d) {
                var atomid = geo.vertices[f[d]].atomid;
                return me.atoms[atomid].color;
            });
        });
        var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ overdraw: me.overdraw,
            vertexColors: THREE.VertexColors,
            wireframe: wireframe,
            opacity: opacity,
            transparent: true,
        }));
        me.mdl.add(mesh);

        this.prevSurfaces.push(mesh);

        // remove the reference
        geo = null;

        // do not add surface to raycasting objects for picking
    };

    // modified from GLmol (http://webglmol.osdn.jp/index-en.html)
    iCn3D.prototype.drawNucleicAcidStick = function(atomlist, bHighlight) {
       var currentChain, currentResi, start = null, end = null;
       var i;

       for (i in atomlist) {
          var atom = atomlist[i];
          if (atom === undefined || atom.het) continue;

          if (atom.resi !== currentResi || atom.chain !== currentChain) {
             if (start !== null && end !== null) {
                this.createCylinder(new THREE.Vector3(start.coord.x, start.coord.y, start.coord.z),
                                  new THREE.Vector3(end.coord.x, end.coord.y, end.coord.z), 0.3, start.color, bHighlight);
             }
             start = null; end = null;
          }
          if (atom.name === 'O3\'' || atom.name === 'O3*') start = atom;
          if (atom.resn === '  A' || atom.resn === '  G' || atom.resn === ' DA' || atom.resn === ' DG') {
             if (atom.name === 'N1')  end = atom; //  N1(AG), N3(CTU)
          } else if (atom.name === 'N3') {
             end = atom;
          }
          currentResi = atom.resi; currentChain = atom.chain;
       }
       if (start !== null && end !== null)
          this.createCylinder(new THREE.Vector3(start.coord.x, start.coord.y, start.coord.z),
                            new THREE.Vector3(end.coord.x, end.coord.y, end.coord.z), 0.3, start.color, bHighlight);
    };

    iCn3D.prototype.isPhosphorusOnly = function(atomlist) {
          var bPhosphorusOnly = false;

          var index = 0, testLength = 30;
          var bOtherAtoms = false;
          for(var i in atomlist) {
            if(index < testLength) {
              if(atomlist[i].name !== 'P') {
                bOtherAtoms = true;
                break;
              }
            }
            else {
              break;
            }

            ++index;
          }

          if(!bOtherAtoms) {
            bPhosphorusOnly = true;
          }

          return bPhosphorusOnly;
    };

    // modified from GLmol (http://webglmol.osdn.jp/index-en.html)
    iCn3D.prototype.drawCartoonNucleicAcid = function(atomlist, div, thickness, bHighlight) {
       this.drawStrandNucleicAcid(atomlist, 2, div, true, undefined, thickness, bHighlight);
    };

    // modified from GLmol (http://webglmol.osdn.jp/index-en.html)
    iCn3D.prototype.drawStrandNucleicAcid = function(atomlist, num, div, fill, nucleicAcidWidth, thickness, bHighlight) {
       if(bHighlight === 2) {
           num = undefined;
           thickness = undefined;
       }

       nucleicAcidWidth = nucleicAcidWidth || this.nucleicAcidWidth;
       div = div || this.axisDIV;
       num = num || this.nucleicAcidStrandDIV;
       var i, j, k;
       var points = []; for (k = 0; k < num; k++) points[k] = [];
       var colors = [];
       var currentChain, currentResi, currentO3;
       var prevOO = null;

       for (i in atomlist) {
          var atom = atomlist[i];
          if (atom === undefined) continue;

          if ((atom.name === 'O3\'' || atom.name === 'OP2' || atom.name === 'O3*' || atom.name === 'O2P') && !atom.het) {
             if (atom.name === 'O3\'' || atom.name === 'O3*') { // to connect 3' end. FIXME: better way to do?
                if (currentChain !== atom.chain || currentResi + 1 !== atom.resi) {
                   if (currentO3 && prevOO) {
                      for (j = 0; j < num; j++) {
                         var delta = -1 + 2 / (num - 1) * j;
                         points[j].push(new THREE.Vector3(currentO3.x + prevOO.x * delta,
                          currentO3.y + prevOO.y * delta, currentO3.z + prevOO.z * delta));
                      }
                   }
                   if (fill) this.createStrip(points[0], points[1], colors, div, thickness, bHighlight);
                   for (j = 0; !thickness && j < num; j++)
                      this.createCurveSub(points[j], 1 ,colors, div, bHighlight);
                   var points = []; for (k = 0; k < num; k++) points[k] = [];
                   colors = [];
                   prevOO = null;
                }
                currentO3 = new THREE.Vector3(atom.coord.x, atom.coord.y, atom.coord.z);
                currentChain = atom.chain;
                currentResi = atom.resi;
                if(bHighlight === 1 || bHighlight === 2) {
                    colors.push(this.highlightColor);
                }
                else {
                    colors.push(atom.color);
                }

             }
             else if (atom.name === 'OP2' || atom.name === 'O2P') {
                if (!currentO3) {prevOO = null; continue;} // for 5' phosphate (e.g. 3QX3)
                var O = new THREE.Vector3(atom.coord.x, atom.coord.y, atom.coord.z);
                O.sub(currentO3);
                O.normalize().multiplyScalar(nucleicAcidWidth);  // TODO: refactor
                //if (prevOO !== undefined && O.dot(prevOO) < 0) {
                if (prevOO !== null && O.dot(prevOO) < 0) {
                   O.negate();
                }
                prevOO = O;
                for (j = 0; j < num; j++) {
                   var delta = -1 + 2 / (num - 1) * j;
                   points[j].push(new THREE.Vector3(currentO3.x + prevOO.x * delta,
                     currentO3.y + prevOO.y * delta, currentO3.z + prevOO.z * delta));
                }
                currentO3 = null;
             }
          }
       }

       if (currentO3 && prevOO) {
          for (j = 0; j < num; j++) {
             var delta = -1 + 2 / (num - 1) * j;
             points[j].push(new THREE.Vector3(currentO3.x + prevOO.x * delta,
               currentO3.y + prevOO.y * delta, currentO3.z + prevOO.z * delta));
          }
       }
       if (fill) this.createStrip(points[0], points[1], colors, div, thickness, bHighlight);
       for (j = 0; !thickness && j < num; j++)
          this.createCurveSub(points[j], 1 ,colors, div, bHighlight);
    };

    iCn3D.prototype.drawSymmetryMates2 = function() {
       if (this.biomtMatrices === undefined) return;
       var cnt = 1; // itself
       var centerSum = this.center.clone();

       for (var i = 0; i < this.biomtMatrices.length; i++) {  // skip itself
          var mat = this.biomtMatrices[i];
          if (mat === undefined) continue;

          var matArray = mat.toArray();

          // skip itself
          var bItself = 1;
          for(var j = 0, jl = matArray.length; j < jl; ++j) {
            if(j == 0 || j == 5 || j == 10) {
              if(parseInt(1000*matArray[j]) != 1000) bItself = 0;
            }
            else if(j != 0 && j != 5 && j != 10 && j != 15) {
              if(parseInt(1000*matArray[j]) != 0) bItself = 0;
            }
          }

          if(bItself) continue;

          var symmetryMate = this.mdl.clone();
          symmetryMate.applyMatrix(mat);

          var center = this.center.clone();
          center.applyMatrix4(mat);
          centerSum.add(center);

          this.mdl.add(symmetryMate);

          ++cnt;
       }

       this.maxD *= Math.sqrt(cnt);
       //this.center = centerSum.multiplyScalar(1.0 / cnt);

       this.mdl.position.add(this.center).sub(centerSum.multiplyScalar(1.0 / cnt));

       // reset cameara
       this.setCamera();
    };

    // modified from 3Dmol (http://3dmol.csb.pitt.edu/)
    // new: http://stackoverflow.com/questions/23514274/three-js-2d-text-sprite-labels
    // old: http://stemkoski.github.io/Three.js/Sprite-Text-Labels.html
    iCn3D.prototype.makeTextSprite = function ( message, parameters ) {

        if ( parameters === undefined ) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";
        var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 18;

        var a = parameters.hasOwnProperty("alpha") ? parameters["alpha"] : 1.0;

        var bBkgd = true;
        var bSchematic = false;
        if(parameters.hasOwnProperty("bSchematic") &&  parameters["bSchematic"]) {
            bSchematic = true;

            fontsize = 40;
        }

        var backgroundColor, borderColor, borderThickness;
        if(parameters.hasOwnProperty("backgroundColor") &&  parameters["backgroundColor"] !== undefined) {
            backgroundColor = this.hexToRgb(parameters["backgroundColor"], a);

            borderColor = parameters.hasOwnProperty("borderColor") ? this.hexToRgb(parameters["borderColor"], a) : { r:0, g:0, b:0, a:1.0 };
            borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 4;
        }
        else {
            bBkgd = false;
            backgroundColor = undefined;
            borderColor = undefined;
            borderThickness = 0;
        }

        var textAlpha = 1.0;
        var textColor = parameters.hasOwnProperty("textColor") &&  parameters["textColor"] !== undefined ? this.hexToRgb(parameters["textColor"], textAlpha) : { r:255, g:255, b:0, a:1.0 };

        var canvas = document.createElement('canvas');

        var context = canvas.getContext('2d');

        context.font = "Bold " + fontsize + "px " + fontface;

        var metrics = context.measureText( message );

        var textWidth = metrics.width;

        var width = textWidth + 2*borderThickness;
        var height = fontsize + 2*borderThickness;

        if(bSchematic) {
            if(width > height) {
                height = width;
            }
            else {
                width = height;
            }
        }

        var textLengthThreshold = 6;
        var factor = 15 * this.maxD / 100;

        // define width and height will make long text be squashed, but make the label to appear at the exact location
        if(bSchematic || message.length <= textLengthThreshold) {
            canvas.width = width;
            canvas.height = height;

            factor = 3 * this.maxD / 100;
        }

        context.clearRect(0, 0, width, height);

        var radius = context.measureText( "M" ).width;

        if(bBkgd) {
            // background color
            context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
            // border color
            context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

            context.lineWidth = borderThickness;

            if(bSchematic) {
                var r = width * 0.35;
                this.circle(context, 0, 0, width, height, r);
            }
            else {
                //var r = radius * 0.3;
                var r = (message.length <= textLengthThreshold) ? height * 0.5 : 0;
                this.roundRect(context, 0, 0, width, height, r);
            }
        }

        // need to redefine again
        context.font = "Bold " + fontsize + "px " + fontface;

        context.textAlign = "center";
        context.textBaseline = "middle";

        context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
        context.strokeStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";

        context.fillText( message, width * 0.5, height * 0.5);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas)
        texture.needsUpdate = true;

        var frontOfTarget = true;
        //var spriteMaterial = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false } );
        var spriteMaterial = new THREE.SpriteMaterial( {
            map: texture,
            useScreenCoordinates: false,
            depthTest: !frontOfTarget,
            depthWrite: !frontOfTarget
        } );

        var sprite = new THREE.Sprite( spriteMaterial );

        var expandWidthFactor = 1.5;
        if(bSchematic) {
            sprite.scale.set(factor, factor, 1.0);
        }
        else {
            sprite.scale.set(expandWidthFactor * factor, factor, 1.0);
        }

        return sprite;
    };

    // function for drawing rounded rectangles
    iCn3D.prototype.roundRect = function (ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.lineTo(x+w-r, y);
        ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h-r);
        ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
        ctx.lineTo(x+r, y+h);
        ctx.quadraticCurveTo(x, y+h, x, y+h-r);
        ctx.lineTo(x, y+r);
        ctx.quadraticCurveTo(x, y, x+r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    iCn3D.prototype.circle = function (ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.arc(x+w/2, y+h/2, r, 0, 2*Math.PI, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    iCn3D.prototype.createLabelRepresentation = function (labels) {
        for(var name in labels) {
            var labelArray = labels[name];

            for (var i = 0, il = labelArray.length; i < il; ++i) {
                var label = labelArray[i];
                // make sure fontsize is a number

                var labelsize = (label.size !== undefined) ? label.size : this.LABELSIZE;
                var labelcolor = (label.color !== undefined) ? label.color : '#ffff00';
                var labelbackground = (label.background !== undefined) ? label.background : '#cccccc';
                var labelalpha = (label.alpha !== undefined) ? label.alpha : 1.0;
                // if label.background is undefined, no background will be drawn
                labelbackground = label.background;

                if(labelcolor !== undefined && labelbackground !== undefined && labelcolor.toLowerCase() === labelbackground.toLowerCase()) {
                    labelcolor = "#888888";
                }

                var bb;
                if(label.bSchematic !== undefined && label.bSchematic) {
                    var bLigandInProtein = false;
                    if(Object.keys(this.proteins).length + Object.keys(this.nucleotides).length > 0) {
                        var firstAtom = this.getFirstAtomObj(this.highlightAtoms);
                        if(this.ligands.hasOwnProperty(firstAtom.serial)) {
                            bLigandInProtein = true;
                        }
                    }

                    var tmpMaxD = this.maxD;
                    if(bLigandInProtein) {
                        this.maxD = 50;
                        this.setCamera();
                    }

                    bb = this.makeTextSprite(label.text, {fontsize: parseInt(labelsize), textColor: labelcolor, borderColor: labelbackground, backgroundColor: labelbackground, alpha: labelalpha, bSchematic: 1});

                    if(bLigandInProtein) {
                        this.maxD = tmpMaxD;
                        this.setCamera();
                    }
                }
                else {
                    bb = this.makeTextSprite(label.text, {fontsize: parseInt(labelsize), textColor: labelcolor, borderColor: labelbackground, backgroundColor: labelbackground, alpha: labelalpha, bSchematic: 0});
                }

                bb.position.set(label.position.x, label.position.y, label.position.z);
                this.mdl.add(bb);
                // do not add labels to objects for picking
            }
        }
    };

    // http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/
    iCn3D.prototype.buildAxes = function (radius) {
        var axes = new THREE.Object3D();

        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0 + radius, 0, 0 ), 0xFF0000, false, 0.5 ) ); // +X
        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0 - radius, 0, 0 ), 0x800000, true, 0.5) ); // -X

        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0 + radius, 0 ), 0x00FF00, false, 0.5 ) ); // +Y
        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0 - radius, 0 ), 0x008000, true, 0.5 ) ); // -Y

        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 + radius ), 0x0000FF, false, 0.5 ) ); // +Z
        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 - radius ), 0x000080, true, 0.5 ) ); // -Z

        this.scene.add( axes );
    };

    iCn3D.prototype.createSingleLine = function ( src, dst, colorHex, dashed, dashSize ) {
        var geom = new THREE.Geometry();
        var mat;

        if(dashed) {
            mat = new THREE.LineDashedMaterial({ linewidth: 1, color: colorHex, dashSize: dashSize, gapSize: 0.5*dashSize });
        } else {
            mat = new THREE.LineBasicMaterial({ linewidth: 1, color: colorHex });
        }

        geom.vertices.push( src );
        geom.vertices.push( dst );
        if(dashed) geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

        var axis = new THREE.Line( geom, mat, THREE.LinePieces );

        return axis;
    };

    iCn3D.prototype.drawHelixBrick = function(molid2ss, molid2color, bHighlight) {
        for(var molid in molid2ss) {
          for(var j = 0, jl = molid2ss[molid].length; j < jl; ++j) {
            if(molid2ss[molid][j].type === 'helix') {
              var radius = 1.6;
              var color = new THREE.Color(molid2color[molid]);

              var p0 = new THREE.Vector3(molid2ss[molid][j].coords[0].x, molid2ss[molid][j].coords[0].y, molid2ss[molid][j].coords[0].z);
              var p1 = new THREE.Vector3(molid2ss[molid][j].coords[1].x, molid2ss[molid][j].coords[1].y, molid2ss[molid][j].coords[1].z);

              this.createCylinder(p0, p1, radius, color, bHighlight);
            }

            else if(molid2ss[molid][j].type === 'brick') {
              // the original bricks are very thin

              // create strands with any width and thickness
              var brick = molid2ss[molid][j];
              var color = molid2color[molid];
              this.createStrandBrick(brick, color, this.thickness, bHighlight);
            }
            else if(molid2ss[molid][j].type === 'coil') {
                 var points = [], colors = [], radii = [];

                 var p0 = new THREE.Vector3(molid2ss[molid][j].coords[0].x, molid2ss[molid][j].coords[0].y, molid2ss[molid][j].coords[0].z);
                 var p1 = new THREE.Vector3(molid2ss[molid][j].coords[1].x, molid2ss[molid][j].coords[1].y, molid2ss[molid][j].coords[1].z);

                 var color = new THREE.Color(molid2color[molid]);

                 var line = this.createSingleLine( p0, p1, color, false);
                 this.mdl.add(line);
                 this.objects.push(line);
            }
          } // inner for
        } // outer for
    };

