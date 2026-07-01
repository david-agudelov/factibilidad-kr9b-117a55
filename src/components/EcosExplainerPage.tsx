import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  ExternalLink,
  FileText,
  Scale,
  ShieldAlert,
} from 'lucide-react'
import { NORMATIVE_RULES, SITE_CONSTANTS } from '../model/projectSource'

type SourceLink = {
  title: string
  description: string
  href: string
  group: 'ECOS' | 'POT y decretos' | 'Normas del informe'
}

const sourceLinks: SourceLink[] = [
  {
    title: 'Manual ECOS',
    description: 'Manual de Ecourbanismo y Construccion Sostenible.',
    href: 'https://www.sdp.gov.co/sites/default/files/manual_ecourb_const.pdf',
    group: 'ECOS',
  },
  {
    title: 'Decreto 582 de 2023',
    description: 'Reglamenta Ecourbanismo y Construccion Sostenible.',
    href: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=151925',
    group: 'ECOS',
  },
  {
    title: 'Micrositio SDP - Decreto 582',
    description: 'Pagina de reglamentacion POT sobre ECOS.',
    href: 'https://www.sdp.gov.co/micrositios/pot/reglamentacion/decreto/decreto-582-de-2023-ecourbanismo-y-construccion-sostenible',
    group: 'ECOS',
  },
  {
    title: 'Nota oficial Ambiente',
    description: 'Presentacion distrital del Manual ECOS.',
    href: 'https://www.ambientebogota.gov.co/archivo-de-noticias/-/asset_publisher/zgSxIlLEtEx3/content/manual-de-ecourbanismo-y-construccion-sostenible',
    group: 'ECOS',
  },
  {
    title: 'Decreto 555 de 2021',
    description: 'Adopta la revision general del POT de Bogota.',
    href: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=119582',
    group: 'POT y decretos',
  },
  {
    title: 'Decreto 670 de 2025',
    description: 'Compilacion vigente POT citada en el informe.',
    href: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=191905',
    group: 'POT y decretos',
  },
  {
    title: 'Decreto 229 de 2026',
    description: 'Control normativo posterior al corte anterior.',
    href: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?dt=S&i=193455',
    group: 'POT y decretos',
  },
  {
    title: 'Anexo 5 actualizado',
    description: 'Manual de normas comunes a tratamientos urbanisticos.',
    href: 'https://www.sdp.gov.co/sites/default/files/actualiza_anexo_5_man_normas_trat_urb.pdf',
    group: 'Normas del informe',
  },
  {
    title: 'Cartilla ilustrada 2026',
    description: 'Manual de normas comunes, soporte grafico de interpretacion.',
    href: 'https://www.sdp.gov.co/sites/default/files/manual_de_normas_comunes_cartilla_ilustrada_2026.pdf',
    group: 'Normas del informe',
  },
]

const ecosTopics = [
  {
    id: 'thermal',
    label: 'Control termico',
    description: 'Control solar, sombra y reduccion de sobrecalentamiento.',
    metric: 'Menos carga termica',
  },
  {
    id: 'light',
    label: 'Confort luminico',
    description: 'Entrada de luz natural sin deslumbramiento excesivo.',
    metric: 'Mejor luz util',
  },
  {
    id: 'acoustic',
    label: 'Confort acustico',
    description: 'Control de ruido urbano y separacion entre fuentes sensibles.',
    metric: 'Menos ruido interior',
  },
  {
    id: 'air',
    label: 'Calidad del aire',
    description: 'Ventilacion, renovacion y reduccion de contaminantes interiores.',
    metric: 'Aire mas saludable',
  },
  {
    id: 'greenery',
    label: 'Reverdecimiento',
    description: 'Cubiertas, patios, antejardines y vegetacion funcional.',
    metric: 'Mas cobertura vegetal',
  },
  {
    id: 'water',
    label: 'Eficiencia en agua',
    description: 'Ahorro, aprovechamiento de lluvia y reduccion de consumo.',
    metric: 'Menor demanda hidrica',
  },
  {
    id: 'energy',
    label: 'Eficiencia energetica',
    description: 'Menor consumo operacional y soporte a sistemas eficientes.',
    metric: 'Menor demanda electrica',
  },
  {
    id: 'materials',
    label: 'Materiales sostenibles',
    description: 'Seleccion responsable, durabilidad y menor impacto de obra.',
    metric: 'Menor impacto material',
  },
] 

