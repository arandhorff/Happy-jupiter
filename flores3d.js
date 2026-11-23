/**
 * MOTOR BOTÁNICO 3D REAL (Three.js WebGL)
 * Modelos tridimensionales de alta fidelidad botánica:
 * - Geometría paramétrica limpia con pivote en la base del pétalo (sin desalineaciones ni arrugas).
 * - Identidad visual clara: Girasol plano y radiante, Rosa inglesa romántica en espiral,
 *   Margarita estrellada, Peonía exuberante, Tulipán estilizado, Lirio con estambres integrados.
 * - Cúpula floral de floristería de lujo (bouquet esférico armónico con follaje marco, tallos y lazo).
 * - Calibración sRGB y ACES Filmic Tone Mapping sin quemados ni destellos plásticos.
 */

// ===================================================
// MATERIALES BOTÁNICOS PBR (Acabado aterciopelado mate)
// ===================================================

const Materiales3D = {
    cache: new Map(),
    texturasCache: new Map(),

    // Gradiente sutil que añade profundidad y volumen botánico
    crearTexturaPetalo(colorHex) {
        if (typeof document === 'undefined') return null;
        if (this.texturasCache.has(colorHex)) return this.texturasCache.get(colorHex);

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const baseCol = new THREE.Color(colorHex);
        const colGarganta = baseCol.clone().multiplyScalar(0.80);
        const colCuerpo = baseCol.clone();
        const colBorde = baseCol.clone().lerp(new THREE.Color('#ffffff'), 0.14);

        const gradY = ctx.createLinearGradient(0, 256, 0, 0);
        gradY.addColorStop(0.0, `#${colGarganta.getHexString()}`);
        gradY.addColorStop(0.35, `#${colCuerpo.getHexString()}`);
        gradY.addColorStop(0.85, `#${colCuerpo.getHexString()}`);
        gradY.addColorStop(1.0, `#${colBorde.getHexString()}`);

        ctx.fillStyle = gradY;
        ctx.fillRect(0, 0, 128, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        this.texturasCache.set(colorHex, texture);
        return texture;
    },

    crear(colorHex, opciones = {}) {
        const roughness = opciones.roughness !== undefined ? opciones.roughness : 0.78;
        const metalness = opciones.metalness !== undefined ? opciones.metalness : 0.0;
        const usaTextura = opciones.conTextura !== false;
        const key = `${colorHex}_${roughness}_${metalness}_${usaTextura ? 'T' : 'N'}_${opciones.doubleSide ? 'D' : 'S'}`;

        if (this.cache.has(key)) return this.cache.get(key);

        const params = {
            color: new THREE.Color(colorHex),
            roughness: roughness,
            metalness: metalness,
            side: opciones.doubleSide !== false ? THREE.DoubleSide : THREE.FrontSide,
            shadowSide: THREE.DoubleSide
        };

        if (usaTextura) {
            const tex = this.crearTexturaPetalo(colorHex);
            if (tex) params.map = tex;
        }

        const mat = new THREE.MeshStandardMaterial(params);
        this.cache.set(key, mat);
        return mat;
    },

    verdeTallo(colorHex = '#2d5a3f') {
        return this.crear(colorHex, { roughness: 0.72, metalness: 0.0, conTextura: false });
    },

    verdeHoja(colorHex = '#356845') {
        return this.crear(colorHex, { roughness: 0.68, metalness: 0.0, conTextura: false });
    },

    verdeCaliz(colorHex = '#3e744a') {
        return this.crear(colorHex, { roughness: 0.70, metalness: 0.0, conTextura: false });
    },

    doradoCentro() {
        return this.crear('#ffb703', { roughness: 0.75, metalness: 0.05, conTextura: false });
    },

    cafeCentro() {
        return this.crear('#2a170d', { roughness: 0.90, metalness: 0.0, conTextura: false });
    },

    satenRosa(colorHex = '#ffb3c6') {
        return this.crear(colorHex, { roughness: 0.38, metalness: 0.08, conTextura: false });
    }
};

// ===================================================
// GENERADOR DE FLORES 3D BOTÁNICAMENTE PRECISAS
// ===================================================
const GeneradorFlores3D = {

    /**
     * Geometría suave continua con pivote en la base (y = 0).
     * ancho: ancho máximo del pétalo.
     * alto: largo del pétalo desde la base hasta la punta.
     * curvaturaCopa: qué tanto se ahueca el pétalo hacia adentro.
     * curvaturaBorde: qué tanto se dobla el borde exterior hacia afuera.
     * esPuntaAfilada: true para girasol/dalia, false para rosa/peonía.
     */
    crearGeometriaPetalo(ancho, alto, curvaturaCopa = 0.25, curvaturaBorde = -0.12, esPuntaAfilada = false) {
        const segX = 14;
        const segY = 16;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);

        // Desplazar para que el origen (0,0,0) esté exactamente en la base del pétalo
        geo.translate(0, alto * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            const y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / alto)); // 0 en la base, 1 en la punta
            const u = x / (ancho * 0.5 + 0.0001);

            let factorAncho;
            if (esPuntaAfilada) {
                // Silueta lanceolada/ovalada para girasol o dalia: nace estrecho, engruesa y remata en punta suave
                factorAncho = Math.sin(v * Math.PI) * Math.pow(Math.max(0, 1.0 - v * 0.25), 0.6);
            } else {
                // Silueta redondeada floral clásica (rosa, peonía)
                factorAncho = Math.sin(Math.pow(v, 0.62) * Math.PI) * (0.18 + 0.82 * Math.sqrt(v));
            }
            x *= factorAncho;
            pos.setX(i, x);

            // Ahuecado de copa
            const uNorm = Math.min(1, Math.max(-1, u));
            const copa = -curvaturaCopa * alto * Math.sin(v * Math.PI) * (1.0 - uNorm * uNorm * 0.5);

            // Pliegue hacia afuera en la punta
            let reborde = 0;
            if (v > 0.65) {
                const t = (v - 0.65) / 0.35;
                reborde = curvaturaBorde * alto * (t * t);
            }

            pos.setZ(i, copa + reborde);
        }

        geo.computeVertexNormals();
        return geo;
    },

    // Pétalo de tulipán acopado estilizado (pivote en base y=0)
    crearGeometriaTulipan(ancho, alto) {
        const segX = 16;
        const segY = 16;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        geo.translate(0, alto * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            const y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / alto));
            const u = x / (ancho * 0.5 + 0.0001);

            const factorAncho = Math.sin(v * Math.PI * 0.90) * 1.05;
            x *= factorAncho;
            pos.setX(i, x);

            const uNorm = Math.min(1, Math.max(-1, u));
            let z = -0.38 * alto * Math.sin(v * Math.PI) * (1.0 - uNorm * uNorm * 0.45);
            if (v > 0.78) {
                const tPunta = (v - 0.78) / 0.22;
                z -= 0.08 * alto * (tPunta * tPunta);
            }
            pos.setZ(i, z);
        }

        geo.computeVertexNormals();
        return geo;
    },

    // Hoja lanceolada suave con pliegue central (pivote en base y=0)
    crearGeometriaHoja(ancho, largo, curvatura = 0.20) {
        const geo = new THREE.PlaneGeometry(ancho, largo, 12, 16);
        geo.translate(0, largo * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            const y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / largo));

            const factorAncho = Math.sin(v * Math.PI);
            x *= factorAncho;
            pos.setX(i, x);

            const pliegueV = Math.abs(x) * 0.32;
            const arcoLong = -Math.sin(v * Math.PI) * largo * curvatura;
            pos.setZ(i, pliegueV + arcoLong);
        }
        geo.computeVertexNormals();
        return geo;
    },

    // Auxiliar maestro para insertar un pétalo en un anillo radial
    crearPetaloEnAnillo(geo, mat, radio, yOffset, rotX, rotY, rotZ = 0) {
        const pivot = new THREE.Group();
        pivot.position.y = yOffset;
        pivot.rotation.y = rotY;

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = radio;
        mesh.rotation.x = rotX;
        if (rotZ !== 0) mesh.rotation.z = rotZ;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        pivot.add(mesh);
        return pivot;
    },

    // Tallo cilíndrico curvo orgánico
    crearTallo3D(altura, radio = 0.065, curvatura = 0.15, matVerde = null) {
        const puntos = [];
        const numPuntos = 14;
        for (let i = 0; i <= numPuntos; i++) {
            const t = i / numPuntos;
            const y = t * altura;
            const x = Math.sin(t * Math.PI) * curvatura;
            const z = (t * t - t) * (curvatura * 0.5);
            puntos.push(new THREE.Vector3(x, y, z));
        }
        const curva = new THREE.CatmullRomCurve3(puntos);
        const geoTallo = new THREE.TubeGeometry(curva, 20, radio, 10, false);
        const mesh = new THREE.Mesh(geoTallo, matVerde || Materiales3D.verdeTallo());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return { mesh, fin: puntos[numPuntos], alturaTotal: altura };
    },

    // 1. ROSA 3D (Espirales aterciopeladas románticas - Acabado inglés de lujo)
    crearRosa(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Rosa3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        // Capa 1: Botón central apretado (4 pétalos cilíndricos envolventes)
        const geo1 = this.crearGeometriaPetalo(0.42 * s, 0.68 * s, 0.40, -0.05);
        for (let i = 0; i < 4; i++) {
            const rotY = (i * Math.PI * 2) / 4 + 0.35;
            grupo.add(this.crearPetaloEnAnillo(geo1, mat, 0.04 * s, 0.06 * s, 0.22, rotY));
        }

        // Capa 2: Espiral interior (5 pétalos acopados)
        const geo2 = this.crearGeometriaPetalo(0.62 * s, 0.80 * s, 0.35, -0.10);
        for (let i = 0; i < 5; i++) {
            const rotY = (i * Math.PI * 2) / 5 + 0.65;
            grupo.add(this.crearPetaloEnAnillo(geo2, mat, 0.10 * s, 0.03 * s, 0.42, rotY));
        }

        // Capa 3: Espiral media (6 pétalos abriéndose con reborde)
        const geo3 = this.crearGeometriaPetalo(0.82 * s, 0.94 * s, 0.30, -0.18);
        for (let i = 0; i < 6; i++) {
            const rotY = (i * Math.PI * 2) / 6 + 0.25;
            grupo.add(this.crearPetaloEnAnillo(geo3, mat, 0.20 * s, -0.01 * s, 0.68, rotY));
        }

        // Capa 4: Capa exterior abierta (7 pétalos amplios)
        const geo4 = this.crearGeometriaPetalo(1.02 * s, 1.05 * s, 0.25, -0.22);
        for (let i = 0; i < 7; i++) {
            const rotY = (i * Math.PI * 2) / 7 + 0.55;
            grupo.add(this.crearPetaloEnAnillo(geo4, mat, 0.32 * s, -0.05 * s, 0.95, rotY));
        }

        // Capa 5: Pétalos exteriores desplegados (8 pétalos de floristería)
        const geo5 = this.crearGeometriaPetalo(1.15 * s, 1.10 * s, 0.20, -0.28);
        for (let i = 0; i < 8; i++) {
            const rotY = (i * Math.PI * 2) / 8 + 0.15;
            grupo.add(this.crearPetaloEnAnillo(geo5, mat, 0.44 * s, -0.10 * s, 1.25, rotY));
        }

        // Sépalos verdes abrazando la base por debajo
        const geoBase = new THREE.CylinderGeometry(0.32 * s, 0.22 * s, 0.10 * s, 16);
        geoBase.position.y = -0.12 * s;
        grupo.add(new THREE.Mesh(geoBase, Materiales3D.verdeCaliz()));

        const geoSep = this.crearGeometriaHoja(0.22 * s, 0.80 * s, 0.35);
        const matSep = Materiales3D.verdeCaliz();
        for (let j = 0; j < 5; j++) {
            const rotY = (j * Math.PI * 2) / 5;
            grupo.add(this.crearPetaloEnAnillo(geoSep, matSep, 0.28 * s, -0.16 * s, 1.68, rotY));
        }

        return grupo;
    },

    // 2. PEONÍA 3D (Ramillete esponjoso suave con pétalos amplios redondeados)
    crearPeonia(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Peonia3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        // Estambres dorados en el centro
        const geoCentro = new THREE.SphereGeometry(0.18 * s, 12, 12);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.doradoCentro());
        meshCentro.position.y = 0.05 * s;
        grupo.add(meshCentro);

        const configCapas = [
            { num: 6, r: 0.10 * s, w: 0.55 * s, h: 0.70 * s, rotX: 0.32, y: 0.05 * s },
            { num: 8, r: 0.22 * s, w: 0.75 * s, h: 0.85 * s, rotX: 0.56, y: 0.02 * s },
            { num: 10, r: 0.35 * s, w: 0.95 * s, h: 0.95 * s, rotX: 0.82, y: -0.02 * s },
            { num: 12, r: 0.48 * s, w: 1.10 * s, h: 1.00 * s, rotX: 1.12, y: -0.06 * s }
        ];

        configCapas.forEach((cfg, idx) => {
            const geo = this.crearGeometriaPetalo(cfg.w, cfg.h, 0.35, -0.15);
            for (let i = 0; i < cfg.num; i++) {
                const rotY = (i * Math.PI * 2) / cfg.num + (idx * 0.45);
                grupo.add(this.crearPetaloEnAnillo(geo, mat, cfg.r, cfg.y, cfg.rotX, rotY));
            }
        });

        return grupo;
    },

    // 3. TULIPÁN 3D (Copa estilizada suave con 6 pétalos en cáliz)
    crearTulipan(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Tulipan3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.76 });
        const s = escala * 0.85;

        // 3 estambres interiores oscuros
        for (let e = 0; e < 3; e++) {
            const rotE = (e * Math.PI * 2) / 3;
            const geoE = new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.45 * s, 6);
            geoE.translate(0, 0.22 * s, 0);
            const mE = new THREE.Mesh(geoE, Materiales3D.crear('#1a1412'));
            mE.position.set(Math.cos(rotE) * 0.08 * s, 0.05 * s, Math.sin(rotE) * 0.08 * s);
            grupo.add(mE);
        }

        // 3 pétalos interiores acopados
        const geoInt = this.crearGeometriaTulipan(0.85 * s, 1.35 * s);
        for (let i = 0; i < 3; i++) {
            const rotY = (i * Math.PI * 2) / 3;
            grupo.add(this.crearPetaloEnAnillo(geoInt, mat, 0.10 * s, 0.05 * s, 0.18, rotY));
        }

        // 3 pétalos exteriores envolventes (desfasados 60°)
        const geoExt = this.crearGeometriaTulipan(0.95 * s, 1.40 * s);
        for (let i = 0; i < 3; i++) {
            const rotY = (i * Math.PI * 2) / 3 + Math.PI / 3;
            grupo.add(this.crearPetaloEnAnillo(geoExt, mat, 0.18 * s, 0.02 * s, 0.28, rotY));
        }

        return grupo;
    },

    // 4. CLAVEL 3D (Cáliz verde tubular con ramillete de pétalos rizados)
    crearClavel(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Clavel3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.80 });
        const s = escala * 0.88;

        // Cáliz verde tubular debajo
        const geoCaliz = new THREE.CylinderGeometry(0.20 * s, 0.12 * s, 0.55 * s, 12);
        geoCaliz.translate(0, -0.27 * s, 0);
        const meshCaliz = new THREE.Mesh(geoCaliz, Materiales3D.verdeCaliz());
        grupo.add(meshCaliz);

        const capas = [
            { num: 8, r: 0.12 * s, w: 0.45 * s, h: 0.60 * s, rotX: 0.28, y: 0.05 * s },
            { num: 12, r: 0.22 * s, w: 0.55 * s, h: 0.65 * s, rotX: 0.55, y: 0.02 * s },
            { num: 14, r: 0.34 * s, w: 0.65 * s, h: 0.70 * s, rotX: 0.85, y: -0.02 * s },
            { num: 16, r: 0.45 * s, w: 0.70 * s, h: 0.72 * s, rotX: 1.15, y: -0.06 * s }
        ];

        capas.forEach(c => {
            const geo = this.crearGeometriaPetalo(c.w, c.h, 0.28, -0.20);
            for (let i = 0; i < c.num; i++) {
                const rotY = (i * Math.PI * 2) / c.num;
                grupo.add(this.crearPetaloEnAnillo(geo, mat, c.r, c.y, c.rotX, rotY));
            }
        });

        return grupo;
    },

    // 5. GIRASOL 3D (Radiante, plano y botánicamente fiel como el sol)
    // Pétalos dorados planos radiantes (rotX ~ 1.40 a 1.52) alrededor del disco de chocolate
    crearGirasol(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Girasol3D';
        const s = escala;

        // Botón central aterciopelado chocolate (convexa suave)
        const geoCentro = new THREE.CylinderGeometry(0.50 * s, 0.44 * s, 0.14 * s, 32);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.cafeCentro());
        meshCentro.position.y = 0.04 * s;
        grupo.add(meshCentro);

        // Placa trasera oclusora que previene cualquier intersección posterior
        const geoFondo = new THREE.CylinderGeometry(0.52 * s, 0.52 * s, 0.04 * s, 32);
        geoFondo.position.y = -0.02 * s;
        grupo.add(new THREE.Mesh(geoFondo, Materiales3D.cafeCentro()));

        // Anillo de polen dorado
        const geoTorus = new THREE.TorusGeometry(0.44 * s, 0.04 * s, 8, 32);
        geoTorus.rotateX(Math.PI / 2);
        const meshTorus = new THREE.Mesh(geoTorus, Materiales3D.doradoCentro());
        meshTorus.position.y = 0.08 * s;
        grupo.add(meshTorus);

        // Capa 1 (interior): 20 pétalos dorados que abren casi planos (rotX = 1.40)
        const matPetalo = Materiales3D.crear(colorHex || '#ffb703', { roughness: 0.76 });
        const geoPetalo1 = this.crearGeometriaPetalo(0.24 * s, 0.90 * s, 0.12, 0.0, true);
        for (let i = 0; i < 20; i++) {
            const rotY = (i * Math.PI * 2) / 20;
            grupo.add(this.crearPetaloEnAnillo(geoPetalo1, matPetalo, 0.46 * s, 0.04 * s, 1.40, rotY));
        }

        // Capa 2 (exterior): 20 pétalos dorados planos (rotX = 1.52) desfasados
        const geoPetalo2 = this.crearGeometriaPetalo(0.26 * s, 0.98 * s, 0.10, 0.0, true);
        for (let i = 0; i < 20; i++) {
            const rotY = (i * Math.PI * 2) / 20 + (Math.PI / 20);
            grupo.add(this.crearPetaloEnAnillo(geoPetalo2, matPetalo, 0.50 * s, 0.01 * s, 1.52, rotY));
        }

        // Brácteas verdes debajo del disco
        const geoBractea = this.crearGeometriaHoja(0.20 * s, 0.55 * s, 0.15);
        const matBractea = Materiales3D.verdeCaliz();
        for (let b = 0; b < 12; b++) {
            const rotY = (b * Math.PI * 2) / 12;
            grupo.add(this.crearPetaloEnAnillo(geoBractea, matBractea, 0.40 * s, -0.08 * s, 1.70, rotY));
        }

        return grupo;
    },

    // 6. DALIA 3D (Mandala concéntrico geométrico con pétalos ordenados)
    crearDalia(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Dalia3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        // Botón central
        const geoCentro = new THREE.SphereGeometry(0.14 * s, 12, 12);
        grupo.add(new THREE.Mesh(geoCentro, Materiales3D.doradoCentro()));

        const anillos = [
            { num: 8, r: 0.14 * s, w: 0.24 * s, h: 0.55 * s, rotX: 0.38, y: 0.06 * s },
            { num: 12, r: 0.26 * s, w: 0.28 * s, h: 0.65 * s, rotX: 0.65, y: 0.02 * s },
            { num: 16, r: 0.40 * s, w: 0.32 * s, h: 0.75 * s, rotX: 0.92, y: -0.02 * s },
            { num: 20, r: 0.54 * s, w: 0.36 * s, h: 0.85 * s, rotX: 1.20, y: -0.06 * s }
        ];

        anillos.forEach(a => {
            const geo = this.crearGeometriaPetalo(a.w, a.h, 0.38, -0.05, true);
            for (let i = 0; i < a.num; i++) {
                const rotY = (i * Math.PI * 2) / a.num;
                grupo.add(this.crearPetaloEnAnillo(geo, mat, a.r, a.y, a.rotX, rotY));
            }
        });

        return grupo;
    },

    // 7. HORTENSIA 3D (Cúpula esférica de florecitas suaves de 4 pétalos)
    crearHortensia(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Hortensia3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala * 0.90;

        const numRacimos = 18;
        for (let i = 0; i < numRacimos; i++) {
            const phi = Math.acos(-1 + (2 * i) / numRacimos);
            const theta = Math.sqrt(numRacimos * Math.PI) * phi;
            const rEsfera = 0.82 * s;

            const racimo = new THREE.Group();
            racimo.position.set(
                Math.cos(theta) * Math.sin(phi) * rEsfera,
                Math.cos(phi) * rEsfera * 0.85,
                Math.sin(theta) * Math.sin(phi) * rEsfera
            );
            racimo.lookAt(0, 0, 0);
            racimo.rotateY(Math.PI);

            const geoPetalo = this.crearGeometriaPetalo(0.22 * s, 0.36 * s, 0.15, 0.0);
            for (let k = 0; k < 4; k++) {
                const a = (k * Math.PI) / 2;
                const m = new THREE.Mesh(geoPetalo, mat);
                m.rotation.z = a;
                m.position.set(Math.cos(a) * 0.10 * s, Math.sin(a) * 0.10 * s, 0);
                racimo.add(m);
            }
            grupo.add(racimo);
        }
        return grupo;
    },

    // 8. SAKURA 3D (Flor de cerezo primaveral con 5 pétalos y centro carmesí)
    crearSakura(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Sakura3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        const geo = this.crearGeometriaPetalo(0.65 * s, 0.90 * s, 0.18, -0.08);
        for (let i = 0; i < 5; i++) {
            const rotY = (i * Math.PI * 2) / 5;
            grupo.add(this.crearPetaloEnAnillo(geo, mat, 0.15 * s, 0, 1.32, rotY));
        }

        // Centro carmesí con pistilos
        const geoCentro = new THREE.SphereGeometry(0.12 * s, 12, 12);
        geoCentro.scale(1, 0.4, 1);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.crear('#d90429', { roughness: 0.7 }));
        meshCentro.position.y = 0.04 * s;
        grupo.add(meshCentro);

        return grupo;
    },

    // 9. MARGARITA 3D (Botón dorado plano con corona de pétalos blancos radiantes)
    crearMargarita(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Margarita3D';
        const matPetalo = Materiales3D.crear(colorHex || '#ffffff', { roughness: 0.76 });
        const s = escala;

        // Botón dorado central suave
        const geoCentro = new THREE.SphereGeometry(0.32 * s, 16, 16);
        geoCentro.scale(1, 0.40, 1);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.doradoCentro());
        meshCentro.position.y = 0.03 * s;
        grupo.add(meshCentro);

        // 22 pétalos blancos radiantes en plano
        const numP = 22;
        const geoP = this.crearGeometriaPetalo(0.18 * s, 0.88 * s, 0.10, 0.0, true);
        for (let i = 0; i < numP; i++) {
            const rotY = (i * Math.PI * 2) / numP;
            grupo.add(this.crearPetaloEnAnillo(geoP, matPetalo, 0.28 * s, 0.02 * s, 1.48, rotY));
        }
        return grupo;
    },

    // 10. AMAPOLA 3D (4 grandes pétalos sedosos carmesí en copa amplia)
    crearAmapola(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Amapola3D';
        const mat = Materiales3D.crear(colorHex || '#e63946', { roughness: 0.78 });
        const s = escala;

        const geo = this.crearGeometriaPetalo(1.15 * s, 1.35 * s, 0.35, -0.18);
        for (let i = 0; i < 4; i++) {
            const rotY = (i * Math.PI * 2) / 4 + 0.35;
            grupo.add(this.crearPetaloEnAnillo(geo, mat, 0.18 * s, 0.04 * s, 0.95, rotY));
        }

        const geoCentro = new THREE.SphereGeometry(0.24 * s, 16, 16);
        geoCentro.scale(1, 0.45, 1);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.cafeCentro());
        meshCentro.position.y = 0.08 * s;
        grupo.add(meshCentro);

        return grupo;
    },

    // 11. LIRIO 3D (6 pétalos recurvados con estambres elegantes integrados)
    crearLirio(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Lirio3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        // 3 pétalos interiores
        const geoInt = this.crearGeometriaPetalo(0.65 * s, 1.70 * s, 0.28, -0.42);
        for (let i = 0; i < 3; i++) {
            const rotY = (i * Math.PI * 2) / 3;
            grupo.add(this.crearPetaloEnAnillo(geoInt, mat, 0.15 * s, 0, 0.75, rotY));
        }

        // 3 pétalos exteriores desfasados
        const geoExt = this.crearGeometriaPetalo(0.75 * s, 1.80 * s, 0.25, -0.48);
        for (let i = 0; i < 3; i++) {
            const rotY = (i * Math.PI * 2) / 3 + Math.PI / 3;
            grupo.add(this.crearPetaloEnAnillo(geoExt, mat, 0.20 * s, -0.02 * s, 0.95, rotY));
        }

        // 6 estambres conectados limpiamente en el centro
        const matEstambre = Materiales3D.crear('#c9e4ca');
        const matAntera = Materiales3D.crear('#7a3e1d');

        for (let j = 0; j < 6; j++) {
            const rotY = (j * Math.PI * 2) / 6 + 0.52;
            const subE = new THREE.Group();
            subE.rotation.y = rotY;

            // Filamento curvado
            const puntosE = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0.45 * s, 0.12 * s),
                new THREE.Vector3(0, 0.90 * s, 0.28 * s)
            ];
            const curvaE = new THREE.CatmullRomCurve3(puntosE);
            const geoE = new THREE.TubeGeometry(curvaE, 10, 0.02 * s, 6, false);
            subE.add(new THREE.Mesh(geoE, matEstambre));

            // Antera en la punta del filamento
            const antera = new THREE.Mesh(new THREE.BoxGeometry(0.06 * s, 0.16 * s, 0.06 * s), matAntera);
            antera.position.copy(puntosE[2]);
            antera.rotation.x = 0.45;
            subE.add(antera);

            grupo.add(subE);
        }

        return grupo;
    },

    // 12. ORQUÍDEA 3D (Silueta exótica: sépalos, 2 alas redondeadas y labello)
    crearOrquidea(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Orquidea3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        // 3 Sépalos
        const sepalosConfig = [
            { rotZ: 0, y: 0.45 * s, w: 0.52 * s, h: 1.05 * s },
            { rotZ: 2.1, y: -0.22 * s, w: 0.46 * s, h: 0.92 * s },
            { rotZ: -2.1, y: -0.22 * s, w: 0.46 * s, h: 0.92 * s }
        ];
        sepalosConfig.forEach(cfg => {
            const geo = this.crearGeometriaPetalo(cfg.w, cfg.h, 0.20, -0.08);
            const m = new THREE.Mesh(geo, mat);
            m.rotation.z = cfg.rotZ;
            m.position.set(0, cfg.y, 0);
            grupo.add(m);
        });

        // 2 alas redondeadas laterales
        [-1, 1].forEach(lado => {
            const geo = this.crearGeometriaPetalo(0.92 * s, 1.10 * s, 0.26, -0.10);
            const m = new THREE.Mesh(geo, mat);
            m.position.set(lado * 0.45 * s, 0.10 * s, 0.08 * s);
            m.rotation.z = lado * -0.55;
            m.rotation.y = lado * 0.20;
            grupo.add(m);
        });

        // Labello esculpido magenta
        const geoLabello = this.crearGeometriaPetalo(0.72 * s, 0.92 * s, 0.42, -0.18);
        const mLabello = new THREE.Mesh(geoLabello, Materiales3D.crear('#7209b7', { roughness: 0.75 }));
        mLabello.position.set(0, -0.30 * s, 0.16 * s);
        mLabello.rotation.x = -0.35;
        grupo.add(mLabello);

        return grupo;
    },

    // 13. LAVANDA 3D (Espiga esbelta con florecitas púrpuras escalonadas)
    crearLavanda(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Lavanda3D';
        const mat = Materiales3D.crear(colorHex || '#9d4edd', { roughness: 0.78 });
        const s = escala * 0.90;

        const niveles = 9;
        const altoTotal = 2.2 * s;

        for (let n = 0; n < niveles; n++) {
            const y = (n / niveles) * altoTotal;
            const rNivel = (1 - (n / niveles) * 0.35) * 0.24 * s;
            for (let k = 0; k < 4; k++) {
                const a = (k * Math.PI * 2) / 4 + n * 0.45;
                const geo = new THREE.SphereGeometry(0.08 * s, 8, 8);
                geo.scale(1, 1.4, 0.85);
                const m = new THREE.Mesh(geo, mat);
                m.position.set(Math.cos(a) * rNivel, y, Math.sin(a) * rNivel);
                grupo.add(m);
            }
        }
        return grupo;
    },

    // 14. GYPSOPHILA 3D (Nube aérea de delicadas florecitas blancas de bebé)
    crearGypsophila(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Gypsophila3D';
        const matFlor = Materiales3D.crear(colorHex || '#ffffff', { roughness: 0.78 });
        const matRama = Materiales3D.verdeTallo('#4a7c59');
        const s = escala * 0.90;

        const ramas = [
            [-0.45, 1.2, 0.18], [0.45, 1.1, -0.18], [-0.28, 1.6, 0.18], [0.28, 1.5, 0.10],
            [-0.55, 0.8, -0.18], [0.55, 0.9, 0.18], [0.0, 1.75, 0.0], [-0.18, 1.0, -0.25]
        ];

        ramas.forEach(p => {
            const sub = new THREE.Group();
            sub.position.set(p[0] * s, p[1] * s, p[2] * s);

            // Ramita conectora fina
            const lineaGeo = new THREE.CylinderGeometry(0.015 * s, 0.015 * s, 0.4 * s, 4);
            const mLinea = new THREE.Mesh(lineaGeo, matRama);
            mLinea.position.y = -0.2 * s;
            sub.add(mLinea);

            // Florecita de 4 pétalos
            for (let i = 0; i < 4; i++) {
                const a = (i * Math.PI * 2) / 4;
                const geo = new THREE.SphereGeometry(0.045 * s, 6, 6);
                const m = new THREE.Mesh(geo, matFlor);
                m.position.set(Math.cos(a) * 0.06 * s, Math.sin(a) * 0.06 * s, 0);
                sub.add(m);
            }
            grupo.add(sub);
        });
        return grupo;
    },

    // 15. EUCALIPTO 3D (Hojas suaves redondeadas opuestas verde salvia)
    crearEucalipto(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Eucalipto3D';
        const matHoja = Materiales3D.crear(colorHex || '#84a59d', { roughness: 0.75 });
        const s = escala;

        const numPares = 6;
        const largoTotal = 2.4 * s;

        // Tallo central verde suave
        const { mesh: meshTallo } = this.crearTallo3D(largoTotal, 0.035 * s, 0.12 * s, Materiales3D.verdeTallo());
        grupo.add(meshTallo);

        for (let i = 1; i <= numPares; i++) {
            const t = i / numPares;
            const y = t * largoTotal;
            const wHoja = (1.0 - t * 0.28) * 0.42 * s;
            const hHoja = (1.0 - t * 0.28) * 0.65 * s;
            const rotY = (i % 2 === 0) ? 0.2 : Math.PI / 2 + 0.2;

            [-1, 1].forEach(lado => {
                const geo = this.crearGeometriaHoja(wHoja, hHoja, 0.12);
                const m = new THREE.Mesh(geo, matHoja);
                m.position.set(lado * 0.05 * s, y, 0);
                m.rotation.y = rotY;
                m.rotation.z = lado * (Math.PI / 2.5);
                m.rotation.x = 0.15;
                m.castShadow = true;
                grupo.add(m);
            });
        }
        return grupo;
    },

    // 16. HELECHO 3D (Fronda verde decorativa arqueada y elegante)
    crearHelecho(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Helecho3D';
        const mat = Materiales3D.crear(colorHex || '#2d6a4f', { roughness: 0.72 });
        const s = escala;

        const numPares = 11;
        const largo = 2.6 * s;

        // Raquis central
        const { mesh: meshTallo } = this.crearTallo3D(largo, 0.030 * s, 0.18 * s, Materiales3D.verdeTallo());
        grupo.add(meshTallo);

        for (let i = 1; i <= numPares; i++) {
            const t = i / numPares;
            const y = t * largo;
            const anchoFoliolo = Math.sin(t * Math.PI) * 0.38 * s;
            const largoFoliolo = Math.sin(t * Math.PI) * 0.85 * s;

            [-1, 1].forEach(lado => {
                const geo = this.crearGeometriaHoja(anchoFoliolo, largoFoliolo, 0.15);
                const m = new THREE.Mesh(geo, mat);
                m.position.set(lado * 0.04 * s, y, 0);
                m.rotation.z = lado * (Math.PI / 2.3);
                m.rotation.x = 0.20;
                m.castShadow = true;
                grupo.add(m);
            });
        }
        return grupo;
    },

    // LAZO SATINADO 3D (Remate suave con bucles inflados y cintas colgantes)
    crearLazoSatinado(colorHex = '#ffb3c6', escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'LazoSatinado3D';
        const mat = Materiales3D.satenRosa(colorHex);
        const s = escala;

        // Nudo central abullonado
        const geoNudo = new THREE.SphereGeometry(0.24 * s, 16, 16);
        geoNudo.scale(1.2, 0.9, 0.9);
        const meshNudo = new THREE.Mesh(geoNudo, mat);
        grupo.add(meshNudo);

        // Bucle izquierdo
        const curvaIzq = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-0.75 * s, 0.45 * s, 0.25 * s),
            new THREE.Vector3(-1.15 * s, -0.18 * s, 0.18 * s),
            new THREE.Vector3(-0.18 * s, -0.08 * s, 0)
        );
        grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curvaIzq, 20, 0.14 * s, 10, false), mat));

        // Bucle derecho
        const curvaDer = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.75 * s, 0.45 * s, 0.25 * s),
            new THREE.Vector3(1.15 * s, -0.18 * s, 0.18 * s),
            new THREE.Vector3(0.18 * s, -0.08 * s, 0)
        );
        grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curvaDer, 20, 0.14 * s, 10, false), mat));

        // Cinta colgante izquierda
        const curvaCintaIzq = new THREE.CubicBezierCurve3(
            new THREE.Vector3(-0.1 * s, -0.08 * s, 0),
            new THREE.Vector3(-0.35 * s, -0.75 * s, 0.18 * s),
            new THREE.Vector3(-0.55 * s, -1.45 * s, 0.10 * s),
            new THREE.Vector3(-0.70 * s, -1.95 * s, 0)
        );
        grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curvaCintaIzq, 24, 0.12 * s, 8, false), mat));

        // Cinta colgante derecha
        const curvaCintaDer = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0.1 * s, -0.08 * s, 0),
            new THREE.Vector3(0.35 * s, -0.75 * s, 0.18 * s),
            new THREE.Vector3(0.55 * s, -1.45 * s, 0.10 * s),
            new THREE.Vector3(0.70 * s, -1.95 * s, 0)
        );
        grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curvaCintaDer, 24, 0.12 * s, 8, false), mat));

        return grupo;
    },

    // Constructor maestro según el tipo de flor
    crearFlor(tipo, colorHex, escala = 1) {
        switch (tipo) {
            case 'rosa': return this.crearRosa(colorHex, escala);
            case 'peonia': return this.crearPeonia(colorHex, escala);
            case 'tulipan': return this.crearTulipan(colorHex, escala);
            case 'clavel': return this.crearClavel(colorHex, escala);
            case 'girasol': return this.crearGirasol(colorHex, escala);
            case 'dalia': return this.crearDalia(colorHex, escala);
            case 'hortensia': return this.crearHortensia(colorHex, escala);
            case 'sakura': return this.crearSakura(colorHex, escala);
            case 'margarita': return this.crearMargarita(colorHex, escala);
            case 'amapola': return this.crearAmapola(colorHex, escala);
            case 'lirio': return this.crearLirio(colorHex, escala);
            case 'orquidea': return this.crearOrquidea(colorHex, escala);
            case 'lavanda': return this.crearLavanda(colorHex, escala);
            case 'gypsophila': return this.crearGypsophila(colorHex, escala);
            case 'eucalipto': return this.crearEucalipto(colorHex, escala);
            case 'helecho': return this.crearHelecho(colorHex, escala);
            default: return this.crearRosa(colorHex, escala);
        }
    }
};

