let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";
let precioMaximo = "";
const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const ordenPrecio = document.querySelector("#ordenPrecio");
const entradaPrecio = document.querySelector("#precioMaximo");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const totalPersonas = document.querySelector("#totalPersonas");
const estado = document.querySelector("#estado");
const mensaje = document.querySelector("#mensaje");
const botonVaciar = document.querySelector("#vaciarReservacion");
async function cargarExperiencias() {
  try {
    estado.textContent = "Cargando experiencias...";
    const respuesta = await fetch("./data/experiencias.json");
    if (!respuesta.ok) {
      throw new Error("No fue posible cargar las experiencias");
    }
    experiencias = await respuesta.json();
    estado.textContent = `${experiencias.length} experiencias disponibles`;
    actualizarCatalogo();
  } catch (error) {
    estado.textContent = "Error al cargar la información";
    console.error(error);
  }
}
function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}
function obtenerResultados() {
  let resultados = [...experiencias];
  if (categoriaActual !== "todas") {
    resultados = resultados.filter(function(experiencia) {
      return experiencia.categoria === categoriaActual;
    });
  }
  if (textoBusqueda !== "") {
    resultados = resultados.filter(function(experiencia) {
      return experiencia.nombre.toLowerCase().includes(textoBusqueda);
    });
  }
  if (precioMaximo !== "") {
    resultados = resultados.filter(function(experiencia) {
      return experiencia.precio <= Number(precioMaximo);
    });
  }
  if (ordenActual === "ascendente") {
    resultados.sort(function(a, b) {
      return a.precio - b.precio;
    });
  }
  if (ordenActual === "descendente") {
    resultados.sort(function(a, b) {
      return b.precio - a.precio;
    });
  }
  return resultados;
}
function actualizarCatalogo() {
  const resultados = obtenerResultados();
  if (resultados.length === 0) {
    catalogo.innerHTML = '<p class="sin-resultados">No se encontraron experiencias</p>';
    estado.textContent = "0 resultados";
    return;
  }
  catalogo.innerHTML = resultados.map(function(experiencia) {
    return `
      <article class="tarjeta">
        <div class="imagen">${experiencia.icono}</div>
        <div class="informacion">
          <span class="categoria">${experiencia.categoria}</span>
          <h3>${experiencia.nombre}</h3>
          <p>Cupo disponible: ${experiencia.cupo}</p>
          <p class="precio">$${experiencia.precio} MXN</p>
          <label for="cantidad-${experiencia.id}">Personas:</label>
          <input type="number" id="cantidad-${experiencia.id}" min="1" max="${experiencia.cupo}" value="1">
          <button class="btn-reservar" data-id="${experiencia.id}">Agregar</button>
        </div>
      </article>
    `;
  }).join("");
  estado.textContent = `${resultados.length} resultados`;
  agregarEventosReservar();
}
function agregarEventosReservar() {
  document.querySelectorAll(".btn-reservar").forEach(function(boton) {
    boton.addEventListener("click", function() {
      agregarReserva(Number(boton.dataset.id));
    });
  });
}
function agregarReserva(id) {
  const experiencia = experiencias.find(function(elemento) {
    return elemento.id === id;
  });
  const entradaCantidad = document.querySelector(`#cantidad-${id}`);
  const cantidad = Number(entradaCantidad.value);
  if (entradaCantidad.value === "" || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > experiencia.cupo) {
    mostrarMensaje("Ingresa una cantidad válida de personas.");
    return;
  }
  const reservaExistente = reservas.find(function(reserva) {
    return reserva.experienciaId === id;
  });
  if (reservaExistente) {
    const nuevaCantidad = reservaExistente.cantidad + cantidad;
    if (nuevaCantidad > experiencia.cupo) {
      mostrarMensaje("La cantidad supera el cupo disponible.");
      return;
    }
    reservaExistente.cantidad = nuevaCantidad;
    reservaExistente.subtotal = nuevaCantidad * experiencia.precio;
  } else {
    reservas.push({
      experienciaId: experiencia.id,
      nombre: experiencia.nombre,
      precio: experiencia.precio,
      cantidad: cantidad,
      cupo: experiencia.cupo,
      subtotal: experiencia.precio * cantidad
    });
  }
  mostrarMensaje("Experiencia agregada a la reservación.");
  mostrarReservas();
}
function mostrarReservas() {
  if (reservas.length === 0) {
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
    total.textContent = "$0 MXN";
    totalPersonas.textContent = "0";
    return;
  }
  listaReservas.innerHTML = reservas.map(function(reserva) {
    return `
      <article class="item-reserva">
        <div>
          <strong>${reserva.nombre}</strong>
          <p>${reserva.cantidad} persona(s) × $${reserva.precio}</p>
          <p>Subtotal: $${reserva.subtotal} MXN</p>
        </div>
        <div class="acciones-reserva">
          <button class="btn-cantidad" data-id="${reserva.experienciaId}" data-cambio="-1" aria-label="Disminuir personas de ${reserva.nombre}">-</button>
          <span>${reserva.cantidad}</span>
          <button class="btn-cantidad" data-id="${reserva.experienciaId}" data-cambio="1" aria-label="Aumentar personas de ${reserva.nombre}">+</button>
          <button class="btn-eliminar" data-id="${reserva.experienciaId}">Eliminar</button>
        </div>
      </article>
    `;
  }).join("");
  const totalReserva = reservas.reduce(function(acumulado, reserva) {
    return acumulado + reserva.subtotal;
  }, 0);
  const cantidadPersonas = reservas.reduce(function(acumulado, reserva) {
    return acumulado + reserva.cantidad;
  }, 0);
  total.textContent = `$${totalReserva} MXN`;
  totalPersonas.textContent = cantidadPersonas;
  agregarEventosCantidad();
  agregarEventosEliminar();
}
function agregarEventosCantidad() {
  document.querySelectorAll(".btn-cantidad").forEach(function(boton) {
    boton.addEventListener("click", function() {
      cambiarCantidad(Number(boton.dataset.id), Number(boton.dataset.cambio));
    });
  });
}
function cambiarCantidad(id, cambio) {
  const reserva = reservas.find(function(elemento) {
    return elemento.experienciaId === id;
  });
  if (!reserva) {
    return;
  }
  const nuevaCantidad = reserva.cantidad + cambio;
  if (nuevaCantidad < 1) {
    mostrarMensaje("La cantidad mínima es una persona. Usa Eliminar para quitar la experiencia.");
    return;
  }
  if (nuevaCantidad > reserva.cupo) {
    mostrarMensaje("No hay suficiente cupo disponible.");
    return;
  }
  reserva.cantidad = nuevaCantidad;
  reserva.subtotal = nuevaCantidad * reserva.precio;
  mostrarMensaje("Cantidad actualizada.");
  mostrarReservas();
}
function agregarEventosEliminar() {
  document.querySelectorAll(".btn-eliminar").forEach(function(boton) {
    boton.addEventListener("click", function() {
      eliminarReserva(Number(boton.dataset.id));
    });
  });
}
function eliminarReserva(id) {
  reservas = reservas.filter(function(reserva) {
    return reserva.experienciaId !== id;
  });
  mostrarMensaje("Experiencia eliminada de la reservación.");
  mostrarReservas();
}
function vaciarReservacion() {
  if (reservas.length === 0) {
    mostrarMensaje("La reservación ya está vacía.");
    return;
  }
  const confirmar = confirm("¿Estás seguro de que deseas vaciar la reservación?");
  if (confirmar) {
    reservas = [];
    mostrarReservas();
    mostrarMensaje("La reservación se ha vaciado.");
  }
}
buscador.addEventListener("input", function() {
  textoBusqueda = buscador.value.trim().toLowerCase();
  actualizarCatalogo();
});
filtroCategoria.addEventListener("change", function() {
  categoriaActual = filtroCategoria.value;
  actualizarCatalogo();
});
entradaPrecio.addEventListener("input", function() {
  precioMaximo = entradaPrecio.value;
  actualizarCatalogo();
});
ordenPrecio.addEventListener("change", function() {
  ordenActual = ordenPrecio.value;
  actualizarCatalogo();
});
botonVaciar.addEventListener("click", vaciarReservacion);
cargarExperiencias();