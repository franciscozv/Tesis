<a name="readme-top"></a>

<div align="center">

## IEPWebApp

Este es el repositorio para la aplicación web desarrollada como parte del proyecto de tesis titulado: Sistema Web para la gestión de la congregación y eventos de la Iglesia Evangelica Pentecostal (IEP) Santa Juana.

</div>

<details>
<summary>Tabla de contenidos</summary>

- [Características principales](#características-principales)
- [Para empezar](#para-empezar)
  - [Prerequisitos](#prerequisitos)
  - [Instalación](#instalación)
- [🛠️ Stack](#️-stack)
- [Arquitectura](#arquitectura-del-sistema)

</details>

## Características principales

- **Gestión de personas**: Permite registrar, eliminar ,editar y mostrar datos de los miembros.
- **Gestión de grupos**: Crear grupos, asignar miembros a grupos, eliminar.
- **Gestión de eventos**: Crear nuevas solicitudes de eventos, planificación de evento, participantes, roles, responsabilidades, objetivos, parafernalia, obstaculos, logs.
- **Gestión de finanzas**: Registra ingresos, egresos.
- **Notificaciones**: El sistema tendra que enviar notificaciones a los usuarios del sistema
- **Reportes**: El sistema muestra graficas con datos de miembros, finanzas, etc

## Para empezar

### Prerequisitos

### Instalación

<p align="right">(<a href="#readme-top">volver arriba</a>)</p>

## 🛠️ Stack

- [![Next.js][nextjs-badge]][nextjs-url] - The React Framework for Production.
- [![Express.js][express-badge]][express-url] - Fast, unopinionated, minimalist web framework for Node.js.
- [![PostgreSQL][postgresql-badge]][postgresql-url] - The world's most advanced open source relational database.
- [![Typescript][typescript-badge]][typescript-url] - JavaScript with syntax for types.
- [![Tailwind CSS][tailwind-badge]][tailwind-url] - A utility-first CSS framework for rapidly building custom designs.
- [![@midudev/tailwind-animations][animations-badge]][animations-url] - Easy peasy animations for your Tailwind project.

<p align="right">(<a href="#readme-top">volver arriba</a>)</p>

## Arquitectura del sistema

El proyecto sigue una arquitectura cliente-servidor con separación clara entre:

- **Frontend**: Aplicación Next.JS que maneja toda la interfaz de usuario.
- **Backend**: API RESTful desarrollada con Node.js y Express que gestiona la lógica de negocio y el acceso a datos.
- **Base de datos**: PostgreSql para almacenamiento de datos.

<p align="right">(<a href="#readme-top">volver arriba</a>)</p>

[nextjs-badge]: https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[nextjs-url]: https://nextjs.org/
[express-badge]: https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white
[express-url]: https://expressjs.com/
[typescript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[tailwind-badge]: https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[tailwind-url]: https://tailwindcss.com/
[animations-badge]: https://img.shields.io/badge/@midudev%2Ftailwind--animations-FF00AA?style=for-the-badge
[animations-url]: https://www.npmjs.com/package/@midudev/tailwind-animations
[postgresql-badge]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[postgresql-url]: https://www.postgresql.org/
