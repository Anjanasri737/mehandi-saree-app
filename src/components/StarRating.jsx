function StarRating({ rating }) {
  const fullStars = Math.round(rating)
  return (
    <span style={{ color: '#B08D57', letterSpacing: '2px' }}>
      {'★'.repeat(fullStars)}
      {'☆'.repeat(5 - fullStars)}
    </span>
  )
}

export default StarRating