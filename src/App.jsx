import Header from './components/Header'
import './App.css'

function App() {
  return (
    <div>
      <Header />

      <main style={{ padding: '2rem' }}>
        <h1>Welcome to my portfolio</h1>
        <p>This is your app content rendered below the header.</p>
      </main>
    </div>
  )
}

export default App
