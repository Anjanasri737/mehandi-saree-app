import './Services.css'

function Services() {
  const mehandiTypes = [
    'Bridal Mehandi',
    'Arabic Mehandi',
    'Simple Mehandi',
    'Traditional Mehandi',
    'Festival Mehandi',
    'Custom Mehandi',
  ]

  const sareeTypes = [
    'Saree Pre-Pleating',
    'Hanger Pleating',
    'Box Pleats',
    'Traditional Pleating',
    'Wedding Saree Preparation',
    'Party Wear Saree Preparation',
  ]

  return (
    <section id="services" className="services">
      <div className="services-inner">
        <h2>Our Services</h2>

        <div className="service-cards">
          <div className="service-card">
            <h3>🌿 Mehandi</h3>
            <ul>
              {mehandiTypes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a href="#booking" className="btn btn-primary">Book Mehandi</a>
          </div>

          <div className="service-card">
            <h3>🥻 Saree Pre-Pleating</h3>
            <ul>
              {sareeTypes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a href="#booking" className="btn btn-primary">Book Saree Pre-Pleating</a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Services