/*! icn3d.js
 * Mainly based on iview. Drawing cartoon of nucleotides is from GLmol. Surface generation and labeling are from 3Dmol. All these functions are labeled with the source names.
 * @author Jiyao Wang / https://github.com/ncbi/icn3d
 *
 * iCn3D has been developed based on iview (http://istar.cse.cuhk.edu.hk/iview/). The following new features has been added so far.
 * 1. Allowed users to pick atoms, both in perspective and orthographics camera. To make this work, the methods of rotation, translation and zooming have been dramatically changed and used libraries from three.js. The picking allows users to pick atoms, add labels, choose a new rotation center, etc.
 * 2. Allowed users to select residues based on structure, chain, sequence, etc. Users can also define their own subset and save the selection.
 * 3. Used THREE.MeshPhongMaterial to make surface shiny.
 * 4. Improved the labeling mechanism.
 * 5. Enabled to save the current state and open the state later. This is done by saving the comand history. Thus users can also go backward or forward to different states.
 * 6. Two kind of highlight mechanisms were provided: 2D outline or 3D objects.
 * 7. Added arrows to the end of beta sheets.
 * 8. Commands can be added to urls to show the final display.
 * 9. 3D structure correlates with sequence window.
 * 10. Added double bonds and triple bonds display for chemicals.
 * 11. An interactive UI was provided for all these features.
 *
 * iCn3D used the following standard libraries. We can easily adopt the new versions of these libraries.
 * 1. jquery and jquery ui. Jquery ui is used for show the menu at the top.
 * 2. Recent version of Three.js.
 *
 * Files in #3-9 are combined in one file: full_ui_all.min.js.
 *
 * 3. The rotation, translation operation libraries from Three.js: TrackballControls.js and OrthographicTrackballControls.js.
 * 4. Projector.js from Three.js for the picking.
 * 5. Canvas render library: CanvasRenderer.js. This is used when WebGL render is no working in the browser.
 * 6. A library to detect whether WebGL is working in the browser: Detector.js.
 * 7. The surface generation of 3Dmol (http://3dmol.csb.pitt.edu/): marchingcube.js, ProteinSurface4.js, and setupsurface.js.
 * 8. The 3D drawing library: icn3d.js
 * 9. Advanced UI library for iCn3D: full_ui.js.
 */

if (typeof jQuery === 'undefined') { throw new Error('iCn3D requires jQuery') }

