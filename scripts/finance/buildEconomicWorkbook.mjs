import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const outputDir = path.join(repoRoot, 'outputs', 'economic-dashboard-kr9b')
const outputPath = path.join(outputDir, 'kr9b_economic_dashboard_master.xlsx')

const SITE = {
  caseId: 'KR9B_117A55',
  name: 'KR 9B #117A-55',
  location: 'Santa Barbara, Usaquen',
  width: 12.992,
  depth: 25.108,
  area: 326.184,
  perimeter: 76.187,
  iceIndex: 5,
  defaultSellableEfficiency: 0.78,
}

const RULES = {
  minSideSetback: 4,
  baseLateralOnsetHeight: 11.4,
  ecosLateralOnsetHeight: 15.7,
  rearSetbackBands: [
    { maxHeight: 12, setback: 4 },
    { maxHeight: 18, setback: 5 },
    { maxHeight: 27, setback: 6 },
  ],
}

const sources = [
  [
    'Prefactibilidad-J VARGAS.xlsx',
    'Estructura limpia de ventas, costos directos, indirectos, lote, cargas y utilidad.',
    'Google Drive',
    'https://docs.google.com/spreadsheets/d/1YKwSAw5YFqWAkWspx5bS9EOwuDQhX6n8/edit',
    'Usar logica/categorias; no copiar datos prediales como verdad KR9B.',
  ],
  [
    'FACT J VARGAS BASE 24-08-01.xlsx',
    'Escenarios, pago de lote, preoperativos, reparto de utilidad, diseno/gerencia y comparables.',
    'Google Drive',
    'https://docs.google.com/spreadsheets/d/1QhDvTYkQd96MLhCuHJUn6QCxcZpfBgzz/edit',
    'Fuente principal para modulos economicos adicionales.',
  ],
  [
    'PREFACTIBILIDAD 1 ETAPA INVERSIONISTA.xlsx',
    'Aporte, participacion, retorno de capital y salida de inversionista.',
    'Google Drive',
    'https://docs.google.com/spreadsheets/d/1PJhTggk6cVd811Z5vECak2rLhmxzkqwW/edit',
    'Usar como patron de inversionista, no como metraje KR9B.',
  ],
  [
    'Prefactibilidad-Belalcazar.xlsx',
    'Caso comparativo para validar formulas y categorias.',
    'Google Drive',
    'https://docs.google.com/spreadsheets/d/1GN90nR_OZLzydJp38dgsJh0H1dVoh4NM/edit',
    'Caso de otro predio; no usar datos prediales para KR9B.',
  ],
  [
    'factibilidad_KR9B_117A55.pdf',
    'Fuente documental del modelador normativo/geometrico actual.',
    'Repositorio',
    '/static/factibilidad_KR9B_117A55.pdf',
    'La viabilidad economica consume areas del modelador; no reemplaza licencias ni curaduria.',
  ],
]

const assumptionRows = [
  ['Precio venta vivienda m2', 'sale_price_residential_m2', 6500000, 'COP/m2', 'Prefactibilidad-J VARGAS / comparables', 'Supuesto editable; actualizar con estudio comercial KR9B.'],
  ['Participacion comercio sobre area vendible', 'commercial_area_share', 0.03, '%', 'Prefactibilidad-J VARGAS', 'Mantener bajo para v1; cambiar si producto incorpora comercio real.'],
  ['Precio venta comercio m2', 'sale_price_commercial_m2', 7500000, 'COP/m2', 'Prefactibilidad-J VARGAS', 'Supuesto editable.'],
  ['Parqueaderos vendibles', 'parking_units', 4, 'un', 'Prefactibilidad-J VARGAS', 'Placeholder preliminar.'],
  ['Precio parqueadero', 'parking_price_unit', 20000000, 'COP/un', 'FACT J VARGAS', 'Supuesto editable.'],
  ['Costo directo construido m2', 'direct_cost_built_m2', 2600000, 'COP/m2', 'FACT J VARGAS', 'Base privada cubierta; el escenario ajusta factor de costo.'],
  ['Costos comunes y externos', 'common_cost_pct', 0.08, '% ventas', 'FACT J VARGAS', 'Reserva simplificada para zonas comunes, exteriores y ajustes.'],
  ['Indirectos generales', 'indirect_cost_pct', 0.19, '% ventas', 'Prefactibilidad-J VARGAS / FACT J VARGAS', 'Honorarios, ventas, legalizacion, impuestos, financiables y estructura.'],
  ['Cargas urbanisticas', 'urban_charges_pct', 0.0175, '% ventas', 'Prefactibilidad-J VARGAS', 'V1 simplificada; validar con norma y curaduria.'],
  ['Preoperativos fijos', 'preop_fixed', 200000000, 'COP', 'PREFACTIBILIDAD inversionista / FACT J VARGAS', 'Sala, estudios, adecuaciones y costos iniciales.'],
  ['Valor lote m2', 'land_price_m2', 4500000, 'COP/m2', 'Prefactibilidad-J VARGAS / FACT J VARGAS', 'Base editable para KR9B.'],
  ['Aporte inversionista', 'investor_contribution', 500000000, 'COP', 'PREFACTIBILIDAD inversionista', 'Editable segun paquete de inversion.'],
  ['Participacion inversionista utilidad', 'investor_profit_share', 0.55, '% utilidad', 'FACT J VARGAS', 'Editable; escenarios 55/45 como referencia.'],
  ['Duracion base proyecto', 'project_months', 36, 'meses', 'FACT J VARGAS / inversionista', 'El escenario economico ajusta meses.'],
  ['Margen objetivo sobre ventas', 'target_margin', 0.12, '% ventas', 'Criterio de decision v1', 'Usado para calcular valor residual de lote.'],
]

