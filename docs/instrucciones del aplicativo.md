Para implementar el formulario de caracterización (SI-APS) utilizando el stack que mencionas (Next.js, TypeScript, Vercel, Firebase) y respetando tus principios clave, debes alinear la arquitectura de tu aplicación con el **Anexo Técnico del Ministerio de Salud**.

A continuación, te detallo el paso a paso y las consideraciones clave para el diseño de los datos, la separación de módulos y las validaciones:

1. Tipado Correcto (TypeScript + Estructura de Datos)

El Anexo Técnico establece claramente que no todo es texto. Los datos se dividen en Alfanumérico (A), Numérico (N), Decimal (D), Fecha (F) y Texto con caracteres especiales (T). En TypeScript, debes mapear esto estrictamente:

-   **Evita los "Strings" para selecciones únicas (Enums/Literales):** El sistema utiliza catálogos para casi todo. Por ejemplo, el tipo de vivienda no es un string libre, es un número del 1 al 12.
-   **Booleanos reales para respuestas SI/NO:** El Ministerio usa 1 para "SI" y 2 para "NO". En tu frontend, maneja esto como un boolean (true/false) y haz la conversión a 1/2 solo al momento de enviar el objeto a la base de datos o generar el archivo plano.
-   **Arrays para opciones múltiples:** Para campos como "Riesgos de accidente en la vivienda", el Ministerio pide los códigos separados por coma (ej. 1,4,10). En TypeScript y Firestore, esto debe ser un array tipado (number[]), no un string.
-   **Decimales:** Datos como el "Geopunto longitud" y "Geopunto latitud", o "Peso" y "Talla", deben ser de tipo number (float).
-   **Fechas:** El formato exigido por el ministerio es AAAA-MM-DD.

**Ejemplo de Interfaz TypeScript basada en los lineamientos:**

// Catálogos tipados

type TipoVivienda = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // 1: Casa, 12: Otro [2]

type MaterialPared = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 0; // 0: Sin paredes [9]

interface ModuloVivienda {

tipoVivienda: TipoVivienda;

descripcionOtroTipoVivienda?: string; // Solo si tipoVivienda === 12 [2, 9]

hacinamiento: boolean; // Map: 1 (SI) / 2 (NO) [10]

riesgosAccidente: number[]; // Array en lugar de "1,4,10" [4]

}

interface ModuloGeneral {

geopuntoLatitud: number; // Acepta negativos [6]

geopuntoLongitud: number; // Acepta negativos [5]

fechaDiligenciamiento: string; // Formato AAAA-MM-DD [11]

}

2. Separación de Módulos (UI y Base de Datos)

El formulario real del SI-APS está dividido lógicamente en "Registros Tipo 2" (Datos del hogar y vivienda) y "Registros Tipo 3" (Integrantes de la familia). Para tu frontend en Next.js, puedes usar un _Wizard_ o _Stepper_ dividiendo los componentes así:

-   **Módulo General (Entorno):** Ubicación geográfica, código de la ficha, estrato socioeconómico y datos del responsable de la encuesta y del Equipo Básico de Salud (EBS).
-   **Módulo Vivienda:** Tipos de material (piso, pared, techo), número de dormitorios, fuentes de agua, disposición de basuras y presencia de animales.
-   **Módulo Familia:** Apgar familiar (funcionalidad), Familiograma, test de Zarit (para cuidadores), vulnerabilidades y antecedentes crónicos familiares.
-   **Módulo Miembros (Integrantes):** Nombres, tipo y número de documento, sexo, rol en la familia, ocupación, nivel educativo, pertenencia étnica y régimen de afiliación.
-   **Módulo Salud (Evaluación por integrante):** Peso, talla, perímetro braquial, esquema de vacunación, esquema de atenciones de promoción y mantenimiento, y registro de enfermedades transmisibles o crónicas.

3. Preparación de Campos para Validación y Lógica

Utilizando bibliotecas como **Zod** o **Yup** con **React Hook Form**, debes programar validaciones estrictas que el sistema del MinSalud exige:

