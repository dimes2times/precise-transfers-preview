"use strict";

(() => {
  const unavailable = document.getElementById("quote-unavailable");
  const content = document.getElementById("quote-content");

  let quote;

  try {
    quote = JSON.parse(
      sessionStorage.getItem("precise-transfer-quote") || "null"
    );
  } catch {
    return;
  }

  const age = Date.now() - Number(quote?.createdAt);

  const valid =
    quote &&
    typeof quote.details === "string" &&
    quote.details.length > 0 &&
    Number.isFinite(quote.total) &&
    quote.total > 0 &&
    quote.currency === "USD" &&
    Number.isFinite(age) &&
    age >= 0 &&
    age < 60 * 60 * 1000;

  if (!valid) return;

  // Display as text, never interpret guest details as HTML.
  document.getElementById("quote-details").textContent =
    quote.details;

  document.getElementById("quote-total").textContent =
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(quote.total) + " USD";

  unavailable.hidden = true;
  content.hidden = false;

  const acceptance = document.getElementById("quote-accepted");
  const payment = document.getElementById("quote-payment");

  acceptance.checked = false;

  acceptance.addEventListener("change", () => {
    payment.hidden = !acceptance.checked;
  });

  document.getElementById("quote-back").addEventListener("click", () => {
    const previousPage = document.referrer
      ? new URL(document.referrer)
      : null;

    if (
      previousPage?.origin === location.origin &&
      previousPage.pathname.endsWith("/booking.html")
    ) {
      history.back();
    } else {
      location.assign("booking.html");
    }
  });
})();