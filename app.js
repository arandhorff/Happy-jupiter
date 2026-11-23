/**
 * LÓGICA PRINCIPAL DE LA APLICACIÓN
 * Interacciones, animaciones de virtualización, sintetizador de audio y renderizado del ramo final.
 */

// Estado de la aplicación
const AppState = {
    pantallaActual: 'screen-inicio',
    floresSeleccionadas: [], // Arreglo de instancias de Flor
    catalogoDefiniciones: [
        {
            tipo: 'rosa',
            nombre: 'Rosa',
            emoji: '🌹',
            desc: 'La flor reina, símbolo clásico de amor eterno y ternura.',
            colores: ['#ffb3c6', '#ff4d6d', '#f4acb7', '#c4a482', '#7f5539', '#ffffff', '#ffcad4'],
            colorSeleccionado: '#ffb3c6'
        },
        {
            tipo: 'peonia',
            nombre: 'Peonía',
            emoji: '🌸',
            desc: 'Pétalos voluminosos, esponjosos y con aroma dulce.',
            colores: ['#ff8fab', '#ffd6e0', '#f4acb7', '#d7b89c', '#ffffff', '#d8b4e2'],
            colorSeleccionado: '#ff8fab'
        },
        {
            tipo: 'tulipan',
            nombre: 'Tulipán',
            emoji: '🌷',
            desc: 'Elegante y romántico, con pétalos acopados suaves.',
            colores: ['#ff758f', '#ffb3c6', '#d7b89c', '#8d6e63', '#d8b4e2', '#f72585', '#fff1e6'],
            colorSeleccionado: '#ff758f'
        },
        {
            tipo: 'hortensia',
            nombre: 'Hortensia',
            emoji: '💐',
            desc: 'Cúmulo abundante de suaves florecitas en tonos pasteles.',
            colores: ['#b8c0ff', '#ffcad4', '#e2afff', '#ddb892', '#c7f9cc'],
            colorSeleccionado: '#b8c0ff'
        },
        {
            tipo: 'sakura',
            nombre: 'Sakura (Cerezo)',
            emoji: '🌸',
            desc: 'Flor de cerezo primaveral con pétalos suaves y muesca tierna.',
            colores: ['#ffb3c6', '#ffe5ec', '#f4acb7', '#c4a482', '#ffffff'],
            colorSeleccionado: '#ffb3c6'
        },
        {
            tipo: 'clavel',
            nombre: 'Clavel',
            emoji: '🌺',
            desc: 'Pétalos con borde festoneado/rizado en capas apretadas.',
            colores: ['#f4acb7', '#c4a482', '#ffdab9', '#e63946', '#fff5f5'],
            colorSeleccionado: '#f4acb7'
        },
        {
            tipo: 'dalia',
            nombre: 'Dalia',
            emoji: '🌼',
            desc: 'Geométrica y majestuosa, con decenas de pétalos cónicos.',
            colores: ['#ff758f', '#f4a261', '#ff4d6d', '#e9d8a6', '#d8b4e2', '#a07855'],
            colorSeleccionado: '#ff758f'
        },
        {
            tipo: 'orquidea',
            nombre: 'Orquídea',
            emoji: '💮',
            desc: 'Exótica, sofisticada y con un centro voluptuoso.',
            colores: ['#ffcad4', '#a07855', '#d8b4e2', '#ffffff', '#b5179e'],
            colorSeleccionado: '#ffcad4'
        },
        {
            tipo: 'eucalipto',
            nombre: 'Eucalipto',
            emoji: '🍃',
            desc: 'Hojas redondas aromáticas verde salvia que dan elegancia moderna.',
            colores: ['#84a59d', '#a3b18a', '#8d8174', '#b7e4c7'],
            colorSeleccionado: '#84a59d'
        },
        {
            tipo: 'helecho',
            nombre: 'Ramitas de Helecho',
            emoji: '🌿',
            desc: 'Follaje verde decorativo ideal para dar frescura y volumen.',
            colores: ['#2d6a4f', '#52b788', '#74c69d', '#584a3c'],
            colorSeleccionado: '#2d6a4f'
        },
        {
            tipo: 'girasol',
            nombre: 'Girasol',
            emoji: '🌻',
            desc: 'Radiante, cálido y lleno de energía alegre como el sol.',
            colores: ['#ffb703', '#fb8500', '#c67d5a', '#ffe8a1'],
            colorSeleccionado: '#ffb703'
        },
        {
            tipo: 'amapola',
            nombre: 'Amapola',
            emoji: '🌺',
            desc: 'Flor silvestre de pétalos delicados y centro aterciopelado.',
            colores: ['#e63946', '#ff8fab', '#9c6644', '#ffcad4'],
            colorSeleccionado: '#e63946'
        },
        {
            tipo: 'margarita',
            nombre: 'Margarita',
            emoji: '🌼',
            desc: 'Sencilla, pura y brillante con su botón dorado.',
            colores: ['#ffffff', '#ffcbf2', '#fff3b0', '#e6ccb2'],
            colorSeleccionado: '#ffffff'
        },
        {
            tipo: 'lavanda',
            nombre: 'Lavanda',
            emoji: '🌾',
            desc: 'Espiga silvestre de color violeta, paz y serenidad.',
            colores: ['#9d4edd', '#c77dff', '#e0aaff', '#7f5539'],
            colorSeleccionado: '#9d4edd'
        },
        {
            tipo: 'gypsophila',
            nombre: 'Nube (Gypsophila)',
            emoji: '☁️',
            desc: 'La nube de pequeñas flores blancas que viste todo ramo.',
            colores: ['#ffffff', '#ffe5ec', '#fdf0d5', '#ddb892'],
            colorSeleccionado: '#ffffff'
        },
        {
            tipo: 'lirio',
            nombre: 'Lirio',
            emoji: '💮',
            desc: 'Majestuoso, pétalos acampanados y estambres elegantes.',
            colores: ['#ffb3c6', '#ffffff', '#ffd166', '#c4a482'],
            colorSeleccionado: '#ffb3c6'
        }
    ],
    enVirtualizacion: false,
    sonidoActivado: true,
    audioCtx: null,
    modoVisual: '3d' // '3d' (WebGL con Three.js + OrbitControls) o '2d' (Canvas ilustrado)
};

