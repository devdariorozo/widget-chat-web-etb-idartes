function getOrigen(req) {
    if (!req) return 'desconocido';
    if (req.headers && req.headers['x-forwarded-for']) {
        return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    return req.ip || 'desconocido';
}

function getDestino(req) {
    if (!req) return 'desconocido';
    const host = req.hostname || (req.headers && req.headers.host) || 'localhost';
    return `${host}${req.originalUrl || req.url || ''}`;
}

function getContextoRecurso(req) {
    if (!req) return {};
    return {
        metodo: req.method,
        ruta: req.route && req.route.path ? req.route.path : (req.originalUrl || req.url)
    };
}

module.exports = { getOrigen, getDestino, getContextoRecurso };


