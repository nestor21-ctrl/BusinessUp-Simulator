
"use strict";

// =======================================
// BUSINESSUP SIMULATOR 3.0
// =======================================

const STORAGE_KEY = "businessup-v3";
const MAX_MONTHS = 12;

const $ = id => document.getElementById(id);

const money = value => new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
}).format(value);

const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

const randomIndex = length =>
    Math.floor(Math.random() * length);

// PRODUCTOS

const productTemplates = [
    {
        name: "Audífonos Bluetooth",
        stock: 20,
        price: 450,
        cost: 250,
        baseDemand: 8
    },
    {
        name: "Mouse inalámbrico",
        stock: 20,
        price: 250,
        cost: 120,
        baseDemand: 10
    },
    {
        name: "Teclado mecánico",
        stock: 15,
        price: 750,
        cost: 450,
        baseDemand: 6
    },
    {
        name: "Bocina portátil",
        stock: 15,
        price: 600,
        cost: 350,
        baseDemand: 7
    }
];

// MERCADOS

const markets = [
    {
        name: "Mercado estable",
        factor: 1,
        description: "La demanda se mantiene en niveles normales."
    },
    {
        name: "Temporada alta",
        factor: 1.3,
        description: "Los consumidores están comprando más tecnología."
    },
    {
        name: "Competencia intensa",
        factor: 0.78,
        description: "Una empresa rival está atrayendo clientes."
    },
    {
        name: "Temporada baja",
        factor: 0.8,
        description: "Las ventas del sector se han reducido."
    },
    {
        name: "Tendencia tecnológica",
        factor: 1.18,
        description: "Los accesorios electrónicos están de moda."
    }
];

// EVENTOS EMPRESARIALES
// Cada opción modifica dinero, reputación o demanda.

const events = [
    {
        title: "Cliente insatisfecho",
        description:
            "Un cliente publicó una queja por el servicio recibido.",
        options: [
            {
                label: "Ofrecer compensación ($800)",
                cost: 800,
                reputation: 6,
                demand: 1.02,
                result: "Resolviste la queja y mejoraste tu imagen."
            },
            {
                label: "Ignorar la queja",
                cost: 0,
                reputation: -5,
                demand: 0.95,
                result: "La queja afectó la confianza de los clientes."
            }
        ]
    },
    {
        title: "Oportunidad de promoción",
        description:
            "Un influencer local ofrece promocionar tu negocio.",
        options: [
            {
                label: "Aceptar campaña ($1,200)",
                cost: 1200,
                reputation: 2,
                demand: 1.2,
                result: "La promoción aumentó el interés por tu tienda."
            },
            {
                label: "No contratar",
                cost: 0,
                reputation: 0,
                demand: 1,
                result: "Decidiste conservar tus recursos."
            }
        ]
    },
    {
        title: "Problemas de calidad",
        description:
            "Algunos clientes reportan fallas en los productos.",
        options: [
            {
                label: "Aplicar control de calidad ($1,000)",
                cost: 1000,
                reputation: 5,
                demand: 1,
                result: "Tu respuesta recuperó la confianza del mercado."
            },
            {
                label: "Posponer solución",
                cost: 0,
                reputation: -7,
                demand: 0.92,
                result: "La reputación del negocio disminuyó."
            }
        ]
    },
    {
        title: "Feria tecnológica",
        description:
            "Se realizará una feria donde puedes promocionar tu empresa.",
        options: [
            {
                label: "Participar ($1,500)",
                cost: 1500,
                reputation: 4,
                demand: 1.25,
                result: "La feria atrajo nuevos clientes."
            },
            {
                label: "No participar",
                cost: 0,
                reputation: 0,
                demand: 1,
                result: "Continuaste con tus operaciones habituales."
            }
        ]
    },
    {
        title: "Competidor con descuentos",
        description:
            "Una empresa rival lanzó una campaña de precios bajos.",
        options: [
            {
                label: "Lanzar promoción ($900)",
                cost: 900,
                reputation: 1,
                demand: 1.12,
                result: "La promoción ayudó a conservar clientes."
            },
            {
                label: "Mantener estrategia",
                cost: 0,
                reputation: 0,
                demand: 0.9,
                result: "Algunos clientes prefirieron a la competencia."
            }
        ]
    },
    {
        title: "Reconocimiento empresarial",
        description:
            "Una organización local invita a tu negocio a un evento.",
        options: [
            {
                label: "Asistir ($500)",
                cost: 500,
                reputation: 5,
                demand: 1.08,
                result: "Tu empresa obtuvo mayor reconocimiento."
            },
            {
                label: "Rechazar invitación",
                cost: 0,
                reputation: 0,
                demand: 1,
                result: "Continuaste trabajando sin cambios."
            }
        ]
    }
];

