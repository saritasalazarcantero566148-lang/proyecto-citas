// ======================================
// MENÚ RESPONSIVE
// ======================================

const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
}

// ======================================
// CERRAR MENÚ AL SELECCIONAR UNA OPCIÓN
// ======================================

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
    });
});

// ======================================
// CAMBIAR NAVBAR AL HACER SCROLL
// ======================================

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if (window.scrollY > 40) {

        navbar.style.padding = "12px 8%";
        navbar.style.boxShadow = "0 10px 25px rgba(0,0,0,.08)";
        navbar.style.background = "#ffffff";

    } else {

        navbar.style.padding = "18px 8%";
        navbar.style.boxShadow = "none";

    }

});

// ======================================
// SCROLL SUAVE
// ======================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        e.preventDefault();

        const destino = document.querySelector(this.getAttribute("href"));

        if (destino) {

            destino.scrollIntoView({

                behavior: "smooth"

            });

        }

    });

});

// ======================================
// ANIMACIONES AL HACER SCROLL
// ======================================

const elementos = document.querySelectorAll(
    ".card, .testimonial, .stat, .benefits-grid div"
);

const mostrarElemento = () => {

    const trigger = window.innerHeight * 0.85;

    elementos.forEach(elemento => {

        const top = elemento.getBoundingClientRect().top;

        if (top < trigger) {

            elemento.style.opacity = "1";
            elemento.style.transform = "translateY(0px)";

        }

    });

};

elementos.forEach(elemento => {

    elemento.style.opacity = "0";
    elemento.style.transform = "translateY(50px)";
    elemento.style.transition = ".8s ease";

});

window.addEventListener("scroll", mostrarElemento);
window.addEventListener("load", mostrarElemento);

// ======================================
// EFECTO EN BOTONES
// ======================================

document.querySelectorAll("button,.btn-primary,.btn-secondary,.btn-login,.btn-register")

.forEach(btn => {

    btn.addEventListener("mouseenter", () => {

        btn.style.transform = "translateY(-3px)";

    });

    btn.addEventListener("mouseleave", () => {

        btn.style.transform = "translateY(0px)";

    });

});

// ======================================
// AÑO AUTOMÁTICO EN FOOTER
// ======================================

const footer = document.querySelector("footer p");

if (footer) {

    footer.innerHTML =
        `© ${new Date().getFullYear()} MediCitas. Todos los derechos reservados.`;

}

// ======================================
// EFECTO CONTADOR EN ESTADÍSTICAS
// ======================================

const counters = document.querySelectorAll(".stat h2");

const iniciarContador = (contador) => {

    const texto = contador.innerText;

    const numero = parseInt(texto.replace(/\D/g, ""));

    let actual = 0;

    const incremento = Math.ceil(numero / 60);

    const actualizar = () => {

        actual += incremento;

        if (actual >= numero) {

            contador.innerText = texto;

        } else {

            contador.innerText =
                actual + texto.replace(/[0-9]/g, "");

            requestAnimationFrame(actualizar);

        }

    };

    actualizar();

};

let iniciado = false;

window.addEventListener("scroll", () => {

    const stats = document.querySelector(".stats");

    if (!stats) return;

    const posicion = stats.getBoundingClientRect().top;

    if (posicion < window.innerHeight && !iniciado) {

        counters.forEach(iniciarContador);

        iniciado = true;

    }

});

// ======================================
// MENSAJE DEL FORMULARIO
// ======================================

const formulario = document.querySelector(".contact form");

if (formulario) {

    formulario.addEventListener("submit", function (e) {

        e.preventDefault();

        alert(
            "Gracias por comunicarte con MediCitas. Pronto nos pondremos en contacto contigo."
        );

        formulario.reset();

    });

}