const metricInputRows = [
  ['caseId', SITE.caseId, '', 'Identificador del caso'],
  ['floors', 5, 'pisos', 'Input vivo del modelador'],
  ['floorHeight', 3, 'm', 'Input vivo del modelador'],
  ['ecosMode', false, '', 'Input vivo del modelador'],
  ['totalHeight', 15, 'm', 'Envelope normativo'],
  ['lotArea', SITE.area, 'm2', 'SITE_CONSTANTS'],
  ['builtArea', 1145.25, 'm2', 'Geometria derivada actual'],
  ['usableArea', 865.25, 'm2', 'Funcionalidad despues de nucleo'],
  ['sellableArea', 674.9, 'm2', 'Area vendible estimada'],
  ['footprintArea', 261.24, 'm2', 'Huella inferior'],
  ['occupancy', 0.8009, '%', 'Footprint / lote'],
  ['iceLimit', 1630.92, 'm2', 'SITE_CONSTANTS.area * ICe'],
  ['iceMargin', 485.67, 'm2', 'ICe - area construida'],
  ['rearSetback', 5, 'm', 'Aislamiento posterior derivado'],
  ['sideSetback', 4, 'm', 'Aislamiento lateral aplicado'],
  ['validationSeverity', 'warning', '', 'Validacion del modelo'],
  ['validationMessages', 'Pendiente confirmar topografia, perfil vial, Aerocivil y curaduria.', '', 'Mensajes del modelador'],
]

const bandRows = [
  ['Conservador', 0.92, 1.08, 1.05, 6],
  ['Base', 1, 1, 1, 0],
  ['Optimista', 1.06, 0.95, 0.95, -3],
]

function roundTo(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function rearSetback(totalHeight) {
  return RULES.rearSetbackBands.find((rule) => totalHeight <= rule.maxHeight)?.setback ?? 6
}

function lateralOnset(ecosMode) {
  return ecosMode ? RULES.ecosLateralOnsetHeight : RULES.baseLateralOnsetHeight
}

function physicalScenario(floors, ecosMode) {
  const floorHeight = 3
  const totalHeight = roundTo(floors * floorHeight)
  const rear = rearSetback(totalHeight)
  const usableDepth = Math.max(0, SITE.depth - rear)
  const onset = lateralOnset(ecosMode)
  const sideSetback = totalHeight <= onset
    ? 0
    : Math.max(RULES.minSideSetback, roundTo((totalHeight - onset) / 5))
  const lowerFloors = totalHeight > onset ? Math.floor(onset / floorHeight) : floors
  const upperFloors = totalHeight > onset ? Math.max(0, floors - lowerFloors) : 0
  const lowerNet = roundTo(SITE.width * usableDepth)
  const upperWidth = Math.max(0, SITE.width - sideSetback * 2)
  const upperNet = roundTo(upperWidth * usableDepth)
  const builtArea = roundTo(lowerFloors * lowerNet + upperFloors * upperNet)
  const coreArea = 48
  const usableArea = roundTo(
    lowerFloors * Math.max(0, lowerNet - coreArea) +
      upperFloors * Math.max(0, upperNet - coreArea),
  )
  const sellableArea = roundTo(usableArea * SITE.defaultSellableEfficiency)

  return {
    floors,
    floorHeight,
    ecosMode,
    totalHeight,
    lotArea: SITE.area,
    builtArea,
    usableArea,
    sellableArea,
    footprintArea: lowerNet,
    occupancy: roundTo(lowerNet / SITE.area, 4),
    iceLimit: roundTo(SITE.area * SITE.iceIndex),
    iceMargin: roundTo(SITE.area * SITE.iceIndex - builtArea),
    rearSetback: rear,
    sideSetback,
  }
}

function writeTitle(sheet, title, subtitle, range = 'A1:H1') {
  sheet.getRange(range).merge()
  sheet.getRange(range).values = [[title]]
  sheet.getRange(range).format = {
    fill: '#0F172A',
    font: { bold: true, color: '#FFFFFF', size: 15 },
  }
  if (subtitle) {
    sheet.getRange('A2:H2').merge()
    sheet.getRange('A2:H2').values = [[subtitle]]
    sheet.getRange('A2:H2').format = {
      fill: '#E2E8F0',
      font: { color: '#334155', size: 10 },
      wrapText: true,
    }
  }
}

function styleHeader(range, fill = '#1E3A8A') {
  range.format = {
    fill,
    font: { bold: true, color: '#FFFFFF' },
    wrapText: true,
  }
}

function styleInput(range) {
  range.format = {
    font: { color: '#0000FF' },
    fill: '#FFF2CC',
  }
}

function styleLinked(range) {
  range.format = {
    font: { color: '#008000' },
  }
}

function styleTotal(range) {
  range.format = {
    fill: '#E0F2FE',
    font: { bold: true, color: '#0F172A' },
    borders: { preset: 'outside', style: 'thin', color: '#93C5FD' },
  }
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width
  })
}