// MISIONES MENSUALES

const missionTypes = [
    {
        type: "sales",
        title: "Impulsa las ventas",
        description: "Alcanza el objetivo de ingresos del mes.",
        baseTarget: 12000
    },
    {
        type: "units",
        title: "Incrementa las unidades vendidas",
        description: "Vende suficientes productos durante este mes.",
        baseTarget: 25
    },
    {
        type: "profit",
        title: "Genera utilidad",
        description: "Obtén la utilidad neta solicitada.",
        baseTarget: 3000
    },
    {
        type: "reputation",
        title: "Construye una buena reputación",
        description: "Alcanza la reputación objetivo al cerrar el mes.",
        baseTarget: 55
    }
];

let state = null;

// =======================================
// CREAR PARTIDA
// =======================================

function createGame(name, difficulty) {
    return {
        name,
        difficulty,
        period: 1,
        capital: 50000,
        sales: 0,
        profit: 0,
        reputation: 50,

        products: productTemplates.map(p => ({ ...p })),

        advertising: false,
        training: false,

        marketIndex: 0,
        eventIndex: 0,
        eventChoice: null,
        eventExpenses: 0,
        eventDemand: 1,

        mission: null,
        missionsCompleted: 0,
        lastMissionResult: null,

        history: [
            { period: 0, capital: 50000 }
        ],

        messages: [
            {
                title: "Bienvenido a BusinessUp",
                detail: "Tu empresa comienza con $50,000 MXN."
            }
        ],

        finished: false,
        finalEvaluation: null
    };
}

// =======================================
// ALMACENAMIENTO
// =======================================

function save() {
    if (!state) return;

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );
    } catch (error) {
        console.warn("No se pudo guardar:", error);
    }
}

function load() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        if (
            saved &&
            Array.isArray(saved.products) &&
            Array.isArray(saved.history) &&
            Array.isArray(saved.messages) &&
            saved.mission &&
            Number.isInteger(saved.period) &&
            saved.period >= 1 &&
            saved.period <= MAX_MONTHS + 1
        ) {
            return saved;
        }
    } catch (error) {
        console.warn("No se pudo cargar:", error);
    }

    return null;
}

// =======================================
// UTILIDADES
// =======================================

function addMessage(title, detail) {
    state.messages.unshift({ title, detail });
    state.messages = state.messages.slice(0, 25);
}

function inventoryValue() {
    return state.products.reduce(
        (sum, p) => sum + p.stock * p.cost,
        0
    );
}

function netWorth() {
    return state.capital + inventoryValue();
}

function difficultyMultiplier() {
    return {
        easy: 1.2,
        normal: 1,
        hard: 0.78
    }[state.difficulty] || 1;
}

function operatingCost() {
    return {
        easy: 800,
        normal: 1200,
        hard: 1800
    }[state.difficulty] || 1200;
}

// =======================================
// GENERAR MISIÓN
// =======================================

function generateMission() {
    const index = (state.period - 1) %
        missionTypes.length;

    const template = missionTypes[index];

    let target;

    if (template.type === "reputation") {
        target = Math.min(
            90,
            template.baseTarget +
            Math.floor((state.period - 1) / 4) * 8
        );
    } else {
        const scale = {
            easy: 0.8,
            normal: 1,
            hard: 1.15
        }[state.difficulty] || 1;

        target = Math.round(
            template.baseTarget *
            (1 + (state.period - 1) * 0.04) *
            scale
        );
    }

    state.mission = {
        type: template.type,
        title: template.title,
        description: template.description,
        target,
        reward: 1500 + (state.period - 1) * 150
    };

    state.lastMissionResult = null;
}

