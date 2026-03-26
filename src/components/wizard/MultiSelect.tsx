'use client'

import { useFormContext } from 'react-hook-form'
import { Check } from 'lucide-react'

interface Option {
  id: string | number
  label: string
}

interface MultiSelectProps {
  label: string
  options: Option[]
  name: string
  exclusiveId?: string | number
  isMap?: boolean
  columns?: 1 | 2 | 3
  required?: boolean
}

export default function MultiSelect({
  label,
  options,
  name,
  exclusiveId,
  isMap = false,
  columns = 2,
  required = false
}: MultiSelectProps) {
  const { watch, setValue } = useFormContext()
  const selection = watch(name) || (isMap ? {} : [])

  const toggle = (optId: string | number) => {
    if (isMap) {
      const current = { ...selection }
      const isCurrentlySelected = !!current[optId]

      if (!isCurrentlySelected) {
        // Al seleccionar la opción exclusiva, limpiar todo lo demás
        if (optId === exclusiveId) {
          Object.keys(current).forEach(key => current[key] = false)
          current[optId] = true
        } else {
          // Si había algo exclusivo seleccionado, quitarlo
          if (exclusiveId) current[exclusiveId] = false
          current[optId] = true
        }
      } else {
        current[optId] = false
      }
      setValue(name, current, { shouldValidate: true })
    } else {
      let current = Array.isArray(selection) ? [...selection] : []
      const sId = String(optId)
      const eId = exclusiveId ? String(exclusiveId) : null

      if (current.includes(sId)) {
        current = current.filter(x => x !== sId)
      } else {
        if (sId === eId) {
          current = [sId]
        } else {
          if (eId) current = current.filter(x => x !== eId)
          current.push(sId)
        }
      }
      setValue(name, current, { shouldValidate: true })
    }
  }

  const isSelected = (optId: string | number) => {
    if (isMap) return !!selection[optId]
    return Array.isArray(selection) && selection.includes(String(optId))
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className={`grid gap-1.5 ${columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((opt) => {
          const active = isSelected(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-200 border ${
                active
                  ? 'bg-[#081e69] text-white border-[#081e69] shadow-sm'
                  : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                active ? 'bg-white/20 border-white/40' : 'bg-gray-50 border-gray-200'
              }`}>
                {active && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-xs font-medium leading-tight ${active ? 'text-white' : 'text-gray-700'}`}>
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