var iCn3D = function (id) {
    this.REVISION = '1.3';
    this.id = id;

    this.container = $('#' + id);

    this.overdraw = 0;

    this.bDrawn = false;

    this.bSecondaryStructure = false;

    this.bHighlight = 1; // undefined: no highlight, 1: highlight by outline, 2: highlight by 3D object

    this.ALTERNATE_STRUCTURE = -1;

    if(Detector.webgl){
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container.get(0),
            antialias: true,
            preserveDrawingBuffer: true
        });

        this.overdraw = 0;
    }
    else {
        alert("Currently your web browser has a problem on WebGL, and CanvasRenderer instead of WebGLRenderer is used. If you are using Chrome, open a new tab for the same URL and WebGL may work again.");

        this.renderer = new THREE.CanvasRenderer({
            canvas: this.container.get(0)
        });

        //http://threejs.org/docs/api/materials/Material.html
        this.overdraw = 0.5;

        // only WebGL support outlines using ShaderMaterial
        this.bHighlight = 2;
    }

    this.matShader = this.setOutlineColor('yellow');
    this.fractionOfColor = new THREE.Color(0.1, 0.1, 0.1);


    // adjust the size
    this.WIDTH = this.container.width(), this.HEIGHT = this.container.height();
    this.setWidthHeight(this.WIDTH, this.HEIGHT);

    this.axis = false;  // used to turn on and off xyz axes

    // picking
    this.picking = 1; // 0: no picking, 1: picking on atoms, 2: picking on residues, 3: picking on strand/helix/coil
    this.highlightlevel = 1; // 1: highlight on atoms, 2: highlight on residues, 3: highlight on strand/helix/coil 4: highlight on chain 5: highlight on structure

    this.pickpair = false; // used for picking pair of atoms for label and distance
    this.pickedatomNum = 0;

    this.pickedatom = undefined;
    this.pickedatom2 = undefined;

    this.bCtrlKey = false; // if true, union selection on sequence window or on 3D structure
    this.bShiftKey = false; // if true, select a range on 3D structure

    this.bStopRotate = false; // by default, do not stop the possible automatic rotation
    this.bCalphaOnly = false; // by default the input has both Calpha and O, used for drawing strands. If atoms have Calpha only, the orientation of the strands is random
    this.bSSOnly = false; // a flag to turn on when only helix and bricks are available to draw 3D diagram

    this.bAllAtoms = true; // no need to adjust atom for strand style

    this.bConsiderNeighbors = false; // a flag to show surface considering the neighboring atoms or not

    this.bShowCrossResidueBond = false;

    this.effects = {
        //'anaglyph': new THREE.AnaglyphEffect(this.renderer),
        //'parallax barrier': new THREE.ParallaxBarrierEffect(this.renderer),
        //'oculus rift': new THREE.OculusRiftEffect(this.renderer),
        //'stereo': new THREE.StereoEffect(this.renderer),
        'none': this.renderer
    };

    this.maxD = 500; // size of the molecule
    this.oriMaxD = this.maxD; // size of the molecule
    //this.camera_z = -150;

    this.camera_z = this.maxD * 2; // when zooming in, it gets dark if the camera is in front
    //this.camera_z = -this.maxD * 2;

    // these variables will not be cleared for each structure
    this.commands = []; // a list of commands, ordered by the operation steps. Each operation will be converted into a command. this command list can be used to go backward and forward.
    this.optionsHistory = []; // a list of options corresponding to this.commands.
    this.logs = []; // a list of comands and other logs, ordered by the operation steps.

    this.bRender = true; // a flag to turn off rendering when loading state file

    // Default values
    this.highlightColor = new THREE.Color(0xFFFF00);

    this.sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 32, 1);
    this.cylinderGeometryOutline = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true);
    this.sphereRadius = 1.5;
    this.cylinderRadius = 0.4;
    this.linewidth = 1;
    this.curveWidth = 3;
    this.helixSheetWidth = 1.3;
    this.coilWidth = 0.3;
    this.thickness = 0.4;
    this.axisDIV = 5; // 3
    this.strandDIV = 6;
    this.tubeDIV = 8;

    this.LABELSIZE = 40;

    this.nucleicAcidStrandDIV = 6; //4;
    this.nucleicAcidWidth = 0.8;

    this.options = {
        camera: 'perspective',
        background: 'black',
        color: 'spectrum',
        sidechains: 'nothing',
        proteins: 'cylinder and plate',
        surface: 'nothing',
        wireframe: 'no',
        opacity: '0.8',
        ligands: 'stick',
        water: 'nothing',
        ions: 'sphere',
        //labels: 'no',
        //effect: 'none',
        hbonds: 'no',
        ssbonds: 'no',
        //ncbonds: 'no',
        labels: 'no',
        lines: 'no',
        rotationcenter: 'molecule center',
        axis: 'no',
        fog: 'no',
        slab: 'no',
        picking: 'residue',
        nucleotides: 'nucleotide cartoon'
    };

    this._zoomFactor = 1.0;
    this.mouseChange = new THREE.Vector2(0,0);
    this.quaternion = new THREE.Quaternion(0,0,0,1);

    var me = this;
    this.container.bind('contextmenu', function (e) {
        e.preventDefault();
    });

    me.switchHighlightLevel();

    // key event has to use the document because it requires the focus
    me.typetext = false;

    //http://unixpapa.com/js/key.html
    $(document).bind('keyup', function (e) {
      if(e.keyCode === 16) { // shiftKey
          me.bShiftKey = false;
      }
      if(e.keyCode === 17 || e.keyCode === 224 || e.keyCode === 91) { // ctrlKey or apple command key
          me.bCtrlKey = false;
      }
    });

    $(document).bind('keydown', function (e) {
      if(e.shiftKey || e.keyCode === 16) {
          me.bShiftKey = true;
      }
      if(e.ctrlKey || e.keyCode === 17 || e.keyCode === 224 || e.keyCode === 91) {
          me.bCtrlKey = true;
      }

      if (!me.controls) return;

      me.bStopRotate = true;

      $('input, textarea').focus(function() {
        me.typetext = true;
      });

      $('input, textarea').blur(function() {
        me.typetext = false;
      });

      if(!me.typetext) {
        // zoom
        if(e.keyCode === 90 ) { // Z
          var para = {};

          if(me.camera === me.perspectiveCamera) { // perspective
            para._zoomFactor = 0.9;
          }
          else if(me.camera === me.orthographicCamera) {  // orthographics
            if(me._zoomFactor < 0.1) {
              me._zoomFactor = 0.1;
            }
            else if(me._zoomFactor > 1) {
              me._zoomFactor = 1;
            }

            para._zoomFactor = me._zoomFactor * 0.9;
            if(para._zoomFactor < 0.1) para._zoomFactor = 0.1;
          }

          para.update = true;
          me.controls.update(para);
          me.render();
        }
        else if(e.keyCode === 88 ) { // X
          var para = {};

          if(me.camera === me.perspectiveCamera) { // perspective
            para._zoomFactor = 1.1;
          }
          else if(me.camera === me.orthographicCamera) {  // orthographics
            if(me._zoomFactor > 20) {
              me._zoomFactor = 20;
            }
            else if(me._zoomFactor < 1) {
              me._zoomFactor = 1;
            }

            para._zoomFactor = me._zoomFactor * 1.03;
            if(para._zoomFactor > 20) para._zoomFactor = 20;
          }

          para.update = true;
          me.controls.update(para);
          me.render();
        }

        // rotate
        else if(e.keyCode === 76 ) { // L, rotate left
          var axis = new THREE.Vector3(0,1,0);
          var angle = -5.0 / 180.0 * Math.PI;

          axis.applyQuaternion( me.camera.quaternion ).normalize();

          var quaternion = new THREE.Quaternion();
          quaternion.setFromAxisAngle( axis, -angle );

          var para = {};
          para.quaternion = quaternion;
          para.update = true;

          me.controls.update(para);
          me.render();
        }
        else if(e.keyCode === 74 ) { // J, rotate right
          var axis = new THREE.Vector3(0,1,0);
          var angle = 5.0 / 180.0 * Math.PI;

          axis.applyQuaternion( me.camera.quaternion ).normalize();

          var quaternion = new THREE.Quaternion();
          quaternion.setFromAxisAngle( axis, -angle );

          var para = {};
          para.quaternion = quaternion;
          para.update = true;

          me.controls.update(para);
          me.render();
        }
        else if(e.keyCode === 73 ) { // I, rotate up
          var axis = new THREE.Vector3(1,0,0);
          var angle = -5.0 / 180.0 * Math.PI;

          axis.applyQuaternion( me.camera.quaternion ).normalize();

          var quaternion = new THREE.Quaternion();
          quaternion.setFromAxisAngle( axis, -angle );

          var para = {};
          para.quaternion = quaternion;
          para.update = true;

          me.controls.update(para);
          me.render();
        }
        else if(e.keyCode === 77 ) { // M, rotate down
          var axis = new THREE.Vector3(1,0,0);
          var angle = 5.0 / 180.0 * Math.PI;

          axis.applyQuaternion( me.camera.quaternion ).normalize();

          var quaternion = new THREE.Quaternion();
          quaternion.setFromAxisAngle( axis, -angle );

          var para = {};
          para.quaternion = quaternion;
          para.update = true;

          me.controls.update(para);
          me.render();
        }

        else if(e.keyCode === 65 ) { // A, alternate
           me.alternateStructures();
        }

      }
    });

    this.container.bind('mouseup touchend', function (e) {
        me.isDragging = false;
    });
    this.container.bind('mousedown touchstart', function (e) {
        e.preventDefault();

        if (!me.scene) return;

        me.bStopRotate = true;

        var x = e.pageX, y = e.pageY;
        if (e.originalEvent.targetTouches && e.originalEvent.targetTouches[0]) {
            x = e.originalEvent.targetTouches[0].pageX;
            y = e.originalEvent.targetTouches[0].pageY;
        }
        me.isDragging = true;

        // see ref http://soledadpenades.com/articles/three-js-tutorials/object-picking/
        if(me.picking && (e.altKey || e.ctrlKey || e.shiftKey || e.keyCode === 18 || e.keyCode === 16 || e.keyCode === 17 || e.keyCode === 224 || e.keyCode === 91) ) {
            me.highlightlevel = me.picking;

            me.mouse.x = ( (x - me.container.offset().left) / me.container.width() ) * 2 - 1;
            me.mouse.y = - ( (y - me.container.offset().top) / me.container.height() ) * 2 + 1;

            var mouse3 = new THREE.Vector3();
            mouse3.x = me.mouse.x;
            mouse3.y = me.mouse.y;
            //mouse3.z = 0.5;
            if(this.camera_z > 0) {
              mouse3.z = -1.0; // between -1 to 1. The z positio of mouse in the real world should be between the camera and the target."-1" worked in our case.
            }
            else {
              mouse3.z = 1.0; // between -1 to 1. The z positio of mouse in the real world should be between the camera and the target."-1" worked in our case.
            }

            // similar to setFromCamera() except mouse3.z is the opposite sign from the value in setFromCamera()
            if(me.camera === me.perspectiveCamera) { // perspective
                if(this.camera_z > 0) {
                  mouse3.z = -1.0;
                }
                else {
                  mouse3.z = 1.0;
                }
                //me.projector.unprojectVector( mouse3, me.camera );  // works for all versions
                mouse3.unproject(me.camera );  // works for all versions
                me.raycaster.set(me.camera.position, mouse3.sub(me.camera.position).normalize()); // works for all versions
            }
            else if(me.camera === me.orthographicCamera) {  // orthographics
                if(this.camera_z > 0) {
                  mouse3.z = 1.0;
                }
                else {
                  mouse3.z = -1.0;
                }
                //me.projector.unprojectVector( mouse3, me.camera );  // works for all versions
                mouse3.unproject(me.camera );  // works for all versions
                me.raycaster.set(mouse3, new THREE.Vector3(0,0,-1).transformDirection( me.camera.matrixWorld )); // works for all versions
            }

            var intersects = me.raycaster.intersectObjects( me.objects ); // not all "mdl" group will be used for picking
            if ( intersects.length > 0 ) {
                // the intersections are sorted so that the closest point is the first one.
                intersects[ 0 ].point.sub(me.mdl.position); // mdl.position was moved to the original (0,0,0) after reading the molecule coordinates. The raycasting was done based on the original. The positio of the ooriginal should be substracted.

                var threshold = 0.5;
                var atom = me.getAtomsFromPosition(intersects[ 0 ].point, threshold); // the second parameter is the distance threshold. The first matched atom will be returned. Use 1 angstrom, not 2 angstrom. If it's 2 angstrom, other atom will be returned.

                while(!atom && threshold < 10) {
                    threshold = threshold + 0.5;
                    atom = me.getAtomsFromPosition(intersects[ 0 ].point, threshold);
                }

                if(atom) {
                    if(me.pickpair) {
                      if(me.pickedatomNum % 2 === 0) {
                        me.pickedatom = atom;
                      }
                      else {
                        me.pickedatom2 = atom;
                      }

                      ++me.pickedatomNum;
                    }
                    else {
                      me.pickedatom = atom;
                    }

                      me.showPicking(atom);
                }
                else {
                    console.log("No atoms were found in 10 andstrom range");
                }
            } // end if
        }

        me.controls.handleResize();
        me.controls.update();
        me.render();
    });
    this.container.bind('mousemove touchmove', function (e) {
        e.preventDefault();
        if (!me.scene) return;
        // no action when no mouse button is clicked and no key was down
        if (!me.isDragging) return;

        me.controls.handleResize();
        me.controls.update();
        me.render();
    });
    this.container.bind('mousewheel', function (e) {
        e.preventDefault();
        if (!me.scene) return;

        me.bStopRotate = true;

        me.controls.handleResize();
        me.controls.update();

        me.render();
    });
    this.container.bind('DOMMouseScroll', function (e) {
        e.preventDefault();
        if (!me.scene) return;

        me.bStopRotate = true;

        me.controls.handleResize();
        me.controls.update();

        me.render();
    });
};

