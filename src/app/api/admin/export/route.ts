import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const fichas = await prisma.fichaHogar.findMany({
      where: { estadoVisita: '1' },
      include: { integrantes: true },
      orderBy: { consecutivo: 'asc' },
    })

    const lines: string[] = []

    // Header Registro Tipo 2 (Ficha Hogar)
    lines.push([
      'CONSECUTIVO', 'ESTADO_VISITA', 'DEPARTAMENTO', 'MUNICIPIO', 'TERRITORIO', 'MICROTERRITORIO',
      'CENTRO_POBLADO', 'DIRECCION', 'LATITUD', 'LONGITUD', 'FECHA_DILIGENCIAMIENTO',
      'NUM_EBS', 'PRESTADOR', 'TIPO_DOC_ENCUESTADOR', 'NUM_DOC_ENCUESTADOR', 'PERFIL_ENCUESTADOR',
      'TIPO_VIVIENDA', 'MAT_PAREDES', 'MAT_PISOS', 'MAT_TECHOS', 'NUM_HOGARES', 'NUM_DORMITORIOS',
      'ESTRATO', 'HACINAMIENTO', 'FUENTE_AGUA', 'DISP_EXCRETAS', 'AGUAS_RESIDUALES',
      'DISP_RESIDUOS', 'RIESGO_ACCIDENTE', 'FUENTE_ENERGIA', 'PRESENCIA_VECTORES',
      'ANIMALES', 'CANT_ANIMALES', 'VAC_MASCOTAS',
      'TIPO_FAMILIA', 'NUM_INTEGRANTES', 'APGAR', 'ECOMAPA', 'CUIDADOR_PRINCIPAL', 'ZARIT',
      'VULNERABILIDADES', 'FECHA_CREACION',
      // Integrante 
      'INT_PRIMER_NOMBRE', 'INT_SEGUNDO_NOMBRE', 'INT_PRIMER_APELLIDO', 'INT_SEGUNDO_APELLIDO',
      'INT_TIPO_DOC', 'INT_NUM_DOC', 'INT_FECHA_NAC', 'INT_PARENTESCO', 'INT_SEXO', 'INT_GESTANTE',
      'INT_TELEFONO', 'INT_NIV_EDUCATIVO', 'INT_OCUPACION', 'INT_REGIMEN', 'INT_EAPB',
      'INT_ETNIA', 'INT_PUEBLO', 'INT_GRUPO_POB', 'INT_DISCAPACIDADES',
      'INT_ANTECEDENTES', 'INT_TRANSMISIBLES',
      'INT_PESO', 'INT_TALLA', 'INT_PERIM_BRAQUIAL', 'INT_DIAG_NUTRICIONAL',
      'INT_PRACTICA_DEP', 'INT_LACTANCIA', 'INT_LACTANCIA_MESES', 'INT_ESQUEMA_ATENCIONES',
      'INT_INTERVENCIONES', 'INT_ENFERMEDAD_AGUDA', 'INT_ATENCION_MEDICA', 'INT_REMISIONES',
    ].join(';'))

    for (const rawF of fichas) {
      const f: any = rawF
      const baseRow = [
        f.consecutivo,
        f.estadoVisita,
        f.departamento,
        f.municipio,
        f.territorio,
        f.microterritorio,
        f.centroPoblado || '',
        `"${f.direccion}"`,
        f.latitud || '',
        f.longitud || '',
        f.fechaDiligenciamiento.toISOString().split('T')[0],
        f.numEBS || '',
        f.prestadorPrimario || '',
        f.tipoDocEncuestador || '',
        f.numDocEncuestador || '',
        f.perfilEncuestador || '',
        f.tipoVivienda || '',
        f.matParedes || '',
        f.matPisos || '',
        f.matTechos || '',
        f.numHogares || '',
        f.numDormitorios || '',
        f.estratoSocial || '',
        f.hacinamiento ? 'SI' : 'NO',
        f.fuenteAgua.join(','),
        f.dispExcretas.join(','),
        f.aguasResiduales.join(','),
        f.dispResiduos.join(','),
        f.riesgoAccidente.join(','),
        f.fuenteEnergia || '',
        f.presenciaVectores ? 'SI' : 'NO',
        f.animales.join(','),
        f.cantAnimales || '',
        f.vacunacionMascotas ? 'SI' : 'NO',
        f.tipoFamilia || '',
        f.numIntegrantes || '',
        f.apgar || '',
        f.ecomapa || '',
        f.cuidadorPrincipal ? 'SI' : 'NO',
        f.zarit || '',
        f.vulnerabilidades.join(','),
        f.createdAt.toISOString().split('T')[0],
      ]

      if (f.integrantes.length === 0) {
        lines.push([...baseRow, ...Array(33).fill('')].join(';'))
      } else {
        for (const rawInt of f.integrantes) {
          const int: any = rawInt
          const antec = int.antecedentes as Record<string, boolean> | null || {}
          const trans = int.antecTransmisibles as Record<string, boolean> | null || {}

          const intRow = [
            int.primerNombre,
            int.segundoNombre || '',
            int.primerApellido,
            int.segundoApellido || '',
            int.tipoDoc,
            int.numDoc,
            int.fechaNacimiento,
            int.parentesco,
            int.sexo,
            int.gestante || '',
            int.telefono || '',
            int.nivelEducativo || '',
            int.ocupacion || '',
            int.regimen || '',
            int.eapb || '',
            int.etnia || '',
            int.puebloIndigena || '',
            int.grupoPoblacional.join(','),
            int.discapacidades.join(','),
            Object.entries(antec).filter(([,v]) => v).map(([k]) => k).join(','),
            Object.entries(trans).filter(([,v]) => v).map(([k]) => k).join(','),
            int.peso || '',
            int.talla || '',
            int.perimetroBraquial || '',
            int.diagNutricional || '',
            int.practicaDeportiva ? 'SI' : 'NO',
            int.lactanciaMaterna ? 'SI' : 'NO',
            int.lactanciaMeses || '',
            int.esquemaAtenciones ? 'SI' : 'NO',
            int.intervencionesPendientes.join(','),
            int.enfermedadAguda ? 'SI' : 'NO',
            int.recibeAtencionMedica ? 'SI' : 'NO',
            int.remisiones.join(','),
          ]
          lines.push([...baseRow, ...intRow].join(';'))
        }
      }
    }

    const csv = lines.join('\n')
    const filename = `siaps_${new Date().toISOString().split('T')[0]}.csv`

    // Se debe concatenar el BOM UTF-8 directo en el body text, las cabeceras REST HTTP no toleran Caracteres de 2+ Bytes (causando error btoa/ByteString)
    return new Response('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