// =======================================
// GENERAR EVENTO
// =======================================

function generateEvent() {
    state.eventIndex = randomIndex(events.length);
    state.eventChoice = null;
    state.eventExpenses = 0;
    state.eventDemand = 1;
}

// =======================================
// INICIAR NUEVA PARTIDA
// =======================================

function startGame() {
    const name =
        $("companyName").value.trim() || "BusinessUp Tech";

    state = createGame(
        name,
        $("difficulty").value
    );

    generateMission();
    generateEvent();

    save();
    show();
}

// =======================================
// PANTALLAS
// =======================================

function show() {
    const active = Boolean(state);

    $("welcomeScreen").hidden = active;
    $("dashboard").hidden = !active;

    if (active) render();
}

// =======================================
// ACTUALIZAR INDICADORES
// =======================================

function render() {
    if (!state) return;

    $("period").textContent =
        `Periodo ${Math.min(state.period, MAX_MONTHS)} de 12`;

    $("companyTitle").textContent = state.name;
    $("capital").textContent = money(state.capital);
    $("sales").textContent = money(state.sales);
    $("profit").textContent = money(state.profit);
    $("reputation").textContent =
        `${state.reputation}/100`;

    $("status").textContent = state.finished
        ? "Simulación finalizada"
        : "Empresa en funcionamiento";

    $("netWorth").textContent = money(netWorth());

    $("missionsCompleted").textContent =
        `${state.missionsCompleted}/12`;

    $("monthsCompleted").textContent =
        `${state.history.length - 1}/12`;

    const market = markets[state.marketIndex];

    $("marketText").textContent =
        `${market.name}: ${market.description}`;

    renderInventory();
    renderMission();
    renderEvent();
    renderMessages();
    drawChart();

    $("advertisingBtn").disabled =
        state.advertising || state.finished;

    $("trainingBtn").disabled =
        state.training || state.finished;

    $("buyBtn").disabled = state.finished;

    $("nextBtn").disabled =
        state.finished || state.eventChoice === null;

    $("nextBtn").textContent = state.finished
        ? "Simulación completada"
        : "Finalizar mes y calcular resultados →";

    $("finalReport").hidden = !state.finished;

    if (state.finished) {
        renderFinalReport();
    }
}

// =======================================
// INVENTARIO
// =======================================

function renderInventory() {
    const container = $("inventory");
    container.replaceChildren();

    state.products.forEach((product, index) => {
        const row = document.createElement("div");
        row.className = "product";

        const info = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = product.name;

        const stock = document.createElement("small");
        stock.textContent =
            `Existencias: ${product.stock} · ` +
            `Costo unitario: ${money(product.cost)}`;

        info.append(name, stock);

        const buyBox = document.createElement("div");

        const buyLabel = document.createElement("label");
        buyLabel.textContent = "Comprar";

        const buyInput = document.createElement("input");
        buyInput.type = "number";
        buyInput.min = "0";
        buyInput.max = "999";
        buyInput.step = "1";
        buyInput.value = "0";
        buyInput.dataset.buy = index;
        buyInput.disabled = state.finished;

        buyInput.addEventListener(
            "input",
            updatePurchaseTotal
        );

        buyBox.append(buyLabel, buyInput);

        const priceBox = document.createElement("div");

        const priceLabel = document.createElement("label");
        priceLabel.textContent = "Precio MXN";

        const priceInput = document.createElement("input");
        priceInput.className = "price-input";
        priceInput.type = "number";
        priceInput.min = String(product.cost);
        priceInput.max = "10000";
        priceInput.step = "1";
        priceInput.value = product.price;
        priceInput.disabled = state.finished;

        priceInput.addEventListener("change", () => {
            const value = Number(priceInput.value);

            if (
                !Number.isInteger(value) ||
                value < product.cost ||
                value > 10000
            ) {
                alert(
                    "El precio debe estar entre " +
                    money(product.cost) +
                    " y $10,000."
                );

                priceInput.value = product.price;
                return;
            }

            product.price = value;
            save();
        });

        priceBox.append(priceLabel, priceInput);

        row.append(info, buyBox, priceBox);
        container.append(row);
    });

    updatePurchaseTotal();
}

