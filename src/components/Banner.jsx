function TrophySVG() {
  return (
    <svg width="54" height="64" viewBox="0 0 54 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* cup body */}
      <path d="M14 4h26v18c0 11-5.5 20-13 24v6h4v4H23v-4h4v-6C19.5 42 14 33 14 22V4Z" fill="#f0b429" />
      {/* left handle */}
      <path d="M14 7H6C6 20 10 25 14 25" stroke="#f0b429" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* right handle */}
      <path d="M40 7h8c0 13-4 18-8 18" stroke="#f0b429" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* base plate */}
      <rect x="18" y="56" width="18" height="4" rx="2" fill="#f0b429" />
      {/* stem */}
      <rect x="24" y="52" width="6" height="5" fill="#f0b429" />
      {/* shine */}
      <path d="M20 8 Q23 22 20 30" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function Banner() {
  return (
    <div className="banner">
      {/* background decorative blobs */}
      <div className="banner-blob banner-blob-l" />
      <div className="banner-blob banner-blob-r" />

      <div className="banner-inner">
        <div className="banner-left">
          <TrophySVG />
          <div className="banner-titles">
            <div className="banner-title">
              Fantamondiale
              <span className="banner-year"> 2026</span>
            </div>
            <div className="banner-sub">FIFA World Cup · USA · Canada · Messico</div>
          </div>
        </div>

        <div className="banner-right">
          <div className="banner-host-flags">🇺🇸 🇨🇦 🇲🇽</div>
          <div className="banner-edition">48 nazionali · 104 partite</div>
        </div>
      </div>
    </div>
  )
}
