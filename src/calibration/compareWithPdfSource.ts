import { roundTo } from '../geometry/polygonMath'
import {
  NORMATIVE_RULES,
  PDF_STUDY_FLOOR_HEIGHT,
  REFERENCE_SCENARIOS,
} from '../model/projectSource'
import type {
  ModelGeometry,
  ModelParams,
  NormativeEnvelope,
  PdfComparisonStatus,
  PdfReferenceScenario,
  PdfRuleCheck,
  PdfSourceComparison,
} from '../model/types'

function isSameStudyHeight(floorHeight: number) {
  return Math.abs(floorHeight - PDF_STUDY_FLOOR_HEIGHT) < 0.001
}

function nearestReference(params: ModelParams): PdfReferenceScenario | undefined {
  return REFERENCE_SCENARIOS.find(
    (scenario) =>
      scenario.floors === params.floors && scenario.ecosMode === params.ecosMode,
  )
}

function ruleCheck(
  label: string,
  actual: number,
  unit: string,
  passes: boolean,
  description: string,
  expected?: number,
): PdfRuleCheck {
  return {
    label,
    actual: roundTo(actual, 2),
    expected,
    unit,
    passes,
    description,
  }
}

function statusFromRules(
  totalHeightPasses: boolean,
): PdfComparisonStatus {
  if (!totalHeightPasses) return 'outside-preliminary-envelope'
  return 'within-pdf-rules'
}

export function compareWithPdfSource(
  params: ModelParams,
  geometry: ModelGeometry,
  envelope: NormativeEnvelope,
): PdfSourceComparison {
  const reference = nearestReference(params)
  const referenceIsExactStudyHeight = isSameStudyHeight(params.floorHeight)
  const areaDifference =
    reference === undefined
      ? undefined
      : roundTo(geometry.builtArea - reference.effectiveArea, 2)
  const areaDifferencePercent =
    reference === undefined
      ? undefined
      : roundTo((Math.abs(areaDifference ?? 0) / reference.effectiveArea) * 100, 2)
  const iceMargin = envelope.iceLimit - geometry.builtArea
  const totalHeightPasses =
    envelope.totalHeight <= NORMATIVE_RULES.preliminaryMaxHeight
  const status = statusFromRules(totalHeightPasses)
  const messages = ['Modelo parametrico evaluado por altura total.']

  if (reference) {
    messages.push(
      `Referencia cercana del PDF: ${reference.floors} pisos, pagina ${reference.sourcePage}.`,
    )
  }

  if (reference && !referenceIsExactStudyHeight) {
    messages.push(
      `La tabla PDF cercana usa ${PDF_STUDY_FLOOR_HEIGHT.toFixed(2)} m/piso como supuesto del estudio; no es una regla fija del modelo.`,
    )
  }

  if (!totalHeightPasses) {
    messages.push('La altura total supera la envolvente preliminar de 27 m citada en el PDF.')
  }

  return {
    status,
    title: 'Evaluacion por altura total',
    messages,
    nearestReference: reference,
    referenceIsExactStudyHeight,
    areaDifference,
    areaDifferencePercent,
    ruleChecks: {
      totalHeight: ruleCheck(
        'Altura total',
        envelope.totalHeight,
        'm',
        totalHeightPasses,
        'Altura derivada de pisos por altura entre pisos.',
        NORMATIVE_RULES.preliminaryMaxHeight,
      ),
      rearSetback: ruleCheck(
        'Posterior aplicado',
        envelope.rearSetback,
        'm',
        envelope.rearSetback >= 4,
        'Aislamiento posterior por bandas de altura total del PDF.',
        reference?.rearSetback,
      ),
      lateralOnset: ruleCheck(
        'Lateral desde',
        envelope.lateralOnsetHeight,
        'm',
        envelope.lateralOnsetHeight === (params.ecosMode
          ? NORMATIVE_RULES.ecosLateralOnsetHeight
          : NORMATIVE_RULES.baseLateralOnsetHeight),
        'Umbral lateral base o ECOS segun sensibilidad activa.',
        reference?.lateralOnsetHeight,
      ),
      iceMargin: ruleCheck(
        'Margen ICe',
        iceMargin,
        'm2',
        iceMargin >= 0,
        'Margen entre el ICe maximo del PDF y el area construida calculada.',
        reference?.iceMargin,
      ),
    },
  }
}