function updatePurchaseTotal() {
    if (!state) return;

    let total = 0;

    document.querySelectorAll("[data-buy]").forEach(input => {
        const quantity = Number(input.value);
        const index = Number(input.dataset.buy);

        if (
            Number.isInteger(quantity) &&
            quantity >= 0 &&
            quantity <= 999
        ) {
            total += quantity * state.products[index].cost;
        }
    });

    $("purchaseTotal").textContent =
        `Costo de compra: ${money(total)}`;
}

function buyInventory() {
    if (!state || state.finished) return;

    const inputs = [
        ...document.querySelectorAll("[data-buy]")
    ];

    const quantities = inputs.map(
        input => Number(input.value)
    );

    if (
        quantities.some(
            n => !Number.isInteger(n) || n < 0 || n > 999
        )
    ) {
        alert("Introduce cantidades enteras de 0 a 999.");
        return;
    }

    const cost = quantities.reduce(
        (sum, quantity, index) =>
            sum + quantity * state.products[index].cost,
        0
    );

    if (cost === 0) {
        alert("Selecciona al menos una unidad.");
        return;
    }

    if (cost > state.capital) {
        alert("No tienes suficiente capital.");
        return;
    }

    quantities.forEach((quantity, index) => {
        state.products[index].stock += quantity;
    });

    state.capital -= cost;

    addMessage(
        "Compra de inventario",
        `Invertiste ${money(cost)} en mercancía.`
    );

    save();
    render();
}

// =======================================
// PUBLICIDAD Y CAPACITACIÓN
// =======================================

function spend(type, cost, title, detail) {
    if (!state || state.finished || state[type]) return;

    if (state.capital < cost) {
        alert("No tienes suficiente capital.");
        return;
    }

    state.capital -= cost;
    state[type] = true;

    addMessage(title, detail);

    save();
    render();
}

// =======================================
// EVENTOS EMPRESARIALES
// =======================================

function renderEvent() {
    const event = events[state.eventIndex];

    $("eventTitle").textContent = event.title;
    $("eventDescription").textContent =
        event.description;

    const options = $("eventOptions");
    options.replaceChildren();

    if (state.eventChoice !== null) {
        const choice =
            event.options[state.eventChoice];

        $("eventResult").textContent =
            `Decisión tomada: ${choice.result}`;

        return;
    }

    $("eventResult").textContent =
        "Selecciona una respuesta antes de finalizar el mes.";

    if (state.finished) return;

    event.options.forEach((option, index) => {
        const button = document.createElement("button");

        button.textContent = option.label;

        button.addEventListener("click", () => {
            chooseEvent(index);
        });

        options.append(button);
    });
}

function chooseEvent(index) {
    if (
        !state ||
        state.finished ||
        state.eventChoice !== null
    ) {
        return;
    }

    const event = events[state.eventIndex];
    const option = event.options[index];

    if (!option) return;

    if (state.capital < option.cost) {
        alert("No tienes suficiente capital para esta decisión.");
        return;
    }

    // El costo se paga inmediatamente.
    state.capital -= option.cost;

    // Se contabiliza como gasto del mes.
    state.eventExpenses += option.cost;

    state.reputation = clamp(
        state.reputation + option.reputation,
        0,
        100
    );

    state.eventDemand = option.demand;
    state.eventChoice = index;

    addMessage(
        `Evento: ${event.title}`,
        option.result +
        ` Costo: ${money(option.cost)}.`
    );

    save();
    render();
}

// =======================================
// MISIONES
// =======================================

