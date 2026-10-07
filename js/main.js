"use strict";

// Change COMPANY_EMAIL here and the visible email links in both HTML files
// when the business moves to a domain email. No secrets belong in this file.
const COMPANY_EMAIL = "Precisetransfers1@gmail.com";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
document.querySelectorAll("[data-year]").forEach(el => { el.textContent = String(new Date().getFullYear()); });

const menuButton = document.querySelector(".menu-toggle");
const menu = document.getElementById("site-nav");
if (menuButton && menu) {
  menuButton.hidden = false;
  document.documentElement.classList.add("has-menu");
  const closeMenu = () => { menu.classList.remove("is-open"); menuButton.setAttribute("aria-expanded", "false"); };
  menuButton.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && menu.classList.contains("is-open")) { closeMenu(); menuButton.focus(); } });
}

const intro = document.querySelector(".logo-intro");
const INTRO_KEY = "precise-transfers-intro-v4";
(() => {
  const releaseBoot = () => {
    clearTimeout(window.preciseIntroFailsafe);
    document.documentElement.classList.remove("intro-boot");
  };
  let seen = false;
  try { seen = sessionStorage.getItem(INTRO_KEY) === "seen"; } catch {}
  if (!intro || seen || reducedMotion.matches) {
    if (intro) intro.hidden = true;
    releaseBoot(); return;
  }
  let timer;
  function finish() {
    clearTimeout(timer);
    intro.hidden = true;
    document.body.classList.remove("intro-running");
    releaseBoot();
    document.removeEventListener("keydown", skip);
  }
  function skip(event) { if (event.key === "Escape") finish(); }
  // Show the black intro immediately; do not wait for the logo's load event.
  intro.hidden = false;
  document.body.classList.add("intro-running");
  try { sessionStorage.setItem(INTRO_KEY, "seen"); } catch {}
  document.addEventListener("keydown", skip);
  intro.addEventListener("click", finish, { once: true });
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) finish(); });
  requestAnimationFrame(releaseBoot);
  timer = setTimeout(finish, 1550);
})();


if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  document.documentElement.classList.add("motion-ready");
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

