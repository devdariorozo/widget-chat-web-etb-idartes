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
  `cht_arbol` varchar(45) NOT NULL DEFAULT '-',
  `cht_control_api` LONGTEXT,
  `cht_control_peticiones` varchar(45) NOT NULL DEFAULT 0,
  `cht_resultado_api` LONGTEXT,
  `cht_nombres` varchar(45) NOT NULL DEFAULT '-',
  `cht_apellidos` varchar(45) NOT NULL DEFAULT '-',
  `cht_numero_cedula` varchar(45) NOT NULL DEFAULT '-',
  `cht_pais_residencia` varchar(250) NOT NULL DEFAULT '-',
  `cht_ciudad_residencia` varchar(250) NOT NULL DEFAULT '-',
  `cht_indicativo_pais` varchar(45) NOT NULL DEFAULT '-',
  `cht_numero_celular` varchar(45) NOT NULL DEFAULT '-',
  `cht_correo_electronico` varchar(45) NOT NULL DEFAULT '-',
  `cht_autorizacion_datos_personales` varchar(45) NOT NULL DEFAULT 'No',
  `cht_adjuntos` varchar(45) NOT NULL DEFAULT 'No',
  `cht_ruta_adjuntos` varchar(1000) NOT NULL DEFAULT '-',
  `cht_descripcion` varchar(255) NOT NULL DEFAULT '-',
  `cht_registro` varchar(45) NOT NULL DEFAULT 'Activo',
  `cht_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cht_responsable` varchar(45) NOT NULL DEFAULT 'Chat Web Thomas Greg y Sons',
  PRIMARY KEY (`cht_id`)
) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


