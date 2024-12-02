import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://yonljvltfgbecsznpblf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvbmxqdmx0ZmdiZWNzem5wYmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNzY0NjgsImV4cCI6MjA0ODc1MjQ2OH0.bd_KDRf8K1Tin7qF6qo6QKsbR0rlVfLD9_lw6y9f74k";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Referencias al DOM
const authSection = document.getElementById("auth-section");
const registerSection = document.getElementById("register-section");
const cuestionarioSection = document.getElementById("cuestionario-section");
const resultadosSection = document.getElementById("resultados-section");

const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");
const formCuestionario = document.getElementById("form-cuestionario");

let currentUser = null;

// Manejo de autenticación
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        cargarHistorial(currentUser.id);
        mostrarSeccion(cuestionarioSection);
    } else {
        mostrarSeccion(authSection);
    }
}

checkAuth();

formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email-register").value;
    const password = document.getElementById("password-register").value;

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        alert("Error al registrar usuario: " + error.message);
    } else {
        alert("Usuario registrado con éxito. Por favor verifica tu correo.");
        mostrarSeccion(authSection);
    }
});

formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email-login").value;
    const password = document.getElementById("password-login").value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Error al iniciar sesión: " + error.message);
    } else {
        currentUser = data.user;
        cargarHistorial(currentUser.id);
        mostrarSeccion(cuestionarioSection);
    }
});

document.getElementById("register-btn").addEventListener("click", () => {
    mostrarSeccion(registerSection);
});

document.getElementById("login-btn").addEventListener("click", () => {
    mostrarSeccion(authSection);
});

// Enviar cuestionario
formCuestionario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const respuestas = {};
    for (let i = 1; i <= 11; i++) {
        const value = obtenerValorSeleccionado(`pregunta${i}`);
        if (!value) {
            alert("Por favor responde todas las preguntas.");
            return;
        }
        respuestas[`pregunta${i}`] = parseInt(value);
    }

    const nivel = calcularNivelMadurez(respuestas);
    const recomendaciones = generarRecomendaciones(nivel);

    try {
        const { error } = await supabase
            .from("reports")
            .insert({ user_id: currentUser.id, report_data: { respuestas, nivel, recomendaciones } });

        if (error) {
            alert("Error al guardar los resultados: " + error.message);
        } else {
            mostrarResultados(nivel, recomendaciones, respuestas);
            alert("Cuestionario enviado y guardado exitosamente.");
        }
    } catch (error) {
        console.error("Error al guardar el cuestionario:", error);
    }
});

// Funciones auxiliares
function mostrarSeccion(seccion) {
    authSection.style.display = "none";
    registerSection.style.display = "none";
    cuestionarioSection.style.display = "none";
    resultadosSection.style.display = "none";
    seccion.style.display = "block";
}

function obtenerValorSeleccionado(nombrePregunta) {
    const opciones = document.getElementsByName(nombrePregunta);
    for (const opcion of opciones) {
        if (opcion.checked) {
            return opcion.value;
        }
    }
    return null;
}

function calcularNivelMadurez(respuestas) {
    const total = Object.values(respuestas).reduce((a, b) => a + b, 0);

    if (total <= 17) return "Inicial";
    if (total <= 25) return "Repetible";
    if (total <= 33) return "Definido";
    if (total <= 41) return "Gestionado";
    return "Optimizado";
}

function generarRecomendaciones(nivel) {
    const recomendaciones = {
        "Inicial": "Desarrollar políticas básicas de privacidad, capacitar al personal, implementar medidas iniciales.",
        "Repetible": "Formalizar procesos, realizar revisiones periódicas y mejorar la comunicación.",
        "Definido": "Mejorar transparencia, automatizar revisiones y realizar auditorías internas.",
        "Gestionado": "Optimizar políticas, realizar auditorías externas y monitorear en tiempo real.",
        "Optimizado": "Adoptar nuevas tecnologías, colaborar con terceros, implementar monitoreo proactivo."
    };

    return recomendaciones[nivel] || "Sin recomendaciones disponibles.";
}

function mostrarResultados(nivel, recomendaciones, respuestas) {
    document.getElementById("nivel-madurez").innerText = `Nivel de Madurez: ${nivel}`;
    document.getElementById("recomendaciones").innerText = `Recomendaciones: ${recomendaciones}`;
    mostrarSeccion(resultadosSection);
}

async function cargarHistorial(userId) {
    const reportList = document.getElementById("report-list");
    reportList.innerHTML = "";

    const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId);

    if (error) {
        console.error("Error al cargar el historial:", error);
        return;
    }

    data.forEach((report) => {
        const li = document.createElement("li");
        li.textContent = `Nivel: ${report.report_data.nivel}, Fecha: ${new Date(report.created_at).toLocaleDateString()}`;
        reportList.appendChild(li);
    });
}