function addTableLikeBorders(range) {
  range.format.borders = {
    insideHorizontal: { style: 'thin', color: '#E2E8F0' },
    insideVertical: { style: 'thin', color: '#E2E8F0' },
    top: { style: 'thin', color: '#CBD5E1' },
    bottom: { style: 'thin', color: '#CBD5E1' },
    left: { style: 'thin', color: '#CBD5E1' },
    right: { style: 'thin', color: '#CBD5E1' },
  }
}

const workbook = Workbook.create()
workbook.comments.setSelf({ displayName: 'User' })

const dashboard = workbook.worksheets.add('00_Dashboard')
const liveInput = workbook.worksheets.add('01_Live_Model_Input')
const assumptions = workbook.worksheets.add('02_Assumptions')
const productMix = workbook.worksheets.add('03_Product_Mix')
const revenue = workbook.worksheets.add('04_Revenue')
const costs = workbook.worksheets.add('05_Costs')
const landDeal = workbook.worksheets.add('06_Land_Deal')
const investor = workbook.worksheets.add('07_Investor')
const scenarios = workbook.worksheets.add('08_Scenarios')
const audit = workbook.worksheets.add('09_Audit_Sources')

for (const sheet of workbook.worksheets.items) {
  sheet.showGridLines = false
}

writeTitle(dashboard, 'Dashboard economico KR9B', 'Selector de escenario, KPIs y sensibilidad para decidir si el proyecto paga el lote y deja utilidad.', 'A1:J1')
dashboard.getRange('A4:B4').values = [['Escenario seleccionado', 'S05_NOECOS_BASE']]
styleInput(dashboard.getRange('B4'))
dashboard.getRange('A6:B13').values = [
  ['KPI', 'Valor'],
  ['Ventas totales', null],
  ['Costos totales', null],
  ['Utilidad', null],
  ['Margen utilidad', null],
  ['Valor residual lote', null],
  ['Delta contra lote pedido', null],
  ['Estado', null],
]
styleHeader(dashboard.getRange('A6:B6'))
dashboard.getRange('B7:B13').formulas = [
  [`=INDEX('08_Scenarios'!$S$3:$S$26,MATCH($B$4,'08_Scenarios'!$A$3:$A$26,0))`],
  [`=INDEX('08_Scenarios'!$Y$3:$Y$26,MATCH($B$4,'08_Scenarios'!$A$3:$A$26,0))`],
  [`=INDEX('08_Scenarios'!$Z$3:$Z$26,MATCH($B$4,'08_Scenarios'!$A$3:$A$26,0))`],
  [`=INDEX('08_Scenarios'!$AA$3:$AA$26,MATCH($B$4,'08_Scenarios'!$A$3:$A$26,0))`],
  [`=INDEX('08_Scenarios'!$AB$3:$AB$26,MATCH($B$4,'08_Scenarios'!$A$3:$A$26,0))`],
  [`=INDEX('08_Scenarios'!$AC$3:$AC$26,MATCH($B$4,'08_Scenarios'!$A$3:$A$26,0))`],
  [`=INDEX('08_Scenarios'!$AF$3:$AF$26,MATCH($B$4,'08_Scenarios'!$A$3:$A$26,0))`],
]
dashboard.getRange('B7:B9').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
dashboard.getRange('B10').format.numberFormat = '0.0%;[Red](0.0%);-'
dashboard.getRange('B11:B12').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
styleTotal(dashboard.getRange('A7:B13'))
dashboard.getRange('D6:I6').values = [['Sensibilidad margen', '-10% precio', '-5% precio', 'Base', '+5% precio', '+10% precio']]
dashboard.getRange('D7:D10').values = [['-5% costo'], ['Base costo'], ['+5% costo'], ['+10% costo']]
styleHeader(dashboard.getRange('D6:I6'), '#334155')
styleHeader(dashboard.getRange('D7:D10'), '#334155')
dashboard.getRange('E7:I10').formulas = [
  ['=($B$7*0.90-($B$8-INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05)) / ($B$7*0.90)', '=($B$7*0.95-($B$8-INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05)) / ($B$7*0.95)', '=($B$7-($B$8-INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05)) / $B$7', '=($B$7*1.05-($B$8-INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05)) / ($B$7*1.05)', '=($B$7*1.10-($B$8-INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05)) / ($B$7*1.10)'],
  ['=($B$7*0.90-$B$8)/($B$7*0.90)', '=($B$7*0.95-$B$8)/($B$7*0.95)', '=$B$10', '=($B$7*1.05-$B$8)/($B$7*1.05)', '=($B$7*1.10-$B$8)/($B$7*1.10)'],
  ['=($B$7*0.90-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05))/($B$7*0.90)', '=($B$7*0.95-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05))/($B$7*0.95)', '=($B$7-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05))/$B$7', '=($B$7*1.05-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05))/($B$7*1.05)', '=($B$7*1.10-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.05))/($B$7*1.10)'],
  ['=($B$7*0.90-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.10))/($B$7*0.90)', '=($B$7*0.95-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.10))/($B$7*0.95)', '=($B$7-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.10))/$B$7', '=($B$7*1.05-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.10))/($B$7*1.05)', '=($B$7*1.10-($B$8+INDEX(\'08_Scenarios\'!$T$3:$T$26,MATCH($B$4,\'08_Scenarios\'!$A$3:$A$26,0))*0.10))/($B$7*1.10)'],
]
dashboard.getRange('E7:I10').format.numberFormat = '0.0%;[Red](0.0%);-'
addTableLikeBorders(dashboard.getRange('A6:B13'))
addTableLikeBorders(dashboard.getRange('D6:I10'))
dashboard.freezePanes.freezeRows(4)
setWidths(dashboard, [28, 22, 3, 24, 16, 16, 16, 16, 16, 16])