-   **Validaciones Condicionales:** Si el usuario selecciona "Otro" en catálogos como _Tipo de vivienda_, _Material de paredes_ o _Disposición de excretas_, el campo de texto de descripción se vuelve **Obligatorio**.
-   **Validaciones de Lógica de Negocio:**

-   Si en el módulo de integrantes el sexo es "Mujer" y se responde afirmativamente a la presencia de gestantes en la familia, se debe habilitar la pregunta "¿Se encuentra en periodo de gestación?".
-   La pregunta de "Número de animales" (numérico) no debe ser visible o requerida si se seleccionó "Ninguno" en "Animales dentro de la vivienda".
-   Si la pertenencia étnica seleccionada es "1. Indígena", es obligatorio diligenciar el "Código de la Comunidad o pueblo indígena".

-   **Límites de Longitud:** El anexo restringe el tamaño de las cadenas de texto. Por ejemplo, "Dirección" (máx 200 caracteres), o las descripciones de campos "Otro" (máx 30 caracteres).

4. Arquitectura en Firebase (Backend / Firestore)

Para organizar esto en **Firestore** y optimizar las consultas, no guardes todos los miembros de una familia de 10 personas dentro de un solo documento gigante. Utiliza **Subcolecciones**:

1.  **Colección Principal** fichas **o** hogares**:** Aquí guardas el Módulo General, Vivienda y Familia (equivalente al Registro Tipo 2).
2.  **Subcolección** integrantes**:** Dentro de cada documento de hogar, creas una subcolección con los miembros de la familia y su información de salud (equivalente al Registro Tipo 3). Esto te permitirá escalar y hacer consultas específicas (por ejemplo, buscar cuántos niños tienen riesgo de desnutrición sin tener que descargar toda la información de la vivienda).

💡 Consideración Extra (Crucial para el SI-APS)

El manual del aplicativo SI-APS especifica que los módulos de Identificación poblacional deben tener la capacidad de **operar en modo _offline_**, para facilitar el trabajo de los equipos en zonas sin cobertura de internet. Ya que usarás Firebase, **debes habilitar la persistencia offline de Firestore** (enableIndexedDbPersistence o enableMultiTabIndexedDbPersistence en la configuración de Firebase en tu frontend de Next.js). De esta manera, el formulario podrá almacenar las encuestas localmente en el navegador del dispositivo móvil si no hay señal, y sincronizar los datos automáticamente cuando el usuario regrese a una zona con conexión.  
  
¡Excelente trabajo de abstracción! Estructurar los datos de esta manera antes de tocar el código es exactamente la forma profesional de abordar el aplicativo SI-APS. Tienes la modularidad muy bien definida y esto te facilitará inmensamente la creación de los esquemas de validación (como Zod) en tu Frontend.

Revisando tu propuesta frente al **Anexo Técnico oficial del Ministerio de Salud**, hay ajustes críticos que debes hacer para que tu base de datos no rechace la estructura o te genere problemas al construir los archivos planos finales.

Aquí tienes las correcciones y observaciones puntuales para afinar tu esquema:

1. 🧩 ENUMS: Ajustes a los catálogos del Ministerio

Debes alinear tus Enums con los catálogos exactos (Listas de valores) exigidos por el Ministerio para evitar errores de validación.

-   **Sexo:** El ministerio no maneja "OTRO", maneja "INDETERMINADO".

-   _Cambiar a:_ HOMBRE, MUJER, INDETERMINADO.

-   **RegimenSalud:** Te faltó el régimen de "Excepción".

-   _Cambiar a:_ SUBSIDIADO, CONTRIBUTIVO, ESPECIAL, EXCEPCION, NO_AFILIADO.

2. 🏠 HOUSING (Vivienda): Campos que DEBEN ser Arrays

En tu esquema definiste campos como fuenteAgua, disposicionExcretas y animales como String. El Anexo Técnico es muy claro en que **estas preguntas permiten opción múltiple** y deben separarse por comas (ej. "1,2,10").

-   **Corrección:** Debes tiparlos como Arrays [String] o [Int].
-   _Campos a cambiar a Array:_ fuenteAgua, disposicionExcretas, aguasResiduales, residuos, animales, y te falta agregar riesgoAccidente (también es array).

