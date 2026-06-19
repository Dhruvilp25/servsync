import Nav from './components/Nav'
import Hero from './components/Hero'
import Metrics from './components/Metrics'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Architecture from './components/Architecture'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Metrics />
        <Features />
        <HowItWorks />
        <Architecture />
      </main>
      <Footer />
    </>
  )
}