writeTitle(liveInput, 'Contrato de datos vivos', 'Estos campos son la entrada manual inicial y el futuro contrato de integracion desde la app React.', 'A1:D1')
liveInput.getRange('A4:D4').values = [['Campo', 'Valor', 'Unidad', 'Origen / nota']]
liveInput.getRangeByIndexes(4, 0, metricInputRows.length, 4).values = metricInputRows
styleHeader(liveInput.getRange('A4:D4'))
styleInput(liveInput.getRange('B5:B21'))
liveInput.getRange('B7:B20').format.numberFormat = '#,##0.00;[Red](#,##0.00);-'
liveInput.getRange('B15').format.numberFormat = '0.0%;[Red](0.0%);-'
addTableLikeBorders(liveInput.getRange(`A4:D${4 + metricInputRows.length}`))
liveInput.freezePanes.freezeRows(4)
setWidths(liveInput, [28, 24, 12, 54])

writeTitle(assumptions, 'Supuestos editables', 'Celdas azules/amarillas son inputs. Formulas y dashboards referencian esta hoja.', 'A1:F1')
assumptions.getRange('A4:F4').values = [['Supuesto', 'Clave', 'Valor base', 'Unidad', 'Fuente', 'Notas']]
assumptions.getRangeByIndexes(4, 0, assumptionRows.length, 6).values = assumptionRows
styleHeader(assumptions.getRange('A4:F4'))
styleInput(assumptions.getRange(`C5:C${4 + assumptionRows.length}`))
assumptions.getRange('C5:C5').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
assumptions.getRange('C6:C6').format.numberFormat = '0.0%;[Red](0.0%);-'
assumptions.getRange('C7:C7').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
assumptions.getRange('C8:C8').format.numberFormat = '#,##0;[Red](#,##0);-'
assumptions.getRange('C9:C11').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
assumptions.getRange('C12:C13').format.numberFormat = '0.0%;[Red](0.0%);-'
assumptions.getRange('C14:C16').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
assumptions.getRange('C17:C17').format.numberFormat = '0.0%;[Red](0.0%);-'
assumptions.getRange('C18:C18').format.numberFormat = '#,##0;[Red](#,##0);-'
assumptions.getRange('C19:C19').format.numberFormat = '0.0%;[Red](0.0%);-'
addTableLikeBorders(assumptions.getRange(`A4:F${4 + assumptionRows.length}`))
assumptions.freezePanes.freezeRows(4)
setWidths(assumptions, [34, 32, 18, 14, 36, 58])