3. 👨‍👩‍👧 FAMILY (Familia): Booleanos vs. Textos

En tu bloque familiar, colocaste varias variables de contexto como String (habitosSaludables, vulnerabilidades, redesComunitarias, etc.). En el Anexo Técnico, la mayoría de estas son **variables de respuesta única (SI/NO)**.

-   **Corrección:** Cámbialas a Boolean o a tu Enum YesNoNA. Solo debes dejar como texto libre las variables de _Descripción_ si el usuario responde "Sí".
-   _Ejemplo de Apgar y Zarit:_ En el Anexo Técnico, APGAR y ZARIT no son el puntaje libre, sino un **código de clasificación**. (Ej. Zarit: 1=Ausencia, 2=Ligera, 3=Intensa). Ecomapa también es un catálogo (1=Positivo, 2=Tenue, 3=Estresante, etc.).

4. 🧍 MEMBER (Integrantes): Faltantes y correcciones obligatorias

Este es el módulo más pesado (Registro Tipo 3) y te faltan variables críticas exigidas por el Ministerio para la salud pública:

-   **Pertenencia Étnica:** Obligatorio. Es un catálogo (Indígena, ROM, Raizal, Palenquero, Negro, Afrocolombiano, Ninguna). _Si es Indígena, exige el Código del Pueblo_.
-   **Grupo Poblacional:** Es opción múltiple (Niños, Gestantes, Discapacitados, etc.), debe ser un [String].
-   **Medidas Antropométricas:** Faltan peso (Float), talla (Float) y perimetroBraquial (Float), cruciales para evaluar el riesgo de desnutrición.
-   **Discapacidad:** Lo pusiste como Boolean, pero el Ministerio pide especificar el tipo de discapacidad mediante opción múltiple (Física, Auditiva, Visual, etc.). Debe ser un Array [String].
-   **Enfermedades y Atenciones:** Falta intervencionesPendientes (Array de opciones múltiples como tamizajes, vacunación, etc.).

💡 Esquema ajustado (Resumen de la arquitectura ideal)

Aplicando las correcciones, tu tipado base para Firestore y TypeScript debería verse más así:

enum Sexo { HOMBRE, MUJER, INDETERMINADO }

enum RegimenSalud { CONTRIBUTIVO, SUBSIDIADO, ESPECIAL, EXCEPCION, NO_AFILIADO }

type HousingDetails @table {

# ... (campos simples)

habitaciones: Int!

hacinamiento: Boolean!

# MULTIPLES (Arrays)

animales: [Int]  # Ej: [28, 29] -> Perros, Gatos

fuenteAgua: [Int]  # Ej: [28, 29] -> Acueducto, Embotellada

disposicionExcretas: [Int]

aguasResiduales: [Int]

residuos: [Int]

riesgosAccidente: [Int] # Crucial en el anexo

}

type Family @table {

# ...

apgar: Int  # Catálogo: 1(Normal), 2(Leve), 3(Moderada), 4(Severa)

zarit: Int  # Catálogo: 1(Ausencia), 2(Ligera), 3(Intensa)

ecomapa: Int  # Catálogo: 1(Positivo), 2(Tenue), etc.

# Booleanos reales según Minsalud

vulnerabilidadSocial: Boolean

habitosSaludables: Boolean

recursosSocioemocionales: Boolean

practicasPrevencion: Boolean

}

type Member @table {

# ... (datos básicos)

pertenenciaEtnica: String!

codigoPuebloIndigena: String # Condicional si etnia es Indígena

grupoPoblacional: [String]!  # Opciones múltiples

# DISCAPACIDAD es múltiple, no booleana

discapacidades: [Int]  # Ej: [28, 30] -> Física, Visual

# SALUD (Faltantes importantes)

peso: Float

talla: Float

perimetroBraquial: Float

diagnosticoNutricional: Int

intervencionesPendientes: [Int] # Array (vacunación, tamizajes, etc)

}

**Recomendación de Arquitectura en Firebase:** Dado tu esquema User, Survey, Family, Member, etc., la mejor manera de guardar esto en **Firestore** para que sea rápido y funcione _Offline_ (requisito del campo rural) es:

