/**
 * MOTOR BOTÁNICO 3D REAL (Three.js WebGL)
 * Modelos tridimensionales de alta fidelidad botánica:
 * - Geometría paramétrica limpia con pivote en la base del pétalo (sin desalineaciones ni arrugas).
 * - Identidad botánica única y distintiva para cada especie:
 *   * Rosa: Capullo central apretado con 5 capas concéntricas en espiral suave y sépalos verdes.
 *   * Girasol: Disco central aterciopelado con placa trasera oclusora, anillo de polen y 40 pétalos dorados planos radiantes.
 *   * Peonía: Ramillete voluminoso y esponjoso con pétalos amplios redondeados y ondulados en copa profunda con estambres dorados.
 *   * Clavel: Cáliz cilíndrico verde estriado prominente del cual brota un pompón denso de pétalos rizados y festoneados en abanico.
 *   * Dalia: Mandala geométrico con pétalos acanalados en canuto/cono (quilled) en 5 anillos concéntricos ordenados.
 *   * Sakura: 5 pétalos acorazonados hendidos en la punta, estambres filamentosos delicados y sépalos basales.
 *   * Orquídea: Arquitectura Phalaenopsis conectada en la columna central (sépalo dorsal, laterales, alas y labello magenta).
 *   * Nube (Gypsophila): Ramillete ramificado continuo desde el tallo principal (sin piezas flotantes).
 * - Cúpula floral de floristería de lujo (bouquet esférico ordenado con holgura sin sobreposiciones confusas).
 */

// ===================================================
// MATERIALES BOTÁNICOS PBR (Acabado aterciopelado mate)
// ===================================================

