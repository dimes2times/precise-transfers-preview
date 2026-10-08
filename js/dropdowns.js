"use strict";

(() => {
  const dropdowns = [];

  document.querySelectorAll("select").forEach((select, number) => {
    if (select.multiple || select.size > 1) return;

    const wrapper = document.createElement("span");
    wrapper.className = "pt-select";
    select.before(wrapper);
    wrapper.append(select);

    const labelElement = select.labels?.[0];
const labelCopy = labelElement?.cloneNode(true);

labelCopy
  ?.querySelectorAll("select, input, button, svg, .pt-select")
  .forEach(element => element.remove());

const label =
  select.getAttribute("aria-label") ||
  labelCopy?.textContent.trim() ||
  select.name ||
  "Choose an option";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "pt-select-trigger";
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", label);
    trigger.setAttribute("aria-required", String(select.required));

    trigger.innerHTML = `
      <span></span>
      <svg class="pt-select-chevron"
           viewBox="0 0 20 20"
           fill="none"
           aria-hidden="true">
        <path d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"/>
      </svg>
    `;

    const valueText = trigger.querySelector("span");
    const menu = document.createElement("span");
    menu.className = "pt-select-menu";
    menu.id = `pt-menu-${number}`;
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", label);
    menu.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-controls", menu.id);

    const error = document.createElement("span");
    error.className = "pt-select-error";
    error.id = `pt-error-${number}`;
    error.hidden = true;
    error.setAttribute("role", "alert");
    trigger.setAttribute("aria-describedby", error.id);

    let opened = false;
    let active = select.selectedIndex;
    let typed = "";
    let typingTimer;

    const options = [...select.options];
    const items = options.map((option, index) => {
      const item = document.createElement("span");
      item.className = "pt-select-option";
      item.id = `${menu.id}-${index}`;
      item.setAttribute("role", "option");
      item.setAttribute("aria-disabled", String(option.disabled));
      item.textContent = option.textContent;
      item.hidden = option.value === "";

      item.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        choose(index);
      });

      menu.append(item);
      return item;
    });

    wrapper.append(trigger, menu, error);
    select.classList.add("pt-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    function sync() {
      const selectedOption = options[select.selectedIndex];

valueText.textContent =
  selectedOption && selectedOption.value !== ""
    ? selectedOption.textContent
    : label;

      trigger.disabled = select.disabled;

      items.forEach((item, index) => {
        item.setAttribute(
          "aria-selected",
          String(index === select.selectedIndex)
        );
      });

      if (select.validity.valid) {
        trigger.removeAttribute("aria-invalid");
        error.hidden = true;
      }
    }

    function highlight(index) {
      active = index;

      items.forEach((item, i) => {
        item.classList.toggle("is-active", i === active);
      });

      if (!items[active]) return;

      trigger.setAttribute("aria-activedescendant", items[active].id);

      // Scroll only the menu, never the whole page.
      const item = items[active];
      const top = item.offsetTop;
      const bottom = top + item.offsetHeight;

      if (top < menu.scrollTop) menu.scrollTop = top;
      else if (bottom > menu.scrollTop + menu.clientHeight) {
        menu.scrollTop = bottom - menu.clientHeight;
      }
    }

    function close() {
      opened = false;
      wrapper.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("aria-activedescendant");
      menu.setAttribute("aria-hidden", "true");
    }

    function open() {
      if (select.disabled) return;
      dropdowns.forEach(dropdown => dropdown.close());
      sync();

      const rect = trigger.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const opensUp = below < 180 && above > below;
      const available = opensUp ? above : below;

      wrapper.classList.toggle("opens-up", opensUp);
      wrapper.style.setProperty(
        "--menu-height",
        `${Math.max(48, Math.min(280, available))}px`
      );

      opened = true;
      wrapper.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-hidden", "false");

      const selected = select.selectedIndex;

highlight(
  selected >= 0 &&
  options[selected].value !== "" &&
  !options[selected].disabled
    ? selected
    : options.findIndex(option =>
        !option.disabled && option.value !== ""
      )
);
    }

    function choose(index) {
      if (
  !options[index] ||
  options[index].disabled ||
  options[index].value === ""
) return;

      select.selectedIndex = index;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      sync();
      close();
      trigger.focus({ preventScroll: true });
    }

    trigger.addEventListener("click", event => {
      event.preventDefault();
      opened ? close() : open();
    });

    trigger.addEventListener("keydown", event => {
      if (event.key === "Tab") {
        close();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        opened ? choose(active) : open();
        return;
      }

      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (!opened) open();

        const enabled = options
          .map((option, index) =>
  option.disabled || option.value === "" ? -1 : index
)
          .filter(index => index >= 0);

        if (!enabled.length) return;

        let position = enabled.indexOf(active);
        if (event.key === "Home") position = 0;
        else if (event.key === "End") position = enabled.length - 1;
        else {
          position += event.key === "ArrowDown" ? 1 : -1;
          position = (position + enabled.length) % enabled.length;
        }

        highlight(enabled[position]);
        return;
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (!opened) open();

        clearTimeout(typingTimer);
        typed += event.key.toLowerCase();

        const match = options.findIndex(option =>
          !option.disabled &&
          option.value !== "" &&
          option.textContent.trim().toLowerCase().startsWith(typed)
        );

        if (match >= 0) highlight(match);
        typingTimer = setTimeout(() => { typed = ""; }, 700);
      }
    });

    select.addEventListener("change", sync);
    select.addEventListener("input", sync);

    select.addEventListener("invalid", event => {
      event.preventDefault();
      trigger.setAttribute("aria-invalid", "true");
      error.textContent = select.validationMessage;
      error.hidden = false;
      trigger.focus({ preventScroll: false });
      open();
    });

    // Keep existing labels usable.
    select.addEventListener("focus", () => {
      trigger.focus({ preventScroll: true });
    });

    select.form?.addEventListener("reset", () => {
      close();
      setTimeout(sync, 0);
    });

    menu.addEventListener("mousedown", event => {
  event.preventDefault();
});

    dropdowns.push({ wrapper, close });
    sync();
  });

  document.addEventListener("pointerdown", event => {
    dropdowns.forEach(dropdown => {
      if (!dropdown.wrapper.contains(event.target)) dropdown.close();
    });
  });

  window.addEventListener("resize", () => {
    dropdowns.forEach(dropdown => dropdown.close());
  });
})();