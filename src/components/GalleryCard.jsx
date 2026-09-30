import './GalleryCard.css'

function GalleryCard({ image, title, category }) {
  return (
    <div className="gallery-card">
      <img src={image} alt={title} />
      <div className="gallery-card-info">
        <span className="gallery-card-category">{category}</span>
        <h4>{title}</h4>
      </div>
    </div>
  )
}

export default GalleryCard