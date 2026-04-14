import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  TIPO_VIVIENDA, MATERIAL_PAREDES, MATERIAL_PISOS, MATERIAL_TECHOS, FUENTE_AGUA,
  DISPOSICION_EXCRETAS, AGUAS_RESIDUALES, DISPOSICION_RESIDUOS, RIESGO_ACCIDENTE,
  FUENTE_ENERGIA, ANIMALES, TIPO_FAMILIA, APGAR_OPCIONES, ECOMAPA_OPCIONES,
  VULNERABILIDADES, PARENTESCO, NIVEL_EDUCATIVO, OCUPACION, GRUPO_POBLACIONAL,
  DISCAPACIDADES, ANTECEDENTES_CRONICOS, ANTECEDENTES_TRANSMISIBLES, 
  INTERVENCIONES_PENDIENTES, REMISIONES_APS, DIAGNOSTICO_NUTRICIONAL,
  PERFIL_ENCUESTADOR, ETNIA
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const exportAll = searchParams.get('all') === 'true'

    const fichas = await prisma.fichaHogar.findMany({
      where: exportAll ? undefined : { estadoVisita: '1' },
      include: { 
        integrantes: true,
        encuestador: true
      },
      orderBy: { consecutivo: 'desc' },
    })

    const lines: string[] = []

    const headers = [
      "globalid", "consecutivo", "estadoVisita", "departamento", "codMunicipio", 
      "municipio", "territorio", "microterritorio", "uzpe", "centroPoblado", 
      "direccion", "numEBS", "prestadorPrimario", "numHogar", "numFamilia", 
      "codFicha", "latitud", "longitud", "fechaDiligenciamiento", "encuestadorNombre", 
      "encuestadorDoc", "tipoVivienda", "matParedes", "matPisos", "matTechos", 
      "numHogares", "numDormitorios", "estratoSocial", "hacinamiento", "fuenteAgua", 
      "dispExcretas", "aguasResiduales", "dispResiduos", "riesgoAccidente", "fuenteEnergia", 
      "presenciaVectores", "animales", "cantAnimales", "vacunacionMascotas", "tipoFamilia", 
      "numIntegrantes", "apgar", "apgar_P1", "apgar_P2", "apgar_P3", "apgar_P4", 
      "apgar_P5", "ecomapa", "cuidadorPrincipal", "zarit", "vulnerabilidades", 
      "pacienteId", "nombres", "apellidos", "tipoDoc", "documento", 
      "fechaNacimiento", "sexo", "generoIdentidad", "parentesco", "gestante", 
      "mesesGestacion", "telefono", "nivelEducativo", "ocupacion", "regimen", 
      "eapb", "etnia", "puebloIndigena", "grupoPoblacional", "discapacidades", 
      "peso", "talla", "perimetroBraquial", "diagNutricional", "practicaDeportiva", 
      "lactanciaMaterna", "lactanciaMeses", "esquemaAtenciones", "esquemaVacunacion", 
      "intervencionesPendientes", "enfermedadAguda", "recibeAtencionMedica", "remisiones", 
      "antecedentesCronicos", "antecedentesTransmisibles"
    ]

    lines.push(headers.join(';'))

    const formatBool = (val: boolean | null | undefined) => {
      if (val === true) return 'SI'
      if (val === false) return 'NO'
      return ''
    }

    const mapLabel = (id: any, catalog: {id: any, label: string}[]) => {
      if (id === null || id === undefined || id === '') return ''
      const item = catalog.find(c => String(c.id) === String(id))
      return item ? item.label : id
    }

    const mapArray = (ids: any[], catalog: {id: any, label: string}[]) => {
      if (!Array.isArray(ids) || ids.length === 0) return ''
      return ids.map(id => mapLabel(id, catalog)).filter(Boolean).join(', ')
    }

    const mapObjectKeys = (obj: Record<string, boolean> | null | undefined, catalog: {id: string, label: string}[]) => {
      if (!obj) return ''
      return Object.entries(obj).filter(([, v]) => v).map(([k]) => mapLabel(k, catalog)).join(', ')
    }

    for (const rawF of fichas) {
      const f: any = rawF
      const encNombre = f.encuestador ? [f.encuestador.nombre, f.encuestador.apellidos].filter(Boolean).join(" ") : ""
      const encDoc = f.encuestador ? f.encuestador.documento : (f.numDocEncuestador || "")

      const baseRow = [
        f.id || '',
        f.consecutivo ?? '',
        f.estadoVisita === '1' ? 'Efectiva' : f.estadoVisita,
        f.departamento || '',
        '', // codMunicipio no esta en schema explicito, se puede omitir o hardcodear
        f.municipio || '',
        f.territorio || '',
        f.microterritorio || '',
        f.uzpe || '',
        f.centroPoblado || '',
        `"${f.direccion || ''}"`,
        f.numEBS || '',
        f.prestadorPrimario || '',
        f.numHogar || '',
        f.numFamilia || '',
        f.codFicha || '',
        f.latitud ? String(f.latitud).replace('.', ',') : '',
        f.longitud ? String(f.longitud).replace('.', ',') : '',
        f.fechaDiligenciamiento ? new Date(f.fechaDiligenciamiento).toISOString().split('T')[0] : '',
        encNombre,
        encDoc,
        mapLabel(f.tipoVivienda, TIPO_VIVIENDA),
        mapLabel(f.matParedes, MATERIAL_PAREDES),
        mapLabel(f.matPisos, MATERIAL_PISOS),
        mapLabel(f.matTechos, MATERIAL_TECHOS),
        f.numHogares ?? '',
        f.numDormitorios ?? '',
        f.estratoSocial ?? '',
        formatBool(f.hacinamiento),
        mapArray(f.fuenteAgua, FUENTE_AGUA),
        mapArray(f.dispExcretas, DISPOSICION_EXCRETAS),
        mapArray(f.aguasResiduales, AGUAS_RESIDUALES),
        mapArray(f.dispResiduos, DISPOSICION_RESIDUOS),
        mapArray(f.riesgoAccidente, RIESGO_ACCIDENTE),
        mapLabel(f.fuenteEnergia, FUENTE_ENERGIA),
        formatBool(f.presenciaVectores),
        mapArray(f.animales, ANIMALES),
        f.cantAnimales ?? '',
        formatBool(f.vacunacionMascotas),
        mapLabel(f.tipoFamilia, TIPO_FAMILIA),
        f.numIntegrantes ?? '',
        mapLabel(f.apgar, APGAR_OPCIONES),
        '', // apgar_P1
        '', // apgar_P2
        '', // apgar_P3
        '', // apgar_P4
        '', // apgar_P5
        mapLabel(f.ecomapa, ECOMAPA_OPCIONES),
        formatBool(f.cuidadorPrincipal),
        f.zarit ?? '',
        mapArray(f.vulnerabilidades, VULNERABILIDADES),
      ]

      if (!f.integrantes || f.integrantes.length === 0) {
        // Rellenar las variables del integrante con vacios
        lines.push([...baseRow, ...Array(headers.length - baseRow.length).fill('')].join(';'))
      } else {
        for (const rawInt of f.integrantes) {
          const int: any = rawInt
          
          const nombres = [int.primerNombre, int.segundoNombre].filter(Boolean).join(" ")
          const apellidos = [int.primerApellido, int.segundoApellido].filter(Boolean).join(" ")

          const intRow = [
            int.id || '',
            nombres,
            apellidos,
            int.tipoDoc || '',
            int.numDoc || '',
            int.fechaNacimiento || '',
            int.sexo || '',
            int.sexo || '', // generoIdentidad equivalente a sexo inicialmente
            mapLabel(int.parentesco, PARENTESCO),
            int.gestante || '',
            '', // mesesGestacion
            int.telefono || '',
            mapLabel(int.nivelEducativo, NIVEL_EDUCATIVO),
            mapLabel(int.ocupacion, OCUPACION),
            int.regimen || '',
            int.eapb || '',
            mapLabel(int.etnia, ETNIA),
            int.puebloIndigena || '',
            mapArray(int.grupoPoblacional, GRUPO_POBLACIONAL),
            mapArray(int.discapacidades, DISCAPACIDADES),
            int.peso ? String(int.peso).replace('.', ',') : '',
            int.talla ? String(int.talla).replace('.', ',') : '',
            int.perimetroBraquial ? String(int.perimetroBraquial).replace('.', ',') : '',
            mapLabel(int.diagNutricional, DIAGNOSTICO_NUTRICIONAL),
            formatBool(int.practicaDeportiva),
            formatBool(int.lactanciaMaterna),
            int.lactanciaMeses ?? '',
            formatBool(int.esquemaAtenciones),
            '', // esquemaVacunacion
            mapArray(int.intervencionesPendientes, INTERVENCIONES_PENDIENTES),
            formatBool(int.enfermedadAguda),
            formatBool(int.recibeAtencionMedica),
            mapArray(int.remisiones, REMISIONES_APS),
            mapObjectKeys(int.antecedentes as any, ANTECEDENTES_CRONICOS),
            mapObjectKeys(int.antecTransmisibles as any, ANTECEDENTES_TRANSMISIBLES),
          ]
          lines.push([...baseRow, ...intRow].join(';'))
        }
      }
    }

    const csv = lines.join('\n')
    const filename = `Base_Generada_${new Date().toISOString().split('T')[0]}.csv`

    // Para Excel: \uFEFF añade BOM, asegurando lecturas correctas de caracteres latinos (ñ, tildes..)
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