// ===================================================
// MOTOR 3D: VIEWPORTS Y ORBIT CONTROLS
// ===================================================
const Motor3D = {
    virtualizador: null,
    ramo: null,

    crearEscena(contenedorId, config = {}) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return null;

        const ancho = contenedor.clientWidth || config.ancho || 450;
        const alto = contenedor.clientHeight || config.alto || 380;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(config.bgColor || 0xfff7f9);

        const camera = new THREE.PerspectiveCamera(config.fov || 38, ancho / alto, 0.1, 1000);
        camera.position.set(0, 1.2, 5.8);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setSize(ancho, alto);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        if (THREE.sRGBEncoding) {
            renderer.outputEncoding = THREE.sRGBEncoding;
        }
        if (THREE.ACESFilmicToneMapping) {
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.05;
        }

        contenedor.innerHTML = '';
        contenedor.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.minDistance = 1.8;
        controls.maxDistance = 12.0;
        controls.target.set(0, 0.75, 0);
        controls.maxPolarAngle = Math.PI * 0.88;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;

        // Iluminación envolvente suave de estudio botánico de alta gama
        const hemiLight = new THREE.HemisphereLight(0xfff0f5, 0xffe4ec, 0.75);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xfffaf5, 0.70);
        dirLight.position.set(2.8, 4.5, 3.8);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.bias = -0.001;
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xfce4ec, 0.45);
        fillLight.position.set(-3.0, 1.8, 2.5);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xfff5f8, 0.35);
        rimLight.position.set(0.0, 3.8, -3.2);
        scene.add(rimLight);

        const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.10 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -1.2;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);

        const objetoEscena = {
            scene,
            camera,
            renderer,
            controls,
            contenedor,
            animId: null,
            grupoContenido: new THREE.Group(),
            particulas3D: [],
            autoGiro: true
        };

        scene.add(objetoEscena.grupoContenido);

        function animar() {
            objetoEscena.animId = requestAnimationFrame(animar);
            controls.update();

            objetoEscena.particulas3D.forEach(p => {
                p.position.y += p.userData.velY;
                p.scale.multiplyScalar(0.985);
                if (p.scale.x < 0.05) {
                    p.position.set(
                        (Math.random() - 0.5) * 1.5,
                        0.5 + Math.random() * 1.2,
                        (Math.random() - 0.5) * 1.5
                    );
                    p.scale.set(1, 1, 1);
                }
            });

            renderer.render(scene, camera);
        }

        animar();

        window.addEventListener('resize', () => {
            if (!contenedor.clientWidth) return;
            camera.aspect = contenedor.clientWidth / contenedor.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
        });

        return objetoEscena;
    },

    // Virtualización limpia e interactiva de cada flor
    virtualizarFlor(itemDef, onProgreso, onFin) {
        if (!this.virtualizador) {
            this.virtualizador = this.crearEscena('virtualizer-3d-container', {
                ancho: 420,
                alto: 360,
                bgColor: 0xfff8fa
            });
        }

        const v = this.virtualizador;
        if (!v) return;

        while (v.grupoContenido.children.length > 0) {
            v.grupoContenido.remove(v.grupoContenido.children[0]);
        }
        v.particulas3D = [];
        v.grupoContenido.rotation.y = 0;
        v.controls.target.set(0, 0.70, 0);
        v.camera.position.set(0, 1.3, 5.2);
        v.controls.update();

        const florRaiz = new THREE.Group();
        const alturaTallo = 2.4;
        const { mesh: meshTallo, fin: finTallo } = GeneradorFlores3D.crearTallo3D(alturaTallo, 0.065, 0.16);
        meshTallo.position.y = -1.15;
        florRaiz.add(meshTallo);

        // Hojas limpias en el tallo
        const matHoja = Materiales3D.verdeHoja();
        const geoHoja1 = GeneradorFlores3D.crearGeometriaHoja(0.40, 1.15, 0.22);
        const hoja1 = new THREE.Mesh(geoHoja1, matHoja);
        hoja1.position.set(-0.25, -0.3, 0);
        hoja1.rotation.z = -0.7;
        hoja1.rotation.y = -0.4;
        florRaiz.add(hoja1);

        const geoHoja2 = GeneradorFlores3D.crearGeometriaHoja(0.38, 1.05, 0.22);
        const hoja2 = new THREE.Mesh(geoHoja2, matHoja);
        hoja2.position.set(0.25, 0.25, 0);
        hoja2.rotation.z = 0.7;
        hoja2.rotation.y = 0.4;
        florRaiz.add(hoja2);

        // Cabeza floral limpia
        const florCabeza = GeneradorFlores3D.crearFlor(itemDef.tipo, itemDef.colorSeleccionado, 1.0);
        florCabeza.position.copy(finTallo);
        florCabeza.position.y += -1.15;

        // Inclinación hacia la cámara para poder admirar el centro y los pétalos
        if (itemDef.tipo !== 'lavanda' && itemDef.tipo !== 'eucalipto' && itemDef.tipo !== 'helecho') {
            florCabeza.rotation.x = 0.35;
        }
        florRaiz.add(florCabeza);

        v.grupoContenido.add(florRaiz);

        // Chispas mágicas sutiles
        const matChispa = new THREE.MeshBasicMaterial({ color: new THREE.Color(itemDef.colorSeleccionado) });
        for (let i = 0; i < 18; i++) {
            const geoC = new THREE.SphereGeometry(0.038, 8, 8);
            const mC = new THREE.Mesh(geoC, matChispa);
            mC.position.set((Math.random() - 0.5) * 1.4, Math.random() * 2, (Math.random() - 0.5) * 1.4);
            mC.userData.velY = 0.012 + Math.random() * 0.018;
            v.grupoContenido.add(mC);
            v.particulas3D.push(mC);
        }

        const duracionMs = 1500;
        const inicioTiempo = performance.now();

        function animarBrote(ahora) {
            const transcurrido = ahora - inicioTiempo;
            const progreso = Math.min(1, transcurrido / duracionMs);

            const progresoTallo = Math.min(1, progreso * 1.15);
            meshTallo.scale.y = progresoTallo;
            florCabeza.position.y = -1.15 + finTallo.y * progresoTallo;
            florCabeza.position.x = finTallo.x * progresoTallo;
            florCabeza.position.z = finTallo.z * progresoTallo;

            const progresoFlor = Math.max(0.01, Math.min(1, (progreso - 0.25) / 0.75));
            florCabeza.scale.setScalar(progresoFlor);
            hoja1.scale.setScalar(Math.max(0.01, (progreso - 0.20) / 0.80));
            hoja2.scale.setScalar(Math.max(0.01, (progreso - 0.30) / 0.70));

            if (onProgreso) onProgreso(progreso);

            if (progreso < 1) {
                requestAnimationFrame(animarBrote);
            } else {
                florCabeza.scale.setScalar(1);
                meshTallo.scale.y = 1;
                florCabeza.position.copy(finTallo);
                florCabeza.position.y += -1.15;
                hoja1.scale.setScalar(1);
                hoja2.scale.setScalar(1);
                if (onFin) onFin();
            }
        }

        requestAnimationFrame(animarBrote);
    },

    // Ensamblaje armónico del Ramo Completo en 3D (Cúpula de floristería de lujo)
    iniciarRamo3D(floresSeleccionadas) {
        if (!this.ramo) {
            this.ramo = this.crearEscena('bouquet-3d-container', {
                ancho: 540,
                alto: 490,
                bgColor: 0xfff5f8
            });
        }

        const r = this.ramo;
        if (!r) return;

        while (r.grupoContenido.children.length > 0) {
            r.grupoContenido.remove(r.grupoContenido.children[0]);
        }
        r.particulas3D = [];
        r.grupoContenido.rotation.y = 0;

        const bouquetGrupo = new THREE.Group();
        bouquetGrupo.position.y = 0.15;

        // Punto de amarre central del ramo (donde se ata el lazo)
        const puntoLazo = new THREE.Vector3(0, -0.75, 0);

        const follaje = floresSeleccionadas.filter(f => f.tipo === 'eucalipto' || f.tipo === 'helecho');
        const principales = floresSeleccionadas.filter(f => f.tipo !== 'eucalipto' && f.tipo !== 'helecho');
        const floresParaDomo = principales.length > 0 ? principales : follaje;
        const follajeDeFondo = principales.length > 0 ? follaje : [];

        // 1. Follaje de fondo que enmarca el ramo
        const configAlas = [
            { pos: new THREE.Vector3(-1.15, 0.55, -0.35), rotZ: 0.35, rotY: 0.25 },
            { pos: new THREE.Vector3(1.15, 0.55, -0.35), rotZ: -0.35, rotY: -0.25 },
            { pos: new THREE.Vector3(-0.75, 0.95, -0.45), rotZ: 0.20, rotY: 0.15 },
            { pos: new THREE.Vector3(0.75, 0.95, -0.45), rotZ: -0.20, rotY: -0.15 }
        ];

        follajeDeFondo.forEach((fol, idx) => {
            const ramaMesh = GeneradorFlores3D.crearFlor(fol.tipo, fol.color, 0.85);
            const cfg = configAlas[idx % configAlas.length];
            ramaMesh.position.copy(cfg.pos);
            ramaMesh.rotation.z = cfg.rotZ;
            ramaMesh.rotation.y = cfg.rotY;
            bouquetGrupo.add(ramaMesh);
        });

        // 2. Flores distribuidas en cúpula armónica
        const total = floresParaDomo.length;
        const plantillas3D = this.calcularPlantillas3D(total);

        floresParaDomo.forEach((flor, idx) => {
            const p = plantillas3D[idx % plantillas3D.length];
            const florCabeza = GeneradorFlores3D.crearFlor(flor.tipo, flor.color, p.scale || 0.85);
            florCabeza.position.set(p.x, p.y, p.z);

            // Orientación natural: flor mira hacia afuera desde el centro del ramo e inclinada hacia el frente (+Z)
            const dir = new THREE.Vector3(
                p.x * 1.1,
                (p.y - puntoLazo.y) * 0.95,
                (p.z + 0.35) * 1.1
            ).normalize();
            florCabeza.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            bouquetGrupo.add(florCabeza);

            // Tallo convergente limpio desde el lazo hasta la base de la flor
            const curvaTallo = new THREE.CatmullRomCurve3([
                new THREE.Vector3(p.x, p.y - 0.08, p.z),
                new THREE.Vector3(p.x * 0.45, puntoLazo.y + 0.35, p.z * 0.45),
                puntoLazo.clone().add(new THREE.Vector3(p.x * 0.08, 0.02, p.z * 0.08))
            ]);
            const geoTallo = new THREE.TubeGeometry(curvaTallo, 16, 0.045, 8, false);
            const meshTallo = new THREE.Mesh(geoTallo, Materiales3D.verdeTallo());
            bouquetGrupo.add(meshTallo);
        });

        // 3. Collar de hojas verdes de floristería que sostienen el domo
        const numHojasCollar = 8;
        const matHojaCollar = Materiales3D.verdeHoja();
        for (let i = 0; i < numHojasCollar; i++) {
            const a = (i * Math.PI * 2) / numHojasCollar;
            const geoHoja = GeneradorFlores3D.crearGeometriaHoja(0.42, 1.10, 0.28);
            const hoja = new THREE.Mesh(geoHoja, matHojaCollar);

            // Posicionadas en el perímetro inferior debajo de las flores
            const radioCollar = 0.88;
            hoja.position.set(Math.cos(a) * radioCollar, puntoLazo.y + 0.45, Math.sin(a) * radioCollar * 0.85);

            // Orientadas hacia afuera abrazando la base
            const dirHoja = new THREE.Vector3(Math.cos(a), 0.35, Math.sin(a)).normalize();
            hoja.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirHoja);
            bouquetGrupo.add(hoja);
        }

        // 4. Haz de tallos inferiores reunidos y cortados parejos
        const totalTallosInf = 9;
        for (let i = 0; i < totalTallosInf; i++) {
            const t = (i / (totalTallosInf - 1)) - 0.5;
            const geoTalloInf = new THREE.CylinderGeometry(0.038, 0.038, 1.05, 8);
            geoTalloInf.translate(0, -0.52, 0);
            const mTI = new THREE.Mesh(geoTalloInf, Materiales3D.verdeTallo());
            mTI.position.set(t * 0.28, puntoLazo.y, (Math.random() - 0.5) * 0.12);
            mTI.rotation.z = t * 0.15;
            bouquetGrupo.add(mTI);
        }

        // 5. Lazo satinado de regalo en el punto de amarre
        const lazo = GeneradorFlores3D.crearLazoSatinado('#ffb3c6', 0.95);
        lazo.position.copy(puntoLazo);
        lazo.position.z += 0.22;
        bouquetGrupo.add(lazo);

        r.grupoContenido.add(bouquetGrupo);

        // Encuadre fotográfico de 3/4 desde arriba para apreciar cada flor
        r.controls.target.set(0, 0.40, 0);
        r.camera.position.set(0, 1.60, 4.7);
        r.controls.update();
    },

    // Distribución armónica en cúpula floral según la cantidad de flores
    calcularPlantillas3D(total) {
        if (total === 1) {
            return [{ x: 0, y: 0.75, z: 0.15, scale: 0.95 }];
        }
        if (total === 2) {
            return [
                { x: -0.48, y: 0.72, z: 0.15, scale: 0.88 },
                { x: 0.48, y: 0.72, z: 0.15, scale: 0.88 }
            ];
        }
        if (total === 3) {
            return [
                { x: 0, y: 1.10, z: -0.05, scale: 0.86 },
                { x: -0.58, y: 0.55, z: 0.22, scale: 0.84 },
                { x: 0.58, y: 0.55, z: 0.22, scale: 0.84 }
            ];
        }
        if (total === 4) {
            return [
                { x: 0, y: 1.15, z: -0.08, scale: 0.84 },
                { x: -0.68, y: 0.68, z: 0.15, scale: 0.82 },
                { x: 0.68, y: 0.68, z: 0.15, scale: 0.82 },
                { x: 0, y: 0.32, z: 0.32, scale: 0.82 }
            ];
        }
        if (total === 5) {
            return [
                { x: 0, y: 0.72, z: 0.30, scale: 0.84 }, // Centro elevado al frente
                { x: 0, y: 1.35, z: -0.15, scale: 0.78 },
                { x: -0.80, y: 0.80, z: 0.08, scale: 0.78 },
                { x: 0.80, y: 0.80, z: 0.08, scale: 0.78 },
                { x: 0, y: 0.22, z: 0.36, scale: 0.78 }
            ];
        }
        if (total === 6) {
            return [
                { x: 0, y: 0.76, z: 0.28, scale: 0.84 }, // Centro
                { x: 0, y: 1.36, z: -0.12, scale: 0.78 },
                { x: -0.82, y: 0.90, z: 0.05, scale: 0.78 },
                { x: 0.82, y: 0.90, z: 0.05, scale: 0.78 },
                { x: -0.58, y: 0.28, z: 0.32, scale: 0.78 },
                { x: 0.58, y: 0.28, z: 0.32, scale: 0.78 }
            ];
        }
        if (total === 7) {
            return [
                { x: 0, y: 0.76, z: 0.28, scale: 0.84 }, // Centro
                { x: 0, y: 1.38, z: -0.14, scale: 0.76 },
                { x: -0.78, y: 1.05, z: 0.00, scale: 0.76 },
                { x: 0.78, y: 1.05, z: 0.00, scale: 0.76 },
                { x: -0.88, y: 0.48, z: 0.18, scale: 0.76 },
                { x: 0.88, y: 0.48, z: 0.18, scale: 0.76 },
                { x: 0, y: 0.20, z: 0.36, scale: 0.76 }
            ];
        }
        if (total === 8) {
            return [
                { x: -0.38, y: 0.80, z: 0.24, scale: 0.80 },
                { x: 0.38, y: 0.80, z: 0.24, scale: 0.80 },
                { x: 0, y: 1.38, z: -0.12, scale: 0.76 },
                { x: -0.88, y: 0.98, z: 0.02, scale: 0.76 },
                { x: 0.88, y: 0.98, z: 0.02, scale: 0.76 },
                { x: -0.85, y: 0.42, z: 0.20, scale: 0.76 },
                { x: 0.85, y: 0.42, z: 0.20, scale: 0.76 },
                { x: 0, y: 0.20, z: 0.36, scale: 0.76 }
            ];
        }
        if (total === 9) {
            return [
                { x: 0, y: 0.80, z: 0.26, scale: 0.82 },
                { x: -0.45, y: 1.18, z: 0.00, scale: 0.76 },
                { x: 0.45, y: 1.18, z: 0.00, scale: 0.76 },
                { x: 0, y: 1.42, z: -0.14, scale: 0.74 },
                { x: -0.95, y: 0.78, z: 0.08, scale: 0.74 },
                { x: 0.95, y: 0.78, z: 0.08, scale: 0.74 },
                { x: -0.60, y: 0.28, z: 0.32, scale: 0.74 },
                { x: 0.60, y: 0.28, z: 0.32, scale: 0.74 },
                { x: 0, y: 0.18, z: 0.38, scale: 0.74 }
            ];
        }
        // 10 flores (Cúpula de rosas idéntica a la referencia de floristería)
        return [
            { x: 0, y: 0.84, z: 0.25, scale: 0.82 },
            { x: -0.48, y: 0.62, z: 0.30, scale: 0.78 },
            { x: 0.48, y: 0.62, z: 0.30, scale: 0.78 },
            { x: 0, y: 1.42, z: -0.14, scale: 0.76 },
            { x: -0.78, y: 1.18, z: -0.04, scale: 0.75 },
            { x: 0.78, y: 1.18, z: -0.04, scale: 0.75 },
            { x: -1.08, y: 0.68, z: 0.10, scale: 0.75 },
            { x: 1.08, y: 0.68, z: 0.10, scale: 0.75 },
            { x: -0.65, y: 0.18, z: 0.36, scale: 0.75 },
            { x: 0.65, y: 0.18, z: 0.36, scale: 0.75 }
        ];
    }
};

// Exportar para acceso global en el navegador
if (typeof window !== 'undefined') {
    window.GeneradorFlores3D = GeneradorFlores3D;
    window.Motor3D = Motor3D;
}
