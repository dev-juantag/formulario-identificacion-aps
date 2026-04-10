'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import MultiSelect from './MultiSelect'
import {
  TIPO_DOCUMENTO, SEXO, PARENTESCO, NIVEL_EDUCATIVO, OCUPACION,
  REGIMEN_SALUD, ETNIA, GRUPO_POBLACIONAL, DISCAPACIDADES, calcularEdad, calcularCursoVida
} from '@/lib/constants'
import { inp, sel, lbl, lblStyle, required as reqStyle, btnGreen, btnGreenStyle } from './wizardStyles'

const defaultIntegrante = {
  primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '',
  tipoDoc: 'CC', numDoc: '', fechaNacimiento: '', parentesco: '', sexo: '', gestante: 'NA',
  telefono: '', nivelEducativo: '', ocupacion: '', regimen: '', eapb: '',
  etnia: '', puebloIndigena: '', grupoPoblacional: [], discapacidades: [],
  antecedentes: {},
  antecTransmisibles: {},
  peso: '', talla: '', perimetroBraquial: '', diagNutricional: '',
  practicaDeportiva: false, lactanciaMaterna: false, lactanciaMeses: '',
  esquemaAtenciones: false, intervencionesPendientes: [],
  enfermedadAguda: false, recibeAtencionMedica: false,
  remisiones: [],
}