function renderMission() {
    const mission = state.mission;

    $("missionTitle").textContent = mission.title;

    let targetText;

    if (mission.type === "units") {
        targetText = `${mission.target} unidades`;
    } else if (mission.type === "reputation") {
        targetText = `${mission.target}/100 puntos`;
    } else {
        targetText = money(mission.target);
    }

    $("missionDescription").textContent =
        `${mission.description} Objetivo: ${targetText}.`;

    $("missionReward").textContent =
        `Recompensa por cumplir: ${money(mission.reward)}`;

    let progress = 0;
    let progressText = "Se evaluará al finalizar el mes.";

    if (mission.type === "reputation" && !state.finished) {
        progress = state.reputation / mission.target * 100;

        progressText =
            `Reputación actual: ${state.reputation}/${mission.target}. ` +
            "El resultado se confirma al cerrar el mes.";
    }

    if (state.lastMissionResult) {
        const result = state.lastMissionResult;

        progress = result.value / result.target * 100;

        progressText = result.success
            ? "¡Misión completada!"
            : "La misión no fue completada.";
    }

    $("missionBar").style.width =
        `${clamp(progress, 0, 100)}%`;

    $("missionProgressText").textContent =
        progressText;
}

function evaluateMission(results) {
    const mission = state.mission;

    let value = 0;

    switch (mission.type) {
        case "sales":
            value = results.revenue;
            break;

        case "units":
            value = results.units;
            break;

        case "profit":
            value = results.net;
            break;

        case "reputation":
            value = state.reputation;
            break;
    }

    const success = value >= mission.target;

    state.lastMissionResult = {
        value,
        target: mission.target,
        success
    };

    if (success) {
        state.missionsCompleted++;

        // Recompensa económica: ingreso adicional.
        state.capital += mission.reward;
        state.profit += mission.reward;

        addMessage(
            "¡Misión completada!",
            `Cumpliste "${mission.title}" y ganaste ` +
            `${money(mission.reward)}.`
        );
    } else {
        addMessage(
            "Misión no completada",
            `No alcanzaste el objetivo de "${mission.title}".`
        );
    }
}

// =======================================
// SIMULAR VENTAS DEL MES
// =======================================

function nextPeriod() {
    if (!state || state.finished) return;

    if (state.eventChoice === null) {
        alert("Primero debes resolver el evento empresarial.");
        return;
    }

    const marketFactor =
        markets[state.marketIndex].factor;

    const difficulty = difficultyMultiplier();

    const reputationFactor =
        0.75 + state.reputation / 200;

    let revenue = 0;
    let cogs = 0;
    let units = 0;
    let missed = 0;

    for (const product of state.products) {
        const priceFactor = clamp(
            product.cost * 1.8 / product.price,
            0.45,
            1.5
        );

        const randomFactor =
            0.8 + Math.random() * 0.4;

        const demand = Math.max(
            0,
            Math.round(
                product.baseDemand *
                marketFactor *
                difficulty *
                reputationFactor *
                priceFactor *
                randomFactor *
                state.eventDemand *
                (state.advertising ? 1.4 : 1) *
                (state.training ? 1.1 : 1)
            )
        );

        const sold = Math.min(
            product.stock,
            demand
        );

        product.stock -= sold;

        units += sold;
        missed += demand - sold;

        revenue += sold * product.price;
        cogs += sold * product.cost;
    }

    // GASTOS DEL MES

    const operating = operatingCost();
    const advertisingCost =
        state.advertising ? 2000 : 0;
    const trainingCost =
        state.training ? 1500 : 0;

    const totalExpenses =
        cogs +
        operating +
        advertisingCost +
        trainingCost +
        state.eventExpenses;

    const net = revenue - totalExpenses;

    // Los pagos por publicidad, capacitación,
    // eventos e inventario ya redujeron el efectivo.
    // Por eso aquí solo ingresan las ventas y se
    // descuentan los gastos operativos pendientes.

    state.capital += revenue - operating;

    state.sales += revenue;
    state.profit += net;

    // REPUTACIÓN

    state.reputation = clamp(
        state.reputation +
        (state.training ? 4 : 0) +
        (missed > 4 ? -4 : 1) +
        (net >= 0 ? 1 : -2),
        0,
        100
    );

    // HISTORIAL DEL MES

    state.history.push({
        period: state.period,
        capital: state.capital
    });

    addMessage(
        `Resultados del mes ${state.period}`,
        `Unidades vendidas: ${units}. ` +
        `Ingresos: ${money(revenue)}. ` +
        `Costo de mercancía: ${money(cogs)}. ` +
        `Gastos operativos: ${money(operating)}. ` +
        `Publicidad, capacitación y eventos: ` +
        `${money(advertisingCost + trainingCost + state.eventExpenses)}. ` +
        `Utilidad: ${money(net)}. ` +
        `Demanda no atendida: ${missed}.`
    );

    // EVALUAR MISIÓN

    evaluateMission({
        revenue,
        units,
        net
    });

    // AVANZAR

    state.period++;

    state.advertising = false;
    state.training = false;

    if (
        state.period > MAX_MONTHS ||
        state.capital <= 0
    ) {
        finishGame();
    } else {
        state.marketIndex =
            randomIndex(markets.length);

        generateMission();
        generateEvent();
    }

    save();
    render();
}

