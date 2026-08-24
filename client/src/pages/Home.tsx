/* Touchline Editorial: documentary sports imagery, offset rails, forest green + Santo Lime + matchday orange. */
import { ArrowUpRight, ChevronRight, Instagram, MapPin, Menu, Phone, Shield, Trophy, Users, X } from "lucide-react";
import { useState } from "react";

const heroImage = "/manus-storage/santo-soka-hero_11ad5ac5.jpg";
const trainingImage = "/manus-storage/santo-soka-training_aa1b73a9.jpg";
const matchdayImage = "/manus-storage/santo-soka-matchday_5980d90e.jpg";
const markImage = "/manus-storage/santo-soka-mark_f519dec8.png";

const teams = [
  { age: "U6–U8", title: "First touch", text: "Joy, movement, and the confidence to fall in love with the ball." },
  { age: "U10–U12", title: "Build the game", text: "Technical habits, teamwork, and the foundations of match intelligence." },
  { age: "U13–U16", title: "Find your edge", text: "Competitive development for players ready to sharpen their identity." },
  { age: "U18–Senior", title: "Step forward", text: "A focused pathway for players preparing for the next level." },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Santo Soka Academy home">
          <span className="brand-mark"><img src={markImage} alt="" /></span>
          <span><strong>SANTO SOKA</strong><small>ACADEMY · NAIROBI</small></span>
        </a>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
          <a href="#pathway" onClick={() => setMenuOpen(false)}>Pathway</a>
          <a href="#academy" onClick={() => setMenuOpen(false)}>Academy</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Matchday</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <a className="header-cta" href="#contact">Book a trial <ArrowUpRight size={16} /></a>
        <button className="menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <img className="hero-image" src={heroImage} alt="Young Santo Soka players sprinting on a football pitch" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow light"><span className="eyebrow-dot" /> Dagoretti Green Santos FC · Nairobi</p>
            <h1>Find your<br /><em>next level.</em></h1>
            <p className="hero-copy">A football academy for young players who want to grow with purpose, compete with courage, and belong to something bigger.</p>
            <div className="hero-actions"><a className="button button-lime" href="#contact">Start your journey <ArrowUpRight size={17} /></a><a className="text-link light" href="#pathway">Explore the pathway <ChevronRight size={17} /></a></div>
          </div>
          <div className="hero-stamp"><span>SS</span><small>Since<br />2018</small></div>
          <div className="hero-caption">01 / The work starts here</div>
        </section>

        <section className="intro-band" id="academy">
          <div className="section-kicker"><span>01</span><i /> About the academy</div>
          <div className="intro-grid">
            <h2>More than<br /><span>a team.</span></h2>
            <div className="intro-copy"><p>Santo Soka Academy is the youth arm of Dagoretti Green Santos FC, developing players from Under-6 through the Senior team in the heart of Nairobi.</p><p>We believe the best football education gives a young player both a sharper game and a stronger sense of self.</p><a className="text-link dark" href="#contact">Meet the academy <ChevronRight size={17} /></a></div>
          </div>
          <div className="stat-row"><div><strong>U6</strong><span>to Senior</span></div><div><strong>01</strong><span>shared pathway</span></div><div><strong>∞</strong><span>room to grow</span></div></div>
        </section>

        <section className="image-story">
          <div className="story-image-wrap"><img src={trainingImage} alt="Young players working through a training drill" /><span className="image-note">Training ground / Dagoretti</span></div>
          <div className="story-panel"><p className="eyebrow">02 / The method</p><h2>Bring your boots.<br /><span>We’ll bring the pathway.</span></h2><p>From first touch to matchday decisions, our coaches create a focused, supportive environment where players can learn the game properly and enjoy the work.</p><a className="button button-dark" href="#contact">Ask about training <ArrowUpRight size={17} /></a></div>
        </section>

        <section className="pathway" id="pathway">
          <div className="pathway-heading"><div className="section-kicker"><span>03</span><i /> Player pathway</div><h2>Every age.<br /><em>One direction.</em></h2><p>Different stages. The same commitment to brave, thoughtful football.</p></div>
          <div className="team-list">{teams.map((team, index) => <article className="team-row" key={team.age}><div className="team-number">0{index + 1}</div><div className="team-age">{team.age}</div><div className="team-info"><h3>{team.title}</h3><p>{team.text}</p></div><ChevronRight className="row-arrow" size={22} /></article>)}</div>
        </section>

        <section className="matchday" id="gallery"><div className="matchday-image"><img src={matchdayImage} alt="Santo Soka player striking the ball during a match" /><div className="matchday-tag">Matchday / 04</div></div><div className="matchday-copy"><p className="eyebrow">04 / In the frame</p><h2>Play with<br /><em>presence.</em></h2><p>Every session is a chance to make the next decision better. Every match is a chance to show what the work has made possible.</p><a className="text-link light" href="#contact">See the academy in action <ChevronRight size={17} /></a></div></section>

        <section className="contact-section" id="contact"><div className="contact-intro"><div className="section-kicker"><span>05</span><i /> Your next move</div><h2>Ready when<br /><em>you are.</em></h2><p>Bring your questions, your ambition, and a pair of boots. Reach out to find the right next step for your player.</p></div><div className="contact-card"><div className="contact-item"><Phone size={19} /><div><small>Call or WhatsApp</small><a href="tel:+254700000000">+254 700 000 000</a></div></div><div className="contact-item"><MapPin size={19} /><div><small>Based in</small><strong>Dagoretti, Nairobi</strong></div></div><div className="contact-item"><Instagram size={19} /><div><small>Follow the journey</small><a href="https://instagram.com" target="_blank" rel="noreferrer">@santosokaacademy</a></div></div><a className="button button-lime full" href="mailto:info@santosokaacademy.com">Register for a trial <ArrowUpRight size={17} /></a></div></section>
      </main>

      <footer className="site-footer"><a className="brand" href="#top"><span className="brand-mark"><img src={markImage} alt="" /></span><span><strong>SANTO SOKA</strong><small>ACADEMY · NAIROBI</small></span></a><div className="footer-meta"><span>© 2026 Santo Soka Academy</span><span>Youth arm of Dagoretti Green Santos FC</span></div><div className="footer-icons"><Shield size={19} /><Trophy size={19} /><Users size={19} /></div></footer>
    </div>
  );
}
