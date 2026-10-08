"use strict";

(() => {
  const form = document.getElementById("request-form");
  if (!form) return;

  const field = name => form.elements.namedItem(name);

  const service = field("service");
  const passengers = field("passengers");
  const checked = field("checkedBags");
  const carryOn = field("carryOnBags");
  const preference = field("vehicleChoice");
  const quantity = field("suvQuantity");
  const special = field("specialLoad");
  const date = field("date");
  const time = field("time");
  const returnDate = field("returnDate");
  const returnTime = field("returnTime");

  const guidance = document.getElementById("vehicle-guidance");
  const quantityField = document.getElementById("suv-quantity-field");
  const returnFields = document.getElementById("return-trip-fields");
  const priceLine = document.getElementById("booking-price-line");
  const createButton = document.getElementById("booking-submit");
const bookingStatus = document.getElementById("booking-status");
const acceptQuote = document.getElementById("accept-quote");
const paymentStep = document.getElementById("payment-next-step");

// Show consistent inline validation instead of browser popups.
form.noValidate = true;
  const invoice = document.getElementById("booking-invoice");
  const details = document.getElementById("invoice-details");

  const rates = {
    "Airport arrival": 135,
    "Airport departure": 135,
    "Airport round trip": 250,
    "Island transfers — one way": 85,
    "Island transfers — round trip": 160
  };

  const money = amount => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);

  function wholeNumber(input, minimum) {
    if (!input || input.value.trim() === "") return null;
    const number = Number(input.value);
    return Number.isSafeInteger(number) && number >= minimum
      ? number
      : null;
  }

  function calculate() {
    const p = wholeNumber(passengers, 1);
    const b = wholeNumber(checked, 0);
    const c = wholeNumber(carryOn, 0);
    const q = wholeNumber(quantity, 1);

    const completeLoad = p !== null && b !== null && c !== null;

    // Each SUV can accommodate up to six of each category
    // simultaneously, based on your confirmed loading limits.
    const minimum = completeLoad
      ? Math.max(
          Math.ceil(p / 6),
          Math.ceil(b / 6),
          Math.ceil(c / 6)
        )
      : null;

    const suvBooking =
      preference.value === "recommend" ||
      preference.value === "suv";

    const rate = rates[service.value];

    const quoteRequired =
      preference.value === "van" ||
      preference.value === "mixed" ||
      special.checked ||
      (service.value !== "" && rate === undefined);

    return {
      p, b, c, q, minimum, rate,
      completeLoad, suvBooking, quoteRequired,
      ready:
        completeLoad &&
        suvBooking &&
        !quoteRequired &&
        q !== null &&
        q >= minimum &&
        rate !== undefined
    };
  }

  function update() {

    acceptQuote.checked = false;
paymentStep.hidden = true;
bookingStatus.textContent = "";
    // Never leave an outdated invoice visible.
    invoice.hidden = true;
    field("invoiceSummary").value = "";

    const isRoundTrip = [
      "Airport round trip",
      "Island transfers — round trip"
    ].includes(service.value);

    returnFields.hidden = !isRoundTrip;
    returnDate.disabled = !isRoundTrip;
    returnTime.disabled = !isRoundTrip;
    returnDate.required = isRoundTrip;
    returnTime.required = isRoundTrip;
    returnDate.min = date.value || date.min;

    returnTime.setCustomValidity("");

    if (
      isRoundTrip &&
      returnDate.value &&
      returnTime.value &&
      date.value &&
      time.value &&
      `${returnDate.value}T${returnTime.value}` <=
        `${date.value}T${time.value}`
    ) {
      returnTime.setCustomValidity(
        "Choose a return pickup after your first pickup."
      );
    }

    let state = calculate();

    quantityField.hidden =
      preference.value === "van" ||
      preference.value === "mixed";

    quantity.disabled = quantityField.hidden;
    quantity.required = !quantityField.hidden;
    quantity.setCustomValidity("");
    quantity.min = String(state.minimum || 1);

    // Recommend the minimum, but preserve any extra SUVs
    // the guest has already chosen for comfort.
    if (
      preference.value === "recommend" &&
      state.minimum !== null &&
      (state.q === null || state.q < state.minimum)
    ) {
      quantity.value = String(state.minimum);
      state = calculate();
    }

    field("luggage").value = state.completeLoad
      ? `${state.b} checked bags; ${state.c} carry-on bags` +
        (special.checked ? "; special loading requirements" : "")
      : "";

    if (state.quoteRequired) {
      guidance.textContent =
        "Please request a personalised quote so we can confirm " +
        "the vehicle arrangement and price.";
      priceLine.textContent = "Personalised quote required.";
      return;
    }

    if (!state.completeLoad || !state.suvBooking) {
      guidance.textContent =
        "Enter your passengers and bags, then choose a vehicle preference.";
      priceLine.textContent =
        "Complete your vehicle and transfer selections.";
      return;
    }

    if (state.q !== null && state.q < state.minimum) {
      quantity.setCustomValidity(
        `Your group and luggage require at least ${state.minimum} SUVs.`
      );
    }

    guidance.textContent =
      `Minimum required: ${state.minimum} ` +
      `SUV${state.minimum === 1 ? "" : "s"}. ` +
      "You may add more vehicles for comfort.";

    if (
      state.q !== null &&
      state.p === state.q * 6 &&
      state.b === state.q * 6 &&
      state.c === state.q * 6
    ) {
      guidance.textContent +=
        " This arrangement fits, but fully loads each SUV. " +
        "We recommend an additional SUV for a more comfortable ride.";
    }

    if (!state.ready) {
      priceLine.textContent =
        "Choose a transfer and a sufficient number of SUVs.";
      return;
    }

    priceLine.textContent =
      `${state.q} SUV${state.q === 1 ? "" : "s"} × ` +
      `${money(state.rate)} = ${money(state.q * state.rate)} USD`;

  }

  function showFieldError(input) {
  if (!input.willValidate || input.type === "hidden") return;

  const container =
    input.closest(".field, .check") || input.parentElement;

  let message = container.querySelector(".booking-field-error");

  if (!message) {
    message = document.createElement("small");
    message.className = "booking-field-error";
    message.id = `error-${input.id || input.name}`;
    container.append(message);

    const descriptions = new Set(
      (input.getAttribute("aria-describedby") || "")
        .split(" ")
        .filter(Boolean)
    );

    descriptions.add(message.id);
    input.setAttribute(
      "aria-describedby",
      [...descriptions].join(" ")
    );
  }

  const invalid = !input.validity.valid;

  container.classList.toggle("has-booking-error", invalid);
  input.setAttribute("aria-invalid", String(invalid));
  message.hidden = !invalid;

  if (invalid) {
    message.textContent = input.validity.valueMissing
      ? "Please complete this required field."
      : input.validationMessage;
  }

  // Also highlight the visible custom dropdown.
  const dropdown = input.closest(".pt-select");
  const trigger = dropdown?.querySelector(".pt-select-trigger");

  if (trigger) {
    trigger.setAttribute("aria-invalid", String(invalid));
    trigger.setAttribute("aria-describedby", message.id);
  }
}

function focusField(input) {
  const trigger = input.closest(".pt-select")
    ?.querySelector(".pt-select-trigger");

  (trigger || input).focus();
}

function validateBooking() {
  const inputs = [...form.elements].filter(
    input => input.willValidate
  );

  inputs.forEach(showFieldError);

  const firstInvalid = inputs.find(input => !input.validity.valid);

  if (firstInvalid) {
    bookingStatus.textContent =
      "Please complete or correct the highlighted fields.";
    focusField(firstInvalid);
    return false;
  }

  return true;
}

// Validate when a guest leaves a field.
form.addEventListener("focusout", event => {
  const dropdown = event.target.closest(".pt-select");

  if (dropdown?.contains(event.relatedTarget)) return;

  const input = dropdown?.querySelector("select") || event.target;

  if (input.matches("input, select, textarea")) {
    showFieldError(input);
  }
});

// Remove errors as the guest corrects them.
function refreshErrors(event) {
  const input = event.target;

  if (
    input.matches("input, select, textarea") &&
    input.getAttribute("aria-invalid") === "true"
  ) {
    showFieldError(input);
  }
}

form.addEventListener("input", refreshErrors);
form.addEventListener("change", refreshErrors);

form.addEventListener("submit", event => {
  event.preventDefault();
  update();

  if (!validateBooking()) return;

  const state = calculate();

  if (state.quoteRequired) {
    bookingStatus.textContent =
      "This arrangement needs a personalised quote. " +
      "Please contact Precise Transfers to confirm vehicles and pricing. " +
      "This form has not sent a request.";
    return;
  }

  if (!state.ready) {
    bookingStatus.textContent =
      "Please choose a transfer and enough SUVs for your passengers and bags.";
    return;
  }

  const text = name =>
    String(field(name)?.value || "").trim();

  const lines = [
    `Name: ${text("name")}`,
    `Email: ${text("email")}`,
    `Phone: ${text("phone")}`,
    "",
    `Transfer: ${service.value}`,
    `Pickup: ${text("pickup")}`,
    `Drop-off: ${text("dropoff")}`,
    `Pickup date: ${date.value}`,
    `Pickup time: ${time.value} — Turks & Caicos`
  ];

  if (!returnFields.hidden) {
    lines.push(
      `Return date: ${returnDate.value}`,
      `Return time: ${returnTime.value} — Turks & Caicos`,
      "Same SUV quantity included on both journeys."
    );
  }

  lines.push(
    "",
    `Passengers: ${state.p}`,
    `Checked bags: ${state.b}`,
    `Carry-on bags: ${state.c}`,
    "",
    `SUV quantity: ${state.q}`,
    `Rate per SUV: ${money(state.rate)}`,
    `Additional taxes and fees: ${money(0)}`,
    `TOTAL: ${money(state.q * state.rate)} USD`
  );

  if (text("notes")) {
    lines.push("", `Additional details: ${text("notes")}`);
  }

  try {
  const quote = {
    details: lines.join("\n"),
    total: state.q * state.rate,
    currency: "USD",
    createdAt: Date.now()
  };

  sessionStorage.setItem(
    "precise-transfer-quote",
    JSON.stringify(quote)
  );

  window.location.assign("quote.html");
} catch {
  bookingStatus.textContent =
    "We couldn't open your quote. Please allow this site's " +
    "browser storage and try again. Your details remain in the form.";
}
});

acceptQuote.addEventListener("change", () => {
  paymentStep.hidden = !acceptQuote.checked;
});

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("reset", () => setTimeout(update, 0));

  update();
})();