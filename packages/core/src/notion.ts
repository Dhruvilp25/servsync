/**
 * Convert a single Notion page property (any type) into a plain string cell
 * suitable for a spreadsheet. Returns '' for empty/unsupported values.
 */
export function notionPropToString(prop: any): string {
  if (!prop || typeof prop !== 'object') return ''

  switch (prop.type) {
    case 'title':
      return (prop.title ?? []).map((t: any) => t.plain_text ?? '').join('')
    case 'rich_text':
      return (prop.rich_text ?? []).map((t: any) => t.plain_text ?? '').join('')
    case 'number':
      return prop.number != null ? String(prop.number) : ''
    case 'select':
      return prop.select?.name ?? ''
    case 'status':
      return prop.status?.name ?? ''
    case 'multi_select':
      return (prop.multi_select ?? []).map((s: any) => s.name).join(', ')
    case 'date': {
      const d = prop.date
      if (!d?.start) return ''
      return d.end ? `${d.start} → ${d.end}` : d.start
    }
    case 'checkbox':
      return prop.checkbox ? 'TRUE' : 'FALSE'
    case 'url':
      return prop.url ?? ''
    case 'email':
      return prop.email ?? ''
    case 'phone_number':
      return prop.phone_number ?? ''
    case 'people':
      return (prop.people ?? []).map((p: any) => p.name ?? p.id).join(', ')
    case 'files':
      return (prop.files ?? [])
        .map((f: any) => f.external?.url ?? f.file?.url ?? f.name ?? '')
        .filter(Boolean)
        .join(', ')
    case 'created_time':
      return prop.created_time ?? ''
    case 'last_edited_time':
      return prop.last_edited_time ?? ''
    case 'created_by':
      return prop.created_by?.name ?? prop.created_by?.id ?? ''
    case 'last_edited_by':
      return prop.last_edited_by?.name ?? prop.last_edited_by?.id ?? ''
    case 'relation':
      return (prop.relation ?? []).map((r: any) => r.id).join(', ')
    case 'rollup':
      // Rollups wrap another value; surface array/number/date best-effort.
      if (prop.rollup?.type === 'number') return String(prop.rollup.number ?? '')
      if (prop.rollup?.type === 'date') return prop.rollup.date?.start ?? ''
      if (prop.rollup?.type === 'array')
        return (prop.rollup.array ?? []).map(notionPropToString).join(', ')
      return ''
    case 'formula': {
      const f = prop.formula
      if (!f) return ''
      if (f.type === 'string') return f.string ?? ''
      if (f.type === 'number') return f.number != null ? String(f.number) : ''
      if (f.type === 'boolean') return f.boolean ? 'TRUE' : 'FALSE'
      if (f.type === 'date') return f.date?.start ?? ''
      return ''
    }
    case 'unique_id':
      return prop.unique_id
        ? `${prop.unique_id.prefix ? prop.unique_id.prefix + '-' : ''}${prop.unique_id.number}`
        : ''
    default:
      return ''
  }
}
