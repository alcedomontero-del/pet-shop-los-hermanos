/**
 * local-db.js
 * ---------------------------------------------------------
 * Simula Firebase Authentication + Firestore + Cloudinary
 * usando SOLO localStorage. No hace ninguna llamada de red.
 *
 * Se carga ÚNICAMENTE cuando env.js detecta ES_LOCAL = true.
 * Sirve para que el dueño de la tienda pueda probar y mostrar
 * el sistema completo (login, subir productos con foto,
 * catálogo) sin tener una cuenta real de Firebase ni de
 * Cloudinary todavía, y sin arriesgar datos reales.
 *
 * Credenciales de la cuenta de administrador de demostración:
 *   correo:    admin@demo.com
 *   contraseña: demo1234
 * ---------------------------------------------------------
 */
window.LocalDB = (function () {
  const CLAVE_PRODUCTOS = "psh_demo_productos";
  const CLAVE_SESION = "psh_demo_sesion";
  const CLAVE_CATEGORIAS = "psh_demo_categorias";
  const ADMIN_DEMO = { email: "admin@demo.com", password: "demo1234" };

  const CATEGORIAS_DEFAULT = [
    { nombre: "Alimento", emoji: "🍖" },
    { nombre: "Juguetes", emoji: "🧸" },
    { nombre: "Accesorios", emoji: "🎀" },
    { nombre: "Higiene", emoji: "🧴" },
    { nombre: "Otros", emoji: "🐾" },
  ];

  function leerCategorias() {
    try {
      const crudo = localStorage.getItem(CLAVE_CATEGORIAS);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) {
      return null;
    }
  }
  function guardarCategorias(lista) {
    localStorage.setItem(CLAVE_CATEGORIAS, JSON.stringify(lista));
  }

  function leerProductos() {
    try {
      const crudo = localStorage.getItem(CLAVE_PRODUCTOS);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) {
      return null;
    }
  }

  function guardarProductos(lista) {
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(lista));
  }

  // Catálogo de ejemplo para que la demo no se vea vacía la primera vez
  function sembrarDatosDeEjemplo() {
    const ejemplo = [
      {
        id: "demo-1",
        nombre: "Croquetas Cachorro Feliz",
        precio: 1450,
        categoria: "Alimento",
        marca: "Feliz Can · 3 kg, sabor pollo",
        imagenUrl: "",
        creadoEn: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
      {
        id: "demo-2",
        nombre: "Pelota mordedora de goma",
        precio: 320,
        categoria: "Juguetes",
        marca: "",
        imagenUrl: "",
        creadoEn: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: "demo-3",
        nombre: "Shampoo antipulgas",
        precio: 690,
        categoria: "Higiene",
        marca: "PetClean · 250 ml",
        imagenUrl: "",
        creadoEn: Date.now() - 1000 * 60 * 60 * 24,
      },
    ];
    guardarProductos(ejemplo);
    return ejemplo;
  }

  function generarId() {
    return "prod-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function leerArchivoComoBase64(archivo) {
    return new Promise((resolve, reject) => {
      if (!archivo) return resolve("");
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result);
      lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
      lector.readAsDataURL(archivo);
    });
  }

  function retrasoFalso(ms) {
    // Pequeña espera artificial para que la experiencia (spinners, etc.)
    // se sienta igual que cuando hay una llamada de red real.
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return {
    // ---------- Autenticación ----------
    async login(email, password) {
      await retrasoFalso(400);
      if (email.trim().toLowerCase() === ADMIN_DEMO.email && password === ADMIN_DEMO.password) {
        const user = { email: ADMIN_DEMO.email, uid: "demo-admin" };
        localStorage.setItem(CLAVE_SESION, JSON.stringify(user));
        return user;
      }
      throw new Error("Correo o contraseña incorrectos (demo: admin@demo.com / demo1234)");
    },

    async logout() {
      await retrasoFalso(150);
      localStorage.removeItem(CLAVE_SESION);
    },

    getCurrentUser() {
      try {
        const crudo = localStorage.getItem(CLAVE_SESION);
        return crudo ? JSON.parse(crudo) : null;
      } catch (e) {
        return null;
      }
    },

    // Misma forma que el listener real de Firebase Auth, para que
    // el resto del código no tenga que saber cuál de los dos usa.
    onAuthChange(callback) {
      callback(this.getCurrentUser());
      return () => {}; // "desuscribirse" — no hace falta en la demo
    },

    // ---------- Productos ----------
    async getProductos() {
      await retrasoFalso(250);
      let lista = leerProductos();
      if (!lista) lista = sembrarDatosDeEjemplo();
      return lista.sort((a, b) => b.creadoEn - a.creadoEn);
    },

    async agregarProducto(datos, archivoImagen) {
      await retrasoFalso(500);
      const lista = leerProductos() || [];
      const imagenUrl = await leerArchivoComoBase64(archivoImagen);
      const nuevo = {
        id: generarId(),
        nombre: datos.nombre,
        precio: Number(datos.precio),
        categoria: datos.categoria,
        marca: datos.marca || "",
        imagenUrl,
        creadoEn: Date.now(),
      };
      lista.push(nuevo);
      guardarProductos(lista);
      return nuevo;
    },

    async actualizarProducto(id, datos, archivoImagen) {
      await retrasoFalso(500);
      const lista = leerProductos() || [];
      const idx = lista.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Producto no encontrado");
      const imagenUrl = archivoImagen ? await leerArchivoComoBase64(archivoImagen) : lista[idx].imagenUrl;
      lista[idx] = {
        ...lista[idx],
        nombre: datos.nombre,
        precio: Number(datos.precio),
        categoria: datos.categoria,
        marca: datos.marca || "",
        imagenUrl,
      };
      guardarProductos(lista);
      return lista[idx];
    },

    async eliminarProducto(id) {
      await retrasoFalso(300);
      const lista = leerProductos() || [];
      guardarProductos(lista.filter((p) => p.id !== id));
    },

    // ---------- Categorías ----------
    async getCategorias() {
      await retrasoFalso(150);
      let lista = leerCategorias();
      if (!lista) {
        lista = CATEGORIAS_DEFAULT.slice();
        guardarCategorias(lista);
      }
      return lista;
    },

    async agregarCategoria(datos) {
      await retrasoFalso(300);
      const nombre = (datos.nombre || "").trim();
      if (!nombre) throw new Error("El nombre de la categoría no puede estar vacío");
      const lista = leerCategorias() || CATEGORIAS_DEFAULT.slice();
      const yaExiste = lista.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
      if (yaExiste) throw new Error("Ya existe una categoría con ese nombre");
      const nueva = { nombre, emoji: datos.emoji || "🐾" };
      lista.push(nueva);
      guardarCategorias(lista);
      return nueva;
    },

    // Permite reiniciar la demo a su estado inicial desde la consola:
    // LocalDB.borrarDatosDeDemo()
    borrarDatosDeDemo() {
      localStorage.removeItem(CLAVE_PRODUCTOS);
      localStorage.removeItem(CLAVE_SESION);
      localStorage.removeItem(CLAVE_CATEGORIAS);
      console.log("Datos de demostración borrados. Recarga la página.");
    },
  };
})();
