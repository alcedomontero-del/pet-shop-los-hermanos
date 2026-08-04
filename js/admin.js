/**
 * admin.js — panel donde el administrador sube y gestiona productos
 */
(function () {
  window.pintarBadgeModo("badge-modo");

  const EMOJIS_DISPONIBLES = [
    "🍖","🧸","🎀","🧴","🐾","🦴","🐟","🐠","🐦","🐹",
    "🐢","🦜","🐇","🧶","🪮","🧻","🚿","💊","🏠","🛏️",
    "🎾","✂️","🌿","🧼","🪥","👕","🎁","🐴","🐍","🦴",
  ];

  let productos = [];
  let categorias = []; // [{ nombre, emoji }]
  let mapaCategorias = {};
  let editandoId = null;
  let archivoSeleccionado = null;
  let emojiSeleccionado = null;
  let valorCategoriaAnterior = "";

  // ---------- Elementos ----------
  const form = document.getElementById("form-producto");
  const inputNombre = document.getElementById("f-nombre");
  const inputPrecio = document.getElementById("f-precio");
  const inputCategoria = document.getElementById("f-categoria");
  const inputMarca = document.getElementById("f-marca");
  const inputImagen = document.getElementById("f-imagen");
  const dropZone = document.getElementById("drop-zone");
  const previewImg = document.getElementById("preview-img");
  const dropIcon = document.getElementById("drop-icon");
  const dropText = document.getElementById("drop-text");
  const btnGuardar = document.getElementById("btn-guardar");
  const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
  const listaProductos = document.getElementById("lista-productos");
  const contadorProductos = document.getElementById("contador-productos");
  const panelNuevaCategoria = document.getElementById("panel-nueva-categoria");
  const inputNombreCategoria = document.getElementById("nc-nombre");
  const emojiGrid = document.getElementById("emoji-grid");
  const btnGuardarCategoria = document.getElementById("btn-guardar-categoria");
  const btnCancelarCategoria = document.getElementById("btn-cancelar-categoria");

  function iconoPara(categoria) {
    return mapaCategorias[categoria] || "🐾";
  }

  // ---------- Guardia de autenticación ----------
  window.cuandoDBListo(async () => {
    const user = window.DB.getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    document.getElementById("admin-email").textContent = user.email;
    construirEmojiGrid();
    await cargarCategorias();
    await cargarProductos();
  });

  // ---------- Cerrar sesión ----------
  document.getElementById("btn-logout").addEventListener("click", async () => {
    await window.DB.logout();
    window.location.href = "login.html";
  });

  // ---------- Ver tienda en otra pestaña ----------
  document.getElementById("btn-ver-tienda").addEventListener("click", () => {
    window.open("index.html", "_blank");
  });

  // ---------- Selección de imagen con vista previa ----------
  dropZone.addEventListener("click", () => inputImagen.click());
  inputImagen.addEventListener("change", () => {
    const archivo = inputImagen.files[0];
    if (!archivo) return;
    archivoSeleccionado = archivo;
    const lector = new FileReader();
    lector.onload = () => {
      previewImg.src = lector.result;
      previewImg.style.display = "block";
      dropIcon.style.display = "none";
      dropText.textContent = archivo.name;
    };
    lector.readAsDataURL(archivo);
  });

  // ---------- Categorías ----------
  async function cargarCategorias() {
    categorias = await window.DB.getCategorias();
    mapaCategorias = Object.fromEntries(categorias.map((c) => [c.nombre, c.emoji]));
    pintarSelectCategorias();
  }

  function pintarSelectCategorias(seleccionar) {
    const opciones = categorias
      .map((c) => `<option value="${c.nombre}">${c.emoji} ${c.nombre}</option>`)
      .join("");
    inputCategoria.innerHTML =
      `<option value="">Elegir...</option>${opciones}<option value="__nueva__">➕ Agregar categoría nueva</option>`;
    if (seleccionar) inputCategoria.value = seleccionar;
  }

  function construirEmojiGrid() {
    emojiGrid.innerHTML = EMOJIS_DISPONIBLES.map(
      (e) => `<button type="button" class="emoji-btn" data-emoji="${e}">${e}</button>`
    ).join("");
    emojiGrid.querySelectorAll(".emoji-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        emojiGrid.querySelectorAll(".emoji-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        emojiSeleccionado = btn.dataset.emoji;
      });
    });
  }

  inputCategoria.addEventListener("change", () => {
    if (inputCategoria.value === "__nueva__") {
      panelNuevaCategoria.classList.add("show");
      inputNombreCategoria.focus();
    } else {
      valorCategoriaAnterior = inputCategoria.value;
      panelNuevaCategoria.classList.remove("show");
    }
  });

  function cerrarPanelCategoria() {
    panelNuevaCategoria.classList.remove("show");
    inputNombreCategoria.value = "";
    emojiSeleccionado = null;
    emojiGrid.querySelectorAll(".emoji-btn").forEach((b) => b.classList.remove("selected"));
    inputCategoria.value = valorCategoriaAnterior;
  }
  btnCancelarCategoria.addEventListener("click", cerrarPanelCategoria);

  btnGuardarCategoria.addEventListener("click", async () => {
    const nombre = inputNombreCategoria.value.trim();
    if (!nombre) {
      window.mostrarToast("Escribe un nombre para la categoría", "error");
      return;
    }
    if (!emojiSeleccionado) {
      window.mostrarToast("Elige un emoji para la categoría", "error");
      return;
    }
    btnGuardarCategoria.disabled = true;
    try {
      await window.DB.agregarCategoria({ nombre, emoji: emojiSeleccionado });
      await cargarCategorias();
      inputCategoria.value = nombre;
      valorCategoriaAnterior = nombre;
      panelNuevaCategoria.classList.remove("show");
      inputNombreCategoria.value = "";
      emojiSeleccionado = null;
      emojiGrid.querySelectorAll(".emoji-btn").forEach((b) => b.classList.remove("selected"));
      window.mostrarToast(`Categoría "${nombre}" creada 🎉`);
    } catch (error) {
      window.mostrarToast(error.message || "No se pudo crear la categoría", "error");
    } finally {
      btnGuardarCategoria.disabled = false;
    }
  });

  // ---------- Cargar y pintar productos ----------
  async function cargarProductos() {
    productos = await window.DB.getProductos();
    pintarLista();
  }

  function pintarLista() {
    contadorProductos.textContent = productos.length;
    if (productos.length === 0) {
      listaProductos.innerHTML =
        '<p style="text-align:center; color:var(--plum-soft); font-weight:700; padding:20px 0;">Todavía no has subido ningún producto 🐾</p>';
      return;
    }
    listaProductos.innerHTML = productos
      .map(
        (p) => `
      <div class="product-row" data-id="${p.id}">
        <div class="thumb">${
          p.imagenUrl ? `<img src="${p.imagenUrl}" alt="${p.nombre}" />` : iconoPara(p.categoria)
        }</div>
        <div class="info">
          <div class="name">${p.nombre}</div>
          <div class="meta">${window.formatearPrecio(p.precio)} · ${iconoPara(p.categoria)} ${p.categoria}${p.marca ? " · " + p.marca : ""}</div>
        </div>
        <div class="row-actions">
          <button class="icon-btn edit" title="Editar" data-accion="editar">✏️</button>
          <button class="icon-btn delete" title="Eliminar" data-accion="eliminar">🗑️</button>
        </div>
      </div>`
      )
      .join("");
  }

  listaProductos.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button");
    if (!boton) return;
    const fila = evento.target.closest(".product-row");
    const id = fila.dataset.id;
    if (boton.dataset.accion === "editar") iniciarEdicion(id);
    if (boton.dataset.accion === "eliminar") eliminar(id);
  });

  // ---------- Editar ----------
  function iniciarEdicion(id) {
    const p = productos.find((x) => x.id === id);
    if (!p) return;
    editandoId = id;
    inputNombre.value = p.nombre;
    inputPrecio.value = p.precio;
    inputCategoria.value = p.categoria;
    valorCategoriaAnterior = p.categoria;
    inputMarca.value = p.marca || "";
    archivoSeleccionado = null;
    if (p.imagenUrl) {
      previewImg.src = p.imagenUrl;
      previewImg.style.display = "block";
      dropIcon.style.display = "none";
      dropText.textContent = "Toca para cambiar la foto";
    } else {
      previewImg.style.display = "none";
      dropIcon.style.display = "block";
      dropText.textContent = "Toca para elegir una foto";
    }
    btnGuardar.textContent = "Actualizar producto";
    btnCancelarEdicion.style.display = "inline-flex";
    document.getElementById("titulo-form").textContent = "Editar producto";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelarEdicion() {
    editandoId = null;
    form.reset();
    archivoSeleccionado = null;
    previewImg.style.display = "none";
    dropIcon.style.display = "block";
    dropText.textContent = "Toca para elegir una foto";
    btnGuardar.textContent = "Guardar producto";
    btnCancelarEdicion.style.display = "none";
    document.getElementById("titulo-form").textContent = "Agregar producto";
    valorCategoriaAnterior = "";
    cerrarPanelCategoria();
  }
  btnCancelarEdicion.addEventListener("click", cancelarEdicion);

  // ---------- Eliminar ----------
  async function eliminar(id) {
    const p = productos.find((x) => x.id === id);
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await window.DB.eliminarProducto(id);
      window.mostrarToast("Producto eliminado 🗑️");
      if (editandoId === id) cancelarEdicion();
      await cargarProductos();
    } catch (error) {
      window.mostrarToast(error.message || "No se pudo eliminar", "error");
    }
  }

  // ---------- Guardar (crear o actualizar) ----------
  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datos = {
      nombre: inputNombre.value.trim(),
      precio: inputPrecio.value,
      categoria: inputCategoria.value,
      marca: inputMarca.value.trim(),
    };

    if (!datos.nombre || !datos.precio || !datos.categoria || datos.categoria === "__nueva__") {
      window.mostrarToast("Completa nombre, precio y categoría", "error");
      return;
    }

    const textoOriginal = btnGuardar.textContent;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<span class="spinner"></span> Guardando...';

    try {
      if (editandoId) {
        await window.DB.actualizarProducto(editandoId, datos, archivoSeleccionado);
        window.mostrarToast("Producto actualizado ✏️");
      } else {
        await window.DB.agregarProducto(datos, archivoSeleccionado);
        window.mostrarToast("Producto guardado 🎉");
      }
      cancelarEdicion(); // ya deja el botón en su texto correcto ("Guardar producto")
      await cargarProductos();
    } catch (error) {
      console.error(error);
      window.mostrarToast(error.message || "No se pudo guardar el producto", "error");
      btnGuardar.textContent = textoOriginal; // solo restauramos el texto si falló
    } finally {
      btnGuardar.disabled = false;
    }
  });
})();