// Slideshows: visible first image without JavaScript; controls when enhanced.
(() => {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const INTERVAL = 3000;
  const DURATION = 550;
  const fleet = document.getElementById("fleet-2021");
  const frame = fleet?.querySelector(".slides");
  if (frame && !frame.querySelector('img[src*="suburban-2021-marina"]')) {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.innerHTML = '<img src="assets/images/suburban-2021-marina.png" alt="Generated 2021 Suburban image at a marina" width="1672" height="941" loading="lazy">';
    frame.append(slide);
  }
  fleet?.closest("figure")?.querySelectorAll("figcaption").forEach(el => el.remove());
  document.querySelectorAll(".about-photo-grid figcaption").forEach(el => el.remove());

  const galleries = [...document.querySelectorAll("[data-slideshow]")].map(gallery => {
    const slides = [...gallery.querySelectorAll(".slide")];
    const controls = gallery.querySelector(".slideshow-controls");
    if (!slides.length || !controls) return null;
    gallery.querySelectorAll("[data-prev], [data-next], [data-play], .slide-count")
      .forEach(el => el.remove());
    const bars = gallery.querySelector(".slide-dots");
    if (!bars) return null;
    bars.replaceChildren();
    const state = { gallery, slides, current: 0, hover: false, focus: false,
      pointer: false, busy: false, animations: [] };

    function settle() {
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === state.current);
        slide.classList.remove("is-moving");
        slide.setAttribute("aria-hidden", String(i !== state.current));
      });
      [...bars.children].forEach((bar, i) => bar.setAttribute("aria-pressed", String(i === state.current)));
    }
    state.show = (index, direction = 1) => {
      if (state.busy) return;
      const next = (index + slides.length) % slides.length;
      if (next === state.current) return;
      const outgoing = slides[state.current], incoming = slides[next];
      state.current = next;
      if (motion.matches || !incoming.animate) { settle(); return; }
      state.busy = true;
      incoming.classList.add("is-moving");
      incoming.setAttribute("aria-hidden", "false");
      outgoing.setAttribute("aria-hidden", "true");
      const options = { duration: DURATION, easing: "cubic-bezier(.22,.61,.36,1)" };
      state.animations = [
        outgoing.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-direction * 100}%)` }], options),
        incoming.animate([{ transform: `translateX(${direction * 100}%)` }, { transform: "translateX(0)" }], options)
      ];
      Promise.allSettled(state.animations.map(a => a.finished)).then(() => {
        state.animations = []; state.busy = false; settle();
      });
    };
    slides.forEach((slide, i) => {
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
      const img = slide.querySelector("img");
      if (img) img.loading = "eager";
      const bar = document.createElement("button");
      bar.type = "button";
      bar.dataset.slide = String(i);
      bar.setAttribute("aria-label", `Show image ${i + 1}`);
      bar.addEventListener("click", event => {
        if (event.detail > 0) state.focus = false;
        state.pointer = false;
        state.show(i, i < state.current ? -1 : 1);
        restart();
      });
      bars.append(bar);
    });
    controls.hidden = slides.length < 2;
    gallery.addEventListener("pointerenter", e => { if(e.pointerType === "mouse") { state.hover = true; restart(); } });
    gallery.addEventListener("pointerleave", () => { state.hover = false; restart(); });
    gallery.addEventListener("pointerdown", () => { state.pointer = true; });
    gallery.addEventListener("focusin", () => { state.focus = !state.pointer; state.pointer = false; restart(); });
    gallery.addEventListener("focusout", () => setTimeout(() => {
      if (!gallery.contains(document.activeElement)) { state.focus = false; restart(); }
    }, 0));
    gallery.addEventListener("keydown", event => {
      state.pointer = false;
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault(); state.focus = true;
      state.show(state.current + (event.key === "ArrowRight" ? 1 : -1), event.key === "ArrowRight" ? 1 : -1);
      bars.children[state.current]?.focus(); restart();
    });
    settle();
    return state;
  }).filter(Boolean);

  let timer;
  function restart() {
    clearTimeout(timer);
    if (!galleries.length || motion.matches || document.hidden || galleries.some(g => g.hover || g.focus)) return;
    timer = setTimeout(() => {
      galleries.forEach(g => g.show(g.current + 1));
      restart();
    }, INTERVAL);
  }
  document.addEventListener("visibilitychange", restart);
  motion.addEventListener("change", () => {
    galleries.forEach(g => g.animations.forEach(a => a.finish()));
    restart();
  });
  restart();

  if (!document.querySelector(".whatsapp-float")) {
    const link = document.createElement("a");
    link.className = "whatsapp-float";
    link.href = "https://wa.me/16492453134?text=" + encodeURIComponent("Hello Precise Transfers, I would like to enquire about a transfer.");
    link.target = "_blank"; link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Chat with Precise Transfers on WhatsApp (opens a new tab)");
    link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .2 5.3.2 11.9c0 2.1.6 4.1 1.6 5.9L.1 24l6.4-1.7a12 12 0 0 0 5.6 1.4h.1c6.5 0 11.8-5.3 11.8-11.9 0-3.1-1.2-6.1-3.5-8.3ZM12.2 21.7a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.8 1 1-3.7-.3-.4a9.8 9.8 0 0 1-1.5-5.1C2.2 6.4 6.6 2 12.1 2a9.8 9.8 0 0 1 9.9 9.9c0 5.4-4.4 9.8-9.8 9.8Zm5.4-7.3c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.8-1.6-2.1-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4Z"/></svg><span>WhatsApp</span>';
    document.body.append(link);
  }
})();


const EXAMPLES = {
  'Airport arrival': 'Hello Precise Transfers, I would like an airport arrival transfer from PLS Airport to my accommodation. Please confirm availability and the total price for my trip.',
  'Airport departure': 'Hello Precise Transfers, I would like a departure transfer from my accommodation to PLS Airport. Please help me arrange a suitable pickup time for my flight.',
  'Airport round trip': 'Hello Precise Transfers, I would like to arrange airport arrival and departure transfers. Please confirm availability and a round-trip quote. I will provide both flight details and my accommodation.',
  'Island transfers — one way': 'Hello Precise Transfers, I would like a one-way island transfer. Please confirm availability and the price for my pickup and destination.',
  'Island transfers — round trip': 'Hello Precise Transfers, I would like a round-trip island transfer. Please confirm availability for the outward and return journeys and the total price.',
  'Concierge / transportation package': 'Hello Precise Transfers, I would like help arranging a transportation package and personalized concierge assistance during my stay. Please let me know the available options.'
};

function setupService(form) {
  const service = form.elements.namedItem('service');
  const pickup = form.elements.namedItem('pickup');
  const notes = form.elements.namedItem('notes');
  const example = form.querySelector('[data-example]');
  const query = new URLSearchParams(location.search);
  if (form.id === 'request-form') {
    for (const name of ['service', 'date', 'passengers']) {
      const field = form.elements.namedItem(name);
      if (field && query.has(name)) field.value = query.get(name);
    }
  }
  function update() {
    const text = EXAMPLES[service.value] || 'Hello Precise Transfers, I would like to enquire about transportation for my stay in Turks & Caicos. Please let me know how you can help.';
    if (example) example.textContent = text;
    // Never replace text that the visitor has edited.
    if (service.value && notes && (!notes.value.trim() || notes.value === notes.dataset.generated)) { notes.value = text; notes.dataset.generated = text; }
    if (pickup) {
      if (service.value === 'Airport arrival' && (!pickup.value.trim() || pickup.value === pickup.dataset.generated)) { pickup.value = 'PLS Airport'; pickup.dataset.generated = 'PLS Airport'; }
      else if (service.value !== 'Airport arrival' && pickup.value === pickup.dataset.generated) { pickup.value = ''; delete pickup.dataset.generated; }
    }
  }
  service.addEventListener('change', update);
  form.querySelector('[data-use-example]')?.addEventListener('click', () => {
    if (notes.value.trim() && notes.value !== notes.dataset.generated) {
      const status = form.querySelector('[data-form-status], #form-status');
      if (status) status.textContent = 'Your message has been kept. Clear it first if you want to use the example instead.';
      notes.focus(); return;
    }
    notes.value = example.textContent; notes.dataset.generated = notes.value; notes.focus();
  });
  update();
}

function emailDraft(form, isBooking) {
  const status = form.querySelector('[data-form-status], #form-status');
  const fallback = form.querySelector('[data-email-fallback], #email-fallback');
  const copyField = form.querySelector('[data-email-copy], #email-copy');
  const copyButton = form.querySelector('[data-copy-request], #copy-request');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const val = key => String(data.get(key) || '').trim();
    const lines = ['Hello Precise Transfers,', '', isBooking ? 'I would like to request availability and a quote:' : 'I would like to make an enquiry:', ''];
    const fields = isBooking ? [['service','Service'],['date','Pickup date'],['time','Pickup time (Turks & Caicos)'],['pickup','Pickup'],['dropoff','Drop-off'],['passengers','Passengers'],['luggage','Luggage']] : [['service','Service'],['pickup','Pickup']];
    for (const [key,label] of fields) if (val(key)) lines.push(`${label}: ${val(key)}`);
    lines.push(`Name: ${val('name')}`, `Email: ${val('email')}`);
    if (val('phone')) lines.push(`Phone: ${val('phone')}`);
    lines.push('', val('notes'));
    if (isBooking) lines.push('', 'I have read the booking policies and understand this is a request, not a confirmed booking.');
    copyField.value = lines.join('\n');
    fallback.hidden = false;
    status.textContent = `Your draft is ready. Review and send it in your email app, or copy it below and email ${COMPANY_EMAIL}. This website has not sent a message or confirmed a booking.`;
    const subject = (isBooking ? 'Transfer request' : 'Website enquiry') + (val('service') ? ' — ' + val('service') : '');
    window.location.href = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(copyField.value)}`;
  });
  copyButton.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copyField.value); status.textContent = `Copied. Paste into an email to ${COMPANY_EMAIL} and send it.`; }
    catch { copyField.focus(); copyField.select(); status.textContent = 'Draft selected. Use your device’s Copy action, then paste into your email.'; }
  });
}