// ===================================================
// MOTOR DE AUDIO SINTETIZADO (Web Audio API)
// ===================================================
function initAudio() {
    if (!AppState.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        AppState.audioCtx = new AudioContext();
    }
    if (AppState.audioCtx.state === 'suspended') {
        AppState.audioCtx.resume();
    }
}

function reproducirSonidoBoton() {
    if (!AppState.sonidoActivado) return;
    try {
        initAudio();
        const ctx = AppState.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.18);
    } catch (e) {
        console.warn('Audio no disponible', e);
    }
}

function reproducirSonidoFlorVirtualizada() {
    if (!AppState.sonidoActivado) return;
    try {
        initAudio();
        const ctx = AppState.audioCtx;
        const notas = [523.25, 659.25, 783.99, 1046.50];

        notas.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.08));

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime + (idx * 0.08));
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (idx * 0.08) + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime + (idx * 0.08));
            osc.stop(ctx.currentTime + (idx * 0.08) + 0.6);
        });
    } catch (e) {
        console.warn('Audio no disponible', e);
    }
}

function reproducirFanfarriaRamo() {
    if (!AppState.sonidoActivado) return;
    try {
        initAudio();
        const ctx = AppState.audioCtx;
        const notas = [440, 554.37, 659.25, 880, 1108.73, 1318.51];

        notas.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            const inicio = ctx.currentTime + (idx * 0.1);
            osc.frequency.setValueAtTime(freq, inicio);

            gain.gain.setValueAtTime(0, inicio);
            gain.gain.setValueAtTime(0.15, inicio + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 1.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(inicio);
            osc.stop(inicio + 1.2);
        });
    } catch (e) {
        console.warn('Audio no disponible', e);
    }
}

// ===================================================
// GESTOR DE MODO VISUAL: 3D REAL (WebGL) vs 2D ILUSTRADO
// ===================================================
function cambiarModoVisual(nuevoModo) {
    AppState.modoVisual = nuevoModo;
    reproducirSonidoBoton();

    const btn3d = document.getElementById('btn-mode-3d');
    const btn2d = document.getElementById('btn-mode-2d');
    if (btn3d && btn2d) {
        btn3d.classList.toggle('active', nuevoModo === '3d');
        btn2d.classList.toggle('active', nuevoModo === '2d');
    }

    // Viewports en la mesa de virtualización
    const stage3d = document.getElementById('virtualizer-3d-container');
    const stage2d = document.getElementById('virtualizer-canvas');
    const hint3dStage = document.getElementById('virtualizer-3d-hint');
    if (stage3d && stage2d) {
        stage3d.classList.toggle('active', nuevoModo === '3d');
        stage2d.classList.toggle('active', nuevoModo === '2d');
    }
    if (hint3dStage) {
        hint3dStage.classList.toggle('active', nuevoModo === '3d');
    }

    // Viewports en el ramo final
    const bq3d = document.getElementById('bouquet-3d-container');
    const bq2d = document.getElementById('bouquet-canvas');
    const hint3dBq = document.getElementById('bouquet-3d-hint');
    if (bq3d && bq2d) {
        bq3d.classList.toggle('active', nuevoModo === '3d');
        bq2d.classList.toggle('active', nuevoModo === '2d');
    }
    if (hint3dBq) {
        hint3dBq.classList.toggle('active', nuevoModo === '3d');
    }

    // Redibujar la escena activa si corresponde
    if (AppState.pantallaActual === 'screen-taller') {
        const total = AppState.floresSeleccionadas.length;
        if (total > 0) {
            const ultimaFlor = AppState.floresSeleccionadas[total - 1];
            if (nuevoModo === '3d' && window.Motor3D) {
                const def = AppState.catalogoDefiniciones.find(d => d.tipo === ultimaFlor.tipo) || { tipo: ultimaFlor.tipo, colorSeleccionado: ultimaFlor.color, nombre: ultimaFlor.nombre };
                Motor3D.virtualizarFlor({ ...def, colorSeleccionado: ultimaFlor.color });
            } else if (nuevoModo === '2d') {
                const canvas = document.getElementById('virtualizer-canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ultimaFlor.dibujar(ctx, canvas.width / 2, canvas.height - 35, 1.25, 1, 0);
                }
            }
        }
    } else if (AppState.pantallaActual === 'screen-ramo') {
        iniciarPresentacionRamo();
    }
}

// ===================================================
// GESTOR DE PANTALLAS Y NAVEGACIÓN
// ===================================================
function cambiarPantalla(idDestino) {
    reproducirSonidoBoton();
    const pantallaActualEl = document.getElementById(AppState.pantallaActual);
    const pantallaDestinoEl = document.getElementById(idDestino);

    if (pantallaActualEl) {
        pantallaActualEl.classList.remove('active');
    }

    setTimeout(() => {
        if (pantallaDestinoEl) {
            pantallaDestinoEl.classList.add('active');
            AppState.pantallaActual = idDestino;

            if (idDestino === 'screen-ramo') {
                iniciarPresentacionRamo();
            }
        }
    }, 300);
}

// ===================================================
// SISTEMA DE PARTÍCULAS DE PÉTALOS 3D PERSONALIZADOS
// Utiliza las flores y colores exactos que Júpiter escogió
// ===================================================
class PetaloFondo {
    constructor(canvasWidth, canvasHeight, florEspecifica = null) {
        this.florFija = florEspecifica;
        this.reset(canvasWidth, canvasHeight, true);
    }

