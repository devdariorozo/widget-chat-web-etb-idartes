-- ! ================================================================================================================================================
-- !                                                   SQL PARA CREAR TABLA MENSAJE 
-- ! ================================================================================================================================================
-- @author Ramón Dario Rozo Torres (24 de Enero de 2025)
-- @lastModified Ramón Dario Rozo Torres (24 de Enero de 2025)
-- @version 1.0.0
-- v1/migrations/widget/mensaje/2025_01_24_create_tbl_mensaje.sql

-- ! ELIMINAR TABLA SI EXISTE
DROP TABLE IF EXISTS `tbl_mensaje`;

-- ! CREAR TABLA BAJO LAS SIGUIENTES ESPECIFICACIONES
CREATE TABLE `tbl_mensaje` (
  `msg_id` int NOT NULL AUTO_INCREMENT,
  `msg_fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `msg_fk_id_chat` int NOT NULL,
  `msg_remitente` varchar(255) NOT NULL DEFAULT '-',
  `msg_estado` varchar(45) NOT NULL DEFAULT '-',
  `msg_tipo` varchar(45) NOT NULL DEFAULT '-',
  `msg_contenido` longtext NOT NULL,
  `msg_enlaces` varchar(1000) NOT NULL DEFAULT '-',
  `msg_lectura` varchar(45) NOT NULL DEFAULT '-',
  `msg_descripcion` varchar(255) NOT NULL DEFAULT '-',
  `msg_registro` varchar(45) NOT NULL DEFAULT '-',
  `msg_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `msg_responsable` varchar(45) NOT NULL DEFAULT '-',
  PRIMARY KEY (`msg_id`)
) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


