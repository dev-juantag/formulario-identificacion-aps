'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import MultiSelect from './MultiSelect'
import {
  ANTECEDENTES_CRONICOS, ANTECEDENTES_TRANSMISIBLES, INTERVENCIONES_PENDIENTES,
  REMISIONES_APS, DIAGNOSTICO_NUTRICIONAL, calcularEdad
} from '@/lib/constants'
import { inp, sel, lbl, lblStyle, chk, chkLabel } from './wizardStyles'

export default function Step5Salud() {
  const { register, control, watch } = useFormContext()
  const { fields } = useFieldArray({ control, name: 'integrantes' })
  const [expanded, setExpanded] = useState<number[]>([0])

  const toggle = (i: number) => setExpanded(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
  )

  return (
    <div className="space-y-3">
      <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#f0f4ff', border: '1px solid #c7d4f0', color: '#081e69' }}>
        Complete la evaluación de salud para cada integrante.
      </p>

      {fields.map((field, i) => {
        const fnac = watch(`integrantes.${i}.fechaNacimiento`)
        const edad = fnac ? calcularEdad(fnac) : null
        const nombre = `${watch(`integrantes.${i}.primerNombre`) || 'Integrante'} ${watch(`integrantes.${i}.primerApellido`) || ''}`
        const open = expanded.includes(i)
        const enfermedadAguda = watch(`integrantes.${i}.enfermedadAguda`)

        return (
          <div key={field.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e8f0' }}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
              style={{ background: '#f7f8fc', borderBottom: open ? '1px solid #e4e8f0' : 'none' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: '#0a8c32' }}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-xs text-gray-800">{nombre}</p>
                  {edad !== null && <p className="text-[10px] text-gray-400">{edad} años</p>}
                </div>
              </div>
              {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {open && (
              <div className="p-4 space-y-4 bg-white">
                <FS title="Antecedentes Patológicos Crónicos">
                  <MultiSelect label="" options={ANTECEDENTES_CRONICOS} name={`integrantes.${i}.antecedentes`} isMap exclusiveId="ninguno" columns={2} />
                </FS>

                <FS title="Enfermedades Transmisibles">
                  <MultiSelect label="" options={ANTECEDENTES_TRANSMISIBLES} name={`integrantes.${i}.antecTransmisibles`} isMap exclusiveId="ninguno" columns={2} />
                </FS>

                <FS title="Medidas Antropométricas">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <F label="Peso (kg)" required><input type="number" step="0.1" {...register(`integrantes.${i}.peso`)} className={inp} /></F>
                    <F label="Talla (cm)" required><input type="number" step="0.1" {...register(`integrantes.${i}.talla`)} className={inp} /></F>
                    <F label="P. Braquial (cm)"><input type="number" step="0.1" {...register(`integrantes.${i}.perimetroBraquial`)} className={inp} /></F>
                    <F label="Diag. Nutricional">
                      <select {...register(`integrantes.${i}.diagNutricional`)} className={sel}>
                        <option value="">—</option>
                        {DIAGNOSTICO_NUTRICIONAL.map(o => <option key={o.id} value={String(o.id)}>{o.label}</option>)}
                      </select>
                    </F>
                  </div>
                </FS>

                <FS title="Prevención y Hábitos">
                  <div className="space-y-2">
                    <label className={chkLabel}>
                      <input type="checkbox" {...register(`integrantes.${i}.practicaDeportiva`)} className={chk} />
                      <span className="text-xs">¿Realiza práctica deportiva?</span>
                    </label>
                    {edad !== null && edad < 2 && (
                       <label className={chkLabel}>
                         <input type="checkbox" {...register(`integrantes.${i}.lactanciaMaterna`)} className={chk} />
                         <span className="text-xs">¿Recibe lactancia materna?</span>
                       </label>
                    )}
                    <label className={chkLabel}>
                      <input type="checkbox" {...register(`integrantes.${i}.esquemaAtenciones`)} className={chk} />
                      <span className="text-xs">¿Esquema completo de P&M?</span>
                    </label>
                  </div>
                </FS>

                <FS title="Intervenciones Pendientes">
                  <MultiSelect label="" options={INTERVENCIONES_PENDIENTES} name={`integrantes.${i}.intervencionesPendientes`} exclusiveId={99} columns={2} />
                </FS>

                <FS title="Enfermedad Aguda">
                  <div className="space-y-2">
                    <label className={chkLabel}>
                      <input type="checkbox" {...register('enfermedadAguda')} className={chk} />
                      <span className="text-xs">¿Presenta enfermedad aguda este mes?</span>
                    </label>
                    {enfermedadAguda && (
                      <label className={chkLabel + ' ml-5'}>
                        <input type="checkbox" {...register('recibeAtencionMedica')} className={chk} />
                        <span className="text-xs">¿Recibe atención médica?</span>
                      </label>
                    )}
                  </div>
                </FS>

                <FS title="Remisiones APS">
                  <MultiSelect label="" options={REMISIONES_APS} name={`integrantes.${i}.remisiones`} exclusiveId="ninguna" columns={2} />
                </FS>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FS({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest pt-2 border-t border-gray-100" style={{ color: '#081e6966' }}>{title}</p>
      {children}
    </div>
  )
}

function F({ label, children, required }: { label: string; children: React.ReactNode, required?: boolean }) {
  return (
    <div className="space-y-1">
      <label className={lbl} style={lblStyle}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
