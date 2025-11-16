-- ! ================================================================================================================================================
-- !                                          SQL PARA CREAR TRIGGERS DE LA TABLA MENSAJE
-- ! ================================================================================================================================================
-- @author Ramón Dario Rozo Torres
-- @version 1.0.0
-- v1/migrations/widget/mensaje/create_triggers_tbl_mensaje.sql

-- ! ELIMINAR TRIGGERS SI EXISTEN
DROP TRIGGER IF EXISTS after_tbl_mensaje_insert;
DROP TRIGGER IF EXISTS after_tbl_mensaje_update;
DROP TRIGGER IF EXISTS before_tbl_mensaje_delete;

-- ! TRIGGER PARA INSERTAR REGISTRO DESPUÉS DE INSERTAR
DELIMITER //

CREATE TRIGGER after_tbl_mensaje_insert
AFTER INSERT ON tbl_mensaje
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_mensaje (
        htmsg_fk_id_mensaje,
        htmsg_fecha,
        htmsg_accion,
        htmsg_fk_id_chat,
        htmsg_remitente,
        htmsg_estado,
        htmsg_tipo,
        htmsg_contenido,
        htmsg_enlaces,
        htmsg_lectura,
        htmsg_descripcion,
        htmsg_registro,
        htmsg_actualizacion,
        htmsg_responsable
    ) VALUES (
        NEW.msg_id,
        NEW.msg_fecha,
        'Crear',
        NEW.msg_fk_id_chat,
        NEW.msg_remitente,
        NEW.msg_estado,
        NEW.msg_tipo,
        NEW.msg_contenido,
        NEW.msg_enlaces,
        NEW.msg_lectura,
        NEW.msg_descripcion,
        NEW.msg_registro,
        NEW.msg_actualizacion,
        NEW.msg_responsable
    );
END //

-- ! TRIGGER PARA INSERTAR REGISTRO DESPUÉS DE ACTUALIZAR
CREATE TRIGGER after_tbl_mensaje_update
AFTER UPDATE ON tbl_mensaje
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_mensaje (
        htmsg_fk_id_mensaje,
        htmsg_fecha,
        htmsg_accion,
        htmsg_fk_id_chat,
        htmsg_remitente,
        htmsg_estado,
        htmsg_tipo,
        htmsg_contenido,
        htmsg_enlaces,
        htmsg_lectura,
        htmsg_descripcion,
        htmsg_registro,
        htmsg_actualizacion,
        htmsg_responsable
    ) VALUES (
        NEW.msg_id,
        NEW.msg_fecha,
        'Actualizar',
        NEW.msg_fk_id_chat,
        NEW.msg_remitente,
        NEW.msg_estado,
        NEW.msg_tipo,
        NEW.msg_contenido,
        NEW.msg_enlaces,
        NEW.msg_lectura,
        NEW.msg_descripcion,
        NEW.msg_registro,
        NEW.msg_actualizacion,
        NEW.msg_responsable
    );
END //

-- ! TRIGGER PARA INSERTAR REGISTRO ANTES DE ELIMINAR
CREATE TRIGGER before_tbl_mensaje_delete
BEFORE DELETE ON tbl_mensaje
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_mensaje (
        htmsg_fk_id_mensaje,
        htmsg_fecha,
        htmsg_accion,
        htmsg_fk_id_chat,
        htmsg_remitente,
        htmsg_estado,
        htmsg_tipo,
        htmsg_contenido,
        htmsg_enlaces,
        htmsg_lectura,
        htmsg_descripcion,
        htmsg_registro,
        htmsg_actualizacion,
        htmsg_responsable
    ) VALUES (
        OLD.msg_id,
        OLD.msg_fecha,
        'Eliminar',
        OLD.msg_fk_id_chat,
        OLD.msg_remitente,
        OLD.msg_estado,
        OLD.msg_tipo,
        OLD.msg_contenido,
        OLD.msg_enlaces,
        OLD.msg_lectura,
        OLD.msg_descripcion,
        OLD.msg_registro,
        OLD.msg_actualizacion,
        OLD.msg_responsable
    );
END //

DELIMITER ;


