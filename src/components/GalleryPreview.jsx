import GalleryCard from './GalleryCard'
import './GalleryPreview.css'

function GalleryPreview({ id, title, items, viewAllHref, viewAllLabel }) {
  return (
    <section id={id} className="gallery-preview">
      <div className="gallery-preview-inner">
        <h2>{title}</h2>

        <div className="gallery-grid">
          {items.map((item) => (
            <GalleryCard key={item.id} image={item.image} title={item.title} category={item.category} />
          ))}
        </div>

        <a href={viewAllHref} className="btn btn-outline view-all-btn">{viewAllLabel}</a>
      </div>
    </section>
  )
}

export default GalleryPreview