writeTitle(productMix, 'Mix de producto', 'Deriva area vendible viva hacia vivienda, comercio y parqueaderos.', 'A1:E1')
productMix.getRange('A4:E4').values = [['Producto', 'Cantidad / area', 'Unidad', 'Precio', 'Ingreso']]
productMix.getRange('A5:A8').values = [['Vivienda'], ['Comercio'], ['Parqueaderos'], ['Total']]
productMix.getRange('B5:B8').formulas = [
  [`='01_Live_Model_Input'!$B$13*(1-'02_Assumptions'!$C$6)`],
  [`='01_Live_Model_Input'!$B$13*'02_Assumptions'!$C$6`],
  [`='02_Assumptions'!$C$8`],
  ['=SUM(B5:B6)'],
]
productMix.getRange('C5:C8').values = [['m2'], ['m2'], ['un'], ['']]
productMix.getRange('D5:E8').formulas = [
  [`='02_Assumptions'!$C$5`, '=B5*D5'],
  [`='02_Assumptions'!$C$7`, '=B6*D6'],
  [`='02_Assumptions'!$C$9`, '=B7*D7'],
  ['', '=SUM(E5:E7)'],
]
styleHeader(productMix.getRange('A4:E4'))
styleLinked(productMix.getRange('B5:E8'))
styleTotal(productMix.getRange('A8:E8'))
productMix.getRange('B5:B6').format.numberFormat = '#,##0.00'
productMix.getRange('D5:E8').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
addTableLikeBorders(productMix.getRange('A4:E8'))
setWidths(productMix, [24, 18, 12, 18, 20])

writeTitle(revenue, 'Ingresos', 'Ventas formula-driven desde mix de producto y supuestos.', 'A1:E1')
revenue.getRange('A4:E4').values = [['Concepto', 'Base', 'Factor escenario', 'Total', 'Notas']]
revenue.getRange('A5:A8').values = [['Vivienda'], ['Comercio'], ['Parqueaderos'], ['Total ventas']]
revenue.getRange('B5:D8').formulas = [
  [`='03_Product_Mix'!$E$5`, `=INDEX('08_Scenarios'!$F$3:$F$26,MATCH('00_Dashboard'!$B$4,'08_Scenarios'!$A$3:$A$26,0))`, '=B5*C5'],
  [`='03_Product_Mix'!$E$6`, `=INDEX('08_Scenarios'!$F$3:$F$26,MATCH('00_Dashboard'!$B$4,'08_Scenarios'!$A$3:$A$26,0))`, '=B6*C6'],
  [`='03_Product_Mix'!$E$7`, '=1', '=B7*C7'],
  ['=SUM(B5:B7)', '', '=SUM(D5:D7)'],
]
revenue.getRange('E5:E8').values = [['Area viva x precio vivienda'], ['Area viva x precio comercio'], ['Unidades x precio parqueadero'], ['Suma de ingresos']]
styleHeader(revenue.getRange('A4:E4'))
styleLinked(revenue.getRange('B5:D8'))
styleTotal(revenue.getRange('A8:E8'))
revenue.getRange('B5:D8').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
revenue.getRange('C5:C7').format.numberFormat = '0.00x'
addTableLikeBorders(revenue.getRange('A4:E8'))
setWidths(revenue, [24, 18, 18, 18, 44])