export default function Step4Integrantes() {
  const { register, control, watch, setValue } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'integrantes' })
  const [expanded, setExpanded] = useState<number[]>([0])
  
  const numIntegrantesField = watch('numIntegrantes')
  const numIntegrantes = parseInt(numIntegrantesField) || 0

  useEffect(() => {
    // Ajustar la cantidad de integrantes al valor definido en Step 3
    const currentCount = fields.length
    if (numIntegrantes > currentCount) {
      for (let i = 0; i < numIntegrantes - currentCount; i++) {
        append(defaultIntegrante)
      }
    } else if (numIntegrantes < currentCount) {
      for (let i = currentCount - 1; i >= numIntegrantes; i--) {
        remove(i)
      }
    }
  }, [numIntegrantes, fields.length, append, remove])

  const toggle = (i: number) => setExpanded(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
          Formularios de integrantes ({fields.length} de {numIntegrantes})
        </p>
      </div>

      {fields.map((field, i) => {
        const fnac = watch(`integrantes.${i}.fechaNacimiento`)
        const edad = fnac ? calcularEdad(fnac) : null
        const cursoVida = edad !== null ? calcularCursoVida(edad) : ''
        const etnia = watch(`integrantes.${i}.etnia`)
        const sexo = watch(`integrantes.${i}.sexo`)
        const open = expanded.includes(i)

        return (
          <div key={field.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e8f0' }}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer"
              style={{ background: '#f7f8fc', borderBottom: open ? '1px solid #e4e8f0' : 'none' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: '#081e69' }}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-xs text-gray-800">
                    {watch(`integrantes.${i}.primerNombre`) || 'Nuevo'}{' '}
                    {watch(`integrantes.${i}.primerApellido`) || 'Integrante'}
                  </p>
                  {edad !== null && (
                    <p className="text-[10px] text-gray-400">{edad} años · {cursoVida}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            {open && (
              <div className="p-4 space-y-4 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <F label="Primer Nombre" required>
                    <input 
                      {...register(`integrantes.${i}.primerNombre`)} 
                      className={inp} 
                      onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); }}
                    />
                  </F>
                  <F label="Segundo Nombre">
                    <input 
                      {...register(`integrantes.${i}.segundoNombre`)} 
                      className={inp} 
                      onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); }}
                    />
                  </F>
                  <F label="Primer Apellido" required>
                    <input 
                      {...register(`integrantes.${i}.primerApellido`)} 
                      className={inp} 
                      onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); }}
                    />
                  </F>
                  <F label="Segundo Apellido" required>
                    <input 
                      {...register(`integrantes.${i}.segundoApellido`)} 
                      className={inp} 
                      onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); }}
                    />
                  </F>
                  <F label="Tipo Doc." required>
                    <select {...register(`integrantes.${i}.tipoDoc`)} className={sel}>
                      <option value="">— Selecciona —</option>
                      {TIPO_DOCUMENTO.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </F>
                  <F label="N° Documento" required><input {...register(`integrantes.${i}.numDoc`)} onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }} className={inp} /></F>
                  <F label="Fecha de Nacimiento" required>
                    <input type="date" {...register(`integrantes.${i}.fechaNacimiento`)} className={inp} />
                  </F>
                  <F label="Edad y Curso de Vida">
                    <input
                      type="text"
                      className={`${inp} bg-gray-100 cursor-not-allowed font-bold text-[#0a8c32]`}
                      value={edad !== null ? `${edad} años · ${cursoVida}` : ''}
                      disabled
                    />
                  </F>
                  <F label="Parentesco" required>
                    <select {...register(`integrantes.${i}.parentesco`)} className={sel}>
                      <option value="">— Selecciona —</option>
                      {PARENTESCO.map(o => <option key={o.id} value={String(o.id)}>{o.label}</option>)}
                    </select>
                  </F>
                  <F label="Sexo" required>
                    <select {...register(`integrantes.${i}.sexo`)} onChange={(e) => { register(`integrantes.${i}.sexo`).onChange(e); if (e.target.value === 'HOMBRE') setValue(`integrantes.${i}.gestante`, 'NA'); }} className={sel}>
                      <option value="">— Selecciona —</option>
                      {SEXO.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </F>
                  <F label="Gestante">
                    <select {...register(`integrantes.${i}.gestante`)} className={sel}>
                      {sexo === 'HOMBRE' ? <option value="NA">NO APLICA</option> : (
                        <>
                          <option value="">— Selecciona —</option>
                          <option value="SI">Sí</option>
                          <option value="NO">No</option>
                          <option value="En duda">En duda</option>
                          <option value="NA">Ninguno / NA</option>
                        </>
                      )}
                    </select>
                  </F>
                  <F label="Teléfono" required>
                    <input 
                      type="tel" 
                      {...register(`integrantes.${i}.telefono`)} 
                      maxLength={10} 
                      className={inp} 
                      placeholder="3XX XXX XXXX"
                      onInput={(e) => {
                        let val = e.currentTarget.value.replace(/[^0-9]/g, '');
                        if (val.length > 0 && val[0] !== '3') {
                          val = '3' + val;
                        }
                        e.currentTarget.value = val.slice(0, 10);
                      }}
                    />
                  </F>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest pt-2 border-t border-gray-100" style={{ color: '#081e6966' }}>
                  Educación y Afiliación
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <F label="Nivel Educativo" required>
                    <select {...register(`integrantes.${i}.nivelEducativo`)} className={sel}>
                      <option value="">— Selecciona —</option>
                      {NIVEL_EDUCATIVO.map(o => <option key={o.id} value={String(o.id)}>{o.label}</option>)}
                    </select>
                  </F>
                  <F label="Ocupación" required>
                    <select {...register(`integrantes.${i}.ocupacion`)} className={sel}>
                      <option value="">— Selecciona —</option>
                      {OCUPACION.map(o => <option key={o.id} value={String(o.id)}>{o.label}</option>)}
                    </select>
                  </F>
                  <F label="Régimen de Salud" required>
                    <select {...register(`integrantes.${i}.regimen`)} className={sel}>
                      <option value="">— Selecciona —</option>
                      {REGIMEN_SALUD.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </F>
                  <F label="EAPB / EPS">
                    <input {...register(`integrantes.${i}.eapb`)} className={inp} />
                  </F>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest pt-2 border-t border-gray-100" style={{ color: '#081e6966' }}>
                  Enfoque Diferencial
                </p>
                <div className="space-y-2.5">
                  <F label="Pertenencia Étnica" required>
                    <select {...register(`integrantes.${i}.etnia`)} className={sel}>
                      <option value="">— Selecciona —</option>
                      {ETNIA.map(o => <option key={o.id} value={String(o.id)}>{o.label}</option>)}
                    </select>
                  </F>
                  {String(etnia) === '1' && (
                    <F label="Pueblo Indígena">
                      <input {...register(`integrantes.${i}.puebloIndigena`)} className={inp} />
                    </F>
                  )}
                  <MultiSelect label="Grupo Pob. Especial Protección" options={GRUPO_POBLACIONAL} name={`integrantes.${i}.grupoPoblacional`} exclusiveId={11} columns={2} />
                  <MultiSelect label="Discapacidades" options={DISCAPACIDADES} name={`integrantes.${i}.discapacidades`} exclusiveId={9} columns={2} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function F({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={`space-y-1 ${className || ''}`}>
      <label className={lbl} style={lblStyle}>
        {label} {required && <span style={reqStyle}>*</span>}
      </label>
      {children}
    </div>
  )
}
