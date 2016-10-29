    iCn3DUI.prototype.loadXyzData = function(data) {
        var me = this;

        var bResult = me.loadXyzAtomData(data);

        if(me.cfg.align === undefined && Object.keys(me.icn3d.structures).length == 1) {
            $("#" + me.pre + "alternateWrapper").hide();
        }

        if(!bResult) {
          alert('The XYZ file has the wrong format...');
        }
        else {
          me.icn3d.setAtomStyleByOptions(me.options);
          me.icn3d.setColorByOptions(me.options, me.icn3d.atoms);

          me.renderStructure();

          if(me.cfg.rotate !== undefined) me.rotateStructure(me.cfg.rotate, true);

          if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
        }
    };

    iCn3DUI.prototype.setXyzAtomSeq = function (AtomHash, moleculeNum, chainNum, residueNum) { var me = this;
        me.icn3d.displayAtoms = me.icn3d.unionHash(me.icn3d.displayAtoms, AtomHash);
        me.icn3d.highlightAtoms= me.icn3d.unionHash(me.icn3d.highlightAtoms, AtomHash);

        me.icn3d.structures[moleculeNum] = [chainNum]; //AtomHash;
        me.icn3d.chains[chainNum] = AtomHash;
        me.icn3d.residues[residueNum] = AtomHash;

        me.icn3d.residueId2Name[residueNum] = 'LIG';

        if(me.icn3d.chainsSeq[chainNum] === undefined) me.icn3d.chainsSeq[chainNum] = [];
        if(me.icn3d.chainsAnno[chainNum] === undefined ) me.icn3d.chainsAnno[chainNum] = [];
        if(me.icn3d.chainsAnno[chainNum][0] === undefined ) me.icn3d.chainsAnno[chainNum][0] = [];
        if(me.icn3d.chainsAnnoTitle[chainNum] === undefined ) me.icn3d.chainsAnnoTitle[chainNum] = [];
        if(me.icn3d.chainsAnnoTitle[chainNum][0] === undefined ) me.icn3d.chainsAnnoTitle[chainNum][0] = [];

          var resObject = {};
          resObject.resi = 1;
          resObject.name = 'LIG';

        me.icn3d.chainsSeq[chainNum].push(resObject);
        me.icn3d.chainsAnno[chainNum][0].push(1);
        me.icn3d.chainsAnnoTitle[chainNum][0].push('');

        // determine bonds
        var serialArray = Object.keys(AtomHash);
        for(var j = 0, jl = serialArray.length; j < jl; ++j) {
            var atom0 = me.icn3d.atoms[serialArray[j]];

            for(var k = j + 1, kl = serialArray.length; k < kl; ++k) {
                var atom1 = me.icn3d.atoms[serialArray[k]];
                var maxR = 1.2 * (me.icn3d.covalentRadii[atom0.elem] + me.icn3d.covalentRadii[atom1.elem]);
                if(Math.abs(atom0.coord.x - atom1.coord.x) > maxR) continue;
                if(Math.abs(atom0.coord.y - atom1.coord.y) > maxR) continue;
                if(Math.abs(atom0.coord.z - atom1.coord.z) > maxR) continue;

                if(me.icn3d.hasCovalentBond(atom0, atom1)) {
                    me.icn3d.atoms[serialArray[j]].bonds.push(serialArray[k]);
                    me.icn3d.atoms[serialArray[k]].bonds.push(serialArray[j]);
                }
            }
        }
    },

    iCn3DUI.prototype.loadXyzAtomData = function (data) { var me = this;
        var lines = data.split(/\r?\n|\r/);
        if (lines.length < 3) return false;

        me.icn3d.init();

        var chain = 'A';
        var resn = 'LIG';
        var resi = 1;

        var AtomHash = {};
        var moleculeNum = 0, chainNum, residueNum;
        var structure, atomCount, serial=1, offset = 2;

        me.icn3d.moleculeTitle = "";

        for (var i = 0, il = lines.length; i < il; ++i) {
            var line = lines[i].trim();
            if(line === '') continue;

            if(line !== '' && !isNaN(line)) { // start a new molecule
                if(i !== 0) {
                    me.setXyzAtomSeq(AtomHash, moleculeNum, chainNum, residueNum);
                }

                ++moleculeNum;
                AtomHash = {};

                structure = moleculeNum;
                chainNum = structure + '_' + chain;
                residueNum = chainNum + '_' + resi;

//12
//glucose from 2gbp
//C  35.884  30.895  49.120

                atomCount = parseInt(line);
                if(moleculeNum > 1) {
                    me.icn3d.moleculeTitle += "; ";
                }
                me.icn3d.moleculeTitle += lines[i+1].trim();

                i = i + offset;
            }

            line = lines[i].trim();
            if(line === '') continue;

            var name_x_y_z = line.replace(/,/, " ").replace(/\s+/g, " ").split(" ");

            var name = name_x_y_z[0];
            var x = parseFloat(name_x_y_z[1]);
            var y = parseFloat(name_x_y_z[2]);
            var z = parseFloat(name_x_y_z[3]);
            var coord = new THREE.Vector3(x, y, z);

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
                elem: name,             // optional, used to determine hydrogen bond
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

        me.setXyzAtomSeq(AtomHash, moleculeNum, chainNum, residueNum);

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
