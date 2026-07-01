import {
  ArrowUpRight,
  BookOpenCheck,
  Building2,
  FileText,
  Gauge,
  Ruler,
  ShieldAlert,
} from 'lucide-react'
import { NORMATIVE_RULES, PDF_SOURCE, SITE_CONSTANTS } from '../model/projectSource'

const sourceLinks = [
  {
    label: 'PDF de factibilidad actualizado',
    href: PDF_SOURCE.publicHref,
    note: 'Documento fuente del modelador y de esta guia.',
  },
  {
    label: 'HTML pedagogico reutilizable',
    href: '/static/norma-facil.html',
    note: 'Version estatica para incrustar o compartir fuera de React.',
  },
  {
    label: 'Anexo 5 actualizado SDP',
    href: 'https://www.sdp.gov.co/sites/default/files/actualiza_anexo_5_man_normas_trat_urb.pdf',
    note: 'Soporte de aislamientos, altura por piso y normas comunes.',
  },
  {
    label: 'Decreto 670 de 2025',
    href: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=191905',
    note: 'Compilacion POT citada en el informe.',
  },
]

const floorRows = [
  ['Piso 1', '0,00 a 3,00 m', 'No se exige lateral por la regla de 11,40 m.'],
  ['Piso 2', '3,00 a 6,00 m', 'No se exige lateral por la regla de 11,40 m.'],
  ['Piso 3', '6,00 a 9,00 m', 'No se exige lateral por la regla de 11,40 m.'],
  [
    'Piso 4',
    '9,00 a 12,00 m',
    'Cruza el umbral de 11,40 m; requiere revisar seccion y arranque real del retiro.',
  ],
  [
    'Piso 5 en adelante',
    '12,00 m o mas',
    'Debe resolver aislamiento lateral o empate, salvo concepto oficial que permita otra lectura.',
  ],
]

const guideCards = [
  {
    title: 'Lateral desde 11,40 m',
    icon: Ruler,
    tone: 'text-blue-800',
    body:
      'No significa un retiro de 11,40 m. Significa que el aislamiento lateral se activa desde esa altura hacia arriba.',
  },
  {
    title: 'ICe',
    icon: Gauge,
    tone: 'text-amber-800',
    body:
      'Es el area construible efectiva total. Para este lote: 326,184 m2 x 5,0 = 1.630,92 m2 efectivos.',
  },
  {
    title: 'ECOS',
    icon: BookOpenCheck,
    tone: 'text-emerald-800',
    body:
      'Es una sensibilidad/incentivo asociado a sostenibilidad. En este proyecto sigue pendiente de concepto oficial.',
  },
]

