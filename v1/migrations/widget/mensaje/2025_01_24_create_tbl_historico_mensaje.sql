-- ! ================================================================================================================================================
-- !                                                   SQL PARA CREAR TABLA HISTORICO MENSAJE
-- ! ================================================================================================================================================
-- @author Ramón Dario Rozo Torres (24 de Enero de 2025)
-- @lastModified Ramón Dario Rozo Torres (24 de Enero de 2025)
-- @version 1.0.0
-- v1/migrations/widget/mensaje/2025_01_24_create_tbl_historico_mensaje.sql

-- ! ELIMINAR TABLA SI EXISTE
DROP TABLE IF EXISTS `tbl_historico_mensaje`;

-- ! CREAR TABLA BAJO LAS SIGUIENTES ESPECIFICACIONES
CREATE TABLE `tbl_historico_mensaje` (
  `htmsg_id` int NOT NULL AUTO_INCREMENT,
  `htmsg_fk_id_mensaje` int NOT NULL,
  `htmsg_fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `htmsg_accion` varchar(45) NOT NULL DEFAULT '-',
  `htmsg_fk_id_chat` int NOT NULL,
  `htmsg_remitente` varchar(255) NOT NULL DEFAULT '-',
  `htmsg_estado` varchar(45) NOT NULL DEFAULT '-',
  `htmsg_tipo` varchar(45) NOT NULL DEFAULT '-',
  `htmsg_contenido` longtext NOT NULL,
  `htmsg_enlaces` varchar(1000) NOT NULL DEFAULT '-',
  `htmsg_lectura` varchar(45) NOT NULL DEFAULT '-',
  `htmsg_descripcion` varchar(255) NOT NULL DEFAULT '-',
  `htmsg_registro` varchar(45) NOT NULL DEFAULT '-',
  `htmsg_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `htmsg_responsable` varchar(45) NOT NULL DEFAULT '-',
  PRIMARY KEY (`htmsg_id`)
) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