for (const form of document.querySelectorAll('#request-form, #contact-form')) {
  setupService(form);
  if (form.id === 'request-form') {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Grand_Turk', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = key => parts.find(p => p.type === key).value;
    form.elements.namedItem('date').min = `${part('year')}-${part('month')}-${part('day')}`;
  }
  emailDraft(form, form.id === 'request-form');
}

document.querySelectorAll('#services, #fleet, .about-gallery-section').forEach(el => el.classList.add('section-divider'));
(() => {
  const hero = document.querySelector(".hero");
  const overlay = document.querySelector(".logo-intro");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!hero || motion.matches) return;
  let started = false;
  let observer;
  let fallback;
  hero.classList.add("hero-enter-pending");

  function revealHero() {
    if (started) return;
    started = true;
    clearTimeout(fallback);
    observer?.disconnect();
    hero.classList.remove("hero-enter-pending");
    if (!motion.matches) hero.classList.add("hero-enter");
  }
  function checkIntro() {
    if (!overlay || overlay.hidden || motion.matches) revealHero();
  }
  if (overlay) {
    observer = new MutationObserver(checkIntro);
    observer.observe(overlay, { attributes: true, attributeFilter: ["hidden"] });
  }
  motion.addEventListener("change", checkIntro);
  // The logo's load handler runs before the window load event.
  if (document.readyState === "complete") checkIntro();
  else window.addEventListener("load", checkIntro, { once: true });
  fallback = setTimeout(revealHero, 8000);
})();