    reset(width, height, primeraVez = false) {
        this.x = Math.random() * width;
        this.y = primeraVez ? Math.random() * height : -30;
        this.tamano = 9 + Math.random() * 12;
        this.velY = 0.9 + Math.random() * 1.6;
        this.velX = (Math.random() - 0.5) * 1.2;
        this.angulo = Math.random() * Math.PI * 2;
        this.velRot = (Math.random() - 0.5) * 0.04;
        this.flip = Math.random() * Math.PI * 2;
        this.velFlip = 0.02 + Math.random() * 0.035;

        // Selección de flor y color según lo que ella escogió
        if (this.florFija) {
            this.flor = this.florFija;
        } else if (AppState.floresSeleccionadas.length > 0) {
            const idx = Math.floor(Math.random() * AppState.floresSeleccionadas.length);
            this.flor = AppState.floresSeleccionadas[idx];
        } else {
            this.flor = null;
        }

        if (this.flor) {
            this.color = this.flor.color;
        } else {
            this.color = ['#ffccd5', '#ffb3c6', '#ffcad4', '#d7b89c', '#ffe5ec', '#fcd5ce'][Math.floor(Math.random() * 6)];
        }
        this.opacidad = 0.6 + Math.random() * 0.35;
    }

    update(width, height) {
        this.y += this.velY;
        this.x += Math.sin(this.y * 0.015) + this.velX;
        this.angulo += this.velRot;
        this.flip += this.velFlip;

        if (this.y > height + 35 || this.x < -35 || this.x > width + 35) {
            this.reset(width, height);
        }
    }

    dibujar(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacidad;

        if (this.flor && typeof this.flor.dibujarPetaloCayendo === 'function') {
            this.flor.dibujarPetaloCayendo(ctx, this.x, this.y, this.tamano, this.angulo, this.flip);
        } else {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angulo);
            ctx.scale(Math.cos(this.flip), 1);
            const grad = ctx.createRadialGradient(-this.tamano * 0.3, -this.tamano * 0.3, 1, 0, 0, this.tamano);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, this.color);
            grad.addColorStop(1, ajustarColorBrillo(this.color, -25));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.tamano, this.tamano * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

let petalosFondo = [];
function iniciarParticulasFondo() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function redimensionar() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', redimensionar);
    redimensionar();

    petalosFondo = Array.from({ length: 40 }, () => new PetaloFondo(canvas.width, canvas.height));

    function animar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        petalosFondo.forEach(p => {
            p.update(canvas.width, canvas.height);
            p.dibujar(ctx);
        });
        requestAnimationFrame(animar);
    }
    animar();
}

// Sincroniza los pétalos flotantes con las flores y colores que ella escogió
function sincronizarPetalosConFloresDeJupiter() {
    if (AppState.floresSeleccionadas.length === 0) return;
    petalosFondo.forEach(p => {
        const idx = Math.floor(Math.random() * AppState.floresSeleccionadas.length);
        p.flor = AppState.floresSeleccionadas[idx];
        p.color = p.flor.color;
    });
}

// ===================================================
// RENDERIZADO DEL CATÁLOGO DE FLORES
// ===================================================
function renderizarCatalogo() {
    const contenedor = document.getElementById('flower-catalog-grid');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    AppState.catalogoDefiniciones.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'flower-card';

        let colorDotsHtml = '';
        item.colores.forEach(col => {
            const esActivo = col === item.colorSeleccionado ? 'active' : '';
            colorDotsHtml += `<span class="color-dot ${esActivo}" style="background-color: ${col};" data-color="${col}" data-index="${index}"></span>`;
        });

        card.innerHTML = `
            <div>
                <div class="flower-card-top">
                    <div class="flower-emoji">${item.emoji}</div>
                    <div>
                        <div class="flower-card-name">${item.nombre}</div>
                    </div>
                </div>
                <div class="flower-card-desc">${item.desc}</div>
                <div class="flower-colors">
                    <span class="color-label">Color:</span>
                    ${colorDotsHtml}
                </div>
            </div>
            <button class="btn-add-flower" data-index="${index}">
                ✨ Virtualizar esta flor
            </button>
        `;

        const dots = card.querySelectorAll('.color-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                item.colorSeleccionado = dot.dataset.color;
            });
        });

        const btnAdd = card.querySelector('.btn-add-flower');
        btnAdd.addEventListener('click', () => {
            if (AppState.enVirtualizacion) return;
            if (AppState.floresSeleccionadas.length >= 10) {
                alert('¡Ya has seleccionado el máximo de 10 flores para tu ramo!');
                return;
            }
            virtualizarFlor(item);
        });

        contenedor.appendChild(card);
    });

    actualizarEstadoBandeja();
}

// ===================================================
// VIRTUALIZACIÓN PASO A PASO EN LA MESA DE TRABAJO
// ===================================================
let animacionVirtualizadorId = null;

