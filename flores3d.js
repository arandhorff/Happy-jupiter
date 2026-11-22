/**
 * MOTOR BOTÁNICO 3D REAL (Three.js WebGL)
 * Modelos tridimensionales paramétricos hiperdetallados con OrbitControls interactivos:
 * Rotación 360°, zoom in/out, inclinación, materiales botánicos aterciopelados PBR (sin pérdida de color ni destellos blancos),
 * sombreado sRGB / ACES Filmic Tone Mapping, y animación de florecimiento.
 */

// ===================================================
// UTILIDADES GEOMÉTRICAS Y MATERIALES BOTÁNICOS PBR
// ===================================================

const Materiales3D = {
    cache: new Map(),
    texturasCache: new Map(),

    // Genera una textura de gradiente botánico procedural (128x256)
    // Da profundidad orgánica: base más profunda/saturada, cuerpo con el color exacto,
    // y borde superior con sutil matiz translúcido suave.
    crearTexturaPetalo(colorHex) {
        if (typeof document === 'undefined') return null;
        if (this.texturasCache.has(colorHex)) return this.texturasCache.get(colorHex);

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const baseCol = new THREE.Color(colorHex);
        // Tono base: 22% más profundo y cálido para simular la sombra entre pétalos solapados
        const colGarganta = baseCol.clone().multiplyScalar(0.78);
        const colCuerpo = baseCol.clone();
        // Tono borde: suave aclarado aterciopelado (12% hacia blanco rosado)
        const colBorde = baseCol.clone().lerp(new THREE.Color('#ffffff'), 0.14);

        // Gradiente longitudinal (base a punta)
        const gradY = ctx.createLinearGradient(0, 256, 0, 0);
        gradY.addColorStop(0.0, `#${colGarganta.getHexString()}`);
        gradY.addColorStop(0.35, `#${colCuerpo.getHexString()}`);
        gradY.addColorStop(0.82, `#${colCuerpo.getHexString()}`);
        gradY.addColorStop(1.0, `#${colBorde.getHexString()}`);

        ctx.fillStyle = gradY;
        ctx.fillRect(0, 0, 128, 256);

        // Viñeteado lateral suave para acentuar la curvatura cilíndrica del pétalo
        const gradX = ctx.createLinearGradient(0, 0, 128, 0);
        gradX.addColorStop(0.0, 'rgba(0, 0, 0, 0.07)');
        gradX.addColorStop(0.2, 'rgba(255, 255, 255, 0.04)');
        gradX.addColorStop(0.5, 'rgba(255, 255, 255, 0.10)');
        gradX.addColorStop(0.8, 'rgba(255, 255, 255, 0.04)');
        gradX.addColorStop(1.0, 'rgba(0, 0, 0, 0.07)');

        ctx.fillStyle = gradX;
        ctx.fillRect(0, 0, 128, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        this.texturasCache.set(colorHex, texture);
        return texture;
    },

    // Material PBR botánico mate/aterciopelado
    // ROUGHNESS ALTO (0.78 - 0.82) y METALNESS 0.0 para evitar reflejos especulares blancos que queman el color
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
        return this.crear('#2a170d', { roughness: 0.88, metalness: 0.0, conTextura: false });
    },

    satenRosa(colorHex = '#ffb3c6') {
        return this.crear(colorHex, { roughness: 0.35, metalness: 0.08, conTextura: false });
    }
};