const groupedSources = sourceLinks.reduce<Record<SourceLink['group'], SourceLink[]>>(
  (acc, source) => {
    acc[source.group].push(source)
    return acc
  },
  { ECOS: [], 'POT y decretos': [], 'Normas del informe': [] },
)

function SourceCard({ source }: { source: SourceLink }) {
  return (
    <a
      href={source.href}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-28 flex-col justify-between rounded border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-600 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
    >
      <span>
        <span className="flex items-start justify-between gap-3">
          <strong className="text-sm font-semibold text-slate-950">{source.title}</strong>
          <ExternalLink
            className="mt-0.5 shrink-0 text-slate-400 transition group-hover:text-emerald-700"
            size={16}
            aria-hidden="true"
          />
        </span>
        <span className="mt-2 block text-xs leading-5 text-slate-600">{source.description}</span>
      </span>
      <span className="mt-3 text-xs font-semibold text-emerald-800">Abrir fuente oficial</span>
    </a>
  )
}

function EcosTopicGraphic({ id }: { id: string }) {
  const common = {
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 3,
  }

  return (
    <svg
      viewBox="0 0 260 150"
      role="img"
      aria-label={`Diagrama ${id}`}
      className="h-32 w-full overflow-visible"
    >
      <rect x="1" y="1" width="258" height="148" rx="10" fill="#fffdf8" stroke="#d6dfd7" />
      {id === 'thermal' ? (
        <>
          <circle cx="52" cy="42" r="17" fill="#f59e0b" opacity="0.9" />
          <path d="M52 12v11M52 61v12M22 42h12M70 42h13M30 20l8 8M72 20l-8 8" stroke="#b45309" {...common} />
          <path d="M105 122V55h96v67" fill="#f8fafc" stroke="#334155" {...common} />
          <path d="M105 72h96M105 91h96M105 110h96" stroke="#94a3b8" strokeWidth="2" />
          <path d="M86 57h134" stroke="#166534" strokeWidth="5" />
          <path d="M92 61c25 17 48 22 75 20" fill="none" stroke="#f97316" strokeDasharray="7 7" {...common} />
          <text x="88" y="34" fill="#166534" fontSize="13" fontWeight="700">
            sombra + envolvente
          </text>
        </>
      ) : null}
      {id === 'light' ? (
        <>
          <path d="M72 28h91v94H72z" fill="#f8fafc" stroke="#334155" {...common} />
          <path d="M97 48h38v37H97z" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <path d="M135 48l78 20M135 64l78 19M135 84l78 18" stroke="#f59e0b" strokeWidth="3" opacity="0.75" />
          <path d="M54 122h145" stroke="#334155" strokeWidth="3" />
          <circle cx="217" cy="53" r="11" fill="#fbbf24" />
          <text x="82" y="28" fill="#1d4ed8" fontSize="13" fontWeight="700">
            luz natural controlada
          </text>
        </>
      ) : null}
      {id === 'acoustic' ? (
        <>
          <path d="M58 117V38h56v79" fill="#f8fafc" stroke="#334155" {...common} />
          <path d="M137 117V38h18v79" fill="#e2e8f0" stroke="#64748b" {...common} />
          <path d="M176 52c14 10 14 30 0 40M196 42c24 20 24 48 0 68" fill="none" stroke="#dc2626" {...common} />
          <path d="M121 48c-17 14-17 42 0 57" fill="none" stroke="#16a34a" strokeDasharray="5 6" {...common} />
          <path d="M57 78h57" stroke="#94a3b8" strokeWidth="2" />
          <text x="48" y="30" fill="#991b1b" fontSize="13" fontWeight="700">
            ruido urbano
          </text>
        </>
      ) : null}
      {id === 'air' ? (
        <>
          <path d="M72 118V47h111v71" fill="#f8fafc" stroke="#334155" {...common} />
          <path d="M72 77h111M105 47v71M150 47v71" stroke="#cbd5e1" strokeWidth="2" />
          <path d="M37 76h63M88 64l14 12-14 12" fill="none" stroke="#0284c7" {...common} />
          <path d="M137 98h77M202 86l14 12-14 12" fill="none" stroke="#0284c7" {...common} />
          <path d="M118 70c18-20 40-20 57-2" fill="none" stroke="#0f766e" strokeDasharray="7 7" {...common} />
          <text x="76" y="31" fill="#0369a1" fontSize="13" fontWeight="700">
            ventilacion y renovacion
          </text>
        </>
      ) : null}
      {id === 'greenery' ? (
        <>
          <path d="M69 120V68h122v52" fill="#f8fafc" stroke="#334155" {...common} />
          <path d="M58 66h144" stroke="#166534" strokeWidth="6" />
          <path d="M77 62c8-18 25-18 33 0M121 62c8-23 32-23 40 0M174 62c6-15 19-15 26 0" fill="#bbf7d0" stroke="#166534" {...common} />
          <path d="M70 120h138" stroke="#334155" strokeWidth="3" />
          <path d="M42 119c0-25 17-43 37-43M42 119c12-5 24-16 28-36" fill="none" stroke="#15803d" {...common} />
          <text x="88" y="35" fill="#166534" fontSize="13" fontWeight="700">
            vegetacion funcional
          </text>
        </>
      ) : null}
      {id === 'water' ? (
        <>
          <path d="M71 55h114l-20 35H91z" fill="#e0f2fe" stroke="#0369a1" {...common} />
          <path d="M92 90v31h72V90" fill="#f8fafc" stroke="#334155" {...common} />
          <path d="M57 23c0 12-9 17-9 27a9 9 0 0 0 18 0c0-10-9-15-9-27ZM128 19c0 12-9 17-9 27a9 9 0 0 0 18 0c0-10-9-15-9-27ZM198 28c0 11-8 16-8 25a8 8 0 0 0 16 0c0-9-8-14-8-25Z" fill="#38bdf8" opacity="0.85" />
          <path d="M164 106h33v-20h24" fill="none" stroke="#0284c7" {...common} />
          <text x="78" y="139" fill="#0369a1" fontSize="13" fontWeight="700">
            captacion + ahorro
          </text>
        </>
      ) : null}
      {id === 'energy' ? (
        <>
          <path d="M66 101l28-54h89l27 54z" fill="#dbeafe" stroke="#1d4ed8" {...common} />
          <path d="M86 65h106M76 83h126M105 48l-17 53M137 48v53M169 48l17 53" stroke="#60a5fa" strokeWidth="2" />
          <path d="M130 44l-17 35h25l-12 36 34-49h-25l14-22z" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
          <path d="M52 118h157" stroke="#334155" strokeWidth="3" />
          <text x="76" y="31" fill="#1d4ed8" fontSize="13" fontWeight="700">
            menor consumo operativo
          </text>
        </>
      ) : null}
      {id === 'materials' ? (
        <>
          <path d="M58 106h54v23H58zM112 106h54v23h-54zM166 106h36v23h-36zM83 80h54v23H83zM137 80h54v23h-54zM108 54h54v23h-54z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          <path d="M182 45c24 16 28 48 9 70M184 45l-2 21 19-10M55 98c-10-28 5-57 32-66M55 98l17-12-20-9" fill="none" stroke="#15803d" {...common} />
          <text x="75" y="34" fill="#166534" fontSize="13" fontWeight="700">
            seleccion responsable
          </text>
        </>
      ) : null}
    </svg>
  )
}

