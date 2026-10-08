"use strict";
(() => {
  // Mask the texture away from the entire sunset section, including its edges.
  const sunset = document.querySelector(".contact-section");
  if (sunset) {
    let queued = false;
    function updateTexture() {
      queued = false;
      const top = sunset.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
      document.body.style.setProperty("--sunset-top", `${top}px`);
      document.body.style.setProperty("--sunset-bottom", `${top + sunset.offsetHeight}px`);
      document.body.classList.add("has-sunset");
    }
    function scheduleTexture() {
      if (!queued) { queued = true; requestAnimationFrame(updateTexture); }
    }
    if ("ResizeObserver" in window) new ResizeObserver(scheduleTexture).observe(document.body);
    window.addEventListener("resize", scheduleTexture);
    window.addEventListener("load", scheduleTexture);
    updateTexture();
  }

   const list = document.getElementById("approved-reviews");
  document.getElementById("reviews-empty")?.remove();
  const demo = new URLSearchParams(location.search).get("reviewDemo") === "1";
  const samples = [
    {name:"Sample guest A — fictional", rating:5, text:"The airport pickup felt relaxed and well organised. A comfortable start to our island visit."},
    {name:"Sample guest B — fictional", rating:5, text:"Our evening transfer was easy to arrange, and the vehicle was comfortable for our group."},
    {name:"Sample guest C — fictional", rating:4, text:"Friendly communication and a smooth journey. We appreciated the personal attention."}
  ];
  const supplied = Array.isArray(window.PRECISE_APPROVED_REVIEWS) ? window.PRECISE_APPROVED_REVIEWS : [];
  const records = (demo ? samples : supplied).filter(r => r && typeof r.name === "string" && typeof r.text === "string" && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
  if (list && records.length) {
    list.replaceChildren(); list.classList.add("review-stack");
    const cards = records.map(r => {
      const card = document.createElement("article"); card.className = "review-card";
      const stars = document.createElement("p"); stars.className = "review-stars";
      stars.textContent = "★".repeat(r.rating) + "☆".repeat(5-r.rating);
      stars.setAttribute("aria-label", `${r.rating} out of 5 stars`);
      const quote = document.createElement("blockquote"); quote.textContent = r.text;
      const name = document.createElement("p"); name.textContent = r.name;
      card.append(stars,quote,name); list.append(card); return card;
    });
    let current = 0;
let busy = false;
let timer;
let activeAnimation;

const motion = matchMedia("(prefers-reduced-motion: reduce)");

function size() {
  if (motion.matches) {
    list.style.height = "";
    return;
  }

  const tallestCard = Math.max(
    0,
    ...cards.map(card => card.offsetHeight)
  );

  // 12px above + 22px stack offset + 22px below.
  const requiredHeight = Math.ceil(tallestCard + 56);
  const nextHeight = `${requiredHeight}px`;

  if (list.style.height !== nextHeight) {
    list.style.height = nextHeight;
  }
}

function paint() {
  list.classList.toggle("is-static", motion.matches);

  cards.forEach((card, index) => {
    const offset = (index - current + cards.length) % cards.length;

    const position = [
      "is-front",
      "is-next",
      "is-back",
      "is-away"
    ][Math.min(offset, 3)];

    card.className = "review-card " + position;

    const hidden = !motion.matches && offset !== 0;
    card.setAttribute("aria-hidden", String(hidden));
    card.inert = hidden;
  });

  size();
}

function schedule() {
  clearTimeout(timer);

  if (
    cards.length < 2 ||
    motion.matches ||
    document.hidden ||
    busy
  ) {
    return;
  }

  timer = setTimeout(flip, 6000);
}

async function flip() {
  if (
    busy ||
    motion.matches ||
    document.hidden ||
    cards.length < 2
  ) return;

  busy = true;
  clearTimeout(timer);

  const animations = [];
  let outgoing;

  const options = {
    duration: 650,
    easing: "cubic-bezier(.22, .61, .36, 1)",
    fill: "both"
  };

  try {
    // A temporary visual copy slides away while the real
    // cards move into their next positions underneath.
    outgoing = cards[current].cloneNode(true);
    outgoing.setAttribute("aria-hidden", "true");
    outgoing.inert = true;
    outgoing.style.zIndex = "4";
    outgoing.style.pointerEvents = "none";
    list.append(outgoing);

    // Recycle immediately, including last review → first.
    current = (current + 1) % cards.length;
    paint();

    animations.push(
      outgoing.animate(
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-105%)", opacity: 0 }
        ],
        options
      )
    );

    cards.forEach((card, index) => {
      const position =
        (index - current + cards.length) % cards.length;

      if (position > 2) return;

      const endY = position * 11;
      const endOpacity = [1, 0.8, 0.45][position];
      const startsAtBottom =
        position === Math.min(2, cards.length - 1);

      animations.push(
        card.animate(
          [
            {
              transform: `translateY(${endY + 11}px)`,
              opacity: startsAtBottom ? 0 : endOpacity - 0.2
            },
            {
              transform: `translateY(${endY}px)`,
              opacity: endOpacity
            }
          ],
          options
        )
      );
    });

    activeAnimation = {
      cancel() {
        animations.forEach(animation => animation.cancel());
      }
    };

    await Promise.all(
      animations.map(animation => animation.finished)
    );
  } catch {
    // Reduced-motion changes can safely cancel a transition.
  } finally {
    outgoing?.remove();
    animations.forEach(animation => animation.cancel());
    activeAnimation = null;
    busy = false;
    paint();
    schedule();
  }
}

document.addEventListener("visibilitychange", schedule);

motion.addEventListener("change", () => {
  activeAnimation?.cancel();
  paint();
  schedule();
});

if ("ResizeObserver" in window) {
  const observer = new ResizeObserver(size);
  cards.forEach(card => observer.observe(card));
}

paint();
schedule();
  }

  const REVIEW_ENDPOINT = ""; // Paste your public https://formspree.io/f/... URL here.
  const form=document.getElementById("review-form");if(!form)return;
  const actions=form.querySelector(".review-actions");
  if(actions){actions.replaceChildren();const submit=document.createElement("button");submit.type="submit";submit.className="button";submit.textContent="Submit";actions.append(submit);}
  const note=form.querySelector(".review-note");
  if(note)note.textContent=REVIEW_ENDPOINT ? "Your review is sent privately for approval before publication." : "Opens an email draft for you to send. Reviews are approved before publication.";
  const status=document.getElementById("review-status");
  const reviewCopy=document.getElementById("review-copy");
  const reviewDraft=document.getElementById("review-draft");
  const submitButton=form.querySelector('[type="submit"]');
  let sending=false;
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const name=form.elements.namedItem("displayName");
    const review=form.elements.namedItem("review");
    const rating=form.elements.namedItem("rating");
    if(sending || !(name instanceof HTMLInputElement) || !(review instanceof HTMLTextAreaElement))return;
    const nameValue=name.value.trim();
    const reviewValue=review.value.trim();
    name.setCustomValidity(nameValue?"":"Please enter your display name.");
    review.setCustomValidity(reviewValue.length>=10?"":"Please write at least 10 characters.");
    if(!form.reportValidity())return;
    const body=`Review for approval — Precise Transfers\n\nDisplay name: ${nameValue}\nRating: ${rating instanceof HTMLSelectElement ? rating.value : "0"}/5\n\n${reviewValue}\n\nI consent to publication of this review and display name after approval.`;
    if(REVIEW_ENDPOINT){
      if(status)status.textContent="Submitting your review…";
      if(submitButton)submitButton.disabled=true;
      sending=true;
      try {
        const response=await fetch(REVIEW_ENDPOINT,{
          method:"POST",headers:{"Accept":"application/json"},
          body:new FormData(form)
        });
        if(!response.ok)throw new Error("Submission failed");
        if(status)status.textContent="Your review was received for approval. It has not been published.";
        form.reset();if(reviewCopy)reviewCopy.hidden=true;
      } catch {
        if(status)status.textContent="We could not confirm receipt. Your review has been kept below so you can copy it and email Precisetransfers1@gmail.com.";
        if(reviewDraft)reviewDraft.value=body;if(reviewCopy)reviewCopy.hidden=false;
      } finally {sending=false;if(submitButton)submitButton.disabled=false;}
      return;
    }
    if(reviewDraft)reviewDraft.value=body;if(reviewCopy)reviewCopy.hidden=false;
    if(status)status.textContent="Your email draft is opening. Please send it from your email app. Your review has not been posted.";
    const email=typeof COMPANY_EMAIL==="string"?COMPANY_EMAIL:"Precisetransfers1@gmail.com";
    location.href=`mailto:${email}?subject=${encodeURIComponent("Guest review for approval")}&body=${encodeURIComponent(body)}`;
  });
  form.addEventListener("input",event=>{
    const target=event.target;
    if(target instanceof HTMLElement){target.setCustomValidity?.("");}
  });
})();