function fmt(value: number, digits = 2) {
  return value.toLocaleString('es-CO', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

function ProjectSectionDiagram() {
  const lotWidth = SITE_CONSTANTS.width
  const minSide = NORMATIVE_RULES.minSideSetback
  const upperWidth = lotWidth - minSide * 2

  return (
    <div className="rounded border border-slate-200 bg-[#fffdf8] p-4">
      <svg
        viewBox="0 0 820 310"
        role="img"
        aria-label="Diagrama de lectura del aislamiento lateral en el proyecto"
        className="h-auto w-full"
      >
        <rect width="820" height="310" rx="8" fill="#fffdf8" />
        <text x="24" y="34" fontSize="17" fontWeight="700" fill="#0f172a">
          Lectura simplificada del lote {SITE_CONSTANTS.name}
        </text>
        <line x1="54" y1="260" x2="360" y2="260" stroke="#334155" strokeWidth="2" />
        <rect x="118" y="85" width="178" height="175" fill="#dbeafe" stroke="#1e3a8a" strokeWidth="2" />
        <rect x="154" y="45" width="106" height="80" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
        <line x1="118" y1="125" x2="296" y2="125" stroke="#64748b" />
        <line x1="118" y1="160" x2="296" y2="160" stroke="#64748b" />
        <line x1="118" y1="195" x2="296" y2="195" stroke="#64748b" />
        <line x1="118" y1="230" x2="296" y2="230" stroke="#64748b" />
        <line x1="72" y1="146" x2="342" y2="146" stroke="#dc2626" strokeDasharray="7 6" strokeWidth="2" />
        <text x="250" y="137" fontSize="13" fontWeight="700" fill="#dc2626">
          11,40 m
        </text>
        <path d="M118 70h-34v190h34M296 70h34v190h-34" fill="none" stroke="#94a3b8" strokeDasharray="7 7" />
        <text x="62" y="286" fontSize="12" fill="#475569">
          Abajo: mayor ocupacion posible. Arriba: retiro o empate.
        </text>

        <g transform="translate(430 74)">
          <rect x="0" y="0" width="310" height="160" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
          <rect x="36" y="48" width="238" height="46" fill="#dbeafe" stroke="#1e3a8a" />
          <rect x="36" y="104" width="238" height="28" fill="#e2e8f0" stroke="#64748b" />
          <rect x="36" y="104" width="73" height="28" fill="#fee2e2" stroke="#dc2626" />
          <rect x="201" y="104" width="73" height="28" fill="#fee2e2" stroke="#dc2626" />
          <rect x="109" y="104" width="92" height="28" fill="#f8fafc" stroke="#334155" />
          <text x="43" y="39" fontSize="13" fill="#0f172a">
            Ancho lote: {fmt(lotWidth, 2)} m
          </text>
          <text x="44" y="151" fontSize="12" fill="#991b1b">
            4,00 m
          </text>
          <text x="208" y="151" fontSize="12" fill="#991b1b">
            4,00 m
          </text>
          <text x="112" y="151" fontSize="12" fill="#0f172a">
            {fmt(upperWidth, 2)} m utiles
          </text>
        </g>
      </svg>
    </div>
  )
}

export function NormativeGuidePage() {
  return (
    <section className="min-h-[calc(100dvh-116px)] bg-[#eef3f8] px-4 py-5 sm:px-6">
      <div className="mx-auto grid max-w-[1800px] gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-5">
          <section className="rounded border border-slate-200 bg-[#fffdf8] p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">
              Guia digestible del PDF
            </p>
            <h2 className="mt-2 max-w-5xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Como leer la norma del proyecto sin ser arquitecto
            </h2>
            <p className="mt-4 max-w-5xl text-base leading-7 text-slate-700">
              Esta pagina convierte la explicacion del PDF en una lectura web para el caso{' '}
              <strong>{SITE_CONSTANTS.name}</strong>. La idea es separar tres cosas que suelen
              confundirse: altura, retiros y area efectiva.
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {guideCards.map((card) => {
              const Icon = card.icon
              return (
                <article key={card.title} className="rounded border border-slate-200 bg-white p-5">
                  <Icon className={card.tone} size={26} aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
                </article>
              )
            })}
          </section>

          <section className="rounded border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Building2 className="text-blue-800" size={22} aria-hidden="true" />
              <h3 className="text-2xl font-semibold text-slate-950">Relacion altura - lateral</h3>
            </div>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-600">
              En Renovacion Urbana, el aislamiento lateral se exige desde{' '}
              <strong>{fmt(NORMATIVE_RULES.baseLateralOnsetHeight, 2)} m</strong> o desde el
              nivel de empate con edificaciones colindantes de mayor altura. Eso quiere decir
              que el primer piso no se retira lateralmente por esta regla.
            </p>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-600">
              El aislamiento lateral no se exige desde el primer piso: se activa cuando la altura
              acumulada del edificio alcanza o supera el umbral normativo.
            </p>
            <div className="mt-5">
              <ProjectSectionDiagram />
            </div>
          </section>

          <section className="rounded border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">
              Lectura por pisos
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950">
              Con el supuesto de 3,00 m por piso
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              La altura minima libre normativa para vivienda es 2,30 m, pero el estudio usa
              3,00 m por piso como supuesto preliminar porque una edificacion real tambien
              necesita placa, estructura, instalaciones y posibles cielos falsos.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-blue-50 text-blue-950">
                    <th className="border border-slate-200 p-3 font-semibold">Nivel</th>
                    <th className="border border-slate-200 p-3 font-semibold">
                      Altura acumulada
                    </th>
                    <th className="border border-slate-200 p-3 font-semibold">
                      Lectura de aislamiento lateral
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {floorRows.map(([level, height, reading]) => (
                    <tr key={level} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 p-3 font-semibold text-slate-950">
                        {level}
                      </td>
                      <td className="border border-slate-200 p-3 text-slate-700">{height}</td>
                      <td className="border border-slate-200 p-3 text-slate-700">{reading}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="rounded border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-amber-800" size={20} aria-hidden="true" />
              <h3 className="text-xl font-semibold text-slate-950">Clave del predio</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              El lote mide aproximadamente <strong>{fmt(SITE_CONSTANTS.width, 2)} m</strong>{' '}
              de ancho. Si arriba se exigen <strong>4,00 m</strong> por cada lado, quedan
              cerca de{' '}
              <strong>{fmt(SITE_CONSTANTS.width - NORMATIVE_RULES.minSideSetback * 2, 2)} m</strong>{' '}
              utiles en la franja superior.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Por eso el reto no es solo sumar pisos, sino que esos pisos sean funcionales,
              vendibles y licenciables.
            </p>
          </section>

          <section className="rounded border border-slate-200 bg-white p-5">
            <FileText className="text-blue-800" size={22} aria-hidden="true" />
            <h3 className="mt-3 text-xl font-semibold text-slate-950">Referencias del proyecto</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Revision documental: {PDF_SOURCE.revisionDate}. Esta web no reemplaza licencia,
              Curaduria, Aerocivil, topografia ni perfil vial oficial.
            </p>
            <div className="mt-4 grid gap-3">
              {sourceLinks.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target={source.href.startsWith('http') ? '_blank' : undefined}
                  rel={source.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="group rounded border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <strong className="block text-sm text-slate-950">{source.label}</strong>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        {source.note}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="shrink-0 text-slate-400 transition group-hover:text-blue-800"
                      size={16}
                      aria-hidden="true"
                    />
                  </span>
                </a>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