writeTitle(costs, 'Costos', 'Costos directos, indirectos, cargas, preoperativos y total del proyecto.', 'A1:E1')
costs.getRange('A4:E4').values = [['Concepto', 'Base', 'Factor / %', 'Total', 'Notas']]
costs.getRange('A5:A11').values = [['Directos construccion'], ['Comunes y exteriores'], ['Indirectos generales'], ['Cargas urbanisticas'], ['Preoperativos'], ['Lote'], ['Total costos']]
costs.getRange('B5:D11').formulas = [
  [`='01_Live_Model_Input'!$B$11*'02_Assumptions'!$C$10`, `=INDEX('08_Scenarios'!$G$3:$G$26,MATCH('00_Dashboard'!$B$4,'08_Scenarios'!$A$3:$A$26,0))`, '=B5*C5'],
  [`='04_Revenue'!$D$8`, `='02_Assumptions'!$C$11`, '=B6*C6'],
  [`='04_Revenue'!$D$8`, `='02_Assumptions'!$C$12`, '=B7*C7'],
  [`='04_Revenue'!$D$8`, `='02_Assumptions'!$C$13`, '=B8*C8'],
  [`='02_Assumptions'!$C$14`, '=1', '=B9*C9'],
  [`='01_Live_Model_Input'!$B$10*'02_Assumptions'!$C$15`, `=INDEX('08_Scenarios'!$H$3:$H$26,MATCH('00_Dashboard'!$B$4,'08_Scenarios'!$A$3:$A$26,0))`, '=B10*C10'],
  ['', '', '=SUM(D5:D10)'],
]
costs.getRange('E5:E11').values = [['Area construida viva x costo m2'], ['Reserva sobre ventas'], ['Honorarios, ventas, legal, financiables'], ['V1 simplificada'], ['Costos iniciales fijos'], ['Area lote x precio m2 x factor'], ['Suma de costos']]
styleHeader(costs.getRange('A4:E4'))
styleLinked(costs.getRange('B5:D11'))
styleTotal(costs.getRange('A11:E11'))
costs.getRange('B5:D11').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
costs.getRange('C5:C10').format.numberFormat = '0.0%;[Red](0.0%);-'
costs.getRange('C5').format.numberFormat = '0.00x'
costs.getRange('C9:C10').format.numberFormat = '0.00x'
addTableLikeBorders(costs.getRange('A4:E11'))
setWidths(costs, [28, 18, 18, 18, 48])

writeTitle(landDeal, 'Negociacion de lote', 'Valor residual, costo pedido y delta de negociacion.', 'A1:D1')
landDeal.getRange('A4:D4').values = [['Indicador', 'Valor', 'Unidad', 'Formula / nota']]
landDeal.getRange('A5:A10').values = [['Valor lote pedido'], ['Valor residual con margen objetivo'], ['Delta negociacion'], ['Utilidad antes de lote'], ['Margen utilidad'], ['Decision lote']]
landDeal.getRange('B5:B10').formulas = [
  [`='05_Costs'!$D$10`],
  [`='04_Revenue'!$D$8-('05_Costs'!$D$5+'05_Costs'!$D$6+'05_Costs'!$D$7+'05_Costs'!$D$8+'05_Costs'!$D$9)-('04_Revenue'!$D$8*'02_Assumptions'!$C$19)`],
  ['=B6-B5'],
  [`='04_Revenue'!$D$8-('05_Costs'!$D$5+'05_Costs'!$D$6+'05_Costs'!$D$7+'05_Costs'!$D$8+'05_Costs'!$D$9)`],
  [`=('04_Revenue'!$D$8-'05_Costs'!$D$11)/'04_Revenue'!$D$8`],
  ['=IF(B3=0,"","")'],
]
landDeal.getRange('B10').formulas = [['=IF(B7>=0,"Paga lote","Lote tensionado")']]
landDeal.getRange('C5:C10').values = [['COP'], ['COP'], ['COP'], ['COP'], ['%'], ['']]
landDeal.getRange('D5:D10').values = [['Costo de lote desde supuestos'], ['Ventas menos costos sin lote y margen objetivo'], ['Residual - pedido'], ['Ventas - costos sin lote'], ['Utilidad / ventas'], ['Semaforo de decision']]
styleHeader(landDeal.getRange('A4:D4'))
styleLinked(landDeal.getRange('B5:B10'))
styleTotal(landDeal.getRange('A5:D10'))
landDeal.getRange('B5:B8').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
landDeal.getRange('B9').format.numberFormat = '0.0%;[Red](0.0%);-'
addTableLikeBorders(landDeal.getRange('A4:D10'))
setWidths(landDeal, [34, 22, 12, 58])

