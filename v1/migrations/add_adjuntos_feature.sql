-- ! ================================================================================================================================================
-- !                                                   SQL PARA ACTULIZAR TABLA MENSAJE Y HISTORICO CHAT
-- ! =================================================================================================================================


ALTER TABLE tbl_mensaje
ADD COLUMN msg_body longtext NOT NULL
AFTER msg_contenido;

ALTER TABLE tbl_chat
ADD COLUMN  cht_adjuntos VARCHAR(45) NOT NULL DEFAULT 'No' AFTER cht_comentario,
ADD COLUMN  cht_ruta_adjuntos VARCHAR(1000) NOT NULL DEFAULT '-' AFTER cht_adjuntos;

ALTER TABLE tbl_historico_chat
ADD COLUMN  htcht_adjuntos VARCHAR(45) NOT NULL DEFAULT 'No' AFTER htcht_comentario,
ADD COLUMN  htcht_ruta_adjuntos VARCHAR(1000) NOT NULL DEFAULT '-' AFTER htcht_adjuntos;