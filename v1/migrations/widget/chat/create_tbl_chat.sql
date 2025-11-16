-- ! ================================================================================================================================================
-- !                                                   SQL PARA CREAR TABLA CHAT 
-- ! ================================================================================================================================================
-- @author Ramón Dario Rozo Torres
-- @version 1.0.0
-- v1/migrations/widget/chat/create_tbl_chat.sql

-- ! ELIMINAR TABLA SI EXISTE
DROP TABLE IF EXISTS `tbl_chat`;

-- ! CREAR TABLA BAJO LAS SIGUIENTES ESPECIFICACIONES
CREATE TABLE `tbl_chat` (
  `cht_id` int NOT NULL AUTO_INCREMENT,
  `cht_fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cht_tipo` varchar(45) NOT NULL DEFAULT '-',
  `cht_remitente` varchar(255) NOT NULL DEFAULT '-',
  `cht_estado` varchar(45) NOT NULL DEFAULT '-',
  `cht_gestion` varchar(45) NOT NULL DEFAULT '-',
  `cht_arbol` varchar(255) NOT NULL DEFAULT '-',
  `cht_control_api` LONGTEXT,
  `cht_control_peticiones` varchar(45) NOT NULL DEFAULT 0,
  `cht_resultado_api` LONGTEXT,
  `cht_nombres_apellidos` varchar(45) NOT NULL DEFAULT '-',
  `cht_genero` varchar(45) NOT NULL DEFAULT '-',
  `cht_correo_electronico` varchar(45) NOT NULL DEFAULT '-',
  `cht_telefono` varchar(45) NOT NULL DEFAULT '-',
  `cht_localidad` varchar(250) NOT NULL DEFAULT '-',
  `cht_en_que_podemos_ayudarle` varchar(1000) NOT NULL DEFAULT '-',
  `cht_rango_edad` varchar(45) NOT NULL DEFAULT '-',
  `cht_autorizacion_tratamiento_datos` varchar(45) NOT NULL DEFAULT 'No',
  `cht_calificar_servicio` varchar(45) NOT NULL DEFAULT '-',
  `cht_calificar_amabilidad` varchar(45) NOT NULL DEFAULT '-',
  `cht_calificar_tiempo` varchar(45) NOT NULL DEFAULT '-',
  `cht_calificar_calidad` varchar(45) NOT NULL DEFAULT '-',
  `cht_calificar_conocimiento` varchar(45) NOT NULL DEFAULT '-',
  `cht_calificar_solucion` varchar(45) NOT NULL DEFAULT '-',
  `cht_comentario` varchar(1000) NOT NULL DEFAULT '-',
  `cht_descripcion` varchar(255) NOT NULL DEFAULT '-',
  `cht_registro` varchar(45) NOT NULL DEFAULT 'Activo',
  `cht_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cht_responsable` varchar(45) NOT NULL DEFAULT 'Widget Chat Web ETB - IDARTES',
  PRIMARY KEY (`cht_id`)
) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


