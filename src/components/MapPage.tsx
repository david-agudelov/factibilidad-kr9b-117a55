const mapSrc = `${import.meta.env.BASE_URL}static/mapa-barrio/index.html`

export function MapPage() {
  return (
    <section className="mx-auto h-[calc(100dvh-104px)] max-w-[1800px] px-4 py-3 sm:px-6">
      <iframe
        className="h-full min-h-[680px] w-full overflow-hidden rounded-md border border-slate-200 bg-white"
        src={mapSrc}
        title="Mapa barrio Santa Barbara Central"
      />
    </section>
  )
}
