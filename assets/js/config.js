// Pega aquí tu endpoint del Apps Script:
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwox-OZt6lZAyy9hKC_yYzwG8a1pqOutkk5azrtClUGrN0O5V65CbAUgnzOdRiahcKi3A/exec";

// Endpoint para cotización de eventos
const EVENTOS_ENDPOINT = "https://script.google.com/macros/s/AKfycby-xUvAYVhUP3ny5nFFSRGHAZDmQy3OBa3fSizcncM4XwPe6qDbQJ2Omvu6gjSrgGsW/exec";

// Número de WhatsApp para eventos (con código de país, sin +)
const EVENTOS_WA_PHONE = "3106514629";

// Modo por defecto
const DEFAULT_MODE = "menu"; // o "menu"

const APP_FLAGS = Object.freeze({
  currency: "es-CO",
  waMustacheTemplate: [
    "Hola, quiero hacer este pedido:",
    "{{items}}",
    "",
    "Total: ${{total}}",
    "",
    "Nombre:",
    "Dirección:",
    "Forma de pago:",
    "Notas:"
  ].join("\n"),
});
