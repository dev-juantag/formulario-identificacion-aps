import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'


export const dynamic = 'force-dynamic'

function getAge(fechaNacimiento: string) {
  if (!fechaNacimiento) return -1;
  const birth = new Date(fechaNacimiento)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function getAgeGroup(age: number) {
  if (age < 0) return 'ND'
  if (age <= 4) return '0-4'
  if (age <= 11) return '5-11'
  if (age <= 17) return '12-17'
  if (age <= 28) return '18-28'
  if (age <= 59) return '29-59'
  return '60+'
}

export async function GET() {
  try {
    const fichas = await prisma.fichaHogar.findMany({
      where: {
        estadoVisita: '1' // Solo visitas efectivas
      },
      select: {
        territorio: true,
        direccion: true,
        apgar: true,
        cuidadorPrincipal: true,
        zarit: true,
        vulnerabilidades: true,
        integrantes: {
          select: {
            sexo: true,
            fechaNacimiento: true,
            gestante: true,
            antecedentes: true,
            regimen: true,
            remisiones: true,
            diagNutricional: true
          }
        }
      }
    })

    const uniqueDirecciones = new Set<string>()
    let totalHogares = fichas.length
    let totalPersonas = 0

    let apgarDisfuncional = 0
    let cuidadores = 0
    let riesgoVulnerabilidad = 0
    let riesgoCronico = 0
    
    let gestantes = 0
    let menores10 = 0
    let mayores60 = 0
    
    let sinAseguramiento = 0
    let totalRemisiones = 0
    let desnutricion = 0

    let Hombres = 0
    let Mujeres = 0

    const piramideMap: Record<string, { M: number, F: number }> = {
      '0-4': { M: 0, F: 0 },
      '5-11': { M: 0, F: 0 },
      '12-17': { M: 0, F: 0 },
      '18-28': { M: 0, F: 0 },
      '29-59': { M: 0, F: 0 },
      '60+': { M: 0, F: 0 }
    }
    const terMap = new Map<string, number>()

    for (const rawF of fichas) {
      const f: any = rawF
      if (f.direccion) uniqueDirecciones.add(f.direccion.toLowerCase().trim())
      
      if (f.apgar && f.apgar > 1) apgarDisfuncional++
      if (f.cuidadorPrincipal || f.zarit) cuidadores++
      if (f.vulnerabilidades && f.vulnerabilidades.length > 0) riesgoVulnerabilidad++
      
      terMap.set(f.territorio, (terMap.get(f.territorio) || 0) + 1)

      for (const rawI of f.integrantes) {
        const i: any = rawI
        totalPersonas++
        const age = getAge(i.fechaNacimiento)
        
        if (i.gestante === 'SI') gestantes++
        if (age >= 0 && age < 10) menores10++
        if (age >= 60) mayores60++
        
        // Sin Aseguramiento
        if (i.regimen === 'NO_AFILIADO') sinAseguramiento++
        
        // Remisiones
        if (i.remisiones && i.remisiones.length > 0) totalRemisiones++
        
        // Desnutrición en niños (< 10 años)
        if (age < 10 && i.diagNutricional === 5) desnutricion++

        if (i.antecedentes) {
          const ant = i.antecedentes as Record<string, boolean>
          if (Object.values(ant).some(v => v === true)) riesgoCronico++
        }
        
        const grupo = getAgeGroup(age)
        if (grupo !== 'ND') {
           if (i.sexo === 'HOMBRE') {
             piramideMap[grupo].M-- // NEGATIVO PARA RECHARTS (Tornado)
             Hombres++
           }
           else if (i.sexo === 'MUJER') {
             piramideMap[grupo].F++ // POSITIVO
             Mujeres++
           }
        }
      }
    }

    const piramide = ['0-4', '5-11', '12-17', '18-28', '29-59', '60+'].map(g => ({
      ageGroup: g,
      Hombres: piramideMap[g].M,
      Mujeres: piramideMap[g].F
    }))

    const densidadTerritorio = [...terMap.entries()]
      .map(([name, value]) => ({ name, value, y: 1 }))
      .sort((a, b) => b.value - a.value)

    return NextResponse.json({
      totalViviendas: uniqueDirecciones.size,
      totalHogares,
      totalPersonas,
      Hombres,
      Mujeres,
      piramide,
      densidadTerritorio,
      apgarDisfuncional,
      cuidadores,
      riesgoVulnerabilidad,
      riesgoCronico,
      gestantes,
      menores10,
      mayores60,
      sinAseguramiento,
      totalRemisiones,
      desnutricion
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

