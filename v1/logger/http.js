const pinoHttp = require('pino-http');
const logger = require('./index');
const { getOrigen, getDestino, getContextoRecurso } = require('./context');

module.exports = pinoHttp({
    logger,
    customSuccessMessage: function () {
        return 'Solicitud procesada';
    },
    customErrorMessage: function (req, res, err) {
        return err && err.message ? err.message : 'Error en solicitud';
    },
    customReceivedMessage: function () {
        return 'Solicitud recibida';
    },
    serializers: {
        req(req) {
            return {
                metodo: req.method,
                url: req.url,
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                headers: {
                    'user-agent': req.headers['user-agent'],
                    origin: req.headers.origin
                }
            };
        },
        res(res) {
            return {
                codigoRespuesta: res.statusCode
            };
        },
        err(err) {
            return {
                tipo: err.name,
                mensaje: err.message
            };
        }
    }
});


