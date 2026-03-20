import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
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
      select: {
        territorio: true,
        direccion: true,
        apgar: true,
        cuidadorPrincipal: true,
        zarit: true,
        vulnerabilidades: true,
        integrantes: {
          select: {
            id: true,
            sexo: true,
            fechaNacimiento: true,
            gestante: true,
            // @ts-ignore - Prisma client needs regeneration
            mesesGestacion: true,
            antecedentes: true,
            createdAt: true
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
    let menores5 = 0
    let mayores60 = 0

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
        const age = getAge(i.fechaNacimiento)
        
        // Excluir estadísticamente a los de 100 años o más
        if (age >= 100) {
          continue;
        }

        totalPersonas++

        let isGestante = i.gestante === 'SI'
        if (isGestante && i.mesesGestacion != null && i.createdAt) {
          const createdAt = new Date(i.createdAt)
          const now = new Date()
          const monthsPassed = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth())
          if (i.mesesGestacion + monthsPassed >= 9) {
            isGestante = false
            // Actualizar DB en background
            prisma.integrante.update({
              where: { id: i.id },
              // @ts-ignore - Prisma client needs regeneration
              data: { gestante: 'NO', mesesGestacion: null }
            }).catch(console.error)
          }
        }
        
        if (isGestante) gestantes++
        if (age >= 0 && age <= 4) menores5++
        if (age >= 60) mayores60++
        
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
      menores5,
      mayores60
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