function SectionDiagram() {
  const baseY = 260
  const scale = 10
  const baseThreshold = baseY - NORMATIVE_RULES.baseLateralOnsetHeight * scale
  const ecosThreshold = baseY - NORMATIVE_RULES.ecosLateralOnsetHeight * scale

  return (
    <div className="rounded border border-slate-200 bg-[#fffdf8] p-3 sm:p-4">
      <svg
        viewBox="0 0 760 330"
        role="img"
        aria-label="Comparacion vertical del arranque de aislamiento lateral en modo base y modo ECOS"
        className="h-auto w-full"
      >
        <rect width="760" height="330" rx="8" fill="#fffdf8" />
        <line x1="55" y1={baseY} x2="330" y2={baseY} stroke="#1f2937" strokeWidth="2" />
        <line x1="430" y1={baseY} x2="705" y2={baseY} stroke="#1f2937" strokeWidth="2" />
        {[0, 3, 6, 9, 12, 15, 18, 21].map((height) => (
          <g key={height}>
            <line
              x1="65"
              y1={baseY - height * scale}
              x2="330"
              y2={baseY - height * scale}
              stroke="#e2e8f0"
            />
            <text x="25" y={baseY - height * scale + 4} fontSize="11" fill="#64748b">
              {height} m
            </text>
            <line
              x1="430"
              y1={baseY - height * scale}
              x2="695"
              y2={baseY - height * scale}
              stroke="#e2e8f0"
            />
          </g>
        ))}

        <text x="116" y="36" fontSize="18" fontWeight="700" fill="#991b1b">
          Modo base
        </text>
        <text x="498" y="36" fontSize="18" fontWeight="700" fill="#166534">
          Modo ECOS
        </text>

        <polygon
          points={`135,${baseY} 135,${baseThreshold} 170,${baseThreshold} 170,70 255,70 255,${baseThreshold} 290,${baseThreshold} 290,${baseY}`}
          fill="#f8fafc"
          stroke="#334155"
          strokeWidth="2"
        />
        <polygon
          points={`510,${baseY} 510,${ecosThreshold} 545,${ecosThreshold} 545,70 630,70 630,${ecosThreshold} 665,${ecosThreshold} 665,${baseY}`}
          fill="#f8fafc"
          stroke="#334155"
          strokeWidth="2"
        />

        {[95, 120, 145, 170, 195, 220, 245].map((y) => (
          <g key={y}>
            <line x1="135" y1={y} x2="290" y2={y} stroke="#94a3b8" />
            <line x1="510" y1={y} x2="665" y2={y} stroke="#94a3b8" />
          </g>
        ))}

        <line
          x1="80"
          y1={baseThreshold}
          x2="320"
          y2={baseThreshold}
          stroke="#dc2626"
          strokeDasharray="6 5"
          strokeWidth="2"
        />
        <line
          x1="455"
          y1={ecosThreshold}
          x2="695"
          y2={ecosThreshold}
          stroke="#15803d"
          strokeDasharray="6 5"
          strokeWidth="2"
        />

        <line x1="316" y1={baseY} x2="316" y2={baseThreshold} stroke="#dc2626" strokeWidth="2" />
        <polygon points={`316,${baseThreshold} 310,${baseThreshold + 12} 322,${baseThreshold + 12}`} fill="#dc2626" />
        <polygon points={`316,${baseY} 310,${baseY - 12} 322,${baseY - 12}`} fill="#dc2626" />
        <text x="222" y={baseThreshold - 10} fontSize="15" fontWeight="700" fill="#dc2626">
          desde 11,40 m
        </text>

        <line x1="690" y1={baseY} x2="690" y2={ecosThreshold} stroke="#15803d" strokeWidth="2" />
        <polygon points={`690,${ecosThreshold} 684,${ecosThreshold + 12} 696,${ecosThreshold + 12}`} fill="#15803d" />
        <polygon points={`690,${baseY} 684,${baseY - 12} 696,${baseY - 12}`} fill="#15803d" />
        <text x="584" y={ecosThreshold - 10} fontSize="15" fontWeight="700" fill="#15803d">
          desde 15,70 m
        </text>

        <text x="104" y="296" fontSize="12" fill="#475569">
          El aislamiento lateral se activa antes.
        </text>
        <text x="486" y="296" fontSize="12" fill="#475569">
          El aislamiento lateral se activa mas arriba.
        </text>
      </svg>
    </div>
  )
}

