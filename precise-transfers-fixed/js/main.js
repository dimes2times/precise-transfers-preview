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
const INTRO_KEY = "precise-transfers-intro-v1";
if (intro && !reducedMotion.matches) {
  let alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem(INTRO_KEY) === "seen"; } catch { /* File previews may restrict storage. */ }
  if (!alreadySeen) {
    const logo = intro.querySelector("img");
    const showIntro = () => {
      if (reducedMotion.matches || !logo.naturalWidth) return;
      intro.hidden = false;
      document.body.classList.add("intro-running");
      try { sessionStorage.setItem(INTRO_KEY, "seen"); } catch { /* Still usable without storage. */ }
      setTimeout(() => { intro.hidden = true; document.body.classList.remove("intro-running"); }, 1900);
    };
    if (logo.complete) showIntro(); else logo.addEventListener("load", showIntro, { once: true });
  }
}

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  document.documentElement.classList.add("motion-ready");
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

const form = document.getElementById("request-form");
if (form) {
  const query = new URLSearchParams(location.search);
  for (const key of ["service", "date", "passengers"]) { const field=form.elements.namedItem(key); if(query.has(key)&&field) field.value=query.get(key); }
  const dateField = document.getElementById("travel-date");
  // Use the destination's date, not the visitor's timezone, for pickup dates.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = name => parts.find(p => p.type === name).value;
  dateField.min = `${part("year")}-${part("month")}-${part("day")}`;
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = name => String(data.get(name) || "").trim();
    const body = ["Hello Precise Transfers,", "", "I would like to request availability and a quote:", "",
      `Service: ${value("service")}`, `Pickup date: ${value("date")}`, `Pickup time (Turks & Caicos): ${value("time")}`,
      `Pickup: ${value("pickup")}`, `Drop-off: ${value("dropoff")}`, `Passengers: ${value("passengers")}`,
      `Luggage: ${value("luggage")}`, `Name: ${value("name")}`, `Email: ${value("email")}`, `Phone: ${value("phone")}`,
      "", `Flight, return trip and requests: ${value("notes") || "None supplied"}`, "",
      "I have read the booking policies and understand this is a request, not a confirmed booking."
    ].join("\n");
    document.getElementById("email-copy").value = body;
    document.getElementById("email-fallback").hidden = false;
    document.getElementById("form-status").textContent = `Your email draft is ready. If an email app opens, review it and press Send. Otherwise copy the request below and email ${COMPANY_EMAIL}. No request has been submitted by this website.`;
    window.location.href = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent("Transfer request — " + value("date"))}&body=${encodeURIComponent(body)}`;
  });
  document.getElementById("copy-request").addEventListener("click", async () => {
    const field = document.getElementById("email-copy");
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(field.value);
      document.getElementById("form-status").textContent = `Request copied. Paste it into an email to ${COMPANY_EMAIL} and send it.`;
    } catch {
      field.focus(); field.select();
      document.getElementById("form-status").textContent = "Request selected. Copy it using Ctrl+C (or your device’s copy action), then paste it into your email.";
    }
  });
}
