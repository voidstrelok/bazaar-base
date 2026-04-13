export default function AboutSection() {
  return (
    <section className="bg-dark-bg py-20 px-4">
      <div className="max-w-6xl mx-auto md:grid md:grid-cols-2 md:gap-16 items-center">
        {/* Text column */}
        <div className="flex flex-col gap-6">
          {/* EDITABLE: about title, description, image */}
          <h2 className="text-3xl md:text-4xl font-extrabold text-dark-text">
            Nuestra <span className="text-brand">historia</span>
          </h2>
          <p className="text-dark-muted text-lg leading-relaxed">
            Cada negocio tiene una historia que merece ser contada. Esta tienda es el espacio para
            contarla: muestra lo que vendes, refleja quién eres y ofrece a tus clientes una
            experiencia de compra cómoda, segura y a tu medida. Porque vender online no debería ser
            complicado.
          </p>
        </div>

        {/* Image placeholder column */}
        <div className="mt-10 md:mt-0">
          <div className="w-full h-72 md:h-80 bg-dark-surface-2 rounded-2xl border border-brand/10 flex items-center justify-center">
            <span className="text-dark-muted text-sm">Imagen de la tienda</span>
          </div>
        </div>
      </div>
    </section>
  );
}