writeTitle(investor, 'Inversionista', 'Retorno simple del paquete de inversion subordinado a utilidad del proyecto.', 'A1:E1')
investor.getRange('A4:E4').values = [['Concepto', 'Valor', 'Unidad', 'Fuente', 'Nota']]
investor.getRange('A5:A10').values = [['Aporte'], ['Participacion utilidad'], ['Utilidad proyecto'], ['Utilidad inversionista'], ['Cash-on-cash'], ['Retorno anual simple']]
investor.getRange('B5:B10').formulas = [
  [`='02_Assumptions'!$C$16`],
  [`='02_Assumptions'!$C$17`],
  [`='04_Revenue'!$D$8-'05_Costs'!$D$11`],
  ['=MAX(0,B7)*B6'],
  ['=IF(B5>0,B8/B5,0)'],
  [`=IF(('02_Assumptions'!$C$18+INDEX('08_Scenarios'!$I$3:$I$26,MATCH('00_Dashboard'!$B$4,'08_Scenarios'!$A$3:$A$26,0)))>0,B9/(('02_Assumptions'!$C$18+INDEX('08_Scenarios'!$I$3:$I$26,MATCH('00_Dashboard'!$B$4,'08_Scenarios'!$A$3:$A$26,0)))/12),0)`],
]
investor.getRange('C5:C10').values = [['COP'], ['% utilidad'], ['COP'], ['COP'], ['%'], ['% anual']]
investor.getRange('D5:D10').values = [['Supuestos'], ['Supuestos'], ['Modelo'], ['Modelo'], ['Modelo'], ['Modelo']]
investor.getRange('E5:E10').values = [['Editable'], ['Editable'], ['Despues de costos y lote'], ['Utilidad positiva x participacion'], ['Utilidad inversionista / aporte'], ['Retorno simple anualizado']]
styleHeader(investor.getRange('A4:E4'))
styleLinked(investor.getRange('B5:B10'))
styleTotal(investor.getRange('A5:E10'))
investor.getRange('B5:B8').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
investor.getRange('B6:B6').format.numberFormat = '0.0%;[Red](0.0%);-'
investor.getRange('B9:B10').format.numberFormat = '0.0%;[Red](0.0%);-'
addTableLikeBorders(investor.getRange('A4:E10'))
setWidths(investor, [30, 20, 14, 18, 48])

writeTitle(scenarios, 'Matriz de escenarios', '24 escenarios: 5-8 pisos x ECOS si/no x Conservador/Base/Optimista.', 'A1:AF1')
const scenarioHeaders = [
  'scenarioId',
  'physicalScenario',
  'floors',
  'ecosMode',
  'economicBand',
  'priceFactor',
  'directCostFactor',
  'landFactor',
  'durationDeltaMonths',
  'totalHeight',
  'builtArea',
  'usableArea',
  'sellableArea',
  'lotArea',
  'iceMargin',
  'residentialSales',
  'commercialSales',
  'parkingSales',
  'totalSales',
  'directCosts',
  'indirectCosts',
  'urbanCharges',
  'preop',
  'landCost',
  'totalCost',
  'profit',
  'profitMargin',
  'residualLandValue',
  'landDelta',
  'investorProfit',
  'cashOnCash',
  'status',
]
scenarios.getRangeByIndexes(3, 0, 1, scenarioHeaders.length).values = [scenarioHeaders]
styleHeader(scenarios.getRangeByIndexes(3, 0, 1, scenarioHeaders.length), '#1E293B')

const rows = []
for (const floors of [5, 6, 7, 8]) {
  for (const ecosMode of [false, true]) {
    const physical = physicalScenario(floors, ecosMode)
    for (const [band, priceFactor, directCostFactor, landFactor, durationDelta] of bandRows) {
      const scenarioId = `S${String(floors).padStart(2, '0')}_${ecosMode ? 'ECOS' : 'NOECOS'}_${band.toUpperCase()}`
      rows.push([
        scenarioId,
        `${floors} pisos ${ecosMode ? 'ECOS' : 'base'}`,
        floors,
        ecosMode ? 'Si' : 'No',
        band,
        priceFactor,
        directCostFactor,
        landFactor,
        durationDelta,
        physical.totalHeight,
        physical.builtArea,
        physical.usableArea,
        physical.sellableArea,
        physical.lotArea,
        physical.iceMargin,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ])
    }
  }
}
scenarios.getRangeByIndexes(4, 0, rows.length, scenarioHeaders.length).values = rows
const scenarioFormulaRows = []
for (let index = 0; index < rows.length; index += 1) {
  const row = index + 5
  scenarioFormulaRows.push([
    `=M${row}*(1-'02_Assumptions'!$C$6)*'02_Assumptions'!$C$5*F${row}`,
    `=M${row}*'02_Assumptions'!$C$6*'02_Assumptions'!$C$7*F${row}`,
    `='02_Assumptions'!$C$8*'02_Assumptions'!$C$9`,
    `=SUM(P${row}:R${row})`,
    `=K${row}*'02_Assumptions'!$C$10*G${row}`,
    `=S${row}*('02_Assumptions'!$C$11+'02_Assumptions'!$C$12)`,
    `=S${row}*'02_Assumptions'!$C$13`,
    `='02_Assumptions'!$C$14`,
    `=N${row}*'02_Assumptions'!$C$15*H${row}`,
    `=SUM(T${row}:X${row})`,
    `=S${row}-Y${row}`,
    `=IF(S${row}>0,Z${row}/S${row},0)`,
    `=S${row}-SUM(T${row}:W${row})-(S${row}*'02_Assumptions'!$C$19)`,
    `=AB${row}-X${row}`,
    `=MAX(0,Z${row})*'02_Assumptions'!$C$17`,
    `=IF('02_Assumptions'!$C$16>0,AD${row}/'02_Assumptions'!$C$16,0)`,
    `=IF(Z${row}<0,"No viable",IF(AC${row}<0,"Lote tensionado",IF(AA${row}<'02_Assumptions'!$C$19,"Margen bajo","Viable")))`,
  ])
}
scenarios.getRangeByIndexes(4, 15, rows.length, 17).formulas = scenarioFormulaRows
scenarios.getRange('F5:H28').format.numberFormat = '0.00x'
scenarios.getRange('I5:I28').format.numberFormat = '#,##0'
scenarios.getRange('J5:O28').format.numberFormat = '#,##0.00'
scenarios.getRange('P5:AE28').format.numberFormat = '"$"#,##0;[Red]("$"#,##0);-'
scenarios.getRange('AA5:AA28').format.numberFormat = '0.0%;[Red](0.0%);-'
scenarios.getRange('AE5:AE28').format.numberFormat = '0.0%;[Red](0.0%);-'
addTableLikeBorders(scenarios.getRange('A4:AF28'))
scenarios.freezePanes.freezeRows(4)
setWidths(scenarios, [25, 18, 10, 10, 16, 12, 14, 12, 16, 12, 14, 14, 14, 12, 14, 18, 18, 18, 18, 18, 18, 18, 16, 18, 18, 18, 12, 18, 18, 18, 12, 18])

