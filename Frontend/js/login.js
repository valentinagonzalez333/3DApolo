document.getElementById("login-forma").addEventListener("submit", async (e) => {

    e.preventDefault();

    const mensajeError = document.querySelector(".error");

    const user = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    const respt = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ usuario: user, password: password })
    });

    const resJson = await respt.json();

    if (resJson.ok) {

        // 🔥 GUARDAR TODO
        localStorage.setItem("usuario", resJson.usuario);
        localStorage.setItem("rol", resJson.rol);

        // Redirección
        window.location.href = "/inicio";

    } else {
        mensajeError.classList.remove("escondido");
    }
});