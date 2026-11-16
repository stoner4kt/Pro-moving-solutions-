/* Pro Moving Solutions – site behaviour (vanilla JS) */
const WHATSAPP_NUMBER = "27615249438";

document.documentElement.classList.add("js");

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Analytics helper (GA4) ---------- */
function track(event, params = {}) {
  if (typeof window.gtag === "function") window.gtag("event", event, params);
}

/* ---------- Footer year ---------- */
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Header: scroll state + mobile menu ---------- */
const header = $("#header");
const nav = $("#nav");
const menuBtn = $("#menuBtn");

const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
$$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
window.matchMedia("(min-width: 900px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

/* ---------- Active nav link on scroll ---------- */
const navLinks = $$('a[href^="#"]', nav);
const sections = navLinks
  .map((a) => $(a.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("is-visible"));
}

/* ---------- Click tracking (calls, WhatsApp, directions) ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-track]");
  if (!el) return;
  track(el.dataset.track, { link_url: el.getAttribute("href"), page_location: location.href });
});

/* ---------- Quote form → WhatsApp ---------- */
const form = $("#quoteForm");
const statusEl = $("#formStatus");
const dateInput = $("#date");

if (dateInput) {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().split("T")[0];
}

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = "form-status" + (type ? " is-" + type : "");
}

function validPhone(v) {
  return v.replace(/[^\d]/g, "").length >= 9;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((k) => (data[k] = String(data[k]).trim()));

  $$(".field", form).forEach((f) => f.classList.remove("has-error"));

  const errors = [];
  if (!data.name) errors.push("name");
  if (!validPhone(data.phone || "")) errors.push("phone");
  if (!data.from) errors.push("from");
  if (!data.to) errors.push("to");

  if (errors.length) {
    errors.forEach((id) => $("#" + id).closest(".field").classList.add("has-error"));
    $("#" + errors[0]).focus();
    setStatus("Please complete the highlighted fields.", "error");
    return;
  }

  const lines = [
    "Hi Pro Moving Solutions, I'd like a free quote.",
    "",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Moving from: ${data.from}`,
    `Moving to: ${data.to}`,
    `Service: ${data.service}`,
  ];
  if (data.date) lines.push(`Move date: ${data.date}`);
  if (data.details) lines.push(`Details: ${data.details}`);

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;

  track("generate_lead", { method: "quote_form_whatsapp", service: data.service });
  setStatus("Opening WhatsApp with your details…", "ok");

  const win = window.open(url, "_blank", "noopener");
  if (!win) window.location.href = url;

  form.reset();
});

form.addEventListener("input", (e) => {
  const f = e.target.closest(".field");
  if (f) f.classList.remove("has-error");
});