export function EcosExplainerPage() {
  return (
    <section className="min-h-[calc(100dvh-116px)] bg-[#eef3f8] px-4 py-5 sm:px-6">
      <div className="mx-auto grid max-w-[1800px] gap-5 xl:grid-cols-[minmax(0,1.08fr)_420px]">
        <div className="grid gap-5">
          <section className="rounded border border-slate-200 bg-[#fffdf8] p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                  Pestaña explicativa
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                  Modo ECOS
                </h2>
                <p className="mt-2 text-xl font-medium text-emerald-800">
                  Ecourbanismo y Construccion Sostenible
                </p>
                <p className="mt-4 max-w-4xl text-base leading-7 text-slate-700">
                  ECOS es la reglamentacion tecnica del POT de Bogota para incorporar
                  criterios de sostenibilidad urbana y edificatoria en proyectos de obra
                  nueva. En este caso se presenta como una sensibilidad normativa para
                  estudiar el predio {SITE_CONSTANTS.name}, no como licencia ni derecho
                  adquirido.
                </p>
              </div>
              <div className="grid min-w-64 gap-2 rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert size={18} aria-hidden="true" />
                  Condicion de uso
                </div>
                <p className="leading-6">
                  Requiere verificacion oficial de Curaduria, SDP u otra autoridad
                  competente para este predio especifico.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded border border-slate-200 bg-white p-5">
              <BookOpen className="text-emerald-800" size={26} aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Origen</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Viene del Manual de Ecourbanismo y Construccion Sostenible, conocido como
                Manual ECOS.
              </p>
            </article>
            <article className="rounded border border-slate-200 bg-white p-5">
              <Scale className="text-emerald-800" size={26} aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Base legal</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                El Decreto Distrital 582 de 2023 reglamenta las disposiciones de
                Ecourbanismo y Construccion Sostenible del POT.
              </p>
            </article>
            <article className="rounded border border-slate-200 bg-white p-5">
              <BadgeCheck className="text-emerald-800" size={26} aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Entidades</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Fue presentado por las Secretarias Distritales de Ambiente, Planeacion y
                Habitat.
              </p>
            </article>
          </section>

          <section className="rounded border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                  Contenido tecnico
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                  Sobre que trata ECOS
                </h3>
              </div>
              <a
                href="#ecos-fuentes"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
              >
                Ver fuentes
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div
              className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4"
              data-testid="ecos-topic-grid"
            >
              {ecosTopics.map((topic) => (
                <article
                  key={topic.id}
                  className="group grid min-h-[300px] gap-3 rounded border border-slate-200 bg-[#fffdf8] p-4 transition hover:border-emerald-600 hover:bg-emerald-50/50"
                >
                  <EcosTopicGraphic id={topic.id} />
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-base font-semibold text-slate-950">{topic.label}</h4>
                      <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-800">
                        ECOS
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{topic.description}</p>
                    <p className="mt-3 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-700">
                      {topic.metric}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Aplicacion al caso
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950">
              Que cambia en el modelo
            </h3>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-600">
              Para {SITE_CONSTANTS.name}, Modo ECOS no modifica el area del lote, el ancho,
              el fondo ni el techo preliminar de ICe 5,0. Lo que se evalua es la altura de
              activacion del aislamiento lateral: de 11,40 m en modo base a 15,70 m en
              sensibilidad ECOS, siempre condicionado a confirmacion oficial.
            </p>
            <div className="mt-5">
              <SectionDiagram />
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="rounded border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Proyecto
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{SITE_CONSTANTS.name}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded bg-slate-50 p-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-slate-500">Area</dt>
                <dd className="mt-1 font-semibold text-slate-950">326,184 m2</dd>
              </div>
              <div className="rounded bg-slate-50 p-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-slate-500">ICe</dt>
                <dd className="mt-1 font-semibold text-slate-950">5,0</dd>
              </div>
              <div className="rounded bg-slate-50 p-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-slate-500">Ancho</dt>
                <dd className="mt-1 font-semibold text-slate-950">12,992 m</dd>
              </div>
              <div className="rounded bg-slate-50 p-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-slate-500">Fondo</dt>
                <dd className="mt-1 font-semibold text-slate-950">25,108 m</dd>
              </div>
            </dl>
          </section>

          <section id="ecos-fuentes" className="rounded border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <FileText className="text-emerald-800" size={20} aria-hidden="true" />
              <h3 className="text-xl font-semibold text-slate-950">Fuentes principales</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Links oficiales usados para explicar ECOS, POT y las normas referenciadas en
              la infografia.
            </p>
            <div className="mt-5 grid gap-5">
              {Object.entries(groupedSources).map(([group, sources]) => (
                <div key={group}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {group}
                  </h4>
                  <div className="grid gap-3">
                    {sources.map((source) => (
                      <SourceCard key={source.href} source={source} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