function virtualizarFlor(itemDef) {
    AppState.enVirtualizacion = true;
    deshabilitarBotonesCatalogo(true);
    const statusEl = document.getElementById('virtualizer-status');
    const florInstancia = CatalogoFlores.crearFlor(itemDef.tipo, itemDef.colorSeleccionado);

    // Si está en Modo 3D Real (Three.js WebGL + OrbitControls)
    if (AppState.modoVisual === '3d' && window.Motor3D) {
        statusEl.innerHTML = `✨ Virtualizando <strong>${florInstancia.nombre}</strong> en 3D Real...`;
        Motor3D.virtualizarFlor(
            itemDef,
            (prog) => {},
            () => {
                AppState.enVirtualizacion = false;
                deshabilitarBotonesCatalogo(false);
                reproducirSonidoFlorVirtualizada();
                statusEl.innerHTML = `🌸 ¡<strong>${florInstancia.nombre}</strong> lista en 3D! Arrastra para girar 360° o usa la rueda para zoom.`;
                AppState.floresSeleccionadas.push(florInstancia);
                actualizarEstadoBandeja();
                sincronizarPetalosConFloresDeJupiter();
            }
        );
        return;
    }

    // Modo 2D Ilustrado en Canvas
    const canvas = document.getElementById('virtualizer-canvas');
    const ctx = canvas.getContext('2d');
    statusEl.innerHTML = `✨ Virtualizando <strong>${florInstancia.nombre}</strong>...`;

    let chispas = [];
    for (let i = 0; i < 25; i++) {
        chispas.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 60,
            y: canvas.height * 0.45 + (Math.random() - 0.5) * 80,
            radio: 1.5 + Math.random() * 2.5,
            color: florInstancia.color,
            velY: -(1 + Math.random() * 2),
            opacidad: 1
        });
    }

    const duracionMs = 1800;
    const inicioTiempo = performance.now();

    function pasoAnimacion(tiempoActual) {
        const transcurrido = tiempoActual - inicioTiempo;
        let progreso = Math.min(1, transcurrido / duracionMs);

        const t = progreso;
        const progresoSuave = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.strokeStyle = 'rgba(230, 57, 70, 0.15)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height - 35, 70, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        florInstancia.dibujar(ctx, canvas.width / 2, canvas.height - 35, 1.25, progresoSuave, 0);

        if (progreso > 0.4) {
            chispas.forEach(c => {
                c.y += c.velY;
                c.opacidad -= 0.015;
                if (c.opacidad > 0) {
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, c.opacidad);
                    ctx.fillStyle = c.color;
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.radio, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }

        if (progreso < 1) {
            animacionVirtualizadorId = requestAnimationFrame(pasoAnimacion);
        } else {
            AppState.enVirtualizacion = false;
            deshabilitarBotonesCatalogo(false);
            reproducirSonidoFlorVirtualizada();
            statusEl.innerHTML = `🌸 ¡<strong>${florInstancia.nombre}</strong> virtualizada y lista para tu ramo!`;

            AppState.floresSeleccionadas.push(florInstancia);
            actualizarEstadoBandeja();
            sincronizarPetalosConFloresDeJupiter();
        }
    }

    if (animacionVirtualizadorId) cancelAnimationFrame(animacionVirtualizadorId);
    animacionVirtualizadorId = requestAnimationFrame(pasoAnimacion);
}

function deshabilitarBotonesCatalogo(deshabilitar) {
    const botones = document.querySelectorAll('.btn-add-flower');
    botones.forEach(btn => {
        btn.disabled = deshabilitar || (AppState.floresSeleccionadas.length >= 10);
    });
}

function actualizarEstadoBandeja() {
    const total = AppState.floresSeleccionadas.length;
    const badge = document.getElementById('count-badge');
    const traySlots = document.getElementById('tray-slots');
    const btnCrearRamo = document.getElementById('btn-crear-ramo');

    if (badge) {
        badge.textContent = `Flores: ${total} / 10 (Mínimo 3)`;
    }

    if (traySlots) {
        traySlots.innerHTML = '';
        if (total === 0) {
            traySlots.innerHTML = `<span style="font-size:0.85rem; color:#888;">Elige flores del catálogo para comenzar tu ramo...</span>`;
        } else {
            AppState.floresSeleccionadas.forEach((flor, idx) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'tray-item';
                itemEl.innerHTML = `
                    <span class="tray-item-color" style="background-color: ${flor.color}"></span>
                    <span>${flor.nombre}</span>
                    <span class="tray-item-remove" title="Quitar flor" data-index="${idx}">✕</span>
                `;
                itemEl.querySelector('.tray-item-remove').addEventListener('click', (e) => {
                    e.stopPropagation();
                    eliminarFlorDeBandeja(idx);
                });
                traySlots.appendChild(itemEl);
            });
        }
    }

    if (btnCrearRamo) {
        if (total >= 3 && total <= 10) {
            btnCrearRamo.disabled = false;
            btnCrearRamo.innerHTML = `💐 ¡Armar Ramo con mis ${total} flores! ✨`;
        } else {
            btnCrearRamo.disabled = true;
            btnCrearRamo.innerHTML = `💐 ¡Armar Ramo! (Elige mínimo 3)`;
        }
    }

    deshabilitarBotonesCatalogo(AppState.enVirtualizacion);
}

function eliminarFlorDeBandeja(index) {
    if (AppState.enVirtualizacion) return;
    AppState.floresSeleccionadas.splice(index, 1);
    reproducirSonidoBoton();
    actualizarEstadoBandeja();
    sincronizarPetalosConFloresDeJupiter();
}

// ===================================================
// PANTALLA 4: EL RAMO FINAL (CELEBRACIÓN Y DOMO FLORAL 3D)
// Distribución en cúpula armónica (idéntica a la foto de referencia):
// Flores grandes, 3D, sin taparse, con collar de hojas y lazo satinado 3D.
// ===================================================
let animacionRamoId = null;