iCn3D.prototype = {

    constructor: iCn3D,

    setOutlineColor: function(colorStr) {
        // outline using ShaderMaterial: http://jsfiddle.net/Eskel/g593q/9/
        var shader = {
            'outline' : {
                vertex_shader: [
                    "uniform float offset;",
                    "void main() {",
                        "vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );",
                        "gl_Position = projectionMatrix * pos;",
                    "}"
                ].join("\n"),

                fragment_shader: [
                    "void main(){",
                        "gl_FragColor = vec4( 1.0, 1.0, 0.0, 1.0 );",
                    "}"
                ].join("\n")
            }
        };

        if(colorStr === 'yellow') {
           shader.outline.fragment_shader = [
               "void main(){",
                   "gl_FragColor = vec4( 1.0, 1.0, 0.0, 1.0 );",
               "}"
           ].join("\n");
        }
        else if(colorStr === 'green') {
           shader.outline.fragment_shader = [
               "void main(){",
                   "gl_FragColor = vec4( 0.0, 1.0, 0.0, 1.0 );",
               "}"
           ].join("\n");
        }
        else if(colorStr === 'red') {
           shader.outline.fragment_shader = [
               "void main(){",
                   "gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );",
               "}"
           ].join("\n");
        }

        // shader
        var uniforms = {offset: {
            type: "f",
            //value: 1
            value: 0.5
          }
        };

        var outShader = shader['outline'];

        var matShader = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: outShader.vertex_shader,
            fragmentShader: outShader.fragment_shader,
            depthTest: false,
            depthWrite: false,
            needsUpdate: true
        });

        return matShader;
    },

    // modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
    setWidthHeight: function(width, height) {
        this.renderer.setSize(width, height);

        this.container.widthInv  = 1 / width;
        this.container.heightInv = 1 / height;
        this.container.whratio = width / height;
    },

    // added nucleotides and ions
    nucleotidesArray: ['  G', '  A', '  T', '  C', '  U', ' DG', ' DA', ' DT', ' DC', ' DU'],

    ionsArray: ['  K', ' NA', ' MG', ' AL', ' CA', ' TI', ' MN', ' FE', ' NI', ' CU', ' ZN', ' AG', ' BA', '  F', ' CL', ' BR', '  I'],

    vdwRadii: { // Hu, S.Z.; Zhou, Z.H.; Tsai, K.R. Acta Phys.-Chim. Sin., 2003, 19:1073.
         H: 1.08,
        HE: 1.34,
        LI: 1.75,
        BE: 2.05,
         B: 1.47,
         C: 1.49,
         N: 1.41,
         O: 1.40,
         F: 1.39,
        NE: 1.68,
        NA: 1.84,
        MG: 2.05,
        AL: 2.11,
        SI: 2.07,
         P: 1.92,
         S: 1.82,
        CL: 1.83,
        AR: 1.93,
         K: 2.05,
        CA: 2.21,
        SC: 2.16,
        TI: 1.87,
         V: 1.79,
        CR: 1.89,
        MN: 1.97,
        FE: 1.94,
        CO: 1.92,
        NI: 1.84,
        CU: 1.86,
        ZN: 2.10,
        GA: 2.08,
        GE: 2.15,
        AS: 2.06,
        SE: 1.93,
        BR: 1.98,
        KR: 2.12,
        RB: 2.16,
        SR: 2.24,
         Y: 2.19,
        ZR: 1.86,
        NB: 2.07,
        MO: 2.09,
        TC: 2.09,
        RU: 2.07,
        RH: 1.95,
        PD: 2.02,
        AG: 2.03,
        CD: 2.30,
        IN: 2.36,
        SN: 2.33,
        SB: 2.25,
        TE: 2.23,
         I: 2.23,
        XE: 2.21,
        CS: 2.22,
        BA: 2.51,
        LA: 2.40,
        CE: 2.35,
        PR: 2.39,
        ND: 2.29,
        PM: 2.36,
        SM: 2.29,
        EU: 2.33,
        GD: 2.37,
        TB: 2.21,
        DY: 2.29,
        HO: 2.16,
        ER: 2.35,
        TM: 2.27,
        YB: 2.42,
        LU: 2.21,
        HF: 2.12,
        TA: 2.17,
         W: 2.10,
        RE: 2.17,
        OS: 2.16,
        IR: 2.02,
        PT: 2.09,
        AU: 2.17,
        HG: 2.09,
        TL: 2.35,
        PB: 2.32,
        BI: 2.43,
        PO: 2.29,
        AT: 2.36,
        RN: 2.43,
        FR: 2.56,
        RA: 2.43,
        AC: 2.60,
        TH: 2.37,
        PA: 2.43,
         U: 2.40,
        NP: 2.21,
        PU: 2.56,
        AM: 2.56,
        CM: 2.56,
        BK: 2.56,
        CF: 2.56,
        ES: 2.56,
        FM: 2.56,
    },

    covalentRadii: { // http://en.wikipedia.org/wiki/Covalent_radius
         H: 0.31,
        HE: 0.28,
        LI: 1.28,
        BE: 0.96,
         B: 0.84,
         C: 0.76,
         N: 0.71,
         O: 0.66,
         F: 0.57,
        NE: 0.58,
        NA: 1.66,
        MG: 1.41,
        AL: 1.21,
        SI: 1.11,
         P: 1.07,
         S: 1.05,
        CL: 1.02,
        AR: 1.06,
         K: 2.03,
        CA: 1.76,
        SC: 1.70,
        TI: 1.60,
         V: 1.53,
        CR: 1.39,
        MN: 1.39,
        FE: 1.32,
        CO: 1.26,
        NI: 1.24,
        CU: 1.32,
        ZN: 1.22,
        GA: 1.22,
        GE: 1.20,
        AS: 1.19,
        SE: 1.20,
        BR: 1.20,
        KR: 1.16,
        RB: 2.20,
        SR: 1.95,
         Y: 1.90,
        ZR: 1.75,
        NB: 1.64,
        MO: 1.54,
        TC: 1.47,
        RU: 1.46,
        RH: 1.42,
        PD: 1.39,
        AG: 1.45,
        CD: 1.44,
        IN: 1.42,
        SN: 1.39,
        SB: 1.39,
        TE: 1.38,
         I: 1.39,
        XE: 1.40,
        CS: 2.44,
        BA: 2.15,
        LA: 2.07,
        CE: 2.04,
        PR: 2.03,
        ND: 2.01,
        PM: 1.99,
        SM: 1.98,
        EU: 1.98,
        GD: 1.96,
        TB: 1.94,
        DY: 1.92,
        HO: 1.92,
        ER: 1.89,
        TM: 1.90,
        YB: 1.87,
        LU: 1.87,
        HF: 1.75,
        TA: 1.70,
         W: 1.62,
        RE: 1.51,
        OS: 1.44,
        IR: 1.41,
        PT: 1.36,
        AU: 1.36,
        HG: 1.32,
        TL: 1.45,
        PB: 1.46,
        BI: 1.48,
        PO: 1.40,
        AT: 1.50,
        RN: 1.50,
        FR: 2.60,
        RA: 2.21,
        AC: 2.15,
        TH: 2.06,
        PA: 2.00,
         U: 1.96,
        NP: 1.90,
        PU: 1.87,
        AM: 1.80,
        CM: 1.69,
    },

    //rasmol-like element colors
    atomColors: {
        'H': new THREE.Color(0xFFFFFF),
        'He': new THREE.Color(0xFFC0CB),
        'HE': new THREE.Color(0xFFC0CB),
        'Li': new THREE.Color(0xB22222),
        'LI': new THREE.Color(0xB22222),
        'B': new THREE.Color(0x00FF00),
        'C': new THREE.Color(0xC8C8C8),
        'N': new THREE.Color(0x8F8FFF),
        'O': new THREE.Color(0xF00000),
        'F': new THREE.Color(0xDAA520),
        'Na': new THREE.Color(0x0000FF),
        'NA': new THREE.Color(0x0000FF),
        'Mg': new THREE.Color(0x228B22),
        'MG': new THREE.Color(0x228B22),
        'Al': new THREE.Color(0x808090),
        'AL': new THREE.Color(0x808090),
        'Si': new THREE.Color(0xDAA520),
        'SI': new THREE.Color(0xDAA520),
        'P': new THREE.Color(0xFFA500),
        'S': new THREE.Color(0xFFC832),
        'Cl': new THREE.Color(0x00FF00),
        'CL': new THREE.Color(0x00FF00),
        'Ca': new THREE.Color(0x808090),
        'CA': new THREE.Color(0x808090),
        'Ti': new THREE.Color(0x808090),
        'TI': new THREE.Color(0x808090),
        'Cr': new THREE.Color(0x808090),
        'CR': new THREE.Color(0x808090),
        'Mn': new THREE.Color(0x808090),
        'MN': new THREE.Color(0x808090),
        'Fe': new THREE.Color(0xFFA500),
        'FE': new THREE.Color(0xFFA500),
        'Ni': new THREE.Color(0xA52A2A),
        'NI': new THREE.Color(0xA52A2A),
        'Cu': new THREE.Color(0xA52A2A),
        'CU': new THREE.Color(0xA52A2A),
        'Zn': new THREE.Color(0xA52A2A),
        'ZN': new THREE.Color(0xA52A2A),
        'Br': new THREE.Color(0xA52A2A),
        'BR': new THREE.Color(0xA52A2A),
        'Ag': new THREE.Color(0x808090),
        'AG': new THREE.Color(0x808090),
        'I': new THREE.Color(0xA020F0),
        'Ba': new THREE.Color(0xFFA500),
        'BA': new THREE.Color(0xFFA500),
        'Au': new THREE.Color(0xDAA520),
        'AU': new THREE.Color(0xDAA520)
    },

    defaultAtomColor: new THREE.Color(0xCCCCCC),

    stdChainColors: [
            new THREE.Color(0x32CD32),
            new THREE.Color(0x1E90FF),
            new THREE.Color(0xFA8072),
            new THREE.Color(0xFFA500),
            new THREE.Color(0x00CED1),
            new THREE.Color(0xFF69B4),

            new THREE.Color(0x00FF00),
            new THREE.Color(0x0000FF),
            new THREE.Color(0xFF0000),
            new THREE.Color(0xFFFF00),
            new THREE.Color(0x00FFFF),
            new THREE.Color(0xFF00FF),

            new THREE.Color(0x3CB371),
            new THREE.Color(0x4682B4),
            new THREE.Color(0xCD5C5C),
            new THREE.Color(0xFFE4B5),
            new THREE.Color(0xAFEEEE),
            new THREE.Color(0xEE82EE),

            new THREE.Color(0x006400),
            new THREE.Color(0x00008B),
            new THREE.Color(0x8B0000),
            new THREE.Color(0xCD853F),
            new THREE.Color(0x008B8B),
            new THREE.Color(0x9400D3)
        ],

    backgroundColors: {
        black: new THREE.Color(0x000000),
         grey: new THREE.Color(0xCCCCCC),
        white: new THREE.Color(0xFFFFFF),
    },

    residueColors: {
        ALA: new THREE.Color(0xC8C8C8),
        ARG: new THREE.Color(0x145AFF),
        ASN: new THREE.Color(0x00DCDC),
        ASP: new THREE.Color(0xE60A0A),
        CYS: new THREE.Color(0xE6E600),
        GLN: new THREE.Color(0x00DCDC),
        GLU: new THREE.Color(0xE60A0A),
        GLY: new THREE.Color(0xEBEBEB),
        HIS: new THREE.Color(0x8282D2),
        ILE: new THREE.Color(0x0F820F),
        LEU: new THREE.Color(0x0F820F),
        LYS: new THREE.Color(0x145AFF),
        MET: new THREE.Color(0xE6E600),
        PHE: new THREE.Color(0x3232AA),
        PRO: new THREE.Color(0xDC9682),
        SER: new THREE.Color(0xFA9600),
        THR: new THREE.Color(0xFA9600),
        TRP: new THREE.Color(0xB45AB4),
        TYR: new THREE.Color(0x3232AA),
        VAL: new THREE.Color(0x0F820F),
        ASX: new THREE.Color(0xFF69B4),
        GLX: new THREE.Color(0xFF69B4),
    },

    defaultResidueColor: new THREE.Color(0xBEA06E),

    chargeColors: {
// charged residues
        '  G': new THREE.Color(0xFF0000),
        '  A': new THREE.Color(0xFF0000),
        '  T': new THREE.Color(0xFF0000),
        '  C': new THREE.Color(0xFF0000),
        '  U': new THREE.Color(0xFF0000),
        ' DG': new THREE.Color(0xFF0000),
        ' DA': new THREE.Color(0xFF0000),
        ' DT': new THREE.Color(0xFF0000),
        ' DC': new THREE.Color(0xFF0000),
        ' DU': new THREE.Color(0xFF0000),
          G: new THREE.Color(0xFF0000),
          A: new THREE.Color(0xFF0000),
          T: new THREE.Color(0xFF0000),
          C: new THREE.Color(0xFF0000),
          U: new THREE.Color(0xFF0000),
         DG: new THREE.Color(0xFF0000),
         DA: new THREE.Color(0xFF0000),
         DT: new THREE.Color(0xFF0000),
         DC: new THREE.Color(0xFF0000),
         DU: new THREE.Color(0xFF0000),
        ARG: new THREE.Color(0x0000FF),
        LYS: new THREE.Color(0x0000FF),
        ASP: new THREE.Color(0xFF0000),
        GLU: new THREE.Color(0xFF0000),

// hydrophobic
        GLY: new THREE.Color(0x888888),
        PRO: new THREE.Color(0x888888),
        ALA: new THREE.Color(0x888888),
        VAL: new THREE.Color(0x888888),
        LEU: new THREE.Color(0x888888),
        ILE: new THREE.Color(0x888888),
        PHE: new THREE.Color(0x888888),

// polar
        HIS: new THREE.Color(0x888888),
        SER: new THREE.Color(0x888888),
        THR: new THREE.Color(0x888888),
        ASN: new THREE.Color(0x888888),
        GLN: new THREE.Color(0x888888),
        TYR: new THREE.Color(0x888888),
        MET: new THREE.Color(0x888888),
        CYS: new THREE.Color(0x888888),
        TRP: new THREE.Color(0x888888)
    },

    hydrophobicColors: {
// charged residues
        '  G': new THREE.Color(0x888888),
        '  A': new THREE.Color(0x888888),
        '  T': new THREE.Color(0x888888),
        '  C': new THREE.Color(0x888888),
        '  U': new THREE.Color(0x888888),
        ' DG': new THREE.Color(0x888888),
        ' DA': new THREE.Color(0x888888),
        ' DT': new THREE.Color(0x888888),
        ' DC': new THREE.Color(0x888888),
        ' DU': new THREE.Color(0x888888),
          G: new THREE.Color(0x888888),
          A: new THREE.Color(0x888888),
          T: new THREE.Color(0x888888),
          C: new THREE.Color(0x888888),
          U: new THREE.Color(0x888888),
         DG: new THREE.Color(0x888888),
         DA: new THREE.Color(0x888888),
         DT: new THREE.Color(0x888888),
         DC: new THREE.Color(0x888888),
         DU: new THREE.Color(0x888888),
        ARG: new THREE.Color(0x888888),
        LYS: new THREE.Color(0x888888),
        ASP: new THREE.Color(0x888888),
        GLU: new THREE.Color(0x888888),

// hydrophobic
        GLY: new THREE.Color(0x00FF00),
        PRO: new THREE.Color(0x00FF00),
        ALA: new THREE.Color(0x00FF00),
        VAL: new THREE.Color(0x00FF00),
        LEU: new THREE.Color(0x00FF00),
        ILE: new THREE.Color(0x00FF00),
        PHE: new THREE.Color(0x00FF00),

// polar
        HIS: new THREE.Color(0x888888),
        SER: new THREE.Color(0x888888),
        THR: new THREE.Color(0x888888),
        ASN: new THREE.Color(0x888888),
        GLN: new THREE.Color(0x888888),
        TYR: new THREE.Color(0x888888),
        MET: new THREE.Color(0x888888),
        CYS: new THREE.Color(0x888888),
        TRP: new THREE.Color(0x888888)
    },

    ssColors: {
        helix: new THREE.Color(0xFF0080),
        sheet: new THREE.Color(0xFFC800),
         coil: new THREE.Color(0x6080FF),
    },

    //defaultBondColor: new THREE.Color(0x2194D6),
    defaultBondColor: new THREE.Color(0xBBBBBB), // cross residue bonds

    surfaces: {
        1: undefined,
        2: undefined,
        3: undefined,
        4: undefined
    },

    // from iview (http://istar.cse.cuhk.edu.hk/iview/)
    hasCovalentBond: function (atom0, atom1) {
        var r = this.covalentRadii[atom0.elem] + this.covalentRadii[atom1.elem];
        return atom0.coord.distanceToSquared(atom1.coord) < 1.3 * r * r;
    },

    init: function () {
        this.structures = {}; // structure name -> array of chains
        this.chains = {}; // structure_chain name -> atom hash
        this.residues = {}; // structure_chain_resi name -> atom hash
        this.secondaries = {}; // structure_chain_resi name -> secondary structure: 'c', 'H', or 'E'
        this.alignChains = {}; // structure_chain name -> atom hash

        this.chainsSeq = {}; // structure_chain name -> array of sequence
        this.chainsColor = {}; // structure_chain name -> color, show chain color in sequence display for mmdbid and align input
        this.chainsAnno = {}; // structure_chain name -> array of array of annotations, such as residue number
        this.chainsAnnoTitle = {}; // structure_chain name -> array of array of annotation title

        this.alignChainsSeq = {}; // structure_chain name -> array of residue object: {mmdbid, chain, resi, resn, aligned}
        this.alignChainsAnno = {}; // structure_chain name -> array of array of annotations, such as residue number
        this.alignChainsAnnoTitle = {}; // structure_chain name -> array of array of annotation title

        this.displayAtoms = {}; // show selected atoms
        this.highlightAtoms = {}; // used to change color or dislay type for certain atoms

        this.pickedAtomList = {}; // used to switch among different highlight levels

        this.prevHighlightObjects = [];
        this.prevSurfaces = [];

        this.definedNames2Residues = {}; // custom defined selection name -> residue array
        this.definedNames2Atoms = {}; // custom defined selection name -> atom array
        this.definedNames2Descr = {}; // custom defined selection name -> description
        this.definedNames2Command = {}; // custom defined selection name -> command

        this.residueId2Name = {}; // structure_chain_resi -> one letter abbreviation

        this.moleculeTitle = "";

        this.atoms = {};
        this.displayAtoms = {};
        this.highlightAtoms = {};
        this.proteins = {};
        this.sidechains = {};
        this.nucleotides = {};
        this.nucleotidesP = {};

        this.ligands = {};
        this.ions = {};
        this.water = {};
        this.calphas = {};

        this.hbondpoints = [];
        this.ssbondpoints = []; // disulfide bonds
        //this.ncbondpoints = []; // non-covalent bonds

        this.doublebonds = {};
        this.triplebonds = {};
        this.aromaticbonds = {};

        this.atomPrevColors = {};

        this.style2atoms = {}; // style -> atom hash, 13 styles: ribbon, strand, cylinder and plate, nucleotide cartoon, phosphorus trace, schematic, c alpha trace, b factor tube, lines, stick, ball and stick, sphere, dot, nothing
        this.labels = {};     // hash of name -> a list of labels. Each label contains 'position', 'text', 'size', 'color', 'background'
                            // label name could be custom, residue, schmatic, distance
        this.lines = {};     // hash of name -> a list of solid or dashed lines. Each line contains 'position1', 'position2', 'color', and a boolean of 'dashed'
                            // line name could be custom, hbond, ssbond, distance

        this.inputid = {"idtype": undefined, "id":undefined}; // support pdbid, mmdbid

        this.biomtMatrices = [];
        this.bAssembly = false;

        this.rotateCount = 0;
        this.rotateCountMax = 30;
    },

    reinitAfterLoad: function () {
        this.displayAtoms = this.cloneHash(this.atoms); // show selected atoms
        this.highlightAtoms = this.cloneHash(this.atoms); // used to change color or dislay type for certain atoms

        this.prevHighlightObjects = [];
        this.prevSurfaces = [];

        this.labels = {};   // hash of name -> a list of labels. Each label contains 'position', 'text', 'size', 'color', 'background'
                            // label name could be custom, residue, schmatic, distance
        this.lines = {};    // hash of name -> a list of solid or dashed lines. Each line contains 'position1', 'position2', 'color', and a boolean of 'dashed'
                            // line name could be custom, hbond, ssbond, distance

        this.bAssembly = false;
    }
};
