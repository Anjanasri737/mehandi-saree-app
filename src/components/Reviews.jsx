import StarRating from './StarRating'
import { sampleReviews } from '../data/sampleReviews'
import './Reviews.css'

function Reviews() {
  const totalReviews = sampleReviews.length
  const averageRating =
    sampleReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews

  return (
    <section id="reviews" className="reviews">
      <div className="reviews-inner">
        <h2>Customer Reviews</h2>

        <div className="reviews-summary">
          <StarRating rating={averageRating} />
          <span className="reviews-average">{averageRating.toFixed(1)} average</span>
          <span className="reviews-total">({totalReviews} reviews)</span>
        </div>

        <div className="review-cards">
          {sampleReviews.map((review) => (
            <div className="review-card" key={review.id}>
              <StarRating rating={review.rating} />
              <p className="review-text">"{review.text}"</p>
              <p className="review-name">— {review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Reviews