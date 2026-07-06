import { describe, expect, it } from 'vitest'
import { detectIntent } from './intent'

describe('detectIntent', () => {
  it('detects mixed spatial and normative questions', () => {
    expect(detectIntent('Que tratamiento urbanistico y norma aplica al predio?')).toBe('mixed')
  })

  it('detects unsupported casual questions', () => {
    expect(detectIntent('cuentame un chiste')).toBe('unsupported')
  })
})