// Distribución en cúpula armónica con empaquetamiento hexagonal (ninguna flor queda tapada)
function calcularDomoFlorista(flores, centroX) {
    const total = flores.length;
    let plantillas = [];

    if (total === 1) {
        plantillas = [
            { x: centroX, y: 195, scale: 1.25, layer: 1 }
        ];
    } else if (total === 2) {
        plantillas = [
            { x: centroX - 60, y: 195, scale: 1.2, layer: 1 },
            { x: centroX + 60, y: 195, scale: 1.2, layer: 1 }
        ];
    } else if (total === 3) {
        plantillas = [
            { x: centroX, y: 145, scale: 1.18, layer: 1 },
            { x: centroX - 65, y: 230, scale: 1.15, layer: 2 },
            { x: centroX + 65, y: 230, scale: 1.15, layer: 2 }
        ];
    } else if (total === 4) {
        plantillas = [
            { x: centroX - 52, y: 150, scale: 1.15, layer: 1 },
            { x: centroX + 52, y: 150, scale: 1.15, layer: 1 },
            { x: centroX - 70, y: 235, scale: 1.12, layer: 2 },
            { x: centroX + 70, y: 235, scale: 1.12, layer: 2 }
        ];
    } else if (total === 5) {
        plantillas = [
            { x: centroX, y: 125, scale: 1.18, layer: 1 },
            { x: centroX - 72, y: 180, scale: 1.12, layer: 2 },
            { x: centroX + 72, y: 180, scale: 1.12, layer: 2 },
            { x: centroX - 60, y: 255, scale: 1.12, layer: 3 },
            { x: centroX + 60, y: 255, scale: 1.12, layer: 3 }
        ];
    } else if (total === 6) {
        plantillas = [
            { x: centroX - 50, y: 130, scale: 1.15, layer: 1 },
            { x: centroX + 50, y: 130, scale: 1.15, layer: 1 },
            { x: centroX - 90, y: 195, scale: 1.1, layer: 2 },
            { x: centroX, y: 195, scale: 1.16, layer: 2 },
            { x: centroX + 90, y: 195, scale: 1.1, layer: 2 },
            { x: centroX, y: 268, scale: 1.12, layer: 3 }
        ];
    } else if (total === 7) {
        plantillas = [
            { x: centroX, y: 115, scale: 1.16, layer: 1 },
            { x: centroX - 68, y: 165, scale: 1.12, layer: 2 },
            { x: centroX + 68, y: 165, scale: 1.12, layer: 2 },
            { x: centroX - 105, y: 225, scale: 1.08, layer: 3 },
            { x: centroX, y: 225, scale: 1.14, layer: 3 },
            { x: centroX + 105, y: 225, scale: 1.08, layer: 3 },
            { x: centroX, y: 285, scale: 1.1, layer: 4 }
        ];
    } else if (total === 8) {
        plantillas = [
            { x: centroX - 52, y: 115, scale: 1.14, layer: 1 },
            { x: centroX + 52, y: 115, scale: 1.14, layer: 1 },
            { x: centroX - 95, y: 175, scale: 1.08, layer: 2 },
            { x: centroX, y: 172, scale: 1.14, layer: 2 },
            { x: centroX + 95, y: 175, scale: 1.08, layer: 2 },
            { x: centroX - 85, y: 245, scale: 1.08, layer: 3 },
            { x: centroX, y: 250, scale: 1.12, layer: 3 },
            { x: centroX + 85, y: 245, scale: 1.08, layer: 3 }
        ];
    } else if (total === 9) {
        plantillas = [
            { x: centroX - 62, y: 115, scale: 1.12, layer: 1 },
            { x: centroX, y: 108, scale: 1.16, layer: 1 },
            { x: centroX + 62, y: 115, scale: 1.12, layer: 1 },
            { x: centroX - 105, y: 178, scale: 1.06, layer: 2 },
            { x: centroX - 36, y: 175, scale: 1.12, layer: 2 },
            { x: centroX + 36, y: 175, scale: 1.12, layer: 2 },
            { x: centroX + 105, y: 178, scale: 1.06, layer: 2 },
            { x: centroX - 60, y: 248, scale: 1.08, layer: 3 },
            { x: centroX + 60, y: 248, scale: 1.08, layer: 3 }
        ];
    } else { // 10 flores (Idéntico patrón que en la foto de referencia: 1 cima, 2 segunda fila, 3 tercera fila, 4 base)
        plantillas = [
            { x: centroX, y: 95, scale: 1.15, layer: 1 },
            { x: centroX - 65, y: 150, scale: 1.12, layer: 2 },
            { x: centroX + 65, y: 150, scale: 1.12, layer: 2 },
            { x: centroX - 110, y: 210, scale: 1.08, layer: 3 },
            { x: centroX, y: 208, scale: 1.14, layer: 3 },
            { x: centroX + 110, y: 210, scale: 1.08, layer: 3 },
            { x: centroX - 115, y: 275, scale: 1.06, layer: 4 },
            { x: centroX - 42, y: 280, scale: 1.1, layer: 4 },
            { x: centroX + 42, y: 280, scale: 1.1, layer: 4 },
            { x: centroX + 115, y: 275, scale: 1.06, layer: 4 }
        ];
    }

    const slots = [];
    flores.forEach((flor, i) => {
        const p = plantillas[i % plantillas.length];
        slots.push({
            flor,
            x: p.x,
            y: p.y,
            scale: p.scale,
            layer: p.layer
        });
    });

    slots.sort((a, b) => a.layer - b.layer);
    return slots;
}