const Materiales3D = {
    cache: new Map(),
    texturasCache: new Map(),

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

    // Pétalo estándar con silueta redondeada y pivote en la base (y = 0)
    crearGeometriaPetalo(ancho, alto, curvaturaCopa = 0.25, curvaturaBorde = -0.12, esPuntaAfilada = false) {
        const segX = 14;
        const segY = 16;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        geo.translate(0, alto * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            const y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / alto));
            const u = x / (ancho * 0.5 + 0.0001);

            let factorAncho;
            if (esPuntaAfilada) {
                // Punta lanceolada para girasol
                factorAncho = Math.sin(v * Math.PI) * Math.pow(Math.max(0, 1.0 - v * 0.25), 0.6);
            } else {
                // Silueta abovedada redondeada (no termina en aguja de cero ancho)
                if (v < 0.65) {
                    factorAncho = 0.25 + 0.75 * Math.sin((v / 0.65) * Math.PI * 0.5);
                } else {
                    const t = (v - 0.65) / 0.35;
                    factorAncho = 0.35 + 0.65 * Math.sqrt(Math.max(0, 1.0 - t * t));
                }
            }
            x *= factorAncho;
            pos.setX(i, x);

            const uNorm = Math.min(1, Math.max(-1, u));
            const copa = -curvaturaCopa * alto * Math.sin(v * Math.PI) * (1.0 - uNorm * uNorm * 0.5);

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

    // Pétalo de Peonía: muy ancho, esponjoso, redondeado y con copa profunda hacia adentro
    crearGeometriaPetaloPeonia(ancho, alto, curvaturaCopa = 0.42) {
        const segX = 18;
        const segY = 18;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        geo.translate(0, alto * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            const y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / alto));
            const u = x / (ancho * 0.5 + 0.0001);

            let factorAncho;
            if (v < 0.55) {
                factorAncho = 0.35 + 0.65 * Math.sin((v / 0.55) * Math.PI * 0.5);
            } else {
                const t = (v - 0.55) / 0.45;
                factorAncho = 0.40 + 0.60 * Math.sqrt(Math.max(0, 1.0 - t * t));
            }
            x *= factorAncho;
            pos.setX(i, x);

            const rizoBorde = v > 0.65 ? Math.sin(u * Math.PI * 4) * 0.05 * alto : 0;
            const uNorm = Math.min(1, Math.max(-1, u));
            // Copa profunda que curva el pétalo hacia el corazón de la flor formando un cáliz globular
            const copa = curvaturaCopa * alto * Math.sin(v * Math.PI * 0.88) * (1.0 - uNorm * uNorm * 0.45);

            pos.setZ(i, copa + rizoBorde);
        }
        geo.computeVertexNormals();
        return geo;
    },

    // Pétalo de Tulipán acopado estilizado
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

    // Pétalo de Clavel festoneado y rizado (en abanico con borde superior ondulado y dentado)
    crearGeometriaPetaloClavel(ancho, alto) {
        const segX = 18;
        const segY = 18;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        geo.translate(0, alto * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / alto));

            const factorAncho = 0.15 + 0.85 * Math.pow(v, 0.65);
            x *= factorAncho;
            pos.setX(i, x);

            if (v > 0.82) {
                const dentado = Math.sin(x * 24) * 0.04 * alto;
                y += dentado;
                pos.setY(i, y);
            }

            const rizo = v > 0.35 ? Math.sin(x * 18) * 0.08 * alto * Math.pow(v, 1.2) : 0;
            const copa = -0.15 * alto * Math.sin(v * Math.PI);
            pos.setZ(i, copa + rizo);
        }
        geo.computeVertexNormals();
        return geo;
    },

    // Pétalo de Girasol: silueta oblonga elegante con canal central y curvatura botánica (sin sierra mecánica)
    crearGeometriaPetaloGirasol(ancho, alto) {
        const segX = 14;
        const segY = 16;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        geo.translate(0, alto * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            const y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / alto));
            const u = x / (ancho * 0.5 + 0.0001);

            let factorAncho;
            if (v < 0.45) {
                factorAncho = 0.35 + 0.65 * Math.sin((v / 0.45) * Math.PI * 0.5);
            } else {
                const t = (v - 0.45) / 0.55;
                factorAncho = 0.25 + 0.75 * Math.sqrt(Math.max(0, 1.0 - t * t));
            }
            x *= factorAncho;
            pos.setX(i, x);

            const uNorm = Math.min(1, Math.max(-1, u));
            const canal = -0.06 * alto * (1.0 - uNorm * uNorm) * Math.sin(v * Math.PI);
            const arqueo = -0.05 * alto * (v * v);
            pos.setZ(i, canal + arqueo);
        }

        geo.computeVertexNormals();
        return geo;
    },

    // Pétalo de Margarita: espatulado, suavemente acopado y con punta redondeada
    crearGeometriaPetaloMargarita(ancho, alto) {
        const segX = 12;
        const segY = 16;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        geo.translate(0, alto * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            const y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / alto));

            let factorAncho;
            if (v < 0.60) {
                factorAncho = 0.35 + 0.65 * Math.sin((v / 0.60) * Math.PI * 0.5);
            } else {
                const t = (v - 0.60) / 0.40;
                factorAncho = 0.35 + 0.65 * Math.sqrt(Math.max(0, 1.0 - t * t));
            }
            x *= factorAncho;
            pos.setX(i, x);

            const u = x / (ancho * 0.5 + 0.0001);
            const canal = -0.04 * alto * (1.0 - u * u) * Math.sin(v * Math.PI);
            pos.setZ(i, canal);
        }

        geo.computeVertexNormals();
        return geo;
    },

    // Pétalo de Dalia cónico/acanalado en U (Quilled petal característico)
    crearGeometriaPetaloDalia(ancho, alto) {
        const segX = 18;
        const segY = 18;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        geo.translate(0, alto * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            const y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / alto));

            let factorAncho;
            if (v < 0.65) {
                factorAncho = 0.25 + 0.75 * Math.pow(v / 0.65, 0.75);
            } else {
                const t = (v - 0.65) / 0.35;
                factorAncho = 1.0 - 0.70 * (t * t);
            }
            x *= factorAncho;
            pos.setX(i, x);

            const u = x / (ancho * 0.5 * factorAncho + 0.0001);
            const uNorm = Math.min(1, Math.max(-1, u));
            // Acanalado cónico profundo en canuto cilíndrico
            const quilled = -0.58 * ancho * (1.0 - uNorm * uNorm) * Math.pow(v, 0.40);
            const arcoLongitudinal = -0.06 * alto * (v * v);
            pos.setZ(i, quilled + arcoLongitudinal);
        }
        geo.computeVertexNormals();
        return geo;
    },

    // Pétalo de Sakura suavemente acopado con hendidura acorazonada en la punta
    crearGeometriaPetaloSakura(ancho, alto) {
        const segX = 16;
        const segY = 16;
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        geo.translate(0, alto * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / alto));
            const u = x / (ancho * 0.5 + 0.0001);

            const factorAncho = Math.sin(Math.pow(v, 0.70) * Math.PI) * (0.25 + 0.75 * Math.sqrt(v));
            x *= factorAncho;

            if (v > 0.82) {
                const notch = (1.0 - Math.min(1, Math.abs(u) * 2.2)) * (0.12 * alto);
                if (notch > 0) y -= notch;
            }

            pos.setX(i, x);
            pos.setY(i, y);

            const copa = -0.16 * alto * Math.sin(v * Math.PI) * (1.0 - Math.min(1, u * u) * 0.4);
            pos.setZ(i, copa);
        }
        geo.computeVertexNormals();
        return geo;
    },

    // Hoja lanceolada suave con pliegue central y curvatura botánica
    crearGeometriaHoja(ancho, largo, curvatura = 0.20) {
        const geo = new THREE.PlaneGeometry(ancho, largo, 14, 18);
        geo.translate(0, largo * 0.5, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            const y = pos.getY(i);
            const v = Math.max(0, Math.min(1, y / largo));

            let factorAncho;
            if (v < 0.38) {
                factorAncho = 0.20 + 0.80 * Math.sin((v / 0.38) * Math.PI * 0.5);
            } else {
                const t = (v - 0.38) / 0.62;
                factorAncho = 0.15 + 0.85 * (1.0 - Math.pow(t, 1.35));
            }
            x *= factorAncho;
            pos.setX(i, x);

            const pliegueV = Math.abs(x) * 0.28;
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

    // 1. ROSA 3D (Espirales aterciopeladas románticas en 5 capas suaves con cáliz verde)
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

        // Base y sépalos verdes
        const geoBase = new THREE.CylinderGeometry(0.32 * s, 0.22 * s, 0.10 * s, 16);
        const meshBase = new THREE.Mesh(geoBase, Materiales3D.verdeCaliz());
        meshBase.position.y = -0.12 * s;
        grupo.add(meshBase);

        const geoSep = this.crearGeometriaHoja(0.22 * s, 0.80 * s, 0.35);
        const matSep = Materiales3D.verdeCaliz();
        for (let j = 0; j < 5; j++) {
            const rotY = (j * Math.PI * 2) / 5;
            grupo.add(this.crearPetaloEnAnillo(geoSep, matSep, 0.28 * s, -0.16 * s, 1.68, rotY));
        }

        return grupo;
    },

    // 2. PEONÍA 3D (Ramillete esponjoso, voluminoso y globular con pétalos ondulados en copa profunda)
    crearPeonia(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Peonia3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala * 0.92;

        // Centro profundo con estambres dorados
        const geoCentro = new THREE.SphereGeometry(0.22 * s, 12, 12);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.doradoCentro());
        meshCentro.position.y = 0.08 * s;
        grupo.add(meshCentro);

        // 4 capas concéntricas de pétalos amplios redondeados que forman una copa esponjosa profunda y globular
        const configCapas = [
            { num: 10, r: 0.08 * s, w: 0.55 * s, h: 0.70 * s, rotX: 0.16, y: 0.09 * s, copa: 0.50 },
            { num: 10, r: 0.18 * s, w: 0.75 * s, h: 0.85 * s, rotX: 0.35, y: 0.05 * s, copa: 0.45 },
            { num: 12, r: 0.30 * s, w: 0.95 * s, h: 0.98 * s, rotX: 0.55, y: 0.01 * s, copa: 0.40 },
            { num: 10, r: 0.42 * s, w: 1.15 * s, h: 1.05 * s, rotX: 0.75, y: -0.04 * s, copa: 0.32 }
        ];

        configCapas.forEach((cfg, idx) => {
            const geo = this.crearGeometriaPetaloPeonia(cfg.w, cfg.h, cfg.copa);
            for (let i = 0; i < cfg.num; i++) {
                const rotY = (i * Math.PI * 2) / cfg.num + (idx * 0.45);
                grupo.add(this.crearPetaloEnAnillo(geo, mat, cfg.r, cfg.y, cfg.rotX, rotY));
            }
        });

        // Cáliz verde de soporte y sépalos
        const geoBase = new THREE.CylinderGeometry(0.38 * s, 0.22 * s, 0.14 * s, 16);
        const meshBase = new THREE.Mesh(geoBase, Materiales3D.verdeCaliz());
        meshBase.position.y = -0.12 * s;
        grupo.add(meshBase);

        const geoSep = this.crearGeometriaHoja(0.24 * s, 0.65 * s, 0.20);
        const matSep = Materiales3D.verdeCaliz();
        for (let j = 0; j < 5; j++) {
            const rotY = (j * Math.PI * 2) / 5;
            grupo.add(this.crearPetaloEnAnillo(geoSep, matSep, 0.32 * s, -0.14 * s, 1.45, rotY));
        }

        return grupo;
    },

    // 3. TULIPÁN 3D (Copa estilizada suave con 6 pétalos en cáliz elegante)
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

    // 4. CLAVEL 3D (Cáliz cilíndrico verde prominente con pompón denso festoneado y rizado)
    crearClavel(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Clavel3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.80 });
        const s = escala * 0.88;

        // Cáliz verde tubular estriado prominente (rasgo botánico distintivo del clavel)
        const geoCaliz = new THREE.CylinderGeometry(0.20 * s, 0.11 * s, 0.65 * s, 16);
        const meshCaliz = new THREE.Mesh(geoCaliz, Materiales3D.verdeCaliz());
        meshCaliz.position.y = -0.28 * s;
        grupo.add(meshCaliz);

        // Dientes verdes en el borde del cáliz
        for (let d = 0; d < 5; d++) {
            const a = (d * Math.PI * 2) / 5;
            const geoDiente = this.crearGeometriaHoja(0.12 * s, 0.28 * s, 0.1);
            const mDiente = new THREE.Mesh(geoDiente, Materiales3D.verdeCaliz());
            mDiente.position.set(Math.cos(a) * 0.18 * s, 0.02 * s, Math.sin(a) * 0.18 * s);
            mDiente.rotation.y = a + Math.PI / 2;
            mDiente.rotation.x = 0.35;
            grupo.add(mDiente);
        }

        // Pompón denso de pétalos festoneados y rizados que brotan del cáliz
        const capas = [
            { num: 10, r: 0.08 * s, w: 0.50 * s, h: 0.60 * s, rotX: 0.22, y: 0.08 * s },
            { num: 12, r: 0.16 * s, w: 0.60 * s, h: 0.68 * s, rotX: 0.45, y: 0.05 * s },
            { num: 14, r: 0.26 * s, w: 0.70 * s, h: 0.72 * s, rotX: 0.70, y: 0.02 * s },
            { num: 16, r: 0.36 * s, w: 0.78 * s, h: 0.75 * s, rotX: 0.95, y: -0.02 * s },
            { num: 18, r: 0.46 * s, w: 0.85 * s, h: 0.78 * s, rotX: 1.20, y: -0.06 * s }
        ];

        capas.forEach(c => {
            const geo = this.crearGeometriaPetaloClavel(c.w, c.h);
            for (let i = 0; i < c.num; i++) {
                const rotY = (i * Math.PI * 2) / c.num;
                grupo.add(this.crearPetaloEnAnillo(geo, mat, c.r, c.y, c.rotX, rotY));
            }
        });

        return grupo;
    },

    // 5. GIRASOL 3D (Radiante y elegante: disco de chocolate aterciopelado con anillo de polen y pétalos solares oblongos)
    crearGirasol(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Girasol3D';
        const s = escala;

        // Botón central abovedado aterciopelado de chocolate
        const geoCentro = new THREE.SphereGeometry(0.48 * s, 32, 16);
        geoCentro.scale(1, 0.28, 1);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.cafeCentro());
        meshCentro.position.y = 0.04 * s;
        grupo.add(meshCentro);

        // Placa trasera oclusora que previene cualquier penetración desde atrás
        const geoFondo = new THREE.CylinderGeometry(0.50 * s, 0.50 * s, 0.05 * s, 32);
        const meshFondo = new THREE.Mesh(geoFondo, Materiales3D.cafeCentro());
        meshFondo.position.y = -0.01 * s;
        grupo.add(meshFondo);

        // Anillo de polen dorado
        const geoTorus = new THREE.TorusGeometry(0.44 * s, 0.045 * s, 10, 32);
        geoTorus.rotateX(Math.PI / 2);
        const meshTorus = new THREE.Mesh(geoTorus, Materiales3D.doradoCentro());
        meshTorus.position.y = 0.07 * s;
        grupo.add(meshTorus);

        // Capa 1: 22 pétalos dorados interiores casi planos (rotX = 1.38)
        const matPetalo = Materiales3D.crear(colorHex || '#ffb703', { roughness: 0.72 });
        const geoPetalo1 = this.crearGeometriaPetaloGirasol(0.28 * s, 0.85 * s);
        for (let i = 0; i < 22; i++) {
            const rotY = (i * Math.PI * 2) / 22;
            grupo.add(this.crearPetaloEnAnillo(geoPetalo1, matPetalo, 0.44 * s, 0.04 * s, 1.38, rotY));
        }

        // Capa 2: 22 pétalos dorados exteriores planos (rotX = 1.50) desfasados
        const geoPetalo2 = this.crearGeometriaPetaloGirasol(0.30 * s, 0.92 * s);
        for (let i = 0; i < 22; i++) {
            const rotY = (i * Math.PI * 2) / 22 + (Math.PI / 22);
            grupo.add(this.crearPetaloEnAnillo(geoPetalo2, matPetalo, 0.48 * s, 0.01 * s, 1.50, rotY));
        }

        // Brácteas verdes (filarias) debajo del disco
        const geoBractea = this.crearGeometriaHoja(0.22 * s, 0.55 * s, 0.15);
        const matBractea = Materiales3D.verdeCaliz();
        for (let b = 0; b < 14; b++) {
            const rotY = (b * Math.PI * 2) / 14;
            grupo.add(this.crearPetaloEnAnillo(geoBractea, matBractea, 0.42 * s, -0.06 * s, 1.68, rotY));
        }

        return grupo;
    },

    // 6. DALIA 3D (Mandala geométrico con pétalos acanalados en canuto/cono en 5 anillos ordenados)
    crearDalia(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Dalia3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        // Botón central abombado dorado
        const geoCentro = new THREE.SphereGeometry(0.18 * s, 16, 16);
        geoCentro.scale(1, 0.6, 1);
        const mCentro = new THREE.Mesh(geoCentro, Materiales3D.doradoCentro());
        mCentro.position.y = 0.08 * s;
        grupo.add(mCentro);

        // 5 anillos geométricos de pétalos acanalados cónicos (rasgo botánico distintivo de la Dalia)
        const anillos = [
            { num: 10, r: 0.10 * s, w: 0.22 * s, h: 0.48 * s, rotX: 0.20, y: 0.08 * s },
            { num: 14, r: 0.20 * s, w: 0.26 * s, h: 0.60 * s, rotX: 0.38, y: 0.05 * s },
            { num: 18, r: 0.30 * s, w: 0.30 * s, h: 0.72 * s, rotX: 0.58, y: 0.01 * s },
            { num: 22, r: 0.40 * s, w: 0.34 * s, h: 0.82 * s, rotX: 0.78, y: -0.03 * s },
            { num: 24, r: 0.50 * s, w: 0.36 * s, h: 0.90 * s, rotX: 0.98, y: -0.07 * s }
        ];

        anillos.forEach((a, idx) => {
            const geo = this.crearGeometriaPetaloDalia(a.w, a.h);
            for (let i = 0; i < a.num; i++) {
                const rotY = (i * Math.PI * 2) / a.num + (idx * 0.25);
                grupo.add(this.crearPetaloEnAnillo(geo, mat, a.r, a.y, a.rotX, rotY));
            }
        });

        // Cáliz verde de soporte
        const geoBase = new THREE.CylinderGeometry(0.32 * s, 0.18 * s, 0.10 * s, 16);
        const mBase = new THREE.Mesh(geoBase, Materiales3D.verdeCaliz());
        mBase.position.y = -0.10 * s;
        grupo.add(mBase);

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

    // 8. SAKURA 3D (Flor de cerezo con 5 pétalos acorazonados hendidos, estambres dorados y sépalos)
    crearSakura(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Sakura3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        // 5 pétalos con hendidura en la punta
        const geo = this.crearGeometriaPetaloSakura(0.68 * s, 0.95 * s);
        for (let i = 0; i < 5; i++) {
            const rotY = (i * Math.PI * 2) / 5;
            grupo.add(this.crearPetaloEnAnillo(geo, mat, 0.12 * s, 0, 1.15, rotY));
        }

        // Centro con botón carmesí
        const geoCentro = new THREE.SphereGeometry(0.12 * s, 12, 12);
        geoCentro.scale(1, 0.4, 1);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.crear('#d90429', { roughness: 0.7 }));
        meshCentro.position.y = 0.04 * s;
        grupo.add(meshCentro);

        // Corona de estambres finos radiantes en el centro
        const matEst = Materiales3D.doradoCentro();
        for (let e = 0; e < 15; e++) {
            const a = (e * Math.PI * 2) / 15;
            const geoE = new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.28 * s, 4);
            geoE.translate(0, 0.14 * s, 0);
            const mE = new THREE.Mesh(geoE, matEst);
            mE.position.set(Math.cos(a) * 0.08 * s, 0.04 * s, Math.sin(a) * 0.08 * s);
            mE.rotation.z = -Math.cos(a) * 0.35;
            mE.rotation.x = Math.sin(a) * 0.35;
            grupo.add(mE);
        }

        // Sépalos verdes debajo
        const geoSep = this.crearGeometriaHoja(0.18 * s, 0.45 * s, 0.15);
        for (let j = 0; j < 5; j++) {
            const rotY = (j * Math.PI * 2) / 5 + Math.PI / 5;
            grupo.add(this.crearPetaloEnAnillo(geoSep, Materiales3D.verdeCaliz(), 0.18 * s, -0.06 * s, 1.65, rotY));
        }

        return grupo;
    },

    // 9. MARGARITA 3D (Botón dorado con corona de pétalos blancos radiantes de punta redondeada)
    crearMargarita(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Margarita3D';
        const matPetalo = Materiales3D.crear(colorHex || '#ffffff', { roughness: 0.74 });
        const s = escala;

        const geoCentro = new THREE.SphereGeometry(0.32 * s, 16, 16);
        geoCentro.scale(1, 0.40, 1);
        const meshCentro = new THREE.Mesh(geoCentro, Materiales3D.doradoCentro());
        meshCentro.position.y = 0.03 * s;
        grupo.add(meshCentro);

        const numP = 22;
        const geoP = this.crearGeometriaPetaloMargarita(0.20 * s, 0.85 * s);
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

            const puntosE = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0.45 * s, 0.12 * s),
                new THREE.Vector3(0, 0.90 * s, 0.28 * s)
            ];
            const curvaE = new THREE.CatmullRomCurve3(puntosE);
            const geoE = new THREE.TubeGeometry(curvaE, 10, 0.02 * s, 6, false);
            subE.add(new THREE.Mesh(geoE, matEstambre));

            const antera = new THREE.Mesh(new THREE.BoxGeometry(0.06 * s, 0.16 * s, 0.06 * s), matAntera);
            antera.position.copy(puntosE[2]);
            antera.rotation.x = 0.45;
            subE.add(antera);

            grupo.add(subE);
        }

        return grupo;
    },

    // 12. ORQUÍDEA 3D (Arquitectura Phalaenopsis conectada en la columna central)
    crearOrquidea(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Orquidea3D';
        const mat = Materiales3D.crear(colorHex, { roughness: 0.78 });
        const s = escala;

        // Receptáculo / Columna floral central (Ivory/Dorado)
        const geoColumna = new THREE.CylinderGeometry(0.08 * s, 0.06 * s, 0.35 * s, 8);
        geoColumna.translate(0, 0.15 * s, 0.08 * s);
        const meshCol = new THREE.Mesh(geoColumna, Materiales3D.doradoCentro());
        meshCol.rotation.x = 0.35;
        grupo.add(meshCol);

        // 1. Sépalo dorsal vertical (arriba)
        const geoSepDorsal = this.crearGeometriaPetalo(0.48 * s, 1.10 * s, 0.20, -0.08);
        const meshSepDorsal = new THREE.Mesh(geoSepDorsal, mat);
        meshSepDorsal.rotation.x = 0.15;
        grupo.add(meshSepDorsal);

        // 2. Dos sépalos laterales inferiores (abren hacia abajo y a los lados)
        const geoSepLat = this.crearGeometriaPetalo(0.44 * s, 0.95 * s, 0.18, -0.06);
        [-1, 1].forEach(lado => {
            const m = new THREE.Mesh(geoSepLat, mat);
            m.rotation.z = lado * 2.25;
            m.rotation.x = 0.22;
            grupo.add(m);
        });

        // 3. Dos alas de mariposa amplias redondeadas (pétalos laterales)
        const geoAla = this.crearGeometriaPetalo(0.92 * s, 1.15 * s, 0.25, -0.12);
        [-1, 1].forEach(lado => {
            const m = new THREE.Mesh(geoAla, mat);
            m.rotation.z = lado * (Math.PI / 2.05);
            m.rotation.y = lado * 0.18;
            m.rotation.x = 0.12;
            grupo.add(m);
        });

        // 4. Labello (labio esculpido magenta conectado al centro)
        const geoLabello = this.crearGeometriaPetalo(0.60 * s, 0.85 * s, 0.45, -0.22);
        const matLabello = Materiales3D.crear('#8338ec', { roughness: 0.75 });
        const meshLabello = new THREE.Mesh(geoLabello, matLabello);
        meshLabello.position.set(0, 0, 0.08 * s);
        meshLabello.rotation.x = 1.25;
        grupo.add(meshLabello);

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

    // 14. GYPSOPHILA 3D (Ramillete continuo totalmente conectado desde el tallo central)
    crearGypsophila(colorHex, escala = 1) {
        const grupo = new THREE.Group();
        grupo.name = 'Gypsophila3D';
        const matFlor = Materiales3D.crear(colorHex || '#ffffff', { roughness: 0.78 });
        const matRama = Materiales3D.verdeTallo('#4a7c59');
        const s = escala * 0.90;

        // Tallo central que conecta directamente con el tallo principal
        const largoCentral = 1.3 * s;
        const geoColumna = new THREE.CylinderGeometry(0.025 * s, 0.035 * s, largoCentral, 8);
        geoColumna.translate(0, largoCentral * 0.5, 0);
        grupo.add(new THREE.Mesh(geoColumna, matRama));

        // 7 ramificaciones continuas que parten físicamente desde la base del ramillete
        const ramasConfig = [
            { yOrigen: 0.05 * s, fin: new THREE.Vector3(-0.35 * s, 0.45 * s, 0.15 * s) },
            { yOrigen: 0.15 * s, fin: new THREE.Vector3(0.38 * s, 0.55 * s, -0.15 * s) },
            { yOrigen: 0.28 * s, fin: new THREE.Vector3(-0.30 * s, 0.75 * s, -0.12 * s) },
            { yOrigen: 0.40 * s, fin: new THREE.Vector3(0.32 * s, 0.85 * s, 0.15 * s) },
            { yOrigen: 0.55 * s, fin: new THREE.Vector3(-0.18 * s, 1.05 * s, 0.10 * s) },
            { yOrigen: 0.65 * s, fin: new THREE.Vector3(0.20 * s, 1.10 * s, -0.08 * s) },
            { yOrigen: 0.75 * s, fin: new THREE.Vector3(0.0, 1.25 * s, 0.0) }
        ];

        ramasConfig.forEach(cfg => {
            const pInicio = new THREE.Vector3(0, cfg.yOrigen, 0);
            const pMedio = pInicio.clone().lerp(cfg.fin, 0.5).add(new THREE.Vector3(0, 0.05 * s, 0));
            const curva = new THREE.CatmullRomCurve3([pInicio, pMedio, cfg.fin]);
            const geoTubo = new THREE.TubeGeometry(curva, 8, 0.016 * s, 6, false);
            grupo.add(new THREE.Mesh(geoTubo, matRama));

            const sub = new THREE.Group();
            sub.position.copy(cfg.fin);
            for (let i = 0; i < 5; i++) {
                const a = (i * Math.PI * 2) / 5;
                const geoF = new THREE.SphereGeometry(0.040 * s, 6, 6);
                geoF.scale(1, 0.45, 1);
                const mF = new THREE.Mesh(geoF, matFlor);
                mF.position.set(Math.cos(a) * 0.055 * s, Math.sin(a) * 0.055 * s, 0);
                sub.add(mF);
            }
            const geoC = new THREE.SphereGeometry(0.022 * s, 4, 4);
            const mC = new THREE.Mesh(geoC, Materiales3D.doradoCentro());
            sub.add(mC);
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

        const geoNudo = new THREE.SphereGeometry(0.24 * s, 16, 16);
        geoNudo.scale(1.2, 0.9, 0.9);
        const meshNudo = new THREE.Mesh(geoNudo, mat);
        grupo.add(meshNudo);

        const curvaIzq = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-0.75 * s, 0.45 * s, 0.25 * s),
            new THREE.Vector3(-1.15 * s, -0.18 * s, 0.18 * s),
            new THREE.Vector3(-0.18 * s, -0.08 * s, 0)
        );
        grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curvaIzq, 20, 0.14 * s, 10, false), mat));

        const curvaDer = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.75 * s, 0.45 * s, 0.25 * s),
            new THREE.Vector3(1.15 * s, -0.18 * s, 0.18 * s),
            new THREE.Vector3(0.18 * s, -0.08 * s, 0)
        );
        grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curvaDer, 20, 0.14 * s, 10, false), mat));

        const curvaCintaIzq = new THREE.CubicBezierCurve3(
            new THREE.Vector3(-0.1 * s, -0.08 * s, 0),
            new THREE.Vector3(-0.35 * s, -0.75 * s, 0.18 * s),
            new THREE.Vector3(-0.55 * s, -1.45 * s, 0.10 * s),
            new THREE.Vector3(-0.70 * s, -1.95 * s, 0)
        );
        grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curvaCintaIzq, 24, 0.12 * s, 8, false), mat));

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
        v.controls.target.set(0, 0.90, 0);
        v.camera.position.set(0, 2.10, 4.3);
        v.controls.update();

        const florRaiz = new THREE.Group();
        const alturaTallo = 2.4;
        const { mesh: meshTallo, fin: finTallo } = GeneradorFlores3D.crearTallo3D(alturaTallo, 0.065, 0.16);
        meshTallo.position.y = -1.15;
        florRaiz.add(meshTallo);

        // Hojas en el tallo (solo para especies con hojas individuales)
        let hoja1 = null;
        let hoja2 = null;
        const matHoja = Materiales3D.verdeHoja();

        if (itemDef.tipo !== 'eucalipto' && itemDef.tipo !== 'helecho' && itemDef.tipo !== 'gypsophila') {
            const geoHoja1 = GeneradorFlores3D.crearGeometriaHoja(0.40, 1.15, 0.22);
            hoja1 = new THREE.Mesh(geoHoja1, matHoja);
            hoja1.position.set(-0.25, -0.3, 0);
            hoja1.rotation.z = -0.7;
            hoja1.rotation.y = -0.4;
            florRaiz.add(hoja1);

            const geoHoja2 = GeneradorFlores3D.crearGeometriaHoja(0.38, 1.05, 0.22);
            hoja2 = new THREE.Mesh(geoHoja2, matHoja);
            hoja2.position.set(0.25, 0.25, 0);
            hoja2.rotation.z = 0.7;
            hoja2.rotation.y = 0.4;
            florRaiz.add(hoja2);
        }

        // Cabeza floral
        const florCabeza = GeneradorFlores3D.crearFlor(itemDef.tipo, itemDef.colorSeleccionado, 1.0);
        florCabeza.position.copy(finTallo);
        florCabeza.position.y += -1.15;

        if (itemDef.tipo !== 'lavanda' && itemDef.tipo !== 'eucalipto' && itemDef.tipo !== 'helecho' && itemDef.tipo !== 'gypsophila') {
            florCabeza.rotation.x = 0.42;
        }
        florRaiz.add(florCabeza);

        v.grupoContenido.add(florRaiz);

        // Chispas mágicas
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

            const progresoFlor = Math.max(0.01, Math.min(1, (progreso - 0.20) / 0.80));
            florCabeza.scale.setScalar(progresoFlor);
            if (hoja1) hoja1.scale.setScalar(Math.max(0.01, (progreso - 0.20) / 0.80));
            if (hoja2) hoja2.scale.setScalar(Math.max(0.01, (progreso - 0.30) / 0.70));

            if (onProgreso) onProgreso(progreso);

            if (progreso < 1) {
                requestAnimationFrame(animarBrote);
            } else {
                florCabeza.scale.setScalar(1);
                meshTallo.scale.y = 1;
                florCabeza.position.copy(finTallo);
                florCabeza.position.y += -1.15;
                if (hoja1) hoja1.scale.setScalar(1);
                if (hoja2) hoja2.scale.setScalar(1);
                if (onFin) onFin();
            }
        }

        requestAnimationFrame(animarBrote);
    },

    // Ensamblaje armónico del Ramo Completo en 3D (Cúpula de floristería de lujo tipo Bouquet Rond)
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
        bouquetGrupo.position.y = 0.05;

        // Punto de amarre central del ramo (justo debajo del domo de flores)
        const puntoLazo = new THREE.Vector3(0, -0.12, 0);
        const yCentroDomo = 0.55;

        const follaje = floresSeleccionadas.filter(f => f.tipo === 'eucalipto' || f.tipo === 'helecho');
        const principales = floresSeleccionadas.filter(f => f.tipo !== 'eucalipto' && f.tipo !== 'helecho');
        const floresParaDomo = principales.length > 0 ? principales : follaje;
        const follajeDeFondo = principales.length > 0 ? follaje : [];

        // 1. Follaje de fondo que enmarca el ramo con frescura y altura
        const configAlas = [
            { pos: new THREE.Vector3(-0.75, 0.70, -0.22), rotZ: 0.35, rotY: 0.18 },
            { pos: new THREE.Vector3(0.75, 0.70, -0.22), rotZ: -0.35, rotY: -0.18 },
            { pos: new THREE.Vector3(-0.40, 0.98, -0.28), rotZ: 0.18, rotY: 0.12 },
            { pos: new THREE.Vector3(0.40, 0.98, -0.28), rotZ: -0.18, rotY: -0.12 }
        ];

        follajeDeFondo.forEach((fol, idx) => {
            const ramaMesh = GeneradorFlores3D.crearFlor(fol.tipo, fol.color, 0.60);
            const cfg = configAlas[idx % configAlas.length];
            ramaMesh.position.copy(cfg.pos);
            ramaMesh.rotation.z = cfg.rotZ;
            ramaMesh.rotation.y = cfg.rotY;
            bouquetGrupo.add(ramaMesh);
        });

        // 2. Flores distribuidas en cúpula armónica esférica
        const total = floresParaDomo.length;
        const plantillas3D = this.calcularPlantillas3D(total);

        // Calibración de escala por especie botánica para que convivan en perfecta armonía sin sobreposiciones
        const escalaEspecieRamo = {
            girasol: 0.40,
            lirio: 0.36,
            amapola: 0.44,
            peonia: 0.45,
            rosa: 0.48,
            tulipan: 0.48,
            clavel: 0.46,
            dalia: 0.44,
            sakura: 0.50,
            margarita: 0.44,
            orquidea: 0.44,
            hortensia: 0.46,
            lavanda: 0.48,
            gypsophila: 0.46,
            eucalipto: 0.50,
            helecho: 0.50
        };

        floresParaDomo.forEach((flor, idx) => {
            const p = plantillas3D[idx % plantillas3D.length];
            const factorBase = p.scale ? (p.scale / 0.76) : 1.0;
            const escalaFinal = (escalaEspecieRamo[flor.tipo] || 0.45) * factorBase;
            const florCabeza = GeneradorFlores3D.crearFlor(flor.tipo, flor.color, escalaFinal);
            florCabeza.position.set(p.x, p.y, p.z);

            // Orientación natural hacia afuera e inclinada hacia el frente (+Z, hacia la cámara)
            // Las flores muestran sus rostros radiantes a la persona que las contempla
            const dir = new THREE.Vector3(
                p.x * 0.55,
                (p.y - yCentroDomo) * 0.55,
                0.90
            ).normalize();
            florCabeza.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            bouquetGrupo.add(florCabeza);

            // Tallo convergente limpio desde la flor hasta el punto de amarre
            const curvaTallo = new THREE.CatmullRomCurve3([
                new THREE.Vector3(p.x, p.y - 0.05, p.z),
                new THREE.Vector3(p.x * 0.45, puntoLazo.y + 0.15, p.z * 0.45),
                puntoLazo.clone().add(new THREE.Vector3(p.x * 0.06, 0.01, p.z * 0.06))
            ]);
            const geoTallo = new THREE.TubeGeometry(curvaTallo, 16, 0.036, 8, false);
            const meshTallo = new THREE.Mesh(geoTallo, Materiales3D.verdeTallo());
            bouquetGrupo.add(meshTallo);
        });

        // 3. Collar de hojas verdes de floristería que sostienen y enmarcan la base del domo
        const numHojasCollar = 10;
        const matHojaCollar = Materiales3D.verdeHoja();
        for (let i = 0; i < numHojasCollar; i++) {
            const a = (i * Math.PI * 2) / numHojasCollar;
            const geoHoja = GeneradorFlores3D.crearGeometriaHoja(0.38, 0.95, 0.22);
            const hoja = new THREE.Mesh(geoHoja, matHojaCollar);

            const radioCollar = 0.82;
            const yCollar = 0.42 + Math.sin(a) * 0.25;
            const xCollar = Math.cos(a) * radioCollar;
            const zCollar = Math.sin(a) * radioCollar * 0.35 - 0.04;
            hoja.position.set(xCollar, yCollar, zCollar);

            const dirHoja = new THREE.Vector3(Math.cos(a) * 1.15, 0.32, Math.sin(a) * 0.45 + 0.35).normalize();
            hoja.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirHoja);
            bouquetGrupo.add(hoja);
        }

        // 4. Haz de tallos inferiores reunidos y cortados parejos bajo el lazo
        const totalTallosInf = 10;
        for (let i = 0; i < totalTallosInf; i++) {
            const t = (i / (totalTallosInf - 1)) - 0.5;
            const geoTalloInf = new THREE.CylinderGeometry(0.032, 0.032, 0.48, 8);
            geoTalloInf.translate(0, -0.24, 0);
            const mTI = new THREE.Mesh(geoTalloInf, Materiales3D.verdeTallo());
            mTI.position.set(t * 0.18, puntoLazo.y, (Math.random() - 0.5) * 0.08);
            mTI.rotation.z = t * 0.12;
            bouquetGrupo.add(mTI);
        }

        // 5. Lazo satinado de regalo en el punto de amarre
        const lazo = GeneradorFlores3D.crearLazoSatinado('#ffb3c6', 0.85);
        lazo.position.copy(puntoLazo);
        lazo.position.z += 0.14;
        bouquetGrupo.add(lazo);

        r.grupoContenido.add(bouquetGrupo);

        r.controls.target.set(0, 0.42, 0);
        r.camera.position.set(0, 0.85, 3.8);
        r.controls.update();
    },

    // Distribución armónica en cúpula floral según la cantidad de flores (Bouquet Rond compacto de floristería)
    calcularPlantillas3D(total) {
        if (total === 1) {
            return [{ x: 0, y: 0.55, z: 0.20, scale: 0.88 }];
        }
        if (total === 2) {
            return [
                { x: -0.32, y: 0.55, z: 0.20, scale: 0.82 },
                { x: 0.32, y: 0.55, z: 0.20, scale: 0.82 }
            ];
        }
        if (total === 3) {
            return [
                { x: 0, y: 0.78, z: 0.12, scale: 0.80 },
                { x: -0.36, y: 0.42, z: 0.20, scale: 0.78 },
                { x: 0.36, y: 0.42, z: 0.20, scale: 0.78 }
            ];
        }
        if (total === 4) {
            return [
                { x: 0, y: 0.82, z: 0.10, scale: 0.78 },
                { x: -0.40, y: 0.55, z: 0.18, scale: 0.76 },
                { x: 0.40, y: 0.55, z: 0.18, scale: 0.76 },
                { x: 0, y: 0.28, z: 0.22, scale: 0.76 }
            ];
        }
        if (total === 5) {
            return [
                { x: 0, y: 0.58, z: 0.26, scale: 0.78 }, // Centro frontal
                { x: 0, y: 0.92, z: 0.08, scale: 0.74 },
                { x: -0.48, y: 0.60, z: 0.15, scale: 0.74 },
                { x: 0.48, y: 0.60, z: 0.15, scale: 0.74 },
                { x: 0, y: 0.24, z: 0.22, scale: 0.74 }
            ];
        }
        if (total === 6) {
            return [
                { x: 0, y: 0.58, z: 0.26, scale: 0.78 }, // Corona central
                { x: 0, y: 0.94, z: 0.08, scale: 0.74 },
                { x: -0.52, y: 0.72, z: 0.14, scale: 0.74 },
                { x: 0.52, y: 0.72, z: 0.14, scale: 0.74 },
                { x: -0.38, y: 0.28, z: 0.22, scale: 0.74 },
                { x: 0.38, y: 0.28, z: 0.22, scale: 0.74 }
            ];
        }
        if (total === 7) {
            return [
                { x: 0, y: 0.58, z: 0.28, scale: 0.80 }, // Centro
                { x: 0, y: 0.96, z: 0.10, scale: 0.74 },  // Arriba
                { x: 0.48, y: 0.76, z: 0.16, scale: 0.74 }, // Arriba der
                { x: 0.48, y: 0.36, z: 0.20, scale: 0.74 }, // Abajo der
                { x: 0, y: 0.18, z: 0.24, scale: 0.74 },    // Abajo
                { x: -0.48, y: 0.36, z: 0.20, scale: 0.74 }, // Abajo izq
                { x: -0.48, y: 0.76, z: 0.16, scale: 0.74 }  // Arriba izq
            ];
        }
        if (total === 8) {
            return [
                { x: -0.22, y: 0.58, z: 0.26, scale: 0.76 }, // Centro izq
                { x: 0.22, y: 0.58, z: 0.26, scale: 0.76 },  // Centro der
                { x: 0, y: 0.96, z: 0.08, scale: 0.72 },
                { x: 0.54, y: 0.76, z: 0.14, scale: 0.72 },
                { x: 0.54, y: 0.36, z: 0.18, scale: 0.72 },
                { x: 0, y: 0.18, z: 0.22, scale: 0.72 },
                { x: -0.54, y: 0.36, z: 0.18, scale: 0.72 },
                { x: -0.54, y: 0.76, z: 0.14, scale: 0.72 }
            ];
        }
        if (total === 9) {
            return [
                { x: 0, y: 0.58, z: 0.28, scale: 0.78 }, // Centro
                { x: 0, y: 0.98, z: 0.08, scale: 0.72 },
                { x: 0.42, y: 0.86, z: 0.14, scale: 0.72 },
                { x: 0.56, y: 0.58, z: 0.18, scale: 0.72 },
                { x: 0.42, y: 0.30, z: 0.22, scale: 0.72 },
                { x: 0, y: 0.18, z: 0.24, scale: 0.72 },
                { x: -0.42, y: 0.30, z: 0.22, scale: 0.72 },
                { x: -0.56, y: 0.58, z: 0.18, scale: 0.72 },
                { x: -0.42, y: 0.86, z: 0.14, scale: 0.72 }
            ];
        }
        // 10 flores (Bouquet esférico idéntico a la referencia de floristería del usuario: 1 cumbre + 3 nivel medio + 6 anillo base)
        return [
            { x: 0, y: 1.02, z: 0.06, scale: 0.74 },     // Cumbre superior
            { x: -0.38, y: 0.74, z: 0.18, scale: 0.74 }, // Fila media izq
            { x: 0, y: 0.68, z: 0.28, scale: 0.76 },      // Fila media centro
            { x: 0.38, y: 0.74, z: 0.18, scale: 0.74 },  // Fila media der
            { x: -0.62, y: 0.44, z: 0.12, scale: 0.72 }, // Anillo base izq exterior
            { x: -0.38, y: 0.30, z: 0.20, scale: 0.72 }, // Anillo base izq
            { x: -0.14, y: 0.18, z: 0.24, scale: 0.72 }, // Anillo base centro-izq
            { x: 0.14, y: 0.18, z: 0.24, scale: 0.72 },  // Anillo base centro-der
            { x: 0.38, y: 0.30, z: 0.20, scale: 0.72 },  // Anillo base der
            { x: 0.62, y: 0.44, z: 0.12, scale: 0.72 }   // Anillo base der exterior
        ];
    }
};

// Exportar para acceso global en el navegador
if (typeof window !== 'undefined') {
    window.GeneradorFlores3D = GeneradorFlores3D;
    window.Motor3D = Motor3D;
}
