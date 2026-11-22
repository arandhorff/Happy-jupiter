/**
 * MOTOR BOTÁNICO 3D REALISTA DE ALTO DETALLE
 * Ilustración botánica con perspectiva tridimensional, iluminación difusa y especular,
 * hojas realistas integradas en CADA flor, cálices anatómicos y sin errores geométricos.
 */

// Utilidad global para variar brillo de colores HEX
function ajustarColorBrillo(hex, percent) {
    if (!hex || hex.charAt(0) !== '#') return hex || '#ff758f';
    let num = parseInt(hex.slice(1), 16);
    if (isNaN(num)) return hex;
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Clase Base: Flor
class Flor {
    constructor(nombre, tipo, color, opciones = {}) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.color = color;
        this.talloColor = opciones.talloColor || '#2d5a36';
        this.hojaColor = opciones.hojaColor || '#386641';
        this.tamano = opciones.tamano || 1;
        this.descripcion = opciones.descripcion || '';
    }

    // Dibuja la flor completa en la mesa de virtualización (con tallo y hojas propias)
    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        throw new Error("El método dibujar() debe ser implementado.");
    }

    // Dibuja la cabeza de la flor con sus hojas de cáliz en el ramo
    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        throw new Error("El método dibujarCabeza() debe ser implementado.");
    }

    // Dibuja un pétalo flotante con volteo 3D para la lluvia personalizada
    dibujarPetaloCayendo(ctx, x, y, tamano, rotacion, flip) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotacion);
        ctx.scale(Math.cos(flip), 1);

        const grad = ctx.createRadialGradient(-tamano * 0.3, -tamano * 0.3, 1, 0, 0, tamano);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, this.color);
        grad.addColorStop(1, ajustarColorBrillo(this.color, -30));
        ctx.fillStyle = grad;

        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(0, -tamano);
        ctx.bezierCurveTo(tamano * 0.85, -tamano * 0.5, tamano * 0.85, tamano * 0.5, 0, tamano);
        ctx.bezierCurveTo(-tamano * 0.85, tamano * 0.5, -tamano * 0.85, -tamano * 0.5, 0, -tamano);
        ctx.fill();

        // Ribete iluminado
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    // Tallo 3D cilíndrico con luz y sombra
    dibujarTallo(ctx, x, y, altura, curvatura = 0, grosor = 5.5, progreso = 1) {
        ctx.save();
        const finY = y - (altura * progreso);
        const controlX = x + curvatura * progreso;
        const controlY = y - (altura * 0.5 * progreso);
        const finX = x + (curvatura * 0.8 * progreso);

        // Sombra lateral
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = (grosor + 2.5) * this.tamano;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 2, y);
        ctx.quadraticCurveTo(controlX + 2, controlY, finX + 2, finY);
        ctx.stroke();

        // Tallo cilíndrico
        ctx.strokeStyle = this.talloColor;
        ctx.lineWidth = grosor * this.tamano;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(controlX, controlY, finX, finY);
        ctx.stroke();

        // Resalte de luz longitudinal
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = Math.max(1, (grosor * 0.3) * this.tamano);
        ctx.beginPath();
        ctx.moveTo(x - 1, y);
        ctx.quadraticCurveTo(controlX - 1, controlY, finX - 1, finY);
        ctx.stroke();

        ctx.restore();
        return { finX, finY };
    }

    // Hoja 3D botánica con pliegue de luz y nervadura
    dibujarHoja(ctx, x, y, radioX, radioY, rotacion, color = this.hojaColor) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotacion);

        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;

        // Mitad izquierda (iluminada)
        const gradLuz = ctx.createLinearGradient(-radioX, 0, 0, 0);
        gradLuz.addColorStop(0, ajustarColorBrillo(color, 25));
        gradLuz.addColorStop(1, color);
        ctx.fillStyle = gradLuz;
        ctx.beginPath();
        ctx.moveTo(0, -radioY);
        ctx.bezierCurveTo(-radioX * 1.3, -radioY * 0.4, -radioX * 1.3, radioY * 0.4, 0, radioY);
        ctx.lineTo(0, -radioY);
        ctx.fill();

        // Mitad derecha (en sombra 3D)
        const gradSombra = ctx.createLinearGradient(0, 0, radioX, 0);
        gradSombra.addColorStop(0, color);
        gradSombra.addColorStop(1, ajustarColorBrillo(color, -25));
        ctx.fillStyle = gradSombra;
        ctx.beginPath();
        ctx.moveTo(0, -radioY);
        ctx.bezierCurveTo(radioX * 1.3, -radioY * 0.4, radioX * 1.3, radioY * 0.4, 0, radioY);
        ctx.lineTo(0, -radioY);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Nervadura central clara
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(0, -radioY * 0.85);
        ctx.lineTo(0, radioY * 0.85);
        ctx.stroke();

        ctx.restore();
    }
}