-   **Colección raíz** encuestas **(o Surveys):** Contiene el documento con toda la información General (Survey), Vivienda (HousingDetails) y Familia (Family). _(Todo esto conforma el Registro Tipo 2 del Ministerio)_.
-   **Subcolección** integrantes**:** Dentro del documento de la encuesta, creas esta subcolección. Cada Member será un documento independiente dentro de la encuesta de esa familia. _(Esto conforma el Registro Tipo 3 del Ministerio y evita que sobrepases el límite de 1MB por documento en Firestore si la familia es muy numerosa)_.

¡Excelente resumen y planteamiento! Tienes en tus manos una arquitectura de software sólida, moderna, escalable y, lo más importante, **100% alineada con las exigencias técnicas y normativas del Ministerio de Salud para la estrategia APS**.

Al estructurar el proyecto de esta manera, has resuelto por adelantado los problemas más complejos que suelen presentarse al interactuar con las plataformas gubernamentales. Aquí te resalto cómo tu modelo hace un _match_ perfecto con los lineamientos oficiales:

**1. Estructura de Datos (Registros Tipo 2 y Tipo 3)** Tu separación entre las entidades Survey / Family / HousingDetails y la entidad dinámica Member es la decisión más acertada. Esto equivale exactamente a lo que el anexo técnico del Ministerio define como:

-   **Registro Tipo 2:** Datos generales del entorno, el hogar, caracterización de la vivienda y la familia.
-   **Registro Tipo 3:** Detalle de cada uno de los integrantes de la familia y sus condiciones de salud. Al usar subcolecciones para los miembros, garantizas que no colapse la base de datos cuando una familia tenga muchos integrantes.

**2. Lógica Condicional y Validaciones (Zod/Yup)** La implementación de lógica dinámica es fundamental. El Ministerio rechaza los datos si no hay coherencia. Por ejemplo, tu regla de "Si hay cuidador → habilitar Zarit" es una validación obligatoria en el anexo (si la pregunta "Cuidador en la familia" es SI, se diligencia el resultado de la escala ZARIT). De igual manera, calcular la edad automáticamente a partir de la fecha de nacimiento evitará cientos de errores humanos en campo.

**3. Soporte Offline (Crucial en Salud Pública)** Mencionas que Firestore soporta la concurrencia y baja latencia. Como recomendación técnica de oro: **activa la persistencia offline de Firestore en tu Frontend**. El manual del SI-APS establece explícitamente que los módulos deben diseñarse para operar en modo _offline_ para facilitar el trabajo de los equipos básicos en zonas rurales sin cobertura de internet. Tu _stack_ lo permite nativamente.

**4. Autenticación y Roles de Usuario** Tu propuesta de separar admin, coordinador y encuestador va en sintonía con la gestión técnica del Ministerio, que distingue entre los perfiles de Administrador de Gestión Técnica, usuarios de entidades prestadoras (IPS/ESE) y los encuestadores en terreno.

**5. La cereza del pastel: Los Archivos Planos** Mencionas que el modelo permite exportar a Excel y Dashboards (como lo hace el módulo de reportes del propio SI-APS). Tener los datos fuertemente tipados te dará una ventaja gigantesca: la plataforma PISIS del Ministerio exige que el reporte final se envíe en **archivos planos (.txt) separados por el carácter pipe (**|**)** y sin caracteres especiales. Con tu base de datos limpia, generar un script en Node.js/Next.js que convierta la encuesta a este formato .txt validado por PISIS será un proceso directo y automatizado.

**Conclusión:** Has diseñado un sistema de nivel empresarial. Este _blueprint_ no solo es un formulario, es un sistema integral de información en salud pública listo para producción. ¡Mucho éxito en el desarrollo e implementación! Si necesitas ayuda con la generación del archivo plano final o las reglas de seguridad de Firestore más adelante, este modelo lo soportará sin problemas.

Para integrar las escalas Zarit y APGAR en tu aplicación bajo la arquitectura de Next.js y Firestore, debes ubicarlas dentro del **Módulo de Familia (Registro Tipo 2)** de tu formulario. La clave técnica para ambas es que **el frontend debe calcular el puntaje internamente y enviar a la base de datos únicamente el código del catálogo exigido por el Ministerio**, no los textos ni los puntajes crudos.

