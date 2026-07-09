import { describe, expect, test } from 'vitest'
import mapHtml from '../../public/static/mapa-barrio/index.html?raw'
import { extractGeoJsonConst } from './extractNeighborhoodLots'
import { measureNeighborhoodLots, summarizeMeasuredLots } from './measureLots'

describe('neighborhood lot measurement', () => {
  test('extracts every cadastral lot from the static neighborhood map', () => {
    const lots = extractGeoJsonConst(mapHtml, 'lots')

    expect(lots.type).toBe('FeatureCollection')
    expect(lots.features).toHaveLength(859)
  })

  test('measures the KR9B study lot near the source dimensions', () => {
    const lots = extractGeoJsonConst(mapHtml, 'lots')
    const measuredLots = measureNeighborhoodLots(lots)
    const studyLot = measuredLots.find((lot) => lot.isStudyLot)

    expect(studyLot).toMatchObject({
      lotCode: '0084155327',
      address: 'KR 9 B 117 A 55',
      registeredFloors: 2,
    })
    expect(studyLot?.widthM).toBeGreaterThanOrEqual(12.8)
    expect(studyLot?.widthM).toBeLessThanOrEqual(13.3)
    expect(studyLot?.depthM).toBeGreaterThanOrEqual(24.8)
    expect(studyLot?.depthM).toBeLessThanOrEqual(25.5)
  })

  test('keeps lots without registered floors in the measured dataset', () => {
    const lots = extractGeoJsonConst(mapHtml, 'lots')
    const measuredLots = measureNeighborhoodLots(lots)
    const summary = summarizeMeasuredLots(measuredLots)

    expect(summary.totalLots).toBe(859)
    expect(summary.lotsWithoutFloors).toBeGreaterThan(0)
    expect(summary.widthM.median).toBeGreaterThan(15)
    expect(summary.depthM.median).toBeGreaterThan(30)
  })
})