// 1. ROSA 3D (Volumétrica, idéntica en estética a la foto de referencia)
class Rosa extends Flor {
    constructor(color = '#ffb3c6', opciones = {}) {
        super('Rosa', 'rosa', color, {
            talloColor: '#2b5832',
            hojaColor: '#366e3f',
            descripcion: 'Reina del romance con múltiples espirales de pétalos aterciopelados.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 175 * s;
        const curv = -10 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 6 * s, talloProg);

        // Hojas de rosa dentadas en el tallo
        if (progreso > 0.3) {
            const hProg = Math.min(1, (progreso - 0.3) / 0.5);
            this.dibujarHoja(ctx, -10 * s, -alturaTallo * 0.35, 14 * s * hProg, 28 * s * hProg, -0.6);
            this.dibujarHoja(ctx, 10 * s, -alturaTallo * 0.6, 13 * s * hProg, 26 * s * hProg, 0.6);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const r = 45 * s;

        // Hojitas verdes de cáliz asomando detrás de la rosa
        ctx.save();
        for (let j = 0; j < 3; j++) {
            const a = -0.8 + (j * 0.8);
            ctx.save();
            ctx.rotate(a);
            this.dibujarHoja(ctx, 0, -r * 0.95, 10 * s, 22 * s, 0, this.hojaColor);
            ctx.restore();
        }
        ctx.restore();

        // Sombra de contacto
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 12 * s;
        ctx.shadowOffsetY = 5 * s;

        // Base esférica del cáliz
        const gradCopa = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
        gradCopa.addColorStop(0, ajustarColorBrillo(this.color, 18));
        gradCopa.addColorStop(0.6, this.color);
        gradCopa.addColorStop(1, ajustarColorBrillo(this.color, -30));
        ctx.fillStyle = gradCopa;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Pétalos 3D con borde enrollado hacia afuera
        const dibujarPetalo3D = (rot, pDist, pAncho, pAlto, brilloVar) => {
            ctx.save();
            ctx.rotate(rot);

            ctx.shadowColor = 'rgba(0,0,0,0.16)';
            ctx.shadowBlur = 5 * s;
            ctx.shadowOffsetY = 3 * s;

            const cBase = ajustarColorBrillo(this.color, brilloVar);
            const grad = ctx.createRadialGradient(0, -pDist * 0.5, 2, 0, -pDist, pAlto * 1.1);
            grad.addColorStop(0, ajustarColorBrillo(cBase, -20));
            grad.addColorStop(0.5, cBase);
            grad.addColorStop(1, ajustarColorBrillo(cBase, 22));
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(-pAncho * 0.6, 0);
            ctx.bezierCurveTo(-pAncho, -pAlto * 0.5, -pAncho * 0.8, -pAlto, 0, -pAlto * 1.05);
            ctx.bezierCurveTo(pAncho * 0.8, -pAlto, pAncho, -pAlto * 0.5, pAncho * 0.6, 0);
            ctx.closePath();
            ctx.fill();

            ctx.shadowColor = 'transparent';

            // Reborde exterior plegado con luz
            ctx.fillStyle = ajustarColorBrillo(cBase, 35);
            ctx.beginPath();
            ctx.moveTo(-pAncho * 0.75, -pAlto * 0.85);
            ctx.quadraticCurveTo(0, -pAlto * 1.15, pAncho * 0.75, -pAlto * 0.85);
            ctx.quadraticCurveTo(0, -pAlto * 0.98, -pAncho * 0.75, -pAlto * 0.85);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.75)';
            ctx.lineWidth = 1.3 * s;
            ctx.beginPath();
            ctx.moveTo(-pAncho * 0.6, -pAlto * 0.88);
            ctx.quadraticCurveTo(0, -pAlto * 1.14, pAncho * 0.6, -pAlto * 0.88);
            ctx.stroke();

            ctx.restore();
        };

        // Capas concéntricas de pétalos
        for (let i = 0; i < 5; i++) {
            dibujarPetalo3D((i * Math.PI * 2) / 5 - 0.3, r * 0.75, r * 0.85, r * 0.92, (i % 2 === 0 ? -6 : 4));
        }
        for (let i = 0; i < 5; i++) {
            dibujarPetalo3D((i * Math.PI * 2) / 5 + 0.35, r * 0.5, r * 0.65, r * 0.7, (i % 2 === 0 ? 8 : -2));
        }
        for (let i = 0; i < 4; i++) {
            dibujarPetalo3D((i * Math.PI * 2) / 4 + 0.2, r * 0.28, r * 0.45, r * 0.5, 14);
        }

        // Corazón aterciopelado con espirales concéntricas
        const gradCentro = ctx.createRadialGradient(-2 * s, -2 * s, 1, 0, 0, r * 0.26);
        gradCentro.addColorStop(0, ajustarColorBrillo(this.color, 32));
        gradCentro.addColorStop(0.65, ajustarColorBrillo(this.color, -12));
        gradCentro.addColorStop(1, ajustarColorBrillo(this.color, -38));
        ctx.fillStyle = gradCentro;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = ajustarColorBrillo(this.color, -40);
        ctx.lineWidth = 2.4 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.18, 0.2, Math.PI * 1.7);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-1 * s, -1 * s, r * 0.11, -Math.PI * 0.6, Math.PI * 0.9);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(1 * s, 1 * s, r * 0.05, 0.4, Math.PI * 1.8);
        ctx.stroke();

        ctx.restore();
    }
}

