-- ! ================================================================================================================================================
-- !                                          SQL PARA CREAR TRIGGERS DE LA TABLA CHAT
-- ! ================================================================================================================================================
-- @author Ramón Dario Rozo Torres
-- @version 1.0.0
-- v1/migrations/widget/chat/create_triggers_tbl_chat.sql

-- ! ELIMINAR TRIGGERS SI EXISTEN
DROP TRIGGER IF EXISTS after_tbl_chat_insert;
DROP TRIGGER IF EXISTS after_tbl_chat_update;
DROP TRIGGER IF EXISTS before_tbl_chat_delete;

-- ! TRIGGER PARA INSERTAR REGISTRO DESPUÉS DE INSERTAR
DELIMITER //

CREATE TRIGGER after_tbl_chat_insert
AFTER INSERT ON tbl_chat
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_chat (
        htcht_fk_id_chat,
        htcht_fecha,
        htcht_accion,
        htcht_tipo,
        htcht_remitente,
        htcht_estado,
        htcht_gestion,
        htcht_arbol,
        htcht_control_api,
        htcht_control_peticiones,
        htcht_resultado_api,
        htcht_nombres_apellidos,
        htcht_genero,
        htcht_correo_electronico,
        htcht_telefono,
        htcht_localidad,
        htcht_en_que_podemos_ayudarle,
        htcht_rango_edad,
        htcht_autorizacion_tratamiento_datos,
        htcht_descripcion,
        htcht_registro,
        htcht_actualizacion,
        htcht_responsable
    ) VALUES (
        NEW.cht_id,
        NEW.cht_fecha,
        'Crear',
        NEW.cht_tipo,
        NEW.cht_remitente,
        NEW.cht_estado,
        NEW.cht_gestion,
        NEW.cht_arbol,
        NEW.cht_control_api,
        NEW.cht_control_peticiones,
        NEW.cht_resultado_api,
        NEW.cht_nombres_apellidos,
        NEW.cht_genero,
        NEW.cht_correo_electronico,
        NEW.cht_telefono,
        NEW.cht_localidad,
        NEW.cht_en_que_podemos_ayudarle,
        NEW.cht_rango_edad,
        NEW.cht_autorizacion_tratamiento_datos,
        NEW.cht_descripcion,
        NEW.cht_registro,
        NEW.cht_actualizacion,
        NEW.cht_responsable
    );
END //

-- ! TRIGGER PARA INSERTAR REGISTRO DESPUÉS DE ACTUALIZAR
CREATE TRIGGER after_tbl_chat_update
AFTER UPDATE ON tbl_chat
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_chat (
        htcht_fk_id_chat,
        htcht_fecha,
        htcht_accion,
        htcht_tipo,
        htcht_remitente,
        htcht_estado,
        htcht_gestion,
        htcht_arbol,
        htcht_control_api,
        htcht_control_peticiones,
        htcht_resultado_api,
        htcht_nombres_apellidos,
        htcht_genero,
        htcht_correo_electronico,
        htcht_telefono,
        htcht_localidad,
        htcht_en_que_podemos_ayudarle,
        htcht_rango_edad,
        htcht_autorizacion_tratamiento_datos,
        htcht_descripcion,
        htcht_registro,
        htcht_actualizacion,
        htcht_responsable
    ) VALUES (
        NEW.cht_id,
        NEW.cht_fecha,
        'Actualizar',
        NEW.cht_tipo,
        NEW.cht_remitente,
        NEW.cht_estado,
        NEW.cht_gestion,
        NEW.cht_arbol,
        NEW.cht_control_api,
        NEW.cht_control_peticiones,
        NEW.cht_resultado_api,
        NEW.cht_nombres_apellidos,
        NEW.cht_genero,
        NEW.cht_correo_electronico,
        NEW.cht_telefono,
        NEW.cht_localidad,
        NEW.cht_en_que_podemos_ayudarle,
        NEW.cht_rango_edad,
        NEW.cht_autorizacion_tratamiento_datos,
        NEW.cht_descripcion,
        NEW.cht_registro,
        NEW.cht_actualizacion,
        NEW.cht_responsable
    );
END //

-- ! TRIGGER PARA INSERTAR REGISTRO ANTES DE ELIMINAR
CREATE TRIGGER before_tbl_chat_delete
BEFORE DELETE ON tbl_chat
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_chat (
        htcht_fk_id_chat,
        htcht_fecha,
        htcht_accion,
        htcht_tipo,
        htcht_remitente,
        htcht_estado,
        htcht_gestion,
        htcht_arbol,
        htcht_control_api,
        htcht_control_peticiones,
        htcht_resultado_api,
        htcht_nombres_apellidos,
        htcht_genero,
        htcht_correo_electronico,
        htcht_telefono,
        htcht_localidad,
        htcht_en_que_podemos_ayudarle,
        htcht_rango_edad,
        htcht_autorizacion_tratamiento_datos,
        htcht_descripcion,
        htcht_registro,
        htcht_actualizacion,
        htcht_responsable
    ) VALUES (
        OLD.cht_id,
        OLD.cht_fecha,
        'Eliminar',
        OLD.cht_tipo,
        OLD.cht_remitente,
        OLD.cht_estado,
        OLD.cht_gestion,
        OLD.cht_arbol,
        OLD.cht_control_api,
        OLD.cht_control_peticiones,
        OLD.cht_resultado_api,
        OLD.cht_nombres_apellidos,
        OLD.cht_genero,
        OLD.cht_correo_electronico,
        OLD.cht_telefono,
        OLD.cht_localidad,
        OLD.cht_en_que_podemos_ayudarle,
        OLD.cht_rango_edad,
        OLD.cht_autorizacion_tratamiento_datos,
        OLD.cht_descripcion,
        OLD.cht_registro,
        OLD.cht_actualizacion,
        OLD.cht_responsable
    );
END //

DELIMITER ;


