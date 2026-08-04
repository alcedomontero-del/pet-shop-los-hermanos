/**
 * store.js — pinta el catálogo de productos que ve el cliente
 */
(function () {
  let todosLosProductos = [];
  let mapaCategorias = {}; // { "Alimento": "🍖", ... }
  let categoriaActiva = "Todas";

  function iconoPara(categoria) {
    return mapaCategorias[categoria] || "🐾";
  }

  function construirFiltros(productos) {
    const contenedor = document.getElementById("filtros");
    const categorias = ["Todas", ...new Set(productos.map((p) => p.categoria).filter(Boolean))];
    contenedor.innerHTML = categorias
      .map(
        (cat) =>
          `<button class="pill ${cat === categoriaActiva ? "active" : ""}" data-cat="${cat}">${
            cat === "Todas" ? "🐾 Todas" : iconoPara(cat) + " " + cat
          }</button>`
      )
      .join("");

    contenedor.querySelectorAll(".pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        categoriaActiva = btn.dataset.cat;
        construirFiltros(todosLosProductos);
        pintarProductos();
      });
    });
  }

  function tarjetaProducto(p) {
    const imagen = p.imagenUrl
      ? `<img src="${p.imagenUrl}" alt="${p.nombre}" loading="lazy" />`
      : `<span class="placeholder-icon">${iconoPara(p.categoria)}</span>`;
    const botonLupa = p.imagenUrl
      ? `<button type="button" class="zoom-btn" data-id="${p.id}" title="Ver foto completa">🔍</button>`
      : "";

    return `
      <article class="card">
        <div class="price-sticker">${window.formatearPrecio(p.precio)}<small>RD$</small></div>
        <div class="photo">${imagen}${botonLupa}</div>
        <div class="body">
          <span class="category-tag">${iconoPara(p.categoria)} ${p.categoria || "Sin categoría"}</span>
          <h3>${p.nombre}</h3>
          ${p.marca ? `<p class="brand">${p.marca}</p>` : ""}
        </div>
      </article>`;
  }

  function pintarProductos() {
    const grid = document.getElementById("grid-productos");
    const vacio = document.getElementById("estado-vacio");

    const filtrados =
      categoriaActiva === "Todas"
        ? todosLosProductos
        : todosLosProductos.filter((p) => p.categoria === categoriaActiva);

    if (filtrados.length === 0) {
      grid.innerHTML = "";
      vacio.style.display = "block";
      return;
    }
    vacio.style.display = "none";
    grid.innerHTML = filtrados.map(tarjetaProducto).join("");
  }

  async function cargar() {
    try {
      const [categorias, productos] = await Promise.all([
        window.DB.getCategorias(),
        window.DB.getProductos(),
      ]);
      mapaCategorias = Object.fromEntries(categorias.map((c) => [c.nombre, c.emoji]));
      todosLosProductos = productos;
      construirFiltros(todosLosProductos);
      pintarProductos();
    } catch (error) {
      console.error(error);
      document.getElementById("grid-productos").innerHTML =
        '<p style="text-align:center; grid-column:1/-1;">No se pudieron cargar los productos. Intenta recargar la página.</p>';
    }
  }

  // ---------- Visor de foto completa (lightbox) ----------
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  let idAbierto = null;

  function marcarBotonActivo(id) {
    document.querySelectorAll(".card .zoom-btn").forEach((b) => {
      b.classList.toggle("activo", b.dataset.id === id);
      b.textContent = b.dataset.id === id ? "✕" : "🔍";
    });
  }

  function abrirFoto(producto) {
    lightboxImg.src = producto.imagenUrl;
    lightboxImg.alt = producto.nombre;
    lightbox.classList.add("show");
    idAbierto = producto.id;
    marcarBotonActivo(idAbierto);
  }

  function cerrarFoto() {
    lightbox.classList.remove("show");
    idAbierto = null;
    marcarBotonActivo(null);
  }

  // Un solo botón por tarjeta: si ya está abierta esa foto, el clic la cierra;
  // si es otra foto (o estaba cerrada), la abre — y la que estuviera abierta
  // antes vuelve sola a su tamaño normal porque solo puede haber una activa.
  document.getElementById("grid-productos").addEventListener("click", (evento) => {
    const boton = evento.target.closest(".zoom-btn");
    if (!boton) return;
    const id = boton.dataset.id;
    if (id === idAbierto) {
      cerrarFoto();
    } else {
      const producto = todosLosProductos.find((p) => p.id === id);
      if (producto) abrirFoto(producto);
    }
  });

  // Clic en cualquier parte que no sea la foto ampliada ni su botón
  // (incluye clic sobre otro producto, sobre el fondo oscuro, o en
  // cualquier zona vacía de la página) también minimiza la foto.
  document.addEventListener("click", (evento) => {
    if (!idAbierto) return;
    const dentroDelMarco = evento.target.closest(".lightbox-frame");
    const esOtroBotonLupa = evento.target.closest(".zoom-btn") && !dentroDelMarco;
    if (!dentroDelMarco && !esOtroBotonLupa) cerrarFoto();
  });
  lightboxClose.addEventListener("click", cerrarFoto);
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cerrarFoto();
  });

  window.pintarBadgeModo("badge-modo");
  window.cuandoDBListo(cargar);
})();
