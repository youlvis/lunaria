// Pega aquí tu endpoint del Apps Script:
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwox-OZt6lZAyy9hKC_yYzwG8a1pqOutkk5azrtClUGrN0O5V65CbAUgnzOdRiahcKi3A/exec";

// Incrementa este número cuando cambies el menú y hagas redeploy
const MENU_VERSION = 1;

// Modo por defecto
const DEFAULT_MODE = "menu"; // o "order"

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