function iniciarPresentacionRamo() {
    reproducirFanfarriaRamo();
    sincronizarPetalosConFloresDeJupiter();

    // Modo 3D Real (Three.js WebGL interactivo en 360°)
    if (AppState.modoVisual === '3d' && window.Motor3D) {
        if (animacionRamoId) cancelAnimationFrame(animacionRamoId);
        Motor3D.iniciarRamo3D(AppState.floresSeleccionadas);
        return;
    }

    const canvas = document.getElementById('bouquet-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const todasLasFlores = AppState.floresSeleccionadas;
    const centroX = canvas.width / 2;
    const bowY = 345;

    // Separamos follaje (eucalipto y helecho) para colocarlo en las alas traseras y no tapar las flores
    const follaje = todasLasFlores.filter(f => f.tipo === 'eucalipto' || f.tipo === 'helecho');
    const principales = todasLasFlores.filter(f => f.tipo !== 'eucalipto' && f.tipo !== 'helecho');

    const floresParaDomo = principales.length > 0 ? principales : follaje;
    const follajeDeFondo = principales.length > 0 ? follaje : [];

    const slots = calcularDomoFlorista(floresParaDomo, centroX);
    let tiempo = 0;

    function dibujarRamo() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        tiempo += 0.025;
        const brisa = Math.sin(tiempo) * 1.5;

        // 0. FOLLAJE DE FONDO (Eucalipto y helecho en las alas traseras, enmarcando con elegancia)
        if (follajeDeFondo.length > 0) {
            ctx.save();
            const configFollaje = [
                { x: centroX - 50, y: 310, escala: 0.95, angulo: -0.42 }, // Ala izquierda
                { x: centroX + 50, y: 310, escala: 0.95, angulo: 0.42 },  // Ala derecha
                { x: centroX - 25, y: 280, escala: 0.88, angulo: -0.20 }, // Centro-izq
                { x: centroX + 25, y: 280, escala: 0.88, angulo: 0.20 }   // Centro-der
            ];

            follajeDeFondo.forEach((ramita, i) => {
                const cfg = configFollaje[i % configFollaje.length];
                const osc = Math.sin(tiempo + i * 1.2) * 0.025;
                ramita.dibujar(ctx, cfg.x, cfg.y, cfg.escala, 1, cfg.angulo + osc);
            });
            ctx.restore();
        }

        // 1. TALLOS CONVERGENTES DESDE CADA FLOR HACIA EL NUDO DEL LAZO
        ctx.save();
        slots.forEach((slot, i) => {
            const startX = slot.x;
            const startY = slot.y + 14;
            const tieX = centroX + (slot.x - centroX) * 0.12;
            const tieY = bowY - 10;
            const cpX = (startX * 0.4) + (tieX * 0.6);
            const cpY = (startY * 0.3) + (tieY * 0.7);

            // Sombra suave del tallo
            ctx.strokeStyle = 'rgba(0,0,0,0.18)';
            ctx.lineWidth = 6.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX + 2, startY + 2);
            ctx.quadraticCurveTo(cpX + 2, cpY + 2, tieX + 2, tieY + 2);
            ctx.stroke();

            // Tallo verde orgánico
            ctx.strokeStyle = (i % 2 === 0) ? '#2d5a36' : '#386641';
            ctx.lineWidth = 5.2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(cpX, cpY, tieX, tieY);
            ctx.stroke();

            // Resalte de luz longitudinal 3D
            ctx.strokeStyle = 'rgba(255,255,255,0.28)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(startX - 1, startY);
            ctx.quadraticCurveTo(cpX - 1, cpY, tieX - 1, tieY);
            ctx.stroke();
        });
        ctx.restore();

        // 2. COLLAR BOTÁNICO DE HOJAS VERDES EN LA BASE (Como en la foto de referencia)
        ctx.save();
        const hojasCollar = [
            { x: centroX - 135, y: 245, rx: 18, ry: 40, rot: -1.05 }, // Flanco izq alto
            { x: centroX - 118, y: 285, rx: 20, ry: 42, rot: -1.55 }, // Flanco izq medio
            { x: centroX - 80,  y: 318, rx: 20, ry: 40, rot: -2.15 }, // Base izq
            { x: centroX + 135, y: 245, rx: 18, ry: 40, rot: 1.05 },  // Flanco der alto
            { x: centroX + 118, y: 285, rx: 20, ry: 42, rot: 1.55 },  // Flanco der medio
            { x: centroX + 80,  y: 318, rx: 20, ry: 40, rot: 2.15 },  // Base der
            { x: centroX - 35,  y: 338, rx: 17, ry: 36, rot: -2.75 }, // Cuna izq sobre lazo
            { x: centroX + 35,  y: 338, rx: 17, ry: 36, rot: 2.75 }   // Cuna der sobre lazo
        ];

        hojasCollar.forEach(h => {
            const hRot = h.rot + Math.sin(tiempo + h.x) * 0.025;
            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.rotate(hRot);

            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 7;
            ctx.shadowOffsetY = 3;

            // Mitad izquierda (iluminada)
            const gradLuz = ctx.createLinearGradient(-h.rx, 0, 0, 0);
            gradLuz.addColorStop(0, '#52b788');
            gradLuz.addColorStop(1, '#2d6a4f');
            ctx.fillStyle = gradLuz;
            ctx.beginPath();
            ctx.moveTo(0, -h.ry);
            ctx.bezierCurveTo(-h.rx * 1.3, -h.ry * 0.4, -h.rx * 1.3, h.ry * 0.4, 0, h.ry);
            ctx.lineTo(0, -h.ry);
            ctx.fill();

            // Mitad derecha (en sombra botánica)
            const gradSombra = ctx.createLinearGradient(0, 0, h.rx, 0);
            gradSombra.addColorStop(0, '#2d6a4f');
            gradSombra.addColorStop(1, '#1b4332');
            ctx.fillStyle = gradSombra;
            ctx.beginPath();
            ctx.moveTo(0, -h.ry);
            ctx.bezierCurveTo(h.rx * 1.3, -h.ry * 0.4, h.rx * 1.3, h.ry * 0.4, 0, h.ry);
            ctx.lineTo(0, -h.ry);
            ctx.fill();

            // Nervadura central clara
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(0, -h.ry * 0.85);
            ctx.lineTo(0, h.ry * 0.85);
            ctx.stroke();

            ctx.restore();
        });
        ctx.restore();

        // 3. HAZ DE TALLOS CORTADOS BAJO EL LAZO (Como en la foto de referencia)
        ctx.save();
        const baseStemsY = bowY + 8;
        const finStemsY = 445;
        const totalTallosInf = Math.max(8, slots.length + 2);

        for (let i = 0; i < totalTallosInf; i++) {
            const t = (i / (totalTallosInf - 1)) - 0.5;
            const startX = centroX + (t * 26);
            const endX = centroX + (t * 32);
            const finY = finStemsY - (Math.abs(t) * 12);

            // Sombra
            ctx.strokeStyle = 'rgba(0,0,0,0.18)';
            ctx.lineWidth = 6.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX + 2, baseStemsY);
            ctx.lineTo(endX + 2, finY);
            ctx.stroke();

            // Tallo
            ctx.strokeStyle = (i % 2 === 0) ? '#2d6a4f' : '#386641';
            ctx.lineWidth = 5.2;
            ctx.beginPath();
            ctx.moveTo(startX, baseStemsY);
            ctx.lineTo(endX, finY);
            ctx.stroke();

            // Resalte de luz longitudinal
            ctx.strokeStyle = 'rgba(255,255,255,0.32)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(startX - 1, baseStemsY);
            ctx.lineTo(endX - 1, finY);
            ctx.stroke();

            // Corte diagonal en la punta con núcleo claro
            ctx.fillStyle = '#a3b18a';
            ctx.beginPath();
            ctx.ellipse(endX, finY, 2.5, 1.4, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 4. CABEZAS DE LAS FLORES EN CAPAS (Renderizado 3D sin taparse entre sí)
        slots.forEach((slot, idx) => {
            const bx = Math.sin(tiempo + idx * 0.7) * 1.2;
            const by = Math.cos(tiempo + idx * 0.6) * 1.2;
            slot.flor.dibujarCabeza(ctx, slot.x + bx, slot.y + by, slot.scale, 1, 0);
        });

        // 5. LAZO SATINADO 3D DE LUJO (Idéntico al de la foto de referencia)
        ctx.save();

        // Sombras suaves del lazo
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;

        // Lazo izquierdo 3D
        const gradLazoIzq = ctx.createRadialGradient(centroX - 35, bowY - 5, 2, centroX - 35, bowY, 40);
        gradLazoIzq.addColorStop(0, '#ffffff');
        gradLazoIzq.addColorStop(0.35, '#ffb3c6');
        gradLazoIzq.addColorStop(0.85, '#ff758f');
        gradLazoIzq.addColorStop(1, '#e63946');
        ctx.fillStyle = gradLazoIzq;

        ctx.beginPath();
        ctx.moveTo(centroX - 10, bowY);
        ctx.bezierCurveTo(centroX - 45, bowY - 30, centroX - 75, bowY - 15, centroX - 70, bowY + 8);
        ctx.bezierCurveTo(centroX - 65, bowY + 30, centroX - 35, bowY + 22, centroX - 10, bowY + 8);
        ctx.closePath();
        ctx.fill();

        // Lazo derecho 3D
        const gradLazoDer = ctx.createRadialGradient(centroX + 35, bowY - 5, 2, centroX + 35, bowY, 40);
        gradLazoDer.addColorStop(0, '#ffffff');
        gradLazoDer.addColorStop(0.35, '#ffb3c6');
        gradLazoDer.addColorStop(0.85, '#ff758f');
        gradLazoDer.addColorStop(1, '#e63946');
        ctx.fillStyle = gradLazoDer;

        ctx.beginPath();
        ctx.moveTo(centroX + 10, bowY);
        ctx.bezierCurveTo(centroX + 45, bowY - 30, centroX + 75, bowY - 15, centroX + 70, bowY + 8);
        ctx.bezierCurveTo(centroX + 65, bowY + 30, centroX + 35, bowY + 22, centroX + 10, bowY + 8);
        ctx.closePath();
        ctx.fill();

        // Colas de la cinta colgando hacia abajo con muesca festonada
        const gradCola = ctx.createLinearGradient(0, bowY, 0, bowY + 85);
        gradCola.addColorStop(0, '#ffb3c6');
        gradCola.addColorStop(0.6, '#ff758f');
        gradCola.addColorStop(1, '#c9184a');
        ctx.fillStyle = gradCola;

        // Cola izquierda
        ctx.beginPath();
        ctx.moveTo(centroX - 6, bowY + 10);
        ctx.quadraticCurveTo(centroX - 35, bowY + 45, centroX - 42, bowY + 85);
        ctx.lineTo(centroX - 25, bowY + 76); // Muesca
        ctx.lineTo(centroX - 14, bowY + 82);
        ctx.quadraticCurveTo(centroX - 18, bowY + 45, centroX, bowY + 12);
        ctx.closePath();
        ctx.fill();

        // Cola derecha
        ctx.beginPath();
        ctx.moveTo(centroX + 6, bowY + 10);
        ctx.quadraticCurveTo(centroX + 35, bowY + 45, centroX + 42, bowY + 85);
        ctx.lineTo(centroX + 25, bowY + 76); // Muesca
        ctx.lineTo(centroX + 14, bowY + 82);
        ctx.quadraticCurveTo(centroX + 18, bowY + 45, centroX, bowY + 12);
        ctx.closePath();
        ctx.fill();

        // Nudo central 3D abombado
        const gradNudo = ctx.createRadialGradient(centroX - 3, bowY - 2, 2, centroX, bowY + 4, 16);
        gradNudo.addColorStop(0, '#ffffff');
        gradNudo.addColorStop(0.4, '#ffb3c6');
        gradNudo.addColorStop(0.85, '#ff4d6d');
        gradNudo.addColorStop(1, '#a4133c');
        ctx.fillStyle = gradNudo;

        ctx.beginPath();
        ctx.ellipse(centroX, bowY + 4, 14, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ribete de brillo en el lazo
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(centroX - 2, bowY + 2, 8, -Math.PI * 0.7, 0);
        ctx.stroke();

        ctx.restore();

        // 6. DESTELLOS MÁGICOS DISCRETOS
        for (let i = 0; i < 7; i++) {
            const sparkAng = tiempo * 1.5 + (i * Math.PI / 3.5);
            const sx = centroX + Math.cos(sparkAng) * (140 + Math.sin(tiempo * 2 + i) * 20);
            const sy = 180 + Math.sin(sparkAng * 0.9) * 85;

            ctx.save();
            ctx.fillStyle = '#fff3b0';
            ctx.shadowColor = '#ffeaa7';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(sx, sy, 2 + Math.sin(tiempo * 3 + i) * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        animacionRamoId = requestAnimationFrame(dibujarRamo);
    }

    if (animacionRamoId) cancelAnimationFrame(animacionRamoId);
    animacionRamoId = requestAnimationFrame(dibujarRamo);
}

// ===================================================
// DESCARGAR POSTAL DEL RAMO
// ===================================================
function descargarPostalRamo() {
    reproducirSonidoBoton();
    
    // Obtener el lienzo origen (3D WebGL o 2D según el modo)
    let sourceCanvas = null;
    if (AppState.modoVisual === '3d' && window.Motor3D && Motor3D.ramo) {
        sourceCanvas = Motor3D.ramo.renderer.domElement;
    } else {
        sourceCanvas = document.getElementById('bouquet-canvas');
    }
    if (!sourceCanvas) return;

    const postCanvas = document.createElement('canvas');
    postCanvas.width = 1200;
    postCanvas.height = 1400;
    const pctx = postCanvas.getContext('2d');

    const grad = pctx.createLinearGradient(0, 0, 0, postCanvas.height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#fff0f3');
    grad.addColorStop(1, '#ffccd5');
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, postCanvas.width, postCanvas.height);

    pctx.strokeStyle = '#e63946';
    pctx.lineWidth = 12;
    pctx.strokeRect(30, 30, postCanvas.width - 60, postCanvas.height - 60);

    pctx.strokeStyle = '#ff758f';
    pctx.lineWidth = 2;
    pctx.strokeRect(45, 45, postCanvas.width - 90, postCanvas.height - 90);

    pctx.font = 'bold 64px "Great Vibes", cursive, sans-serif';
    pctx.fillStyle = '#e63946';
    pctx.textAlign = 'center';
    pctx.fillText('Tu Ramito de happycump my baby', postCanvas.width / 2, 140);

    pctx.font = '26px "Poppins", sans-serif';
    pctx.fillStyle = '#5c677d';
    pctx.fillText('Un ramo inmarcesible virtualizado con todo mi amor ✨', postCanvas.width / 2, 200);

    pctx.drawImage(sourceCanvas, (postCanvas.width - 800) / 2, 240, 800, 750);

    pctx.font = 'italic 23px "Poppins", sans-serif';
    pctx.fillStyle = '#2b2d42';
    pctx.fillText('“Para mi personita especial: mi baby mi Júpiter hermosa. Que esta nueva vuelta al sol te traiga', postCanvas.width / 2, 1060);
    pctx.fillText('toda la felicidad, paz, amor y momentos mágicos que mereces. Gracias por iluminar todo', postCanvas.width / 2, 1105);
    pctx.fillText('a tu alrededor con tu bella luz y sonrisa cuando esta toda amorosita uwu.”', postCanvas.width / 2, 1150);

    pctx.font = 'bold 45px "Great Vibes", cursive, sans-serif';
    pctx.fillStyle = '#f72585';
    pctx.fillText('Con todo mi amor para mi baby ❤️', postCanvas.width / 2, 1245);

    const link = document.createElement('a');
    link.download = 'Ramo-Virtual-Para-Jupiter.png';
    link.href = postCanvas.toDataURL('image/png');
    link.click();
}

// Lluvia extra de pétalos 3D: ¡Exclusivamente de las flores y en los colores que ella escogió!
function activarLluviaDePetalos() {
    reproducirSonidoFlorVirtualizada();
    const flores = AppState.floresSeleccionadas.length > 0
        ? AppState.floresSeleccionadas
        : [CatalogoFlores.crearFlor('rosa', '#ffb3c6')];

    for (let i = 0; i < 50; i++) {
        const florAleatoria = flores[Math.floor(Math.random() * flores.length)];
        const p = new PetaloFondo(window.innerWidth, window.innerHeight, florAleatoria);
        p.y = -Math.random() * 140;
        p.velY = 1.4 + Math.random() * 2.2;
        petalosFondo.push(p);
    }
}

// ===================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
    iniciarParticulasFondo();
    renderizarCatalogo();

    // Botones de Modo Visual (3D Real vs 2D Ilustrado)
    const btnMode3D = document.getElementById('btn-mode-3d');
    if (btnMode3D) {
        btnMode3D.addEventListener('click', () => cambiarModoVisual('3d'));
    }

    const btnMode2D = document.getElementById('btn-mode-2d');
    if (btnMode2D) {
        btnMode2D.addEventListener('click', () => cambiarModoVisual('2d'));
    }

    const btnInicio = document.getElementById('btn-inicio');
    if (btnInicio) {
        btnInicio.addEventListener('click', () => {
            cambiarPantalla('screen-carta');
        });
    }

    const btnCartaComenzar = document.getElementById('btn-carta-comenzar');
    if (btnCartaComenzar) {
        btnCartaComenzar.addEventListener('click', () => {
            cambiarPantalla('screen-taller');
        });
    }

    const btnCrearRamo = document.getElementById('btn-crear-ramo');
    if (btnCrearRamo) {
        btnCrearRamo.addEventListener('click', () => {
            if (AppState.floresSeleccionadas.length < 3) {
                alert('¡Por favor selecciona al menos 3 flores antes de armar tu ramo!');
                return;
            }
            cambiarPantalla('screen-ramo');
        });
    }

    const btnDescargar = document.getElementById('btn-descargar-postal');
    if (btnDescargar) {
        btnDescargar.addEventListener('click', descargarPostalRamo);
    }

    const btnLluvia = document.getElementById('btn-lluvia-petalos');
    if (btnLluvia) {
        btnLluvia.addEventListener('click', activarLluviaDePetalos);
    }

    const btnReiniciar = document.getElementById('btn-reiniciar');
    if (btnReiniciar) {
        btnReiniciar.addEventListener('click', () => {
            AppState.floresSeleccionadas = [];
            actualizarEstadoBandeja();
            const canvasV = document.getElementById('virtualizer-canvas');
            if (canvasV) {
                const ctx = canvasV.getContext('2d');
                ctx.clearRect(0, 0, canvasV.width, canvasV.height);
            }
            if (window.Motor3D && Motor3D.virtualizador) {
                while (Motor3D.virtualizador.grupoContenido.children.length > 0) {
                    Motor3D.virtualizador.grupoContenido.remove(Motor3D.virtualizador.grupoContenido.children[0]);
                }
            }
            const statusEl = document.getElementById('virtualizer-status');
            if (statusEl) statusEl.innerHTML = 'Toca "Virtualizar esta flor" en el catálogo para verla nacer 🌱';
            cambiarPantalla('screen-taller');
        });
    }

    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            AppState.sonidoActivado = !AppState.sonidoActivado;
            soundToggle.textContent = AppState.sonidoActivado ? '🔊' : '🔇';
            soundToggle.title = AppState.sonidoActivado ? 'Sonido activado' : 'Sonido desactivado';
        });
    }

    // Inicializar en Modo 3D Real
    cambiarModoVisual(AppState.modoVisual || '3d');
});