// ===================================================
// GENERADOR DE MESHES BOTÁNICOS 3D DE ALTA PRECISIÓN
// ===================================================
const GeneradorFlores3D = {

    // Pétalo curvo 3D de alta densidad (24x24 segmentos)
    // Combina: silueta botánica spatulada, copa esferoidal envolvente,
    // reborde superior recurvado hacia afuera y ondulaciones orgánicas.
    crearGeometriaPetalo(ancho, alto, curvaturaCopa = 0.35, curvaturaBorde = -0.22, rizado = 0.0) {
        const segX = 24;
        const segY = 24;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            const v = (y + alto * 0.5) / alto; // 0 (base) a 1 (punta)
            const u = x / (ancho * 0.5 + 0.0001); // -1 (izq) a 1 (der)

            // 1. Silueta botánica (base estrecha, vientre redondeado voluptuoso, ápice suave)
            const factorAncho = Math.sin(Math.pow(Math.max(0, v), 0.72) * Math.PI) * (0.2 + 0.8 * Math.sqrt(Math.max(0, v)));
            x *= factorAncho;
            pos.setX(i, x);

            // 2. Copa transversal envolvente (curvatura esferoidal)
            const uNorm = Math.min(1, Math.max(-1, u));
            const copaTransversal = -curvaturaCopa * alto * Math.sin(v * Math.PI) * (1.0 - uNorm * uNorm * 0.48);

            // 3. Reborde recurvado hacia afuera en el tercio superior
            let reborde = 0;
            if (v > 0.55) {
                const tReborde = (v - 0.55) / 0.45;
                reborde = curvaturaBorde * alto * (tReborde * tReborde);
            }

            // 4. Ondulación orgánica en los bordes para flores rizadas (peonía, clavel)
            const ondulacion = rizado * alto * Math.sin(v * 14 + uNorm * 3.5) * (uNorm * uNorm) * (0.3 + 0.7 * v);

            pos.setZ(i, copaTransversal + reborde + ondulacion);
        }

        geo.computeVertexNormals();
        return geo;
    },

    // Geometría de pétalo tipo cáliz para tulipanes
    // Forma un cuenco redondeado que se cierra suavemente en el ápice
    crearGeometriaTulipan(ancho, alto) {
        const segX = 24;
        const segY = 24;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            const v = (y + alto * 0.5) / alto;
            const u = x / (ancho * 0.5 + 0.0001);

            // Silueta de cáliz ovalada
            const factorAncho = Math.sin(v * Math.PI * 0.92) * 1.08;
            x *= factorAncho;
            pos.setX(i, x);

            // Curvatura esferoidal de copa profunda
            const uNorm = Math.min(1, Math.max(-1, u));
            let z = -0.48 * alto * Math.sin(v * Math.PI) * (1.0 - uNorm * uNorm * 0.45);

            // En la punta, el pétalo se curva ligeramente hacia adentro para cerrar el capullo
            if (v > 0.75) {
                const tPunta = (v - 0.75) / 0.25;
                z -= 0.12 * alto * (tPunta * tPunta);
            }

            pos.setZ(i, z);
        }

        geo.computeVertexNormals();
        return geo;
    },

    // Hoja botánica 3D lanceolada con nervadura y pliegue en V
    crearGeometriaHoja(ancho, largo, curvatura = 0.25) {
        const geo = new THREE.PlaneGeometry(ancho, largo, 16, 24);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            const v = (y + largo * 0.5) / largo;

            // Silueta lanceolada
            const factorAncho = Math.sin(v * Math.PI);
            x *= factorAncho;
            pos.setX(i, x);

            // Pliegue en V en la nervadura central y arqueamiento longitudinal
            const pliegueV = Math.abs(x) * 0.35;
            const arcoLong = -Math.sin(v * Math.PI) * largo * curvatura;
            pos.setZ(i, pliegueV + arcoLong);
        }
        geo.computeVertexNormals();
        return geo;
    },

    // Tallo cilíndrico curvo 3D
    crearTallo3D(altura, radio = 0.065, curvatura = 0.15, matVerde = null) {
        const puntos = [];
        const numPuntos = 16;
        for (let i = 0; i <= numPuntos; i++) {
            const t = i / numPuntos;
            const y = t * altura;
            const x = Math.sin(t * Math.PI) * curvatura;
            const z = (t * t - t) * (curvatura * 0.5);
            puntos.push(new THREE.Vector3(x, y, z));
        }
        const curva = new THREE.CatmullRomCurve3(puntos);
        const geoTallo = new THREE.TubeGeometry(curva, 24, radio, 12, false);
        const mesh = new THREE.Mesh(geoTallo, matVerde || Materiales3D.verdeTallo());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return { mesh, fin: puntos[numPuntos], alturaTotal: altura };
    },

    // 1. ROSA 3D (Idéntica en estructura natural a la referencia Sketchfab)
    // 36 pétalos organizados en espiral áurea (Golden Angle: 137.5077°)
    // Centro en vórtice apretado, cáliz abultado y sépalos exteriores.
    crearRosa(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Rosa3D';
        const matPetalo = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const matCaliz = Materiales3D.verdeCaliz();
        const matHoja = Materiales3D.verdeHoja();
        const s = escala;

        const anguloAureo = 2.399963; // 137.5077° en radianes

        // --- TIER 1: CAPULLO CENTRAL (8 pétalos en espiral apretada) ---
        for (let i = 0; i < 8; i++) {
            const theta = i * anguloAureo;
            const r = (0.04 + i * 0.015) * s;
            const y = (0.10 - i * 0.008) * s;
            const w = (0.42 + i * 0.035) * s;
            const h = (0.72 + i * 0.035) * s;
            const rotX = 0.18 + i * 0.02;

            const geo = this.crearGeometriaPetalo(w, h, 0.45, -0.06);
            const m = new THREE.Mesh(geo, matPetalo);
            m.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
            m.rotation.y = theta + Math.PI / 2;
            m.rotation.x = rotX;
            m.castShadow = true;
            grupo.add(m);
        }

        // --- TIER 2: CAPA INTERIOR (8 pétalos acopados) ---
        for (let i = 8; i < 16; i++) {
            const theta = i * anguloAureo;
            const idx = i - 8;
            const r = (0.17 + idx * 0.018) * s;
            const y = (0.04 - idx * 0.01) * s;
            const w = (0.75 + idx * 0.04) * s;
            const h = (0.95 + idx * 0.035) * s;
            const rotX = 0.38 + idx * 0.025;

            const geo = this.crearGeometriaPetalo(w, h, 0.38, -0.16);
            const m = new THREE.Mesh(geo, matPetalo);
            m.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
            m.rotation.y = theta + Math.PI / 2;
            m.rotation.x = rotX;
            m.castShadow = true;
            grupo.add(m);
        }

        // --- TIER 3: CAPA MEDIA (10 pétalos con reborde voluptuoso) ---
        for (let i = 16; i < 26; i++) {
            const theta = i * anguloAureo;
            const idx = i - 16;
            const r = (0.32 + idx * 0.022) * s;
            const y = (-0.04 - idx * 0.012) * s;
            const w = (1.08 + idx * 0.035) * s;
            const h = (1.20 + idx * 0.03) * s;
            const rotX = 0.65 + idx * 0.03;

            const geo = this.crearGeometriaPetalo(w, h, 0.32, -0.28);
            const m = new THREE.Mesh(geo, matPetalo);
            m.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
            m.rotation.y = theta + Math.PI / 2;
            m.rotation.x = rotX;
            m.castShadow = true;
            grupo.add(m);
        }

        // --- TIER 4: CAPA EXTERIOR (10 pétalos envolventes amplios) ---
        for (let i = 26; i < 36; i++) {
            const theta = i * anguloAureo;
            const idx = i - 26;
            const r = (0.54 + idx * 0.018) * s;
            const y = (-0.14 - idx * 0.01) * s;
            const w = (1.35 + idx * 0.03) * s;
            const h = (1.38 + idx * 0.025) * s;
            const rotX = 0.95 + idx * 0.025;

            const geo = this.crearGeometriaPetalo(w, h, 0.26, -0.36);
            const m = new THREE.Mesh(geo, matPetalo);
            m.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
            m.rotation.y = theta + Math.PI / 2;
            m.rotation.x = rotX;
            m.castShadow = true;
            grupo.add(m);
        }

        // --- RECEPTÁCULO VERDE INFERIOR (Cáliz carnoso abombado) ---
        const geoReceptaculo = new THREE.SphereGeometry(0.38 * s, 16, 12);
        geoReceptaculo.scale(1.0, 0.75, 1.0);
        const meshReceptaculo = new THREE.Mesh(geoReceptaculo, matCaliz);
        meshReceptaculo.position.y = -0.28 * s;
        grupo.add(meshReceptaculo);

        // --- SÉPALOS VERDES (5 sépalos puntiagudos abrazando la rosa) ---
        const numSepalos = 5;
        for (let j = 0; j < numSepalos; j++) {
            const rotY = (j * Math.PI * 2) / numSepalos + 0.3;
            const geoSepalo = this.crearGeometriaHoja(0.32 * s, 1.15 * s, 0.32);
            const sepalo = new THREE.Mesh(geoSepalo, matHoja);
            sepalo.position.set(Math.cos(rotY) * 0.34 * s, -0.24 * s, Math.sin(rotY) * 0.34 * s);
            sepalo.rotation.y = rotY + Math.PI / 2;
            sepalo.rotation.x = 1.35;
            grupo.add(sepalo);
        }

        return grupo;
    },

    // 2. PEONÍA 3D (Ramillete voluptuoso con 40 pétalos rizados y núcleo dorado)
    crearPeonia(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Peonia3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.80 });
        const matCentro = Materiales3D.doradoCentro();
        const s = escala;

        // Estambres dorados en el centro
        const geoCentro = new THREE.SphereGeometry(0.22 * s, 12, 12);
        const meshCentro = new THREE.Mesh(geoCentro, matCentro);
        meshCentro.position.y = 0.05 * s;
        grupo.add(meshCentro);

        for (let capa = 0; capa < 4; capa++) {
            const numP = 8 + capa * 3;
            const rCapa = (0.16 + capa * 0.16) * s;
            const altoP = (0.75 + capa * 0.18) * s;
            const anchoP = (0.65 + capa * 0.18) * s;
            const rotX = 0.32 + capa * 0.24;

            for (let i = 0; i < numP; i++) {
                const rotY = (i * Math.PI * 2) / numP + (capa * 0.42);
                const geo = this.crearGeometriaPetalo(anchoP, altoP, 0.38, -0.22, 0.12);
                const m = new THREE.Mesh(geo, mat);
                m.position.set(Math.cos(rotY) * rCapa, (0.08 - capa * 0.07) * s, Math.sin(rotY) * rCapa);
                m.rotation.y = rotY + Math.PI / 2;
                m.rotation.x = rotX;
                m.castShadow = true;
                grupo.add(m);
            }
        }

        // Receptáculo verde
        const geoRec = new THREE.SphereGeometry(0.32 * s, 12, 10);
        geoRec.scale(1, 0.6, 1);
        const meshRec = new THREE.Mesh(geoRec, Materiales3D.verdeCaliz());
        meshRec.position.y = -0.22 * s;
        grupo.add(meshRec);

        return grupo;
    },

    // 3. TULIPÁN 3D (Copa de seda chalice con 6 pétalos acopados + pistilo y estambres)
    crearTulipan(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Tulipan3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.76 });
        const s = escala;

        // Pistilo central y 6 estambres visibles desde arriba
        const geoPistilo = new THREE.CylinderGeometry(0.05 * s, 0.07 * s, 0.5 * s, 8);
        const meshPistilo = new THREE.Mesh(geoPistilo, Materiales3D.verdeHoja());
        meshPistilo.position.y = 0.25 * s;
        grupo.add(meshPistilo);

        const matAntera = Materiales3D.crear('#1a1412', { roughness: 0.85 });
        for (let e = 0; e < 6; e++) {
            const rotE = (e * Math.PI * 2) / 6;
            const antera = new THREE.Mesh(new THREE.BoxGeometry(0.05 * s, 0.18 * s, 0.05 * s), matAntera);
            antera.position.set(Math.cos(rotE) * 0.14 * s, 0.38 * s, Math.sin(rotE) * 0.14 * s);
            grupo.add(antera);
        }

        // 3 pétalos interiores acopados
        for (let i = 0; i < 3; i++) {
            const rotY = (i * Math.PI * 2) / 3;
            const geo = this.crearGeometriaTulipan(0.95 * s, 1.45 * s);
            const m = new THREE.Mesh(geo, mat);
            m.position.set(Math.cos(rotY) * 0.18 * s, 0.42 * s, Math.sin(rotY) * 0.18 * s);
            m.rotation.y = rotY + Math.PI / 2;
            m.rotation.x = 0.20;
            m.castShadow = true;
            grupo.add(m);
        }

        // 3 pétalos exteriores envolventes (desfasados 60°)
        for (let i = 0; i < 3; i++) {
            const rotY = (i * Math.PI * 2) / 3 + Math.PI / 3;
            const geo = this.crearGeometriaTulipan(1.08 * s, 1.52 * s);
            const m = new THREE.Mesh(geo, mat);
            m.position.set(Math.cos(rotY) * 0.28 * s, 0.38 * s, Math.sin(rotY) * 0.28 * s);
            m.rotation.y = rotY + Math.PI / 2;
            m.rotation.x = 0.25;
            m.castShadow = true;
            grupo.add(m);
        }

        // Base del cáliz verde
        const geoCaliz = new THREE.SphereGeometry(0.24 * s, 12, 10);
        geoCaliz.scale(1, 0.7, 1);
        const meshCaliz = new THREE.Mesh(geoCaliz, Materiales3D.verdeCaliz());
        meshCaliz.position.y = -0.05 * s;
        grupo.add(meshCaliz);

        return grupo;
    },

    // 4. CLAVEL 3D (Pompón 360° con borde rizado, cáliz verde tubular)
    crearClavel(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Clavel3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.80 });
        const s = escala;

        // Cáliz verde tubular estriado
        const geoCaliz = new THREE.CylinderGeometry(0.22 * s, 0.16 * s, 0.65 * s, 12);
        const meshCaliz = new THREE.Mesh(geoCaliz, Materiales3D.verdeCaliz());
        meshCaliz.position.y = -0.28 * s;
        grupo.add(meshCaliz);

        // Capas concéntricas rizadas en 360°
        for (let capa = 0; capa < 4; capa++) {
            const num = 8 + capa * 4;
            const r = (0.14 + capa * 0.18) * s;
            const ancho = (0.52 + capa * 0.14) * s;
            const alto = (0.68 + capa * 0.14) * s;
            const rotX = 0.38 + capa * 0.26;

            for (let i = 0; i < num; i++) {
                const rotY = (i * Math.PI * 2) / num + capa * 0.35;
                const geo = this.crearGeometriaPetalo(ancho, alto, 0.32, -0.32, 0.18);
                const m = new THREE.Mesh(geo, mat);
                m.position.set(Math.cos(rotY) * r, (0.06 - capa * 0.05) * s, Math.sin(rotY) * r);
                m.rotation.y = rotY + Math.PI / 2;
                m.rotation.x = rotX;
                m.castShadow = true;
                grupo.add(m);
            }
        }
        return grupo;
    },

    // 5. GIRASOL 3D (Botón convexo aterciopelado chocolate/polen y doble corona radiante abriéndose hacia +Y)
    crearGirasol(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Girasol3D';
        const s = escala;

        // Botón central convexo aterciopelado (en plano XZ mirando hacia +Y)
        const geoCentro = new THREE.SphereGeometry(0.52 * s, 24, 16);
        geoCentro.scale(1.0, 0.32, 1.0);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.cafeCentro());
        meshCentro.position.y = 0.04 * s;
        grupo.add(meshCentro);

        // Anillo de polen dorado
        const geoTorus = new THREE.TorusGeometry(0.48 * s, 0.055 * s, 10, 32);
        geoTorus.rotateX(Math.PI / 2);
        const meshTorus = new THREE.Mesh(geoTorus, Materiales3D.doradoCentro());
        meshTorus.position.y = 0.09 * s;
        grupo.add(meshTorus);

        // 2 coronas de pétalos dorados (24 + 24 pétalos densos)
        const matPetalo = Materiales3D.crear(colorHex || '#ffb703', { roughness: 0.76 });
        for (let capa = 0; capa < 2; capa++) {
            const num = 24;
            const rotOffset = capa * (Math.PI / 24);
            const distY = (capa * -0.05) * s;
            const rotX = 1.35 + capa * 0.15;

            for (let i = 0; i < num; i++) {
                const rotY = (i * Math.PI * 2) / num + rotOffset;
                const geo = this.crearGeometriaPetalo(0.28 * s, 1.05 * s, 0.18, -0.08);
                const m = new THREE.Mesh(geo, matPetalo);
                m.position.set(Math.cos(rotY) * 0.52 * s, distY, Math.sin(rotY) * 0.52 * s);
                m.rotation.y = rotY + Math.PI / 2;
                m.rotation.x = rotX;
                m.castShadow = true;
                grupo.add(m);
            }
        }

        // Brácteas verdes del cáliz posterior (16 brácteas)
        for (let b = 0; b < 16; b++) {
            const rotY = (b * Math.PI * 2) / 16;
            const geoB = this.crearGeometriaHoja(0.24 * s, 0.72 * s, 0.2);
            const meshB = new THREE.Mesh(geoB, Materiales3D.verdeCaliz());
            meshB.position.set(Math.cos(rotY) * 0.48 * s, -0.12 * s, Math.sin(rotY) * 0.48 * s);
            meshB.rotation.y = rotY + Math.PI / 2;
            meshB.rotation.x = 1.6;
            grupo.add(meshB);
        }

        return grupo;
    },

    // 6. DALIA 3D (Estructura concéntrica matemática con 40 pétalos cónicos quilled)
    crearDalia(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Dalia3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        for (let capa = 0; capa < 5; capa++) {
            const num = 6 + capa * 5;
            const r = (0.12 + capa * 0.16) * s;
            const ancho = (0.34 + capa * 0.10) * s;
            const alto = (0.62 + capa * 0.15) * s;
            const rotX = 0.32 + capa * 0.24;

            for (let i = 0; i < num; i++) {
                const rotY = (i * Math.PI * 2) / num + capa * 0.28;
                const geo = this.crearGeometriaPetalo(ancho, alto, 0.48, -0.05);
                const m = new THREE.Mesh(geo, mat);
                m.position.set(Math.cos(rotY) * r, (0.08 - capa * 0.05) * s, Math.sin(rotY) * r);
                m.rotation.y = rotY + Math.PI / 2;
                m.rotation.x = rotX;
                m.castShadow = true;
                grupo.add(m);
            }
        }

        const geoRec = new THREE.SphereGeometry(0.28 * s, 12, 10);
        geoRec.scale(1, 0.6, 1);
        const meshRec = new THREE.Mesh(geoRec, Materiales3D.verdeCaliz());
        meshRec.position.y = -0.2 * s;
        grupo.add(meshRec);

        return grupo;
    },

    // 7. HORTENSIA 3D (Cúpula esférica de florecitas de 4 pétalos)
    crearHortensia(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Hortensia3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        const numRacimos = 22;
        for (let i = 0; i < numRacimos; i++) {
            const phi = Math.acos(-1 + (2 * i) / numRacimos);
            const theta = Math.sqrt(numRacimos * Math.PI) * phi;
            const radioEsfera = 0.95 * s;

            const racimo = new THREE.Group();
            racimo.position.set(
                Math.cos(theta) * Math.sin(phi) * radioEsfera,
                Math.cos(phi) * radioEsfera * 0.85,
                Math.sin(theta) * Math.sin(phi) * radioEsfera
            );
            racimo.lookAt(0, 0, 0);
            racimo.rotateY(Math.PI);

            for (let k = 0; k < 4; k++) {
                const a = (k * Math.PI) / 2;
                const geo = this.crearGeometriaPetalo(0.28 * s, 0.45 * s, 0.18, 0.0);
                const m = new THREE.Mesh(geo, mat);
                m.rotation.z = a;
                m.position.set(Math.cos(a) * 0.15 * s, Math.sin(a) * 0.15 * s, 0);
                racimo.add(m);
            }
            grupo.add(racimo);
        }
        return grupo;
    },

    // 8. SAKURA 3D (Flor de cerezo con 5 pétalos, muesca y estambres)
    crearSakura(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Sakura3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        for (let i = 0; i < 5; i++) {
            const rotY = (i * Math.PI * 2) / 5;
            const geo = this.crearGeometriaPetalo(0.68 * s, 0.98 * s, 0.22, -0.12);
            const m = new THREE.Mesh(geo, mat);
            m.position.set(Math.cos(rotY) * 0.25 * s, 0, Math.sin(rotY) * 0.25 * s);
            m.rotation.y = rotY + Math.PI / 2;
            m.rotation.x = 0.35;
            m.castShadow = true;
            grupo.add(m);
        }

        // Centro magenta y estambres
        const geoCentro = new THREE.SphereGeometry(0.14 * s, 12, 12);
        geoCentro.scale(1, 0.5, 1);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.crear('#d90429', { roughness: 0.7 }));
        meshCentro.position.y = 0.05 * s;
        grupo.add(meshCentro);

        const numEstambres = 10;
        for (let e = 0; e < numEstambres; e++) {
            const rotY = (e * Math.PI * 2) / numEstambres;
            const geoE = new THREE.CylinderGeometry(0.015 * s, 0.015 * s, 0.35 * s, 6);
            const mE = new THREE.Mesh(geoE, Materiales3D.doradoCentro());
            mE.position.set(Math.cos(rotY) * 0.12 * s, 0.15 * s, Math.sin(rotY) * 0.12 * s);
            grupo.add(mE);
        }

        return grupo;
    },

    // 9. MARGARITA 3D (Centro dorado abombado y 22 pétalos blancos radiantes)
    crearMargarita(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Margarita3D';
        const matPetalo = Materiales3D.crear(colorHex || '#ffffff', { roughness: 0.76 });
        const s = escala;

        const geoCentro = new THREE.SphereGeometry(0.44 * s, 20, 16);
        geoCentro.scale(1, 0.35, 1);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.doradoCentro());
        meshCentro.position.y = 0.05 * s;
        grupo.add(meshCentro);

        const numP = 22;
        for (let i = 0; i < numP; i++) {
            const rotY = (i * Math.PI * 2) / numP;
            const geo = this.crearGeometriaPetalo(0.24 * s, 1.15 * s, 0.18, 0.0);
            const m = new THREE.Mesh(geo, matPetalo);
            m.position.set(Math.cos(rotY) * 0.44 * s, 0, Math.sin(rotY) * 0.44 * s);
            m.rotation.y = rotY + Math.PI / 2;
            m.rotation.x = 0.28;
            m.castShadow = true;
            grupo.add(m);
        }

        // Cáliz inferior
        const geoCaliz = new THREE.SphereGeometry(0.35 * s, 12, 10);
        geoCaliz.scale(1, 0.5, 1);
        const meshCaliz = new THREE.Mesh(geoCaliz, Materiales3D.verdeCaliz());
        meshCaliz.position.y = -0.1 * s;
        grupo.add(meshCaliz);

        return grupo;
    },

    // 10. AMAPOLA 3D (4 grandes pétalos sedosos carmesí y botón aterciopelado)
    crearAmapola(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Amapola3D';
        const mat = Materiales3D.crear(colorHex || '#e63946', { roughness: 0.78 });
        const s = escala;

        for (let i = 0; i < 4; i++) {
            const rotY = (i * Math.PI * 2) / 4 + 0.35;
            const geo = this.crearGeometriaPetalo(1.35 * s, 1.55 * s, 0.40, -0.22, 0.08);
            const m = new THREE.Mesh(geo, mat);
            m.position.set(Math.cos(rotY) * 0.28 * s, 0.05 * s, Math.sin(rotY) * 0.28 * s);
            m.rotation.y = rotY + Math.PI / 2;
            m.rotation.x = 0.48;
            m.castShadow = true;
            grupo.add(m);
        }

        // Centro aterciopelado negro
        const geoCentro = new THREE.SphereGeometry(0.30 * s, 16, 16);
        geoCentro.scale(1, 0.45, 1);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.crear('#111317', { roughness: 0.9 }));
        meshCentro.position.y = 0.14 * s;
        grupo.add(meshCentro);

        return grupo;
    },

    // 11. LIRIO 3D (6 pétalos recurvados y estambres majestuosos)
    crearLirio(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Lirio3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        for (let i = 0; i < 6; i++) {
            const rotY = (i * Math.PI * 2) / 6;
            const geo = this.crearGeometriaPetalo(0.85 * s, 2.15 * s, 0.35, -0.48);
            const m = new THREE.Mesh(geo, mat);
            m.position.set(Math.cos(rotY) * 0.26 * s, 0, Math.sin(rotY) * 0.26 * s);
            m.rotation.y = rotY + Math.PI / 2;
            m.rotation.x = 0.65;
            m.castShadow = true;
            grupo.add(m);
        }

        // Estambres curvados con anteras de color óxido
        for (let j = 0; j < 6; j++) {
            const rotY = (j * Math.PI * 2) / 6 + 0.52;
            const geoE = new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 1.25 * s, 6);
            const estambre = new THREE.Mesh(geoE, Materiales3D.crear('#c9e4ca'));
            estambre.position.set(Math.cos(rotY) * 0.35 * s, 0.62 * s, Math.sin(rotY) * 0.35 * s);
            estambre.rotation.y = rotY;
            estambre.rotation.x = 0.22;
            grupo.add(estambre);

            const antera = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.20 * s, 0.08 * s), Materiales3D.crear('#7a3e1d'));
            antera.position.copy(estambre.position);
            antera.position.z += 0.68 * s;
            grupo.add(antera);
        }

        return grupo;
    },

    // 12. ORQUÍDEA 3D (Sépalos, pétalos y labello voluptuoso)
    crearOrquidea(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Orquidea3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        // 3 sépalos
        [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6].forEach(a => {
            const geo = this.crearGeometriaPetalo(0.68 * s, 1.38 * s, 0.24, -0.12);
            const m = new THREE.Mesh(geo, mat);
            m.rotation.z = a;
            m.rotation.x = 0.3;
            grupo.add(m);
        });

        // 2 pétalos anchos
        [-0.55, 0.55].forEach(a => {
            const geo = this.crearGeometriaPetalo(1.15 * s, 1.28 * s, 0.30, -0.18);
            const m = new THREE.Mesh(geo, mat);
            m.rotation.z = a;
            m.position.set(Math.cos(a) * 0.45 * s, Math.sin(a) * 0.45 * s, 0.1 * s);
            m.rotation.x = 0.22;
            grupo.add(m);
        });

        // Labello esculpido
        const geoLabello = this.crearGeometriaPetalo(0.88 * s, 1.15 * s, 0.48, -0.22);
        const mLabello = new THREE.Mesh(geoLabello, Materiales3D.crear('#7209b7', { roughness: 0.75 }));
        mLabello.position.set(0, -0.45 * s, 0.22 * s);
        mLabello.rotation.x = -0.4;
        grupo.add(mLabello);

        return grupo;
    },

    // 13. LAVANDA 3D (Espiga botánica con verticilos púrpuras)
    crearLavanda(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Lavanda3D';
        const mat = Materiales3D.crear(colorHex || '#9d4edd', { roughness: 0.78 });
        const s = escala;

        const niveles = 10;
        const altoTotal = 2.4 * s;

        for (let n = 0; n < niveles; n++) {
            const y = (n / niveles) * altoTotal;
            const rNivel = (1 - (n / niveles) * 0.38) * 0.28 * s;
            for (let k = 0; k < 5; k++) {
                const a = (k * Math.PI * 2) / 5 + n * 0.42;
                const geo = new THREE.SphereGeometry(0.09 * s, 8, 8);
                geo.scale(1, 1.5, 0.85);
                const m = new THREE.Mesh(geo, mat);
                m.position.set(Math.cos(a) * rNivel, y, Math.sin(a) * rNivel);
                grupo.add(m);
            }
        }
        return grupo;
    },

    // 14. GYPSOPHILA 3D (Nube de flores diminutas)
    crearGypsophila(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Gypsophila3D';
        const matFlor = Materiales3D.crear(colorHex || '#ffffff', { roughness: 0.78 });
        const s = escala;

        const posiciones = [
            [-0.6, 1.4, 0.2], [0.6, 1.3, -0.2], [-0.3, 1.8, 0.3], [0.3, 1.7, 0.1],
            [-0.7, 0.9, -0.3], [0.7, 1.0, 0.3], [0.0, 2.0, 0.0], [-0.2, 1.2, -0.4],
            [0.2, 1.1, 0.4], [0.5, 1.6, -0.3]
        ];

        posiciones.forEach(p => {
            const sub = new THREE.Group();
            sub.position.set(p[0] * s, p[1] * s, p[2] * s);
            for (let i = 0; i < 5; i++) {
                const a = (i * Math.PI * 2) / 5;
                const geo = new THREE.SphereGeometry(0.075 * s, 8, 8);
                const m = new THREE.Mesh(geo, matFlor);
                m.position.set(Math.cos(a) * 0.08 * s, Math.sin(a) * 0.08 * s, 0);
                sub.add(m);
            }
            grupo.add(sub);
        });
        return grupo;
    },

    // 15. EUCALIPTO 3D (Hojas redondeadas opuestas tipo silver dollar con curvatura natural)
    crearEucalipto(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Eucalipto3D';
        const matHoja = Materiales3D.crear(colorHex || '#84a59d', { roughness: 0.75 });
        const s = escala;

        const numPares = 7;
        const largoTotal = 2.8 * s;

        // Tallo central curvado
        const { mesh: meshTallo } = this.crearTallo3D(largoTotal, 0.045 * s, 0.12 * s, Materiales3D.verdeTallo());
        grupo.add(meshTallo);

        for (let i = 1; i <= numPares; i++) {
            const t = i / numPares;
            const y = t * largoTotal;
            const rHoja = (1.1 - t * 0.32) * 0.45 * s;
            const rotY = (i % 2 === 0) ? 0.2 : Math.PI / 2 + 0.2;

            [-1, 1].forEach(lado => {
                const geo = new THREE.CylinderGeometry(rHoja, rHoja, 0.025 * s, 18);
                geo.rotateZ(Math.PI / 2);
                const m = new THREE.Mesh(geo, matHoja);
                m.position.set(lado * (rHoja + 0.08 * s), y, 0);
                m.rotation.y = rotY;
                m.rotation.z = lado * 0.28;
                m.castShadow = true;
                grupo.add(m);
            });
        }
        return grupo;
    },

    // 16. HELECHO 3D (Fronda con raquis arqueado y folíolos pinnados)
    crearHelecho(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Helecho3D';
        const mat = Materiales3D.crear(colorHex || '#2d6a4f', { roughness: 0.72 });
        const s = escala;

        const numPares = 14;
        const largo = 3.2 * s;

        for (let i = 1; i <= numPares; i++) {
            const t = i / numPares;
            const y = t * largo;
            const anchoFoliolo = Math.sin(t * Math.PI) * 0.55 * s;
            const largoFoliolo = Math.sin(t * Math.PI) * 1.05 * s;

            [-1, 1].forEach(lado => {
                const geo = this.crearGeometriaHoja(anchoFoliolo, largoFoliolo, 0.18);
                const m = new THREE.Mesh(geo, mat);
                m.position.set(lado * (largoFoliolo * 0.45), y, 0);
                m.rotation.z = lado * (Math.PI / 2.3);
                m.rotation.x = 0.22;
                m.castShadow = true;
                grupo.add(m);
            });
        }
        return grupo;
    },

    // LAZO SATINADO 3D (Para el atado del ramo final)
    crearLazoSatinado(colorHex = '#ffb3c6', escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'LazoSatinado3D';
        const mat = Materiales3D.satenRosa(colorHex);
        const s = escala;

        // Nudo central abombado
        const geoNudo = new THREE.SphereGeometry(0.32 * s, 16, 16);
        geoNudo.scale(1.2, 0.9, 0.9);
        const meshNudo = new THREE.Mesh(geoNudo, mat);
        grupo.add(meshNudo);

        // Bucle izquierdo
        const curvaIzq = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-0.9 * s, 0.6 * s, 0.4 * s),
            new THREE.Vector3(-1.4 * s, -0.2 * s, 0.2 * s),
            new THREE.Vector3(-0.2 * s, -0.1 * s, 0)
        );
        const geoBucleIzq = new THREE.TubeGeometry(curvaIzq, 24, 0.18 * s, 12, false);
        grupo.add(new THREE.Mesh(geoBucleIzq, mat));

        // Bucle derecho
        const curvaDer = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.9 * s, 0.6 * s, 0.4 * s),
            new THREE.Vector3(1.4 * s, -0.2 * s, 0.2 * s),
            new THREE.Vector3(0.2 * s, -0.1 * s, 0)
        );
        const geoBucleDer = new THREE.TubeGeometry(curvaDer, 24, 0.18 * s, 12, false);
        grupo.add(new THREE.Mesh(geoBucleDer, mat));

        // Cinta colgante izquierda
        const curvaCintaIzq = new THREE.CubicBezierCurve3(
            new THREE.Vector3(-0.1 * s, -0.1 * s, 0),
            new THREE.Vector3(-0.5 * s, -1.0 * s, 0.2 * s),
            new THREE.Vector3(-0.7 * s, -1.8 * s, 0.1 * s),
            new THREE.Vector3(-0.85 * s, -2.4 * s, 0)
        );
        const geoCintaIzq = new THREE.TubeGeometry(curvaCintaIzq, 28, 0.15 * s, 10, false);
        grupo.add(new THREE.Mesh(geoCintaIzq, mat));

        // Cinta colgante derecha
        const curvaCintaDer = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0.1 * s, -0.1 * s, 0),
            new THREE.Vector3(0.5 * s, -1.0 * s, 0.2 * s),
            new THREE.Vector3(0.7 * s, -1.8 * s, 0.1 * s),
            new THREE.Vector3(0.85 * s, -2.4 * s, 0)
        );
        const geoCintaDer = new THREE.TubeGeometry(curvaCintaDer, 28, 0.15 * s, 10, false);
        grupo.add(new THREE.Mesh(geoCintaDer, mat));

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

    // Inicializa la escena 3D en un contenedor DOM con iluminación balanceada sRGB
    // y tone mapping para evitar cualquier lavado de color.
    crearEscena(contenedorId, config = {}) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return null;

        const ancho = contenedor.clientWidth || config.ancho || 450;
        const alto = contenedor.clientHeight || config.alto || 380;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(config.bgColor || 0xfff7f9);

        const camera = new THREE.PerspectiveCamera(config.fov || 42, ancho / alto, 0.1, 1000);
        camera.position.set(0, 1.2, 5.8);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setSize(ancho, alto);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // CONFIGURACIÓN DE COLOR Y TONEMAPPING CINEMATOGRÁFICO:
        // Evita quemar los colores en blanco y conserva la gama pastel y tonos vivos al rotar
        if (THREE.sRGBEncoding) {
            renderer.outputEncoding = THREE.sRGBEncoding;
        }
        if (THREE.ACESFilmicToneMapping) {
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
        }

        // Limpiar contenedor previo
        contenedor.innerHTML = '';
        contenedor.appendChild(renderer.domElement);

        // OrbitControls interactivo (Rotación 360°, zoom in/out con rueda o pellizco)
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.minDistance = 1.8;
        controls.maxDistance = 12.0;
        controls.target.set(0, 0.8, 0);
        controls.maxPolarAngle = Math.PI * 0.88;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;

        // RIG DE ILUMINACIÓN BOTÁNICA PROFESIONAL EN 4 PUNTOS (360° sin zonas oscuras ni destellos ciegos)
        // 1. Luz ambiente / hemisferio suave (rebote cálido de estudio rosa)
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffd5df, 0.68);
        scene.add(hemiLight);

        // 2. Luz principal cálida suave (Key Light)
        const dirLight = new THREE.DirectionalLight(0xfff8f2, 0.72);
        dirLight.position.set(2.5, 4.2, 3.5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 15;
        dirLight.shadow.bias = -0.001;
        scene.add(dirLight);

        // 3. Luz de relleno lateral (Fill Light suave)
        const fillLight = new THREE.DirectionalLight(0xffedf2, 0.48);
        fillLight.position.set(-2.8, 1.8, 2.2);
        scene.add(fillLight);

        // 4. Luz de contraluz / silueta (Rim Light) para destacar bordes de pétalos
        const rimLight = new THREE.DirectionalLight(0xfff2f5, 0.42);
        rimLight.position.set(0.0, 3.8, -3.2);
        scene.add(rimLight);

        // Suelo receptor de sombras suaves
        const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.12 });
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

        // Loop de renderizado
        function animar() {
            objetoEscena.animId = requestAnimationFrame(animar);
            controls.update();

            // Animar chispas 3D
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

        // Reajustar tamaño al cambiar ventana
        window.addEventListener('resize', () => {
            if (!contenedor.clientWidth) return;
            camera.aspect = contenedor.clientWidth / contenedor.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
        });

        return objetoEscena;
    },

    // Virtualiza una flor en 3D paso a paso con animación de florecimiento
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

        // Limpiar contenido previo
        while (v.grupoContenido.children.length > 0) {
            v.grupoContenido.remove(v.grupoContenido.children[0]);
        }
        v.particulas3D = [];
        v.grupoContenido.rotation.y = 0;
        v.controls.target.set(0, 0.8, 0);
        v.camera.position.set(0, 1.2, 5.8);
        v.controls.update();

        // Construir la flor completa en 3D (Tallo, hojas y cabeza)
        const florRaiz = new THREE.Group();
        const alturaTallo = 2.4;
        const { mesh: meshTallo, fin: finTallo } = GeneradorFlores3D.crearTallo3D(alturaTallo, 0.075, 0.18);
        meshTallo.position.y = -1.15;
        florRaiz.add(meshTallo);

        // Hojas en el tallo
        const matHoja = Materiales3D.verdeHoja();
        const geoHoja1 = GeneradorFlores3D.crearGeometriaHoja(0.45, 1.25, 0.25);
        const hoja1 = new THREE.Mesh(geoHoja1, matHoja);
        hoja1.position.set(-0.25, -0.3, 0);
        hoja1.rotation.z = -0.7;
        hoja1.rotation.y = -0.4;
        florRaiz.add(hoja1);

        const geoHoja2 = GeneradorFlores3D.crearGeometriaHoja(0.42, 1.15, 0.25);
        const hoja2 = new THREE.Mesh(geoHoja2, matHoja);
        hoja2.position.set(0.25, 0.25, 0);
        hoja2.rotation.z = 0.7;
        hoja2.rotation.y = 0.4;
        florRaiz.add(hoja2);

        // Cabeza de la flor
        const florCabeza = GeneradorFlores3D.crearFlor(itemDef.tipo, itemDef.colorSeleccionado, 1.0);
        florCabeza.position.copy(finTallo);
        florCabeza.position.y += -1.15;
        if (itemDef.tipo !== 'lavanda' && itemDef.tipo !== 'eucalipto' && itemDef.tipo !== 'helecho') {
            florCabeza.rotation.x = 0.42;
        }
        florRaiz.add(florCabeza);

        v.grupoContenido.add(florRaiz);

        // Crear chispitas 3D mágicas
        const matChispa = new THREE.MeshBasicMaterial({ color: new THREE.Color(itemDef.colorSeleccionado) });
        for (let i = 0; i < 20; i++) {
            const geoC = new THREE.SphereGeometry(0.045, 8, 8);
            const mC = new THREE.Mesh(geoC, matChispa);
            mC.position.set((Math.random() - 0.5) * 1.5, Math.random() * 2, (Math.random() - 0.5) * 1.5);
            mC.userData.velY = 0.012 + Math.random() * 0.02;
            v.grupoContenido.add(mC);
            v.particulas3D.push(mC);
        }

        // Animación de florecimiento
        const duracionMs = 1800;
        const inicioTiempo = performance.now();

        function animarBrote(ahora) {
            const transcurrido = ahora - inicioTiempo;
            const progreso = Math.min(1, transcurrido / duracionMs);

            // Escala progresiva de florecimiento
            florCabeza.scale.setScalar(Math.max(0.01, progreso));
            meshTallo.scale.y = Math.min(1, progreso * 1.2);
            hoja1.scale.setScalar(Math.max(0.01, (progreso - 0.25) / 0.75));
            hoja2.scale.setScalar(Math.max(0.01, (progreso - 0.35) / 0.65));

            if (onProgreso) onProgreso(progreso);

            if (progreso < 1) {
                requestAnimationFrame(animarBrote);
            } else {
                florCabeza.scale.setScalar(1);
                meshTallo.scale.y = 1;
                hoja1.scale.setScalar(1);
                hoja2.scale.setScalar(1);
                if (onFin) onFin();
            }
        }

        requestAnimationFrame(animarBrote);
    },

    // Ensambla el RAMO COMPLETO en 3D interactivo (360° OrbitControls)
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

        // Limpiar contenido previo
        while (r.grupoContenido.children.length > 0) {
            r.grupoContenido.remove(r.grupoContenido.children[0]);
        }
        r.particulas3D = [];
        r.grupoContenido.rotation.y = 0;

        const bouquetGrupo = new THREE.Group();
        bouquetGrupo.position.y = 0.25;

        const puntoLazo = new THREE.Vector3(0, -0.65, 0);

        // Separar follaje y flores principales
        const follaje = floresSeleccionadas.filter(f => f.tipo === 'eucalipto' || f.tipo === 'helecho');
        const principales = floresSeleccionadas.filter(f => f.tipo !== 'eucalipto' && f.tipo !== 'helecho');
        const floresParaDomo = principales.length > 0 ? principales : follaje;
        const follajeDeFondo = principales.length > 0 ? follaje : [];

        // 1. FOLLAJE DECORATIVO DE FONDO (Alas traseras que enmarcan el ramo)
        const configAlas = [
            { pos: new THREE.Vector3(-1.3, 0.45, -0.4), rotZ: 0.45, rotY: 0.3 },
            { pos: new THREE.Vector3(1.3, 0.45, -0.4), rotZ: -0.45, rotY: -0.3 },
            { pos: new THREE.Vector3(-0.85, 0.95, -0.5), rotZ: 0.25, rotY: 0.15 },
            { pos: new THREE.Vector3(0.85, 0.95, -0.5), rotZ: -0.25, rotY: -0.15 }
        ];

        follajeDeFondo.forEach((fol, idx) => {
            const ramaMesh = GeneradorFlores3D.crearFlor(fol.tipo, fol.color, 0.85);
            const cfg = configAlas[idx % configAlas.length];
            ramaMesh.position.copy(cfg.pos);
            ramaMesh.rotation.z = cfg.rotZ;
            ramaMesh.rotation.y = cfg.rotY;
            bouquetGrupo.add(ramaMesh);
        });

        // 2. DISTRIBUCIÓN EN CÚPULA 3D REAL (Empaquetamiento armónico floral)
        const total = floresParaDomo.length;
        const plantillas3D = this.calcularPlantillas3D(total);

        floresParaDomo.forEach((flor, idx) => {
            const p = plantillas3D[idx % plantillas3D.length];
            const florCabeza = GeneradorFlores3D.crearFlor(flor.tipo, flor.color, p.scale || 0.88);
            florCabeza.position.set(p.x, p.y, p.z);
            florCabeza.rotation.y = p.rotY || 0;
            florCabeza.rotation.x = p.rotX || 0.48;
            florCabeza.rotation.z = p.rotZ || 0;
            bouquetGrupo.add(florCabeza);

            // Tallo convergente en 3D hacia el lazo
            const curvaTallo = new THREE.CatmullRomCurve3([
                new THREE.Vector3(p.x, p.y - 0.15, p.z),
                new THREE.Vector3(p.x * 0.4, puntoLazo.y + 0.3, p.z * 0.4),
                puntoLazo.clone().add(new THREE.Vector3(p.x * 0.08, 0, p.z * 0.08))
            ]);
            const geoTallo = new THREE.TubeGeometry(curvaTallo, 18, 0.05, 10, false);
            const meshTallo = new THREE.Mesh(geoTallo, Materiales3D.verdeTallo());
            bouquetGrupo.add(meshTallo);
        });

        // 3. COLLAR BOTÁNICO DE HOJAS VERDES 3D EN LA BASE DEL RAMO
        const numHojasCollar = 8;
        for (let i = 0; i < numHojasCollar; i++) {
            const a = (i * Math.PI * 2) / numHojasCollar;
            const geoHoja = GeneradorFlores3D.crearGeometriaHoja(0.48, 1.25, 0.32);
            const hoja = new THREE.Mesh(geoHoja, Materiales3D.verdeHoja());
            hoja.position.set(Math.cos(a) * 0.95, puntoLazo.y + 0.25, Math.sin(a) * 0.85);
            hoja.rotation.z = -Math.cos(a) * 0.8;
            hoja.rotation.x = Math.sin(a) * 0.8;
            hoja.rotation.y = a + Math.PI / 2;
            bouquetGrupo.add(hoja);
        }

        // 4. HAZ DE TALLOS CORTADOS BAJO EL LAZO
        const totalTallosInf = 10;
        for (let i = 0; i < totalTallosInf; i++) {
            const t = (i / (totalTallosInf - 1)) - 0.5;
            const geoTalloInf = new THREE.CylinderGeometry(0.045, 0.045, 1.15, 10);
            const mTI = new THREE.Mesh(geoTalloInf, Materiales3D.verdeTallo());
            mTI.position.set(t * 0.35, puntoLazo.y - 0.65, (Math.random() - 0.5) * 0.15);
            mTI.rotation.z = t * 0.18;
            bouquetGrupo.add(mTI);
        }

        // 5. LAZO SATINADO ROSA 3D
        const lazo = GeneradorFlores3D.crearLazoSatinado('#ffb3c6', 0.95);
        lazo.position.copy(puntoLazo);
        lazo.position.z += 0.22;
        bouquetGrupo.add(lazo);

        r.grupoContenido.add(bouquetGrupo);
        r.controls.target.set(0, 0.50, 0);
        r.camera.position.set(0, 1.75, 4.6);
        r.controls.update();
    },

    // Distribución armónica de coordenadas espaciales 3D (X, Y, Z) para la cúpula del ramo
    // Cada flor ocupa su propio espacio en la cúpula botánica sin obstrucciones
    calcularPlantillas3D(total) {
        if (total === 1) {
            return [{ x: 0, y: 0.75, z: 0.15, scale: 1.05, rotX: 0.40 }];
        }
        if (total === 2) {
            return [
                { x: -0.65, y: 0.72, z: 0.18, scale: 0.95, rotX: 0.45, rotY: 0.25, rotZ: 0.15 },
                { x: 0.65, y: 0.72, z: 0.18, scale: 0.95, rotX: 0.45, rotY: -0.25, rotZ: -0.15 }
            ];
        }
        if (total === 3) {
            return [
                { x: 0, y: 1.15, z: 0.05, scale: 0.95, rotX: 0.38, rotY: 0.0 },
                { x: -0.75, y: 0.52, z: 0.25, scale: 0.92, rotX: 0.58, rotY: 0.35, rotZ: 0.18 },
                { x: 0.75, y: 0.52, z: 0.25, scale: 0.92, rotX: 0.58, rotY: -0.35, rotZ: -0.18 }
            ];
        }
        if (total === 4) {
            return [
                { x: 0, y: 0.78, z: 0.25, scale: 0.95, rotX: 0.40, rotY: 0.0 },
                { x: 0, y: 1.25, z: -0.05, scale: 0.90, rotX: 0.35, rotY: 0.0 },
                { x: -0.85, y: 0.48, z: 0.22, scale: 0.90, rotX: 0.60, rotY: 0.40, rotZ: 0.20 },
                { x: 0.85, y: 0.48, z: 0.22, scale: 0.90, rotX: 0.60, rotY: -0.40, rotZ: -0.20 }
            ];
        }
        if (total === 5) {
            return [
                { x: 0, y: 0.78, z: 0.25, scale: 0.95, rotX: 0.40, rotY: 0.0 },
                { x: 0, y: 1.28, z: -0.05, scale: 0.90, rotX: 0.35, rotY: 0.0 },
                { x: -0.88, y: 0.72, z: 0.12, scale: 0.90, rotX: 0.52, rotY: 0.35, rotZ: 0.16 },
                { x: 0.88, y: 0.72, z: 0.12, scale: 0.90, rotX: 0.52, rotY: -0.35, rotZ: -0.16 },
                { x: 0, y: 0.18, z: 0.38, scale: 0.90, rotX: 0.75, rotY: 0.0 }
            ];
        }
        if (total === 6) {
            return [
                { x: 0, y: 0.82, z: 0.22, scale: 0.95, rotX: 0.38, rotY: 0.0, rotZ: 0.0 },
                { x: 0, y: 1.28, z: -0.05, scale: 0.90, rotX: 0.35, rotY: 0.0, rotZ: 0.0 },
                { x: -0.92, y: 0.78, z: 0.10, scale: 0.88, rotX: 0.52, rotY: 0.38, rotZ: 0.18 },
                { x: 0.92, y: 0.78, z: 0.10, scale: 0.88, rotX: 0.52, rotY: -0.38, rotZ: -0.18 },
                { x: -0.65, y: 0.18, z: 0.35, scale: 0.88, rotX: 0.72, rotY: 0.28, rotZ: 0.12 },
                { x: 0.65, y: 0.18, z: 0.35, scale: 0.88, rotX: 0.72, rotY: -0.28, rotZ: -0.12 }
            ];
        }
        if (total === 7) {
            return [
                { x: 0, y: 0.82, z: 0.22, scale: 0.95, rotX: 0.38, rotY: 0.0 },
                { x: 0, y: 1.32, z: -0.08, scale: 0.90, rotX: 0.35, rotY: 0.0 },
                { x: -0.85, y: 0.95, z: 0.05, scale: 0.88, rotX: 0.45, rotY: 0.30, rotZ: 0.15 },
                { x: 0.85, y: 0.95, z: 0.05, scale: 0.88, rotX: 0.45, rotY: -0.30, rotZ: -0.15 },
                { x: -0.98, y: 0.42, z: 0.25, scale: 0.86, rotX: 0.65, rotY: 0.45, rotZ: 0.22 },
                { x: 0.98, y: 0.42, z: 0.25, scale: 0.86, rotX: 0.65, rotY: -0.45, rotZ: -0.22 },
                { x: 0, y: 0.12, z: 0.40, scale: 0.88, rotX: 0.78, rotY: 0.0 }
            ];
        }
        if (total === 8) {
            return [
                { x: -0.40, y: 0.85, z: 0.20, scale: 0.92, rotX: 0.40, rotY: 0.15, rotZ: 0.08 },
                { x: 0.40, y: 0.85, z: 0.20, scale: 0.92, rotX: 0.40, rotY: -0.15, rotZ: -0.08 },
                { x: 0, y: 1.35, z: -0.08, scale: 0.88, rotX: 0.35, rotY: 0.0 },
                { x: -0.95, y: 0.88, z: 0.08, scale: 0.86, rotX: 0.48, rotY: 0.35, rotZ: 0.18 },
                { x: 0.95, y: 0.88, z: 0.08, scale: 0.86, rotX: 0.48, rotY: -0.35, rotZ: -0.18 },
                { x: -0.92, y: 0.28, z: 0.30, scale: 0.85, rotX: 0.70, rotY: 0.38, rotZ: 0.18 },
                { x: 0, y: 0.18, z: 0.42, scale: 0.90, rotX: 0.75, rotY: 0.0 },
                { x: 0.92, y: 0.28, z: 0.30, scale: 0.85, rotX: 0.70, rotY: -0.38, rotZ: -0.18 }
            ];
        }
        if (total === 9) {
            return [
                { x: -0.42, y: 0.85, z: 0.20, scale: 0.90, rotX: 0.40, rotY: 0.15, rotZ: 0.08 },
                { x: 0.42, y: 0.85, z: 0.20, scale: 0.90, rotX: 0.40, rotY: -0.15, rotZ: -0.08 },
                { x: 0, y: 1.38, z: -0.10, scale: 0.88, rotX: 0.35, rotY: 0.0 },
                { x: -0.78, y: 1.15, z: 0.02, scale: 0.86, rotX: 0.42, rotY: 0.25, rotZ: 0.14 },
                { x: 0.78, y: 1.15, z: 0.02, scale: 0.86, rotX: 0.42, rotY: -0.25, rotZ: -0.14 },
                { x: -1.05, y: 0.58, z: 0.20, scale: 0.84, rotX: 0.62, rotY: 0.45, rotZ: 0.22 },
                { x: 1.05, y: 0.58, z: 0.20, scale: 0.84, rotX: 0.62, rotY: -0.45, rotZ: -0.22 },
                { x: -0.58, y: 0.15, z: 0.38, scale: 0.86, rotX: 0.75, rotY: 0.25, rotZ: 0.12 },
                { x: 0.58, y: 0.15, z: 0.38, scale: 0.86, rotX: 0.75, rotY: -0.25, rotZ: -0.12 }
            ];
        }
        // 10 flores (Cúpula volumétrica armónica de floristería de lujo)
        return [
            { x: 0, y: 0.88, z: 0.24, scale: 0.95, rotX: 0.38, rotY: 0.0 },
            { x: -0.48, y: 0.68, z: 0.32, scale: 0.88, rotX: 0.52, rotY: 0.18 },
            { x: 0.48, y: 0.68, z: 0.32, scale: 0.88, rotX: 0.52, rotY: -0.18 },
            { x: 0, y: 1.42, z: -0.12, scale: 0.90, rotX: 0.35, rotY: 0.0 },
            { x: -0.80, y: 1.12, z: 0.02, scale: 0.86, rotX: 0.45, rotY: 0.28, rotZ: 0.14 },
            { x: 0.80, y: 1.12, z: 0.02, scale: 0.86, rotX: 0.45, rotY: -0.28, rotZ: -0.14 },
            { x: -1.15, y: 0.58, z: 0.20, scale: 0.84, rotX: 0.62, rotY: 0.48, rotZ: 0.22 },
            { x: 1.15, y: 0.58, z: 0.20, scale: 0.84, rotX: 0.62, rotY: -0.48, rotZ: -0.22 },
            { x: -0.65, y: 0.12, z: 0.40, scale: 0.86, rotX: 0.76, rotY: 0.25, rotZ: 0.12 },
            { x: 0.65, y: 0.12, z: 0.40, scale: 0.86, rotX: 0.76, rotY: -0.25, rotZ: -0.12 }
        ];
    }
};

// Exportar para acceso global en el navegador
if (typeof window !== 'undefined') {
    window.GeneradorFlores3D = GeneradorFlores3D;
    window.Motor3D = Motor3D;
}
