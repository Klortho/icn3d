    iCn3DUI.prototype.loadMol2Data = function(data) {
        var me = this;

        var bResult = me.loadMol2AtomData(data);

        if(me.cfg.align === undefined && Object.keys(me.icn3d.structures).length == 1) {
            $("#" + me.pre + "alternateWrapper").hide();
        }

        if(!bResult) {
          alert('The Mol2 file has the wrong format...');
        }
        else {
          me.icn3d.setAtomStyleByOptions(me.options);
          me.icn3d.setColorByOptions(me.options, me.icn3d.atoms);

          me.renderStructure();

          if(me.cfg.rotate !== undefined) me.rotateStructure(me.cfg.rotate, true);

          if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
        }
    };

    iCn3DUI.prototype.loadMol2AtomData = function (data) { var me = this;
        var lines = data.split(/\r?\n|\r/);
        if (lines.length < 4) return false;

        me.icn3d.init();

        var structure = 1;
        var chain = 'A';
        var resn = 'LIG';
        var resi = 1;

        var AtomHash = {};
        var moleculeNum = 1, chainNum = '1_A', residueNum = '1_A_1';
        var atomCount, bondCount, atomIndex = 0, bondIndex = 0;
        var serial=1;

        var bAtomSection = false, bBondSection = false;

        var atomid2serial = {};
        var skipAtomids = {};

        var prevBondType = '', contiArrBondCnt = 0;

        for (var i = 0, il = lines.length; i < il; ++i) {
            var line = lines[i].trim();
            if(line === '') continue;
            if(line.substr(0, 1) === '#') continue;

            if(line == '@<TRIPOS>MOLECULE') {
                me.icn3d.moleculeTitle = lines[i + 1].trim();
                var atomCnt_bondCnt = lines[i + 2].trim().replace(/\s+/g, " ").split(" ");
                atomCount = atomCnt_bondCnt[0];
                bondCount = atomCnt_bondCnt[1];
                i = i + 4;
            }
            else if(line == '@<TRIPOS>ATOM') { // 1    C1    1.207    2.091    0.000    C.ar    1    BENZENE    0.000
                serial = 1;

                bAtomSection = true;

                ++i;
            }
            else if(line == '@<TRIPOS>BOND') { // 1    1    2    ar
                bBondSection = true;
                bAtomSection = false;

                ++i;
            }
            else if(line == '@<TRIPOS>SUBSTRUCTURE') { // 1    1    2    ar
                bBondSection = false;

                ++i;
            }

            line = lines[i].trim();
            if(line === '') continue;
            if(line.substr(0, 1) === '#') continue;

            if(bAtomSection && atomIndex < atomCount) {
                // 1    C1    1.207    2.091    0.000    C.ar    1    BENZENE    0.000
                var atomArray = line.replace(/\s+/g, " ").split(" ");

                var atomid = parseInt(atomArray[0]);
                atomid2serial[atomid] = serial;

                var name = atomArray[1];
                var x = parseFloat(atomArray[2]);
                var y = parseFloat(atomArray[3]);
                var z = parseFloat(atomArray[4]);
                var coord = new THREE.Vector3(x, y, z);

                var elemFull = atomArray[5];
                var pos = elemFull.indexOf('.');

                var elem;
                if(pos === -1) {
                    elem = elemFull;
                }
                else {
                    elem = elemFull.substr(0, pos);
                }

                // skip H, but keep H.spc, H.t3p, etc
                if(elem === 'H' && elem === elemFull) {
                    skipAtomids[atomid] = 1;
                }
                else {
                    var atomDetails = {
                        het: true,              // optional, used to determine ligands, water, ions, etc
                        serial: serial,         // required, unique atom id
                        name: name,             // required, atom name
                        resn: resn,             // optional, used to determine protein or nucleotide
                        structure: structure,   // optional, used to identify structure
                        chain: chain,           // optional, used to identify chain
                        resi: resi,             // optional, used to identify residue ID
                        coord: coord,           // required, used to draw 3D shape
                        b: 0,                   // optional, used to draw B-factor tube
                        elem: elem,             // optional, used to determine hydrogen bond
                        bonds: [],              // required, used to connect atoms
                        ss: 'coil',             // optional, used to show secondary structures
                        ssbegin: false,         // optional, used to show the beginning of secondary structures
                        ssend: false,           // optional, used to show the end of secondary structures

                        bondOrder: []           // optional, specific for chemicals
                    };

                    me.icn3d.atoms[serial] = atomDetails;
                    AtomHash[serial] = 1;

                    ++serial;
                }

                ++atomIndex;
            }

            if(bBondSection && bondIndex < bondCount) {
                // 1    1    2    ar
                var bondArray = line.replace(/\s+/g, " ").split(" ");
                var fromAtomid = parseInt(bondArray[1]);
                var toAtomid = parseInt(bondArray[2]);
                var bondType = bondArray[3];
                var finalBondType = bondType;

                //� 1 = single � 2 = double � 3 = triple � am = amide � ar = aromatic � du = dummy � un = unknown (cannot be determined from the parameter tables) � nc = not connected
                if(bondType === 'am') {
                    finalBondType = '1';
                }

                if(bondType === 'ar') {
                    finalBondType = '1.5';
                }

                if(!skipAtomids.hasOwnProperty(fromAtomid) && !skipAtomids.hasOwnProperty(toAtomid) && (finalBondType === '1' || finalBondType === '2' || finalBondType === '3' || finalBondType === '1.5') ) {
                    var order = finalBondType;
                    var from = atomid2serial[fromAtomid];
                    var to = atomid2serial[toAtomid];

                    // skip all bonds between H and C
                    //if( !(me.icn3d.atoms[from].elem === 'H' && me.icn3d.atoms[to].elem === 'C') && !(me.icn3d.atoms[from].elem === 'C' && me.icn3d.atoms[to].elem === 'H') ) {
                        me.icn3d.atoms[from].bonds.push(to);
                        me.icn3d.atoms[from].bondOrder.push(order);
                        me.icn3d.atoms[to].bonds.push(from);
                        me.icn3d.atoms[to].bondOrder.push(order);

                        if(order == '2') {
                            me.icn3d.doublebonds[from + '_' + to] = 1;
                            me.icn3d.doublebonds[to + '_' + from] = 1;
                        }
                        else if(order == '3') {
                            me.icn3d.triplebonds[from + '_' + to] = 1;
                            me.icn3d.triplebonds[to + '_' + from] = 1;
                        }
                        else if(order == '1.5') {
                            me.icn3d.aromaticbonds[from + '_' + to] = 1;
                            me.icn3d.aromaticbonds[to + '_' + from] = 1;
                        }
                    //}
                }

                ++bondIndex;
                prevBondType = bondType;
            }
        }

        me.icn3d.displayAtoms = AtomHash;
        me.icn3d.highlightAtoms= AtomHash;
        me.icn3d.structures[moleculeNum] = [chainNum]; //AtomHash;
        me.icn3d.chains[chainNum] = AtomHash;
        me.icn3d.residues[residueNum] = AtomHash;

        me.icn3d.residueId2Name[residueNum] = resn;

        if(me.icn3d.chainsSeq[chainNum] === undefined) me.icn3d.chainsSeq[chainNum] = [];
        if(me.icn3d.chainsAnno[chainNum] === undefined ) me.icn3d.chainsAnno[chainNum] = [];
        if(me.icn3d.chainsAnno[chainNum][0] === undefined ) me.icn3d.chainsAnno[chainNum][0] = [];
        if(me.icn3d.chainsAnnoTitle[chainNum] === undefined ) me.icn3d.chainsAnnoTitle[chainNum] = [];
        if(me.icn3d.chainsAnnoTitle[chainNum][0] === undefined ) me.icn3d.chainsAnnoTitle[chainNum][0] = [];

          var resObject = {};
          resObject.resi = resi;
          resObject.name = resn;

        me.icn3d.chainsSeq[chainNum].push(resObject);
        me.icn3d.chainsAnno[chainNum][0].push(resi);
        me.icn3d.chainsAnnoTitle[chainNum][0].push('');

        var pmin = new THREE.Vector3( 9999, 9999, 9999);
        var pmax = new THREE.Vector3(-9999,-9999,-9999);
        var psum = new THREE.Vector3();
        var cnt = 0;
        // assign atoms
        for (var i in me.icn3d.atoms) {
            var atom = me.icn3d.atoms[i];
            var coord = atom.coord;
            psum.add(coord);
            pmin.min(coord);
            pmax.max(coord);
            ++cnt;

            if(atom.het) {
              if($.inArray(atom.elem, me.icn3d.ionsArray) !== -1) {
                me.icn3d.ions[atom.serial] = 1;
              }
              else {
                me.icn3d.ligands[atom.serial] = 1;
              }
            }
        } // end of for


        me.icn3d.pmin = pmin;
        me.icn3d.pmax = pmax;

        me.icn3d.cnt = cnt;

        me.icn3d.maxD = me.icn3d.pmax.distanceTo(me.icn3d.pmin);
        me.icn3d.center = psum.multiplyScalar(1.0 / me.icn3d.cnt);

        if (me.icn3d.maxD < 25) me.icn3d.maxD = 25;

        me.icn3d.oriMaxD = me.icn3d.maxD;
        me.icn3d.oriCenter = me.icn3d.center.clone();

        me.showTitle();

        return true;
    };