// 2. PEONÍA 3D (Volumen frondoso y pétalos ondulados en floristería de lujo)
class Peonia extends Flor {
    constructor(color = '#ff8fab', opciones = {}) {
        super('Peonía', 'peonia', color, {
            talloColor: '#345e3b',
            hojaColor: '#45784d',
            descripcion: 'Esponjosa, dulce y con un volumen majestuoso de pétalos suaves.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 175 * s;
        const curv = 10 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 6 * s, talloProg);

        if (progreso > 0.3) {
            const hProg = Math.min(1, (progreso - 0.3) / 0.5);
            this.dibujarHoja(ctx, -10 * s, -alturaTallo * 0.35, 15 * s * hProg, 30 * s * hProg, -0.5);
            this.dibujarHoja(ctx, 10 * s, -alturaTallo * 0.55, 14 * s * hProg, 28 * s * hProg, 0.5);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const r = 46 * s;

        // Hojas verdes de peonía detrás
        ctx.save();
        this.dibujarHoja(ctx, -r * 0.7, -r * 0.5, 12 * s, 26 * s, -0.9, this.hojaColor);
        this.dibujarHoja(ctx, r * 0.7, -r * 0.5, 12 * s, 26 * s, 0.9, this.hojaColor);
        ctx.restore();

        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 12 * s;

        const gradBase = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        gradBase.addColorStop(0, ajustarColorBrillo(this.color, 18));
        gradBase.addColorStop(0.7, this.color);
        gradBase.addColorStop(1, ajustarColorBrillo(this.color, -25));
        ctx.fillStyle = gradBase;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Capa de pétalos ondulados
        for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI * 2) / 8;
            ctx.save();
            ctx.rotate(a);
            const grad = ctx.createRadialGradient(0, -r * 0.5, 2, 0, -r * 0.7, r * 0.55);
            grad.addColorStop(0, ajustarColorBrillo(this.color, -10));
            grad.addColorStop(0.7, this.color);
            grad.addColorStop(1, ajustarColorBrillo(this.color, 25));
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(-r * 0.45, 0);
            ctx.bezierCurveTo(-r * 0.6, -r * 0.5, -r * 0.4, -r * 0.95, 0, -r * 0.98);
            ctx.bezierCurveTo(r * 0.4, -r * 0.95, r * 0.6, -r * 0.5, r * 0.45, 0);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.3 * s;
            ctx.stroke();
            ctx.restore();
        }

        for (let i = 0; i < 7; i++) {
            const a = (i * Math.PI * 2) / 7 + 0.35;
            ctx.save();
            ctx.rotate(a);
            ctx.fillStyle = ajustarColorBrillo(this.color, 20);
            ctx.beginPath();
            ctx.moveTo(-r * 0.35, 0);
            ctx.bezierCurveTo(-r * 0.45, -r * 0.35, -r * 0.3, -r * 0.7, 0, -r * 0.75);
            ctx.bezierCurveTo(r * 0.3, -r * 0.7, r * 0.45, -r * 0.35, r * 0.35, 0);
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = '#ffbe0b';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 4;
        for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI * 2) / 8;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 7 * s, Math.sin(a) * 7 * s, 2 * s, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// 3. TULIPÁN 3D (Copa de seda satinada con hojas largas que abrazan el tallo)
class Tulipan extends Flor {
    constructor(color = '#ff758f', opciones = {}) {
        super('Tulipán', 'tulipan', color, {
            talloColor: '#3d6d45',
            hojaColor: '#538e5c',
            descripcion: 'Elegante y sedoso, con pétalos acopados en capas suaves.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 175 * s;
        const curv = 12 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 6 * s, talloProg);

        if (progreso > 0.3) {
            const hProg = Math.min(1, (progreso - 0.3) / 0.5);
            this.dibujarHoja(ctx, curv * 0.2, -alturaTallo * 0.3, 14 * s * hProg, 48 * s * hProg, -0.4);
            this.dibujarHoja(ctx, curv * 0.5, -alturaTallo * 0.5, 12 * s * hProg, 42 * s * hProg, 0.45);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const ancho = 28 * s;
        const alto = 54 * s;

        // Hoja verde de fondo del tulipán
        this.dibujarHoja(ctx, -ancho * 0.6, 5 * s, 10 * s, 32 * s, -0.4, this.hojaColor);

        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 10 * s;

        const gradPost = ctx.createLinearGradient(0, -alto, 0, 0);
        gradPost.addColorStop(0, ajustarColorBrillo(this.color, -30));
        gradPost.addColorStop(1, ajustarColorBrillo(this.color, -50));
        ctx.fillStyle = gradPost;
        ctx.beginPath();
        ctx.ellipse(0, -alto * 0.55, ancho * 0.75, alto * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Pétalos laterales
        const gradIzq = ctx.createLinearGradient(-ancho, -alto * 0.5, 0, 0);
        gradIzq.addColorStop(0, ajustarColorBrillo(this.color, 25));
        gradIzq.addColorStop(0.6, this.color);
        gradIzq.addColorStop(1, ajustarColorBrillo(this.color, -25));
        ctx.fillStyle = gradIzq;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-ancho * 1.35, -alto * 0.3, -ancho * 1.3, -alto * 0.88, -ancho * 0.35, -alto * 0.98);
        ctx.bezierCurveTo(-ancho * 0.1, -alto * 0.75, 0, -alto * 0.35, 0, 0);
        ctx.fill();

        const gradDer = ctx.createLinearGradient(ancho, -alto * 0.5, 0, 0);
        gradDer.addColorStop(0, ajustarColorBrillo(this.color, 20));
        gradDer.addColorStop(0.6, this.color);
        gradDer.addColorStop(1, ajustarColorBrillo(this.color, -30));
        ctx.fillStyle = gradDer;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(ancho * 1.35, -alto * 0.3, ancho * 1.3, -alto * 0.88, ancho * 0.35, -alto * 0.98);
        ctx.bezierCurveTo(ancho * 0.1, -alto * 0.75, 0, -alto * 0.35, 0, 0);
        ctx.fill();

        // Pétalo frontal central con reflejo satinado
        const gradFront = ctx.createLinearGradient(0, -alto * 1.05, 0, 0);
        gradFront.addColorStop(0, '#ffffff');
        gradFront.addColorStop(0.2, ajustarColorBrillo(this.color, 35));
        gradFront.addColorStop(0.7, this.color);
        gradFront.addColorStop(1, ajustarColorBrillo(this.color, -20));
        ctx.fillStyle = gradFront;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-ancho * 0.85, -alto * 0.28, -ancho * 0.75, -alto * 0.85, 0, -alto * 1.08);
        ctx.bezierCurveTo(ancho * 0.75, -alto * 0.85, ancho * 0.85, -alto * 0.28, 0, 0);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.6 * s;
        ctx.beginPath();
        ctx.moveTo(-ancho * 0.4, -alto * 0.85);
        ctx.quadraticCurveTo(0, -alto * 1.08, ancho * 0.4, -alto * 0.85);
        ctx.stroke();

        ctx.restore();
    }
}

// 4. CLAVEL 3D (RECONSTRUIDO AL 100%: Con cáliz verde alargado anatómico ABAJO, sin recuadros)
class Clavel extends Flor {
    constructor(color = '#f4acb7', opciones = {}) {
        super('Clavel', 'clavel', color, {
            talloColor: '#3a6642',
            hojaColor: '#4f772d',
            descripcion: 'Pétalos con borde festoneado/rizado en capas apretadas.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 175 * s;
        const curv = 6 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 5 * s, talloProg);

        // Hojitas lineales azul-verdosas del clavel
        if (progreso > 0.3) {
            const hProg = Math.min(1, (progreso - 0.3) / 0.5);
            this.dibujarHoja(ctx, -6 * s, -alturaTallo * 0.35, 6 * s * hProg, 26 * s * hProg, -0.6);
            this.dibujarHoja(ctx, 6 * s, -alturaTallo * 0.55, 6 * s * hProg, 24 * s * hProg, 0.6);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const r = 42 * s;

        // Hojitas verdes de cáliz asomando detrás
        ctx.save();
        for (let j = 0; j < 3; j++) {
            const a = -0.8 + (j * 0.8);
            ctx.save();
            ctx.rotate(a);
            this.dibujarHoja(ctx, 0, -r * 0.9, 8 * s, 20 * s, 0, this.hojaColor);
            ctx.restore();
        }
        ctx.restore();

        // Sombra de contacto
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 9 * s;

        // Función auxiliar para pétalo festoneado con borde rizado
        const dibujarPetaloRizado = (rot, dist, ancho, alto, brilloVar) => {
            ctx.save();
            ctx.rotate(rot);

            const cBase = ajustarColorBrillo(this.color, brilloVar);
            const grad = ctx.createLinearGradient(0, 0, 0, -dist - alto);
            grad.addColorStop(0, ajustarColorBrillo(cBase, -25));
            grad.addColorStop(0.65, cBase);
            grad.addColorStop(1, '#ffffff');
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-ancho * 0.5, -dist - alto * 0.55);
            ctx.lineTo(-ancho * 0.7, -dist - alto * 0.85);
            ctx.lineTo(-ancho * 0.35, -dist - alto * 0.75);
            ctx.lineTo(0, -dist - alto);
            ctx.lineTo(ancho * 0.35, -dist - alto * 0.75);
            ctx.lineTo(ancho * 0.7, -dist - alto * 0.85);
            ctx.lineTo(ancho * 0.5, -dist - alto * 0.55);
            ctx.closePath();
            ctx.fill();

            // Filo blanco festoneado
            ctx.strokeStyle = 'rgba(255,255,255,0.75)';
            ctx.lineWidth = 1.1 * s;
            ctx.stroke();

            ctx.restore();
        };

        // Capa 1: Pétalos exteriores en 360° (10 pétalos)
        for (let i = 0; i < 10; i++) {
            const a = (i * Math.PI * 2) / 10;
            dibujarPetaloRizado(a, r * 0.3, 18 * s, 22 * s, (i % 2 === 0 ? -10 : 8));
        }

        // Capa 2: Pétalos intermedios (8 pétalos)
        for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI * 2) / 8 + 0.35;
            dibujarPetaloRizado(a, r * 0.18, 15 * s, 18 * s, (i % 2 === 0 ? 12 : -6));
        }

        // Capa 3: Centro rizado denso (6 pétalos)
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI * 2) / 6 + 0.2;
            dibujarPetaloRizado(a, 0, 12 * s, 14 * s, 18);
        }

        // Centro apretado con sombreado
        const gradCentro = ctx.createRadialGradient(0, 0, 1, 0, 0, 8 * s);
        gradCentro.addColorStop(0, '#ffffff');
        gradCentro.addColorStop(0.5, this.color);
        gradCentro.addColorStop(1, ajustarColorBrillo(this.color, -30));
        ctx.fillStyle = gradCentro;
        ctx.beginPath();
        ctx.arc(0, 0, 8 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 5. GIRASOL 3D
class Girasol extends Flor {
    constructor(color = '#ffb703', opciones = {}) {
        super('Girasol', 'girasol', color, {
            talloColor: '#355e3b',
            hojaColor: '#437a4b',
            descripcion: 'Radiante, cálido y lleno de energía alegre como el sol.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 190 * s;
        const curv = 10 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 8 * s, talloProg);

        if (progreso > 0.3) {
            const hProg = Math.min(1, (progreso - 0.3) / 0.5);
            this.dibujarHoja(ctx, -12 * s, -alturaTallo * 0.35, 20 * s * hProg, 32 * s * hProg, -0.6);
            this.dibujarHoja(ctx, 12 * s, -alturaTallo * 0.6, 18 * s * hProg, 28 * s * hProg, 0.6);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;

        const radioCentro = 22 * s;
        const largoPetalo = 32 * s;
        const numPetalos = 18;

        // Hojas verdes asomando
        this.dibujarHoja(ctx, -radioCentro * 1.1, -radioCentro * 0.4, 14 * s, 26 * s, -0.8, this.hojaColor);
        this.dibujarHoja(ctx, radioCentro * 1.1, -radioCentro * 0.4, 14 * s, 26 * s, 0.8, this.hojaColor);

        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 8 * s;

        // Pétalos dorados frontales con pliegue 3D
        for (let i = 0; i < numPetalos; i++) {
            const a = (i * Math.PI * 2) / numPetalos;
            ctx.save();
            ctx.rotate(a);

            const grad = ctx.createLinearGradient(0, -radioCentro, 0, -radioCentro - largoPetalo);
            grad.addColorStop(0, ajustarColorBrillo(this.color, 20));
            grad.addColorStop(0.6, this.color);
            grad.addColorStop(1, ajustarColorBrillo(this.color, -10));
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(-6 * s, -radioCentro * 0.8);
            ctx.quadraticCurveTo(-8 * s, -radioCentro - largoPetalo * 0.85, 0, -radioCentro - largoPetalo * 0.98);
            ctx.quadraticCurveTo(8 * s, -radioCentro - largoPetalo * 0.85, 6 * s, -radioCentro * 0.8);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 1 * s;
            ctx.beginPath();
            ctx.moveTo(0, -radioCentro * 0.8);
            ctx.lineTo(0, -radioCentro - largoPetalo * 0.85);
            ctx.stroke();

            ctx.restore();
        }

        // Centro convexo aterciopelado
        const gradCentro = ctx.createRadialGradient(-3 * s, -3 * s, 2 * s, 0, 0, radioCentro);
        gradCentro.addColorStop(0, '#543d2b');
        gradCentro.addColorStop(0.6, '#3a2618');
        gradCentro.addColorStop(1, '#1f130b');
        ctx.fillStyle = gradCentro;
        ctx.beginPath();
        ctx.arc(0, 0, radioCentro, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffbe0b';
        for (let r = 5 * s; r < radioCentro - 2 * s; r += 3.8 * s) {
            const puntos = Math.floor(r / 1.8);
            for (let j = 0; j < puntos; j++) {
                const a = (j * Math.PI * 2) / puntos + r;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1 * s, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// 6. HORTENSIA 3D
class Hortensia extends Flor {
    constructor(color = '#b8c0ff', opciones = {}) {
        super('Hortensia', 'hortensia', color, {
            talloColor: '#3d6b46',
            hojaColor: '#4f855a',
            descripcion: 'Cúmulo abundante de suaves florecitas en tonos pasteles.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 175 * s;
        const curv = 8 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 6.5 * s, talloProg);

        if (progreso > 0.3) {
            this.dibujarHoja(ctx, -12 * s, -alturaTallo * 0.4, 16 * s, 30 * s, -0.6);
            this.dibujarHoja(ctx, 12 * s, -alturaTallo * 0.55, 15 * s, 28 * s, 0.6);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;

        // Dos hojas de hortensia grandes enmarcando la esfera
        this.dibujarHoja(ctx, -38 * s, 0, 16 * s, 32 * s, -1.2, this.hojaColor);
        this.dibujarHoja(ctx, 38 * s, 0, 16 * s, 32 * s, 1.2, this.hojaColor);

        const florecitas = [
            { x: 0, y: -10 * s, tam: 12 * s, var: 18 },
            { x: -24 * s, y: -22 * s, tam: 11 * s, var: -8 },
            { x: 24 * s, y: -22 * s, tam: 11 * s, var: 12 },
            { x: -35 * s, y: 2 * s, tam: 10.5 * s, var: -18 },
            { x: 35 * s, y: 2 * s, tam: 10.5 * s, var: -6 },
            { x: -18 * s, y: 18 * s, tam: 10.5 * s, var: 6 },
            { x: 18 * s, y: 18 * s, tam: 10.5 * s, var: -12 },
            { x: 0, y: -36 * s, tam: 11 * s, var: 24 },
            { x: -14 * s, y: -12 * s, tam: 11 * s, var: 8 },
            { x: 14 * s, y: -12 * s, tam: 11 * s, var: 16 }
        ];

        florecitas.forEach(fl => {
            ctx.save();
            ctx.translate(fl.x, fl.y);
            const c = ajustarColorBrillo(this.color, fl.var);
            const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, fl.tam);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, c);
            grad.addColorStop(1, ajustarColorBrillo(c, -20));
            ctx.fillStyle = grad;

            for (let k = 0; k < 4; k++) {
                const a = (k * Math.PI / 2) + 0.35;
                ctx.save();
                ctx.rotate(a);
                ctx.beginPath();
                ctx.ellipse(0, -fl.tam * 0.65, fl.tam * 0.52, fl.tam * 0.38, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 2.2 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.restore();
    }
}

// 7. DALIA 3D
class Dalia extends Flor {
    constructor(color = '#a07855', opciones = {}) {
        super('Dalia', 'dalia', color, {
            talloColor: '#2d6a4f',
            hojaColor: '#40916c',
            descripcion: 'Geométrica y majestuosa, con decenas de pétalos cónicos.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 180 * s;
        const curv = -8 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 6 * s, talloProg);

        if (progreso > 0.3) {
            this.dibujarHoja(ctx, -10 * s, -alturaTallo * 0.4, 14 * s, 26 * s, -0.6);
            this.dibujarHoja(ctx, 10 * s, -alturaTallo * 0.6, 14 * s, 26 * s, 0.6);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const r = 44 * s;

        // Hojas de dalia detrás
        this.dibujarHoja(ctx, -r * 0.8, -r * 0.4, 12 * s, 26 * s, -1.0, this.hojaColor);
        this.dibujarHoja(ctx, r * 0.8, -r * 0.4, 12 * s, 26 * s, 1.0, this.hojaColor);

        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 8 * s;

        // Función para pétalo cónico abombado de dalia
        const dibujarPetaloDalia = (rot, dist, ancho, alto, brilloVar) => {
            ctx.save();
            ctx.rotate(rot);

            const cBase = ajustarColorBrillo(this.color, brilloVar);
            const grad = ctx.createRadialGradient(0, -dist * 0.5, 2, 0, -dist - alto * 0.5, alto);
            grad.addColorStop(0, ajustarColorBrillo(cBase, -20));
            grad.addColorStop(0.6, cBase);
            grad.addColorStop(1, ajustarColorBrillo(cBase, 28));
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(0, -dist);
            ctx.bezierCurveTo(-ancho * 0.65, -dist - alto * 0.4, -ancho * 0.55, -dist - alto * 0.85, 0, -dist - alto);
            ctx.bezierCurveTo(ancho * 0.55, -dist - alto * 0.85, ancho * 0.65, -dist - alto * 0.4, 0, -dist);
            ctx.closePath();
            ctx.fill();

            // Pliegue central 3D
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1 * s;
            ctx.beginPath();
            ctx.moveTo(0, -dist * 1.1);
            ctx.lineTo(0, -dist - alto * 0.9);
            ctx.stroke();

            ctx.restore();
        };

        // Capa 1: Anillo exterior (14 pétalos amplios)
        for (let i = 0; i < 14; i++) {
            const a = (i * Math.PI * 2) / 14;
            dibujarPetaloDalia(a, r * 0.35, 14 * s, 22 * s, (i % 2 === 0 ? -12 : 6));
        }

        // Capa 2: Anillo intermedio (11 pétalos)
        for (let i = 0; i < 11; i++) {
            const a = (i * Math.PI * 2) / 11 + 0.25;
            dibujarPetaloDalia(a, r * 0.2, 12 * s, 18 * s, (i % 2 === 0 ? 14 : -4));
        }

        // Capa 3: Anillo interno (8 pétalos)
        for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI * 2) / 8 + 0.4;
            dibujarPetaloDalia(a, 0, 10 * s, 14 * s, 22);
        }

        // Botón central dorado
        const gradCentro = ctx.createRadialGradient(-1 * s, -1 * s, 1, 0, 0, 6 * s);
        gradCentro.addColorStop(0, '#fff3b0');
        gradCentro.addColorStop(0.6, '#f4a261');
        gradCentro.addColorStop(1, '#e76f51');
        ctx.fillStyle = gradCentro;
        ctx.beginPath();
        ctx.arc(0, 0, 6 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 8. SAKURA 3D
class Sakura extends Flor {
    constructor(color = '#ffb3c6', opciones = {}) {
        super('Sakura', 'sakura', color, {
            talloColor: '#5c4033',
            hojaColor: '#709775',
            descripcion: 'Flor de cerezo primaveral con pétalos suaves y muesca tierna.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 175 * s;
        const curv = -14 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 5 * s, talloProg);

        if (progreso > 0.3) {
            this.dibujarHoja(ctx, 8 * s, -alturaTallo * 0.4, 8 * s, 18 * s, 0.7);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const r = 36 * s;

        this.dibujarHoja(ctx, -r * 0.6, -r * 0.3, 8 * s, 18 * s, -0.8, this.hojaColor);

        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
            ctx.save();
            ctx.rotate(a);

            const grad = ctx.createRadialGradient(0, -r * 0.4, 2 * s, 0, -r * 0.5, r * 0.85);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, this.color);
            grad.addColorStop(1, ajustarColorBrillo(this.color, -10));
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-14 * s, -r * 0.4, -14 * s, -r * 0.85, -5 * s, -r);
            ctx.lineTo(0, -r * 0.86);
            ctx.lineTo(5 * s, -r);
            ctx.bezierCurveTo(14 * s, -r * 0.85, 14 * s, -r * 0.4, 0, 0);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1 * s;
            ctx.stroke();

            ctx.restore();
        }

        ctx.fillStyle = '#d90429';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ef233c';
        ctx.lineWidth = 1 * s;
        for (let j = 0; j < 8; j++) {
            const a = (j * Math.PI * 2) / 8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * 12 * s, Math.sin(a) * 12 * s);
            ctx.stroke();

            ctx.fillStyle = '#ffbe0b';
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 12 * s, Math.sin(a) * 12 * s, 1.5 * s, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// 9. MARGARITA 3D
class Margarita extends Flor {
    constructor(color = '#ffffff', opciones = {}) {
        super('Margarita', 'margarita', color, {
            talloColor: '#40734a',
            hojaColor: '#538c5f',
            descripcion: 'Sencilla, pura y brillante con su botón dorado.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 165 * s;
        const curv = 8 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 5 * s, talloProg);

        if (progreso > 0.3) {
            this.dibujarHoja(ctx, -8 * s, -alturaTallo * 0.4, 10 * s, 22 * s, -0.6);
            this.dibujarHoja(ctx, 8 * s, -alturaTallo * 0.55, 9 * s, 20 * s, 0.6);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const radioCentro = 15 * s;
        const largoPetalo = 28 * s;
        const numPetalos = 16;

        this.dibujarHoja(ctx, -radioCentro * 1.1, -radioCentro * 0.4, 10 * s, 20 * s, -0.8, this.hojaColor);
        this.dibujarHoja(ctx, radioCentro * 1.1, -radioCentro * 0.4, 10 * s, 20 * s, 0.8, this.hojaColor);

        for (let i = 0; i < numPetalos; i++) {
            const a = (i * Math.PI * 2) / numPetalos;
            ctx.save();
            ctx.rotate(a);

            const grad = ctx.createLinearGradient(0, 0, 0, -radioCentro - largoPetalo);
            grad.addColorStop(0, '#e5e5e5');
            grad.addColorStop(0.3, this.color);
            grad.addColorStop(1, '#ffffff');
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.ellipse(0, -radioCentro - largoPetalo * 0.5, 7 * s, largoPetalo * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const grad = ctx.createRadialGradient(-2 * s, -2 * s, 1, 0, 0, radioCentro);
        grad.addColorStop(0, '#fff3b0');
        grad.addColorStop(0.5, '#f4a261');
        grad.addColorStop(1, '#e76f51');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radioCentro, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 10. AMAPOLA 3D
class Amapola extends Flor {
    constructor(color = '#e63946', opciones = {}) {
        super('Amapola', 'amapola', color, {
            talloColor: '#3d6b46',
            hojaColor: '#4f855a',
            descripcion: 'Flor silvestre de pétalos delicados y centro aterciopelado.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 175 * s;
        const curv = -15 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 4.5 * s, talloProg);

        if (progreso > 0.3) {
            this.dibujarHoja(ctx, -8 * s, -alturaTallo * 0.4, 8 * s, 22 * s, -0.6);
            this.dibujarHoja(ctx, 8 * s, -alturaTallo * 0.55, 7 * s, 20 * s, 0.6);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const r = 38 * s;

        // Hojas verdes de amapola asomando detrás
        this.dibujarHoja(ctx, -r * 0.7, -r * 0.4, 10 * s, 22 * s, -0.9, this.hojaColor);
        this.dibujarHoja(ctx, r * 0.7, -r * 0.4, 10 * s, 22 * s, 0.9, this.hojaColor);

        for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI * 2) / 4 + 0.3;
            ctx.save();
            ctx.rotate(a);

            const grad = ctx.createRadialGradient(0, -r * 0.4, 4 * s, 0, -r * 0.4, r * 0.88);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.25, ajustarColorBrillo(this.color, 20));
            grad.addColorStop(0.7, this.color);
            grad.addColorStop(1, ajustarColorBrillo(this.color, -25));
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-r * 0.85, -r * 0.3, -r * 0.9, -r * 0.9, 0, -r * 1.05);
            ctx.bezierCurveTo(r * 0.9, -r * 0.9, r * 0.85, -r * 0.3, 0, 0);
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = '#111317';
        ctx.beginPath();
        ctx.arc(0, 0, 11 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6b8243';
        ctx.beginPath();
        ctx.arc(0, 0, 5 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 11. LIRIO 3D
class Lirio extends Flor {
    constructor(color = '#ffb3c6', opciones = {}) {
        super('Lirio', 'lirio', color, {
            talloColor: '#2d6a4f',
            hojaColor: '#40916c',
            descripcion: 'Majestuoso, pétalos acampanados y estambres elegantes.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 185 * s;
        const curv = -10 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 6 * s, talloProg);

        if (progreso > 0.3) {
            this.dibujarHoja(ctx, -10 * s, -alturaTallo * 0.4, 12 * s, 30 * s, -0.6);
            this.dibujarHoja(ctx, 10 * s, -alturaTallo * 0.6, 11 * s, 28 * s, 0.6);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const largoPetalo = 44 * s;

        // Hojas lanceoladas verdes del lirio asomando detrás
        this.dibujarHoja(ctx, -largoPetalo * 0.5, -largoPetalo * 0.3, 11 * s, 26 * s, -1.0, this.hojaColor);
        this.dibujarHoja(ctx, largoPetalo * 0.5, -largoPetalo * 0.3, 11 * s, 26 * s, 1.0, this.hojaColor);

        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI * 2) / 6;
            ctx.save();
            ctx.rotate(a);

            const grad = ctx.createLinearGradient(0, 0, 0, -largoPetalo);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, this.color);
            grad.addColorStop(1, ajustarColorBrillo(this.color, -18));
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-16 * s, -largoPetalo * 0.5, -6 * s, -largoPetalo);
            ctx.quadraticCurveTo(0, -largoPetalo * 1.08, 6 * s, -largoPetalo);
            ctx.quadraticCurveTo(16 * s, -largoPetalo * 0.5, 0, 0);
            ctx.fill();
            ctx.restore();
        }

        ctx.strokeStyle = '#c9e4ca';
        ctx.lineWidth = 1.8 * s;
        ctx.fillStyle = '#7a3e1d';
        for (let j = 0; j < 5; j++) {
            const a = (j * Math.PI * 2) / 5;
            const ex = Math.cos(a) * 22 * s;
            const ey = Math.sin(a) * 22 * s;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(ex * 0.5, ey * 0.3, ex, ey);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(ex, ey, 4 * s, 2 * s, a, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// 12. ORQUÍDEA 3D
class Orquidea extends Flor {
    constructor(color = '#ffcad4', opciones = {}) {
        super('Orquídea', 'orquidea', color, {
            talloColor: '#386641',
            hojaColor: '#4f772d',
            descripcion: 'Exótica, sofisticada y con un centro voluptuoso.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 185 * s;
        const curv = 16 * s;

        const talloProg = Math.min(1, progreso * 1.3);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 5 * s, talloProg);

        if (progreso > 0.3) {
            this.dibujarHoja(ctx, -10 * s, -alturaTallo * 0.3, 14 * s, 32 * s, -0.7);
        }

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;
        const r = 36 * s;

        // Hojas carnosas de orquídea asomando detrás
        this.dibujarHoja(ctx, -r * 0.8, -r * 0.2, 12 * s, 26 * s, -1.1, this.hojaColor);
        this.dibujarHoja(ctx, r * 0.8, -r * 0.2, 12 * s, 26 * s, 1.1, this.hojaColor);

        [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6].forEach(a => {
            ctx.save();
            ctx.rotate(a);
            ctx.fillStyle = ajustarColorBrillo(this.color, 18);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-11 * s, -r * 0.6, 0, -r * 1.05);
            ctx.quadraticCurveTo(11 * s, -r * 0.6, 0, 0);
            ctx.fill();
            ctx.restore();
        });

        [-0.6, 0.6].forEach(a => {
            ctx.save();
            ctx.rotate(a);
            const grad = ctx.createRadialGradient(0, -r * 0.5, 2, 0, -r * 0.5, r * 0.45);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, this.color);
            grad.addColorStop(1, ajustarColorBrillo(this.color, -15));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.55, r * 0.45, r * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        const gradLabio = ctx.createRadialGradient(0, 8 * s, 1, 0, 12 * s, 16 * s);
        gradLabio.addColorStop(0, '#ffd166');
        gradLabio.addColorStop(0.6, ajustarColorBrillo(this.color, -30));
        gradLabio.addColorStop(1, '#7209b7');
        ctx.fillStyle = gradLabio;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-14 * s, 6 * s, -16 * s, 22 * s, 0, 24 * s);
        ctx.bezierCurveTo(16 * s, 22 * s, 14 * s, 6 * s, 0, 0);
        ctx.fill();

        ctx.restore();
    }
}

// 13. LAVANDA 3D
class Lavanda extends Flor {
    constructor(color = '#9d4edd', opciones = {}) {
        super('Lavanda', 'lavanda', color, {
            talloColor: '#4f772d',
            hojaColor: '#5a8535',
            descripcion: 'Espiga silvestre de color violeta, paz y serenidad.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 190 * s;
        const curv = -6 * s;

        const talloProg = Math.min(1, progreso * 1.2);
        const { finX, finY } = this.dibujarTallo(ctx, 0, 0, alturaTallo, curv, 3.8 * s, talloProg);

        if (progreso > 0.3) {
            this.dibujarHoja(ctx, -4 * s, -alturaTallo * 0.3, 5 * s, 20 * s, -0.6);
            this.dibujarHoja(ctx, 4 * s, -alturaTallo * 0.45, 5 * s, 18 * s, 0.6);
        }

        if (progreso > 0.35) {
            const florProg = (progreso - 0.35) / 0.65;
            this.dibujarCabeza(ctx, finX, finY, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;

        // Hojitas lineales de lavanda
        this.dibujarHoja(ctx, -6 * s, 10 * s, 4 * s, 16 * s, -0.6, this.hojaColor);
        this.dibujarHoja(ctx, 6 * s, 10 * s, 4 * s, 16 * s, 0.6, this.hojaColor);

        const niveles = 9;
        const altoEspiga = 75 * s;

        for (let i = 0; i < niveles; i++) {
            const py = (altoEspiga * (1 - (i / niveles))) - (altoEspiga * 0.2);
            for (let j = 0; j < 5; j++) {
                const a = (j * Math.PI * 2) / 5 + (i * 0.5);
                const fx = Math.cos(a) * 7 * s;
                const fy = py + Math.sin(a) * 3 * s;

                const grad = ctx.createRadialGradient(fx - 1, fy - 1, 1, fx, fy, 4.5 * s);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.35, this.color);
                grad.addColorStop(1, ajustarColorBrillo(this.color, -25));
                ctx.fillStyle = grad;

                ctx.beginPath();
                ctx.ellipse(fx, fy, 4.5 * s, 3 * s, a, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

// 14. NUBE / GYPSOPHILA 3D
class Gypsophila extends Flor {
    constructor(color = '#ffffff', opciones = {}) {
        super('Nube (Gypsophila)', 'gypsophila', color, {
            talloColor: '#608066',
            hojaColor: '#709775',
            descripcion: 'La nube de pequeñas flores blancas que viste todo ramo.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const alturaTallo = 175 * s;

        const talloProg = Math.min(1, progreso * 1.2);
        ctx.strokeStyle = this.talloColor;
        ctx.lineWidth = 3 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -alturaTallo * 0.5 * talloProg);
        ctx.stroke();

        if (progreso > 0.4) {
            const florProg = (progreso - 0.4) / 0.6;
            this.dibujarCabeza(ctx, 0, -alturaTallo * 0.5, escala, florProg, 0);
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano * progreso;

        const ramas = [
            { sx: 0, sy: 0, ex: -30 * s, ey: -50 * s },
            { sx: 0, sy: -15 * s, ex: 30 * s, ey: -45 * s },
            { sx: 0, sy: -25 * s, ex: -15 * s, ey: -70 * s },
            { sx: 0, sy: -25 * s, ex: 15 * s, ey: -70 * s },
            { sx: 0, sy: 0, ex: 0, ey: -65 * s }
        ];

        ctx.strokeStyle = this.talloColor;
        ctx.lineWidth = 1.5 * s;
        ramas.forEach(r => {
            ctx.beginPath();
            ctx.moveTo(r.sx, r.sy);
            ctx.quadraticCurveTo(r.ex * 0.3, r.sy - 15 * s, r.ex, r.ey);
            ctx.stroke();
        });

        const floresPos = [
            { x: -30 * s, y: -50 * s }, { x: -40 * s, y: -40 * s }, { x: -15 * s, y: -65 * s },
            { x: 30 * s, y: -45 * s }, { x: 40 * s, y: -35 * s }, { x: 15 * s, y: -70 * s },
            { x: 0, y: -65 * s }
        ];

        floresPos.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.fillStyle = this.color;
            ctx.shadowColor = 'rgba(255,255,255,0.7)';
            ctx.shadowBlur = 4 * s;

            for (let k = 0; k < 5; k++) {
                const a = (k * Math.PI * 2) / 5;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * 3.5 * s, Math.sin(a) * 3.5 * s, 3.2 * s, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = '#fff3b0';
            ctx.beginPath();
            ctx.arc(0, 0, 1.8 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.restore();
    }
}

// 15. EUCALIPTO 3D (Arreglado: Rama estilizada en segundo plano que no bloquea el centro)
class Eucalipto extends Flor {
    constructor(color = '#84a59d', opciones = {}) {
        super('Eucalipto', 'eucalipto', color, {
            talloColor: '#6f5e53',
            hojaColor: color,
            descripcion: 'Hojas redondas aromáticas verde salvia que dan elegancia moderna.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const largo = 175 * s;
        const curvatura = -18 * s;

        const talloProg = Math.min(1, progreso * 1.2);
        ctx.strokeStyle = this.talloColor;
        ctx.lineWidth = 3.5 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const finY = -largo * talloProg;
        const cX = curvatura * talloProg;
        const cY = -largo * 0.5 * talloProg;
        ctx.quadraticCurveTo(cX, cY, cX * 0.8, finY);
        ctx.stroke();

        if (progreso > 0.25) {
            const hProg = Math.min(1, (progreso - 0.25) / 0.75);
            const numPares = 7;

            for (let i = 1; i < numPares; i++) {
                const t = i / numPares;
                if (t > talloProg) break;

                const pX = 2 * (1 - t) * t * cX + (t * t) * (cX * 0.8);
                const pY = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * cY + (t * t) * finY;
                const rHoja = (1 - t * 0.3) * 14 * s * hProg;

                ctx.save();
                ctx.translate(pX, pY);

                const gradIzq = ctx.createRadialGradient(-rHoja * 0.7, -rHoja * 0.3, 1, -rHoja * 0.7, 0, rHoja);
                gradIzq.addColorStop(0, '#ffffff');
                gradIzq.addColorStop(0.35, this.color);
                gradIzq.addColorStop(1, ajustarColorBrillo(this.color, -20));
                ctx.fillStyle = gradIzq;
                ctx.beginPath();
                ctx.arc(-rHoja * 0.8, 0, rHoja, 0, Math.PI * 2);
                ctx.fill();

                const gradDer = ctx.createRadialGradient(rHoja * 0.7, -rHoja * 0.3, 1, rHoja * 0.7, 0, rHoja);
                gradDer.addColorStop(0, '#ffffff');
                gradDer.addColorStop(0.35, ajustarColorBrillo(this.color, 12));
                gradDer.addColorStop(1, ajustarColorBrillo(this.color, -22));
                ctx.fillStyle = gradDer;
                ctx.beginPath();
                ctx.arc(rHoja * 0.8, 0, rHoja, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        this.dibujar(ctx, x, y, escala * 0.85, progreso, angulo);
    }
}

// 16. HELECHO 3D (Arreglado: Enmarca con suavidad por detrás)
class Helecho extends Flor {
    constructor(color = '#2d6a4f', opciones = {}) {
        super('Helecho', 'helecho', color, {
            talloColor: '#1b4332',
            hojaColor: color,
            descripcion: 'Follaje verde frondoso ideal para dar frescura y volumen.',
            ...opciones
        });
    }

    dibujar(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angulo);
        const s = escala * this.tamano;
        const largo = 180 * s;
        const curvatura = 25 * s;

        const talloProg = Math.min(1, progreso * 1.2);
        ctx.strokeStyle = this.talloColor;
        ctx.lineWidth = 3.5 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const finY = -largo * talloProg;
        const cX = curvatura * talloProg;
        const cY = -largo * 0.5 * talloProg;
        ctx.quadraticCurveTo(cX, cY, cX * 0.8, finY);
        ctx.stroke();

        if (progreso > 0.2) {
            const hProg = Math.min(1, (progreso - 0.2) / 0.8);
            const numPares = 13;

            for (let i = 2; i < numPares; i++) {
                const t = i / numPares;
                if (t > talloProg) break;

                const pX = 2 * (1 - t) * t * cX + (t * t) * (cX * 0.8);
                const pY = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * cY + (t * t) * finY;
                const tamFronda = (1 - (t * 0.6)) * 22 * s * hProg;

                const tangentAng = Math.atan2(
                    2 * (1 - t) * (cY - 0) + 2 * t * (finY - cY),
                    2 * (1 - t) * (cX - 0) + 2 * t * (cX * 0.8 - cX)
                );

                ctx.save();
                ctx.translate(pX, pY);
                ctx.rotate(tangentAng - Math.PI / 2 - 0.45);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(tamFronda * 0.5, 0, tamFronda * 0.5, 4.5 * s, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.translate(pX, pY);
                ctx.rotate(tangentAng + Math.PI / 2 + 0.45);
                ctx.fillStyle = ajustarColorBrillo(this.color, -10);
                ctx.beginPath();
                ctx.ellipse(tamFronda * 0.5, 0, tamFronda * 0.5, 4.5 * s, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        ctx.restore();
    }

    dibujarCabeza(ctx, x, y, escala = 1, progreso = 1, angulo = 0) {
        this.dibujar(ctx, x, y, escala * 0.85, progreso, angulo);
    }
}

// Fábrica (Factory) para instanciar flores
const CatalogoFlores = {
    crearFlor(tipo, color) {
        switch (tipo) {
            case 'tulipan': return new Tulipan(color);
            case 'rosa': return new Rosa(color);
            case 'girasol': return new Girasol(color);
            case 'amapola': return new Amapola(color);
            case 'helecho': return new Helecho(color);
            case 'margarita': return new Margarita(color);
            case 'lavanda': return new Lavanda(color);
            case 'gypsophila': return new Gypsophila(color);
            case 'peonia': return new Peonia(color);
            case 'lirio': return new Lirio(color);
            case 'hortensia': return new Hortensia(color);
            case 'sakura': return new Sakura(color);
            case 'orquidea': return new Orquidea(color);
            case 'eucalipto': return new Eucalipto(color);
            case 'clavel': return new Clavel(color);
            case 'dalia': return new Dalia(color);
            default: return new Rosa(color);
        }
    }
};
