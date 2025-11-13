// Pega aquí tu endpoint del Apps Script:
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwox-OZt6lZAyy9hKC_yYzwG8a1pqOutkk5azrtClUGrN0O5V65CbAUgnzOdRiahcKi3A/exec";

// Modo por defecto
const DEFAULT_MODE = "menu"; // o "order"

const APP_FLAGS = {
    currency: 'es-CO',
    waMustacheTemplate:
        "Hola, quiero hacer este pedido:\n{{items}}\n\nTotal: ${{total}}\n\nNombre:\nDirección:\nForma de pago:\nNotas:"
};