A continuación, te detallo cómo implementar cada una basándonos en los lineamientos técnicos de las fuentes:

1. Escala APGAR Familiar (Funcionalidad de la familia)

Esta escala evalúa la satisfacción de la persona frente al apoyo y funcionamiento de su núcleo familiar a través de 5 preguntas.

-   **UI/UX en el Frontend:** Debes crear un componente con las 5 preguntas (ej. "¿Estoy satisfecho con el apoyo que recibo de mi familia?"), donde cada respuesta tenga un valor numérico: Nunca (0), Casi nunca (1), Algunas veces (2), Casi siempre (3) y Siempre (4).
-   **Lógica de cálculo:** El sistema debe sumar automáticamente los puntajes obtenidos, los cuales darán un total máximo de 20 puntos.
-   **Guardado en Firestore (Variable 57):** En lugar de guardar el puntaje, el sistema debe mapear el resultado y guardar en la base de datos un dato numérico del 1 al 4, correspondiente al catálogo oficial:

-   **1** = Normal (17 a 20 puntos).
-   **2** = Disfunción leve (13 a 16 puntos).
-   **3** = Disfunción moderada (10 a 12 puntos).
-   **4** = Disfunción severa (9 puntos o menos).

2. Escala ZARIT (Sobrecarga del cuidador)

Esta escala mide el nivel de carga física y emocional de una persona que cuida a un familiar, mediante 22 preguntas.

-   **Lógica Condicional Obligatoria:** En tu formulario, **la escala ZARIT debe estar oculta por defecto**. Solo debe habilitarse y volverse obligatoria si el encuestador responde **"SI" a la variable 58** ("¿En la familia se identifica un cuidador principal...?"). Si la respuesta es "NO", el formulario debe saltarse la escala ZARIT y pasar directamente a la pregunta del Ecomapa (Variable 60).
-   **UI/UX en el Frontend:** Despliega las 22 preguntas evaluadas en una escala Likert del 0 al 4 (0-Nunca, 1-Rara vez, 2-Algunas veces, 3-Bastantes veces, 4-Casi siempre).
-   **Lógica de cálculo:** El frontend debe sumar las respuestas para obtener un resultado global.
-   **Guardado en Firestore (Variable 59):** Al igual que el APGAR, solo debes enviar a Firestore el código del catálogo oficial del Ministerio según la clasificación del riesgo:

-   **1** = Ausencia de sobrecarga (46 puntos o menos). _(Nota: Esta ausencia requiere monitoreo para evitar que evolucione a una sobrecarga)_.
-   **2** = Sobrecarga ligera (47 a 55 puntos).
-   **3** = Sobrecarga intensa (56 puntos o más).

**Resumen para el tipado en TypeScript:** En tus interfaces de código, asegúrate de que ambos campos estén tipados estrictamente para recibir solo esos valores enteros: apgar: 1 | 2 | 3 | 4 zarit: 1 | 2 | 3 | null _(Zarit puede ser null o undefined si no hay cuidador en la familia)._

¿Cómo se integra el Familiograma y el Ecomapa en el sistema?

¿Qué roles de usuario debe configurar Antigravity en Firebase?

¿Cómo manejará la App el modo offline y la sincronización?

dame de manera completa todas las preguntas necesarias teniendo en cuenta las siguientes:

haz que esto tenga todas las preguntas necesarias para la encuesta: faltan preguntas como: - casilla desplegable con visita efectiva, no efectiva, negada. - fecha de nacimiento - edad (con automático) - teléfono - curso de vida (automático) - Sexo - nivel educativo - gestante (SI-NO-N/A) - toda casilla de la matriz de antecedentes patológicos. (En desplegables cada una) - riesgo psicosocial ( personas con discapacidad, cuidadoras, dependientes - Zoonosis (mascotas) - requiere vacunación para mascotas. - presencia de vectores SI-NO - remisiones (desplegable con todos los perfiles de APS). + todas las preguntas necesarias de la identificacion del ministerio