writeTitle(audit, 'Fuentes y auditoria', 'Documentos revisados, uso dentro del modelo y limites de confiabilidad.', 'A1:E1')
audit.getRange('A4:E4').values = [['Fuente', 'Uso', 'Autoridad / origen', 'URL', 'Notas']]
audit.getRangeByIndexes(4, 0, sources.length, 5).values = sources
styleHeader(audit.getRange('A4:E4'))
audit.getRange('D5:D9').format.font = { color: '#FF0000' }
audit.getRange('A12:E12').values = [['Checks', 'Actual', 'Esperado', 'Estado', 'Nota']]
audit.getRange('A13:E17').values = [
  ['Escenarios generados', 24, 24, null, '5-8 pisos x ECOS si/no x 3 bandas'],
  ['Fuentes declaradas', sources.length, 5, null, 'Todas las fuentes base declaradas'],
  ['Live input completo', metricInputRows.length, 17, null, 'Contrato minimo de app'],
  ['Supuestos editables', assumptionRows.length, 15, null, 'No hay numeros magicos en calculos principales'],
  ['Modelo v1', 'Preliminar', 'Preliminar', null, 'No reemplaza licencia, curaduria, Aerocivil ni topografia'],
]
audit.getRange('D13:D17').formulas = [
  ['=IF(B13=C13,"OK","Revisar")'],
  ['=IF(B14=C14,"OK","Revisar")'],
  ['=IF(B15=C15,"OK","Revisar")'],
  ['=IF(B16=C16,"OK","Revisar")'],
  ['=IF(B17=C17,"OK","Revisar")'],
]
styleHeader(audit.getRange('A12:E12'), '#334155')
addTableLikeBorders(audit.getRange('A4:E9'))
addTableLikeBorders(audit.getRange('A12:E17'))
setWidths(audit, [36, 52, 20, 72, 64])

const workbookInspect = await workbook.inspect({
  kind: 'sheet',
  include: 'name',
  maxChars: 2000,
})
console.log(workbookInspect.ndjson)

const formulaErrors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 300 },
  summary: 'formula error scan',
})
console.log(formulaErrors.ndjson)

const dashboardPreview = await workbook.render({
  sheetName: '00_Dashboard',
  autoCrop: 'all',
  scale: 1,
  format: 'png',
})
await fs.mkdir(outputDir, { recursive: true })
await fs.writeFile(
  path.join(outputDir, 'kr9b_economic_dashboard_master_preview.png'),
  new Uint8Array(await dashboardPreview.arrayBuffer()),
)

for (const sheetName of [
  '01_Live_Model_Input',
  '02_Assumptions',
  '03_Product_Mix',
  '04_Revenue',
  '05_Costs',
  '06_Land_Deal',
  '07_Investor',
  '08_Scenarios',
  '09_Audit_Sources',
]) {
  await workbook.render({
    sheetName,
    autoCrop: 'all',
    scale: 1,
    format: 'png',
  })
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook)
await xlsx.save(outputPath)
console.log(outputPath)