// =======================================
// GRÁFICA FINANCIERA
// =======================================

function drawChart() {
    const canvas = $("capitalChart");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const values = state.history.map(
        item => item.capital
    );

    const min = Math.min(0, ...values);
    const max = Math.max(...values, 1);
    const range = max - min || 1;

    const x = index =>
        45 + (width - 65) *
        (
            state.history.length === 1
                ? 0
                : index / (state.history.length - 1)
        );

    const y = value =>
        height - 30 -
        (height - 55) * (value - min) / range;

    ctx.strokeStyle = "#e6e7ef";
    ctx.lineWidth = 1;
    ctx.font = "12px Arial";
    ctx.fillStyle = "#85899b";

    for (let i = 0; i <= 4; i++) {
        const value = min + range * i / 4;
        const py = y(value);

        ctx.beginPath();
        ctx.moveTo(45, py);
        ctx.lineTo(width - 15, py);
        ctx.stroke();

        ctx.fillText(
            Math.round(value / 1000) + "k",
            5,
            py + 4
        );
    }

    ctx.strokeStyle = "#7159d4";
    ctx.lineWidth = 3;
    ctx.beginPath();

    state.history.forEach((item, index) => {
        if (index === 0) {
            ctx.moveTo(x(index), y(item.capital));
        } else {
            ctx.lineTo(x(index), y(item.capital));
        }
    });

    ctx.stroke();

    ctx.fillStyle = "#7159d4";

    state.history.forEach((item, index) => {
        ctx.beginPath();
        ctx.arc(
            x(index),
            y(item.capital),
            4,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillText(
            String(item.period),
            x(index) - 3,
            height - 8
        );
    });
}

// =======================================
// HISTORIAL
// =======================================

function renderMessages() {
    const container = $("messages");
    container.replaceChildren();

    state.messages.forEach(message => {
        const row = document.createElement("div");
        row.className = "message";

        const title = document.createElement("strong");
        title.textContent = message.title;

        const detail = document.createElement("span");
        detail.textContent = message.detail;

        row.append(title, detail);
        container.append(row);
    });
}

// =======================================
// EVALUACIÓN FINAL
// =======================================

function finishGame() {
    state.finished = true;

    const months = state.history.length - 1;
    const patrimonio = netWorth();

    // PUNTUACIÓN SOBRE 100

    const missionScore =
        (state.missionsCompleted / MAX_MONTHS) * 30;

    const reputationScore =
        (state.reputation / 100) * 20;

    const financeScore = clamp(
        ((patrimonio - 45000) / 40000) * 30,
        0,
        30
    );

    const profitScore = clamp(
        (state.profit / 30000) * 20,
        0,
        20
    );

    // Penalización por terminar antes del mes 12
    const completionFactor = months / MAX_MONTHS;

    const total = Math.round(
        (
            missionScore +
            reputationScore +
            financeScore +
            profitScore
        ) * completionFactor
    );

    let level;

    if (total >= 90) {
        level = "Gerente excepcional";
    } else if (total >= 75) {
        level = "Gerente destacado";
    } else if (total >= 60) {
        level = "Gerente competente";
    } else if (total >= 40) {
        level = "Gerente en desarrollo";
    } else {
        level = "Gerente principiante";
    }

    state.finalEvaluation = {
        total,
        level,
        months,
        patrimonio,
        missionScore: Math.round(missionScore),
        reputationScore: Math.round(reputationScore),
        financeScore: Math.round(financeScore),
        profitScore: Math.round(profitScore),
        completionFactor
    };

    addMessage(
        "Simulación finalizada",
        `Calificación final: ${total}/100. ` +
        `Nivel alcanzado: ${level}.`
    );
}

// MOSTRAR REPORTE FINAL

function renderFinalReport() {
    const evaluation = state.finalEvaluation;

    if (!evaluation) return;

    $("finalScore").textContent =
        `${evaluation.total}/100`;

    $("finalLevel").textContent =
        evaluation.level;

    $("finalSummary").textContent =
        `Administraste ${evaluation.months} meses. ` +
        `Tu empresa terminó con un patrimonio estimado de ` +
        `${money(evaluation.patrimonio)}, ` +
        `una utilidad acumulada de ${money(state.profit)} ` +
        `y una reputación de ${state.reputation}/100.`;

    const breakdown = $("finalBreakdown");
    breakdown.replaceChildren();

    const scores = [
        ["Misiones", evaluation.missionScore, 30],
        ["Reputación", evaluation.reputationScore, 20],
        ["Patrimonio", evaluation.financeScore, 30],
        ["Utilidad", evaluation.profitScore, 20]
    ];

    scores.forEach(([name, score, maximum]) => {
        const row = document.createElement("div");
        row.className = "score-row";

        const label = document.createElement("span");
        label.textContent = name;

        const value = document.createElement("strong");
        value.textContent = `${score}/${maximum}`;

        row.append(label, value);
        breakdown.append(row);
    });

    const recommendations = [];

    if (state.missionsCompleted < 8) {
        recommendations.push(
            "Planifica tus decisiones de acuerdo con el objetivo de cada mes."
        );
    }

    if (state.reputation < 70) {
        recommendations.push(
            "Mejora la atención al cliente y evita decisiones que dañen la reputación."
        );
    }

    if (state.profit < 15000) {
        recommendations.push(
            "Controla los gastos y revisa los márgenes de ganancia de tus productos."
        );
    }

    if (evaluation.patrimonio < 70000) {
        recommendations.push(
            "Equilibra las compras de inventario con la demanda para aumentar el patrimonio."
        );
    }

    if (evaluation.months < MAX_MONTHS) {
        recommendations.push(
            "Conserva suficiente liquidez para mantener la empresa operando durante los 12 meses."
        );
    }

    if (recommendations.length === 0) {
        recommendations.push(
            "¡Excelente gestión! Mantén tu estrategia de crecimiento y control financiero."
        );
    }

    const container = $("recommendations");
    container.replaceChildren();

    recommendations.forEach(text => {
        const item = document.createElement("div");
        item.className = "recommendation";
        item.textContent = text;
        container.append(item);
    });
}

// =======================================
// REINICIAR
// =======================================

function resetGame() {
    if (
        !confirm(
            "¿Deseas eliminar la partida actual y comenzar de nuevo?"
        )
    ) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);
    state = null;
    show();
}

// =======================================
// INICIALIZACIÓN
// =======================================

document.addEventListener("DOMContentLoaded", () => {

    $("startBtn").addEventListener(
        "click",
        startGame
    );

    $("resetBtn").addEventListener(
        "click",
        resetGame
    );

    $("playAgainBtn").addEventListener(
        "click",
        resetGame
    );

    $("buyBtn").addEventListener(
        "click",
        buyInventory
    );

    $("advertisingBtn").addEventListener("click", () => {
        spend(
            "advertising",
            2000,
            "Campaña publicitaria",
            "Invertiste $2,000 para aumentar la demanda."
        );
    });

    $("trainingBtn").addEventListener("click", () => {
        spend(
            "training",
            1500,
            "Capacitación del personal",
            "Invertiste $1,500 para mejorar el servicio."
        );
    });

    $("nextBtn").addEventListener(
        "click",
        nextPeriod
    );

    state = load();
    show();

    console.log("BusinessUp Simulator 3.0 iniciado.");
